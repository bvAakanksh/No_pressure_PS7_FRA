# FRA Monitoring Backend

FastAPI + SQLite backend for the supplied **synthetic demonstration** data. It does not represent government records or live geospatial analysis.

## Run

From `backend` on Windows:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

On Linux/macOS use `python3 -m venv .venv`, `source .venv/bin/activate`, then the same install/run commands. The first startup creates `fra.db` and idempotently imports the three files in `data/`. Browse `http://localhost:8000/docs`.

Run tests with `pytest` from `backend`.

## Dataset mapping

`assigned_unit_id` becomes the district ID, `state` becomes the slugged state ID, and the summary CSV supplies synthetic centres. `claimed_area_ha`, `revenue_record_area_ha`, `forest_record_area_ha`, overlap percentages, dates, status/stage, coordinates and `applicant_hash` remain source-derived. The data dictionary is retained alongside the CSVs.

## Derived decision support

Risk is a weighted deterministic score (default: delay 20, rejection 10, land mismatch 25, duplicate 15, boundary 20, record discrepancy 10). Levels are low 0–39, medium 40–69, high 70–100. No LLM affects scores.

Rules flag pending claims older than 365 days, >=30% claimed-vs-revenue mismatch, same-hash/same-village candidates within 5 km with comparable area, >=20% forest overlap, >=10% protected-area overlap, and rejected claims. The natural-language endpoint deterministically resolves supplied state/unit names and status/risk phrases. Its explanation is likewise a deterministic, evidence-based fallback.

## API

`/api/states`, `/api/districts`, `/api/claims`, claim detail/risk/timeline/nearby-anomaly routes, `/api/anomalies/clusters`, `/api/priority-queue`, benchmarks, historical/period comparison, duplicates, land mismatches, boundary overlaps, risk weights, natural-language query, and `/api/health` are documented in FastAPI OpenAPI.

Set `FRONTEND_ORIGIN` and `DATA_AS_OF_DATE` in `.env` as needed; copy `.env.example` to start. The frontend reads `VITE_API_BASE_URL` from its `.env` (default shown in its `.env.example`).
