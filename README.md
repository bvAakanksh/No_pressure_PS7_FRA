# Forest Rights Act Decision Support System

A full-stack, synthetic-data demonstration dashboard for monitoring Forest Rights Act (FRA) claims. It provides a map-based overview, claim search and filters, deterministic anomaly signals, district benchmarking, and historical analysis.

> This project uses only the supplied synthetic data. It is not a source of official government records or an automated decision system.

## Architecture

```text
FRA Decision Support System
├── frontend/                 React + TypeScript + Vite + Leaflet + Recharts
│   └── src/
│       ├── components/       Reusable map, dashboard, layout and UI components
│       ├── pages/            Overview, Claims, Risk, Districts, Analysis, Settings
│       ├── services/api.ts   Single frontend API client
│       └── types/            Shared UI response schemas
└── backend/                  FastAPI + SQLAlchemy + SQLite
    ├── app/main.py           API routes, deterministic risk rules and data loading
    ├── data/                 Supplied synthetic CSV files
    └── tests/                API smoke tests
```

## Features

- Interactive Leaflet map of FRA claims, risk levels and anomaly clusters.
- Natural-language query panel with deterministic, evidence-based summaries.
- Claim filters for state, district, workflow status/stage, risk level and anomaly.
- Claim detail view with timeline, anomaly factors and nearby anomalies.
- District performance summaries and state benchmark comparisons.
- Quarterly analysis with linked map markers and period comparison.

## Run locally

### 1. Start the backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The first startup builds `backend/fra.db` from the CSVs in `backend/data/`.

### 2. Start the frontend

In a second terminal:

```powershell
cd frontend
pnpm install
Copy-Item .env.example .env
pnpm dev
```

Open the URL printed by Vite. By default, the frontend uses `http://localhost:8000/api`.

## Verification

```powershell
cd backend
pytest -q

cd ..\frontend
pnpm build
```

## Environment variables

| Location | Variable | Purpose |
| --- | --- | --- |
| `frontend/.env` | `VITE_API_BASE_URL` | Base URL for the FastAPI `/api` routes. |
| `backend/.env` | `FRONTEND_ORIGIN` | Comma-separated permitted frontend origins. |
| `backend/.env` | `DATA_AS_OF_DATE` | Date used for deterministic processing-age calculations. |
| `backend/.env` | `DATABASE_URL` | Optional SQLAlchemy database URL. Defaults to local SQLite. |

## Data

The application imports the supplied 44,300-claim synthetic FRA dataset from `backend/data/`. The corrected district-name CSV is the active source used by the backend. Generated SQLite databases and environment files are intentionally excluded from Git.
