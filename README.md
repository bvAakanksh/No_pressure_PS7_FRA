# Forest Rights Act Decision Support System

A full-stack dashboard for exploring a synthetic Forest Rights Act claims dataset. It includes claim search, risk indicators, anomaly analysis, maps, district comparisons, and historical views.

> Synthetic demonstration data only. This is not an official government records system or automated decision system.

## Run locally

### Prerequisites

- Python 3.11 or newer
- Node.js 20.19 or newer
- Corepack-enabled pnpm 11.25

Enable the pinned package manager once after installing Node.js:

```text
corepack enable
```

### Backend

Windows PowerShell:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Linux/macOS:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The first startup creates the local SQLite database from `backend/data/`. Later starts use the existing database.

### Frontend

In a second terminal:

```powershell
cd frontend
pnpm --config.minimum-release-age=0 install --frozen-lockfile
Copy-Item .env.example .env
pnpm dev
```

On Linux/macOS, use `cp .env.example .env`. The frontend uses `http://localhost:8000/api` by default.

## Verification

```powershell
cd backend
python -m pytest -q -p no:unraisableexception

cd ../frontend
pnpm --config.minimum-release-age=0 build
```

Claims are loaded from the API in pages of 50. Search and filters run server-side; selecting a claim loads its details on demand.

## Environment variables

Copy the example files before running locally:

- `frontend/.env.example` sets `VITE_API_BASE_URL`.
- `backend/.env.example` sets backend CORS and data-date options.

Local `.env` files, the SQLite database, virtual environments, and build output are ignored by Git.
