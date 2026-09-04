# Forest Rights Act Decision Support System

A full-stack dashboard for exploring a synthetic Forest Rights Act claims dataset. It includes claim search, risk indicators, anomaly analysis, maps, district comparisons, and historical views.

> Synthetic demonstration data only. This is not an official government records system or automated decision system.

## Run locally

### Backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The first startup creates the local SQLite database from `backend/data/`.

### Frontend

In a second terminal:

```powershell
cd frontend
pnpm install
Copy-Item .env.example .env
pnpm dev
```

The frontend uses `http://localhost:8000/api` by default.

## Verification

```powershell
cd backend
pytest -q

cd ..\frontend
pnpm build
```

## Environment variables

Copy the example files before running locally:

- `frontend/.env.example` sets `VITE_API_BASE_URL`.
- `backend/.env.example` sets backend CORS and data-date options.

Local `.env` files, the SQLite database, virtual environments, and build output are ignored by Git.
