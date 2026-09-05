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
