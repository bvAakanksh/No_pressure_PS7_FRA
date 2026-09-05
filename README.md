# Forest Rights Act — Decision Support System

> **Every claim. Every risk. Visible.**

A full-stack analytics dashboard for exploring a synthetic Forest Rights Act (FRA) claims dataset across India. Built for transparent, explainable decision support — not automated decisions.

> ⚠️ Synthetic demonstration data only. This is **not** an official government records system or automated decision system.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Interactive Map** | Visualise claims and anomaly clusters across states and districts |
| 🔍 **Claim Search & Filters** | Server-side search by state, district, status, risk level, claim type, date range |
| ⚠️ **Risk Scoring** | Deterministic, explainable risk scores with factor-level breakdowns |
| 🚨 **Anomaly Detection** | Flags boundary overlaps, duplicate suspects, land mismatches, processing delays |
| 📊 **Analytics Views** | Historical trends, district benchmarking, priority queue |
| 💬 **Natural Language Query** | Ask questions like *"high-risk pending claims in Karnataka"* |
| 🔁 **Claim Timeline** | End-to-end journey from submission to decision |

---

## 🛠️ Tech Stack

**Backend** — Python · FastAPI · SQLAlchemy · SQLite  
**Frontend** — React · TypeScript · Vite · pnpm

---

## 🚀 Run Locally

### Prerequisites

- Python 3.11+
- Node.js 20.19+
- pnpm 11.25 (via Corepack)

```bash
corepack enable
```

---

### Backend

**Windows (PowerShell):**
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

**Linux / macOS:**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

> The first startup auto-creates the SQLite database from `backend/data/`. Subsequent starts reuse it.

---

### Frontend

In a second terminal:

```powershell
cd frontend
pnpm --config.minimum-release-age=0 install --frozen-lockfile
Copy-Item .env.example .env     # Linux/macOS: cp .env.example .env
pnpm dev
```

Frontend runs at `http://localhost:5173` and calls the API at `http://localhost:8000/api` by default.

---

## ✅ Verification

```powershell
# Backend tests
cd backend
python -m pytest -q -p no:unraisableexception

# Frontend build check
cd ../frontend
pnpm --config.minimum-release-age=0 build
```

---

## ⚙️ Environment Variables

Copy the example files before running:

| File | Key variable |
|---|---|
| `frontend/.env.example` | `VITE_API_BASE_URL` |
| `backend/.env.example` | `FRONTEND_ORIGIN`, `DATA_AS_OF_DATE` |

Local `.env` files, the SQLite database, virtual environments, and build output are git-ignored.

---

## 📁 Project Structure

```
.
├── backend/
│   ├── app/
│   │   └── main.py          # FastAPI app, models, risk scoring, endpoints
│   ├── data/                # Synthetic FRA CSV dataset (443 units, 44 300 claims)
│   ├── tests/
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/      # Dashboard, map, claim table, chatbot, etc.
    │   ├── pages/           # Overview, Claims, Analytics, Districts
    │   ├── services/        # API client
    │   └── types/           # Zod schemas & TypeScript types
    └── vite.config.ts
```

---

*Built for PS7 · No Pressure team*
