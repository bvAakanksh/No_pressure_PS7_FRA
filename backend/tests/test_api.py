from fastapi.testclient import TestClient
from app.main import app, seed, SessionLocal, Claim

seed()
client = TestClient(app)

def test_health_and_core_endpoints():
    assert client.get('/api/health').json()['status'] == 'ok'
    assert len(client.get('/api/states').json()) > 0
    assert len(client.get('/api/districts').json()) == 443
    paged = client.get('/api/claims?page=2&pageSize=2')
    claims = paged.json()
    assert len(claims) == 2 and 0 <= claims[0]['riskScore'] <= 100
    assert paged.headers['x-total-count'] == '44300'
    assert paged.headers['x-page'] == '2'
    assert paged.headers['x-page-size'] == '2'
    claim_id = claims[0]['id']
    assert client.get(f'/api/claims/{claim_id}').status_code == 200
    assert client.get(f'/api/claims/{claim_id}/risk').status_code == 200
    assert client.get(f'/api/claims/{claim_id}/timeline').status_code == 200

def test_seed_is_idempotent_and_ids_are_unique():
    first = seed(); second = seed()
    with SessionLocal() as db:
        assert db.query(Claim.id).count() == 44300
    assert second['status'] == 'already initialized'

def test_risk_weight_validation():
    bad = {'processingDelay':20,'rejectionPattern':10,'landAreaMismatch':25,'duplicateProbability':15,'boundaryOverlap':20,'satelliteDiscrepancy':9}
    assert client.post('/api/risk-weights', json=bad).status_code == 422

def test_natural_language_regions_feed_multi_state_filters():
    result = client.post('/api/natural-language-query', json={'query': 'Show pending claims in South India'}).json()
    assert result['interpretedFilters']['region'] == 'south'
    assert len(result['interpretedFilters']['stateIds']) == 5
    claims = client.get('/api/claims?stateIds=' + ','.join(result['interpretedFilters']['stateIds']) + '&status=Pending&pageSize=50').json()
    assert len(claims) == 50

def test_natural_language_aliases_status_and_year_filters():
    result = client.post('/api/natural-language-query', json={'query': 'Show approved claims in MP in 2024'}).json()
    assert result['interpretedFilters']['state'] == 'madhya-pradesh'
    assert result['interpretedFilters']['status'] == 'Approved'
    assert result['interpretedFilters']['startDate'] == '2024-01-01'
    assert result['interpretedFilters']['endDate'] == '2024-12-31'

def test_natural_language_claim_village_and_processing_filters():
    village = client.post('/api/natural-language-query', json={'query': 'Show claims in FRA-MP-032-Village-02'}).json()
    assert village['matchedCount'] == 18
    assert village['interpretedFilters']['villageName'] == 'FRA-MP-032-VILLAGE-02'
    central = client.post('/api/natural-language-query', json={'query': 'Show claims in Central India'}).json()
    assert central['matchedCount'] == 10267
    processing = client.post('/api/natural-language-query', json={'query': 'Show processing claims in Madhya Pradesh'}).json()
    assert processing['interpretedFilters']['workflow'] == 'processing'
    assert processing['matchedCount'] > 0

def test_natural_language_entity_counts():
    for prompt, count_type, expected in [
        ('How many states are in the dataset?', 'states', 19),
        ('How many districts are available?', 'districts', 443),
        ('How many sub-level villages are there?', 'villages', 5233),
        ('How many claims are in the dataset?', 'claims', 44300),
    ]:
        result = client.post('/api/natural-language-query', json={'query': prompt}).json()
        assert result['interpretedFilters']['countType'] == count_type
        assert result['matchedCount'] == expected
