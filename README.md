# 🌿 Forest Rights Act — Decision Support System

> **Every claim. Every risk. Visible.**

A full-stack analytics and decision-support dashboard for exploring, monitoring, and understanding Forest Rights Act (FRA) claims across India. Built with explainability and transparency at its core — every risk score is deterministic and traceable, not a black-box model.

> ⚠️ **Synthetic demonstration data only.** This is **not** an official government records system or an automated decision-making system. All data is procedurally generated for demonstration purposes.

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Dataset](#-dataset)
- [Risk Scoring Engine](#-risk-scoring-engine)
- [API Reference](#-api-reference)
- [Screenshots & Pages](#-pages--ui-overview)
- [Getting Started](#-getting-started)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Environment Variables](#️-environment-variables)
- [Project Structure](#-project-structure)
- [Team](#-team)

---

## 🧭 About the Project

The **Forest Rights Act (2006)** grants land and resource rights to forest-dwelling communities across India. Processing tens of thousands of claims across 19 states, 443 districts, and 5,000+ villages is a massive administrative challenge — delays, duplicates, boundary disputes, and area mismatches are common.

This project simulates what an **AI-assisted officer dashboard** could look like: a tool that surfaces anomalies, ranks claims by risk, and gives reviewers a data-backed explanation for every flag — all without making any automated decisions on behalf of officers.

**Problem statement**: PS7 — *Intelligent FRA Claims Monitoring & Anomaly Detection*

---

## ✨ Key Features

### 🗺️ Interactive Geospatial Map
- Leaflet-powered map of all claims plotted by GPS coordinates
- Heat-map style colour coding by risk level (green → red)
- Anomaly cluster markers for high-concentration flagged areas
- Click a district or state on the map to drill down instantly
- Region-level viewport switching (North / South / East / West / Central / Northeast)

### 🔍 Claims Explorer
- Server-side paginated table of all 44,300 claims
- Filter by: state, district, village, status, risk level, claim type, anomaly type, date range
- Inline risk badges and anomaly tags per row
- Click any row to open a full-detail side panel

### 📄 Claim Detail Panel
- Full claim data: applicant, area, location, type, status
- **Risk factor breakdown** — percentage contribution of each signal to total score
- **AI Explanation card** — plain-language summary with suspicious factors listed
- **Journey timeline** — end-to-end workflow (Submitted → Gram Sabha → SDLC → DLC → Decision)
- **Nearby anomalies** — other flagged claims within 10 km in the same district

### 📊 Analytics & Analysis Page
- **Historical trends** — area chart of claims volume, approvals, rejections, and high-risk cases by quarter/month/year
- **Period comparison tool** — compare any two quarters side-by-side on approval/rejection/processing metrics
- **Duplicate claim pairs** — algorithmically matched pairs with similarity scores and matching factor lists
- **Land area mismatches** — ranked list of claims where stated area vs. revenue area diverges > 30%
- **Forest boundary overlaps** — claims overlapping Reserve Forest or Wildlife Sanctuary boundaries
- All analytics views are backed by their own dedicated API endpoints

### 🏘️ Districts Page
- District-level summary cards with approval/rejection/pending rates
- Benchmark comparison — district vs. state average across 5 metrics
- Key anomaly types most prevalent in each district

### 🚨 Risk & Anomaly Page
- Priority queue — top 100 claims ranked by composite risk score
- Anomaly cluster map showing geographic hotspots
- Anomaly cards with type, severity, and affected claim counts

### 💬 Natural Language Query (Chatbot Assistant)
- Chat-style interface embedded on the Overview page
- Type queries like:
  - *"Show high-risk pending claims in Karnataka"*
  - *"How many claims are in the dataset?"*
  - *"Show approved claims in Madhya Pradesh in 2024"*
  - *"Show boundary overlap claims in South India"*
- Backend NLU engine parses the query into structured filters (state, district, status, date range, anomaly type, etc.)
- Suggested quick-query chips for common searches
- Results instantly update the map and KPI cards

### ⚙️ Risk Scoring Configuration (Settings Page)
- Six risk factors, each with an adjustable weight slider (must sum to 100)
- Saving new weights triggers a live recalculation of all 44,300 claims on the backend
- Cache is cleared and the UI reflects updated scores in real time

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (React)                   │
│                                                      │
│  OverviewPage  ClaimsPage  AnalysisPage  Districts  │
│       │             │            │            │      │
│  FRAMap  ChatbotAssistant  ClaimTable  Charts       │
│       │             │            │            │      │
│              services/api.ts  (HTTP)                │
└──────────────────────┬──────────────────────────────┘
                       │  REST API (JSON)
┌──────────────────────▼──────────────────────────────┐
│              FastAPI Backend (Python)                │
│                                                      │
│   /api/claims       /api/states     /api/districts  │
│   /api/anomalies    /api/analytics  /api/priority   │
│   /api/natural-language-query       /api/risk-weights│
│                                                      │
│        SQLAlchemy ORM + SQLite (fra.db)             │
│                                                      │
│   Risk Scoring Engine (deterministic, in-memory)    │
│   NLU Query Parser  |  Response Cache (60s TTL)     │
└─────────────────────────────────────────────────────┘
```

**Data flow on startup:**
1. Backend reads two CSV files from `backend/data/`
2. Seeds SQLite with 443 units and 44,300 claim records
3. Computes duplicate scores (same applicant hash + village + proximity ≤ 5 km)
4. Computes composite risk scores for every claim using the 6-factor weighted model
5. Subsequent starts reuse the existing `fra.db` file

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Runtime |
| FastAPI | 0.115+ | REST API framework |
| SQLAlchemy | 2.0+ | ORM & query layer |
| SQLite | (built-in) | Local database |
| Uvicorn | 0.30+ | ASGI server |
| pandas | 2.2+ | CSV ingestion |
| python-dotenv | 1.0+ | Environment config |
| pytest + httpx | 8+ / 0.27+ | API test suite |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.7+ | Type safety |
| Vite | 8+ | Build tool & dev server |
| Tailwind CSS | 4 | Utility-first styling |
| React Leaflet | 5 | Interactive maps |
| Recharts | 3 | Charts & visualisations |
| React Router | 8 | Client-side routing |
| Lucide React | 1.41 | Icon set |

### Deployment
| Service | Role |
|---|---|
| Vercel | Frontend hosting (SPA with rewrites) |
| Render | Backend hosting (Python web service) |

---

## 📦 Dataset

The synthetic dataset was procedurally generated to simulate realistic FRA claims:

| Metric | Value |
|---|---|
| Total claims | **44,300** |
| States covered | **19** |
| Districts (units) | **443** |
| Unique villages | **5,233** |
| Claim types | Individual (IFR), Community (CFR), Community Resource (CRR) |
| Statuses | Pending, Approved, Rejected |
| Workflow stages | Gram Sabha → SDLC → DLC → Decision |
| Date range | Multi-year, grouped by quarter |

Source files in `backend/data/`:
- `FRA_synthetic_443_units_44300_cases.csv` — one row per claim
- `FRA_unit_summary_443_units.csv` — one row per district with geographic centres

---

## 🧮 Risk Scoring Engine

Every claim gets a **composite risk score from 0–100**, calculated deterministically from six weighted signals. There is no ML model — every score is fully explainable.

### Risk Factors & Default Weights

| Factor | Default Weight | Signal Measured |
|---|---|---|
| Land Area Mismatch | 25% | `abs(claimed_area − revenue_area) / revenue_area × 100` |
| Boundary Overlap | 20% | `max(forest_overlap_pct, protected_area_overlap_pct)` |
| Processing Delay | 20% | `claim_age_days / 365`, capped at 100% |
| Duplicate Probability | 15% | Same applicant hash + same village + within 5 km |
| Rejection Pattern | 10% | Claim status is "Rejected" → 100, else 0 |
| Satellite Discrepancy | 10% | `abs(forest_area − revenue_area) / revenue_area × 100` |

**Formula:**
```
risk_score = Σ (signal_value × weight / 100)
```

### Risk Levels
| Score Range | Level |
|---|---|
| ≥ 70 | 🔴 High |
| 40–69 | 🟡 Medium |
| < 40 | 🟢 Low |

### Anomaly Tags
| Tag | Condition |
|---|---|
| Severe Anomaly | `risk_score ≥ 75` |
| Boundary Overlap | `30 ≤ score < 75` AND forest/protected overlap ≥ thresholds |
| Duplicate Suspect | `30 ≤ score < 75` AND `duplicate_score ≥ 70` |
| Minor Mismatch | `30 ≤ score < 75`, other signals |
| Clean | `risk_score < 30` |

Weights are **user-configurable** via the Settings page — saving triggers live recalculation of all claims.

---

## 📡 API Reference

Base URL: `http://localhost:8000/api`

### Core Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check + DB status |
| GET | `/states` | All states with claim aggregates |
| GET | `/districts` | All districts (filterable by `stateId`) |
| GET | `/districts/{id}` | Single district summary |
| GET | `/districts/{id}/benchmark` | District vs. state average comparison |
| GET | `/claims` | Paginated claims (see filters below) |
| GET | `/claims/{id}` | Full claim detail + timeline + nearby anomalies |
| GET | `/claims/{id}/risk` | Risk score and factor breakdown only |
| GET | `/claims/{id}/timeline` | Workflow journey events |
| GET | `/claims/{id}/nearby-anomalies` | High-risk claims within 10 km |

### Analytics Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics/historical` | Time-series claim volume (by `quarter`/`month`/`year`) |
| GET | `/analytics/compare-periods` | Compare two periods by label |
| GET | `/analytics/land-mismatches` | Claims with area mismatch ≥ 30% |
| GET | `/analytics/boundary-overlaps` | Claims with forest overlap ≥ 20% |
| GET | `/analytics/duplicate-claims` | Matched duplicate pairs |
| GET | `/anomalies/clusters` | Geographic anomaly clusters |
| GET | `/priority-queue` | Top 100 highest-risk claims |

### Action Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/risk-weights` | Update scoring weights (must sum to 100) |
| POST | `/natural-language-query` | Parse NL query → structured filters + results |

### Claims Filter Parameters

`GET /api/claims` accepts these query params:

| Param | Type | Example |
|---|---|---|
| `stateId` | string | `madhya-pradesh` |
| `stateIds` | string (comma-sep) | `karnataka,telangana` |
| `districtId` | string | `MP-032` |
| `villageName` | string | `Village-02` |
| `status` | string | `Pending`, `Approved`, `Rejected` |
| `riskLevel` | string | `low`, `medium`, `high` |
| `minRiskScore` | float | `70` |
| `anomalyType` | string | `Severe Anomaly`, `Duplicate Suspect` |
| `claimType` | string | `Individual`, `Community` |
| `startDate` | ISO date | `2024-01-01` |
| `endDate` | ISO date | `2024-12-31` |
| `page` | int | `1` |
| `pageSize` | int | `50` (max 500) |

Response includes headers: `X-Total-Count`, `X-Page`, `X-Page-Size`.

---

## 🖥️ Pages & UI Overview

| Page | Route | What it shows |
|---|---|---|
| **Overview** | `/` | Map + KPI cards + chatbot + district drill-down |
| **Claims** | `/claims` | Filterable paginated table + claim detail panel |
| **Analysis** | `/analysis` | Charts, duplicates, land mismatches, boundary overlaps |
| **Districts** | `/districts` | District cards + benchmark comparison |
| **Risk & Anomalies** | `/risk-anomalies` | Priority queue + cluster map |
| **Settings** | `/settings` | Risk weight sliders + live recalculation |

---

## 🚀 Getting Started

### Prerequisites

| Tool | Minimum Version |
|---|---|
| Python | 3.11 |
| Node.js | 20.19 |
| pnpm | 11.25 (via Corepack) |

Enable pnpm via Corepack after installing Node.js:
```bash
corepack enable
```

---

### 1. Clone the Repository

```bash
git clone https://github.com/bvAakanksh/No_pressure_PS7_FRA.git
cd No_pressure_PS7_FRA
```

---

### 2. Backend Setup

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

> **First run:** The startup event auto-seeds the SQLite database from the CSV files in `backend/data/`. This may take ~10–20 seconds for 44,300 records. Subsequent starts are instant.

Backend is available at: `http://localhost:8000`  
Interactive API docs: `http://localhost:8000/docs`

---

### 3. Frontend Setup

In a **second terminal**:

**Windows:**
```powershell
cd frontend
pnpm --config.minimum-release-age=0 install --frozen-lockfile
Copy-Item .env.example .env
pnpm dev
```

**Linux / macOS:**
```bash
cd frontend
pnpm --config.minimum-release-age=0 install --frozen-lockfile
cp .env.example .env
pnpm dev
```

Frontend is available at: `http://localhost:5173`

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
python -m pytest -q -p no:unraisableexception
```

The test suite covers:
- Health check and core CRUD endpoints
- Pagination headers (`X-Total-Count`, `X-Page`, `X-Page-Size`)
- Risk weight validation (weights must sum to 100)
- NLU query parsing — regions, state aliases, year ranges, village names, claim IDs
- Entity count queries (states, districts, villages)
- Seed idempotency and unique claim ID constraints

### Frontend Build Check

```bash
cd frontend
pnpm --config.minimum-release-age=0 build
```

---

## ☁️ Deployment

### Frontend → Vercel

The frontend deploys as a Vite SPA. A `vercel.json` rewrite rule redirects all routes to `index.html` for client-side routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Set the environment variable `VITE_API_BASE_URL` in Vercel to point to your Render backend URL.

### Backend → Render

A `render.yaml` and `Procfile` configure the Python web service:

```yaml
startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set `FRONTEND_ORIGIN` to your Vercel deployment URL (or `*` for open CORS during development).

---

## ⚙️ Environment Variables

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Backend API base URL |

### Backend (`backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `FRONTEND_ORIGIN` | `http://localhost:5173,...` | Allowed CORS origins (comma-separated) |
| `DATA_AS_OF_DATE` | `2026-09-04` | Reference date for claim age calculations |
| `DATABASE_URL` | `sqlite:///fra.db` | Database connection string |

Copy the example files before running:
```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Local `.env` files, `fra.db`, `.venv/`, and `dist/` are all git-ignored.

---

## 📁 Project Structure

```
No_pressure_PS7_FRA/
│
├── backend/
│   ├── app/
│   │   └── main.py              # FastAPI app — models, seeding, risk engine, all endpoints
│   ├── data/
│   │   ├── FRA_synthetic_443_units_44300_cases.csv
│   │   └── FRA_unit_summary_443_units.csv
│   ├── tests/
│   │   └── test_api.py          # pytest test suite
│   ├── .env.example
│   ├── Procfile                 # Render start command
│   ├── render.yaml              # Render service config
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/          # KpiCard, SearchBar, FilterBar, RiskBadge,
    │   │   │                    # ChatbotAssistant, AIExplanationCard, etc.
    │   │   ├── dashboard/       # ClaimTable, ClaimDetailPanel, Timeline,
    │   │   │                    # BenchmarkChart, ComparisonChart, PriorityQueue, etc.
    │   │   ├── layout/          # App shell, navigation
    │   │   └── map/             # FRAMap (Leaflet), MapLegend
    │   ├── pages/
    │   │   ├── OverviewPage.tsx      # Map + KPIs + chatbot
    │   │   ├── ClaimsPage.tsx        # Filtered table + detail panel
    │   │   ├── AnalysisPage.tsx      # Charts + deep analytics
    │   │   ├── DistrictsPage.tsx     # District benchmark cards
    │   │   ├── RiskAnomaliesPage.tsx # Priority queue + cluster map
    │   │   └── SettingsPage.tsx      # Risk weight configuration
    │   ├── services/
    │   │   └── api.ts           # All API call functions (typed)
    │   ├── types/
    │   │   └── schemas.ts       # TypeScript interfaces for all data models
    │   ├── routes.ts            # React Router route definitions
    │   └── App.tsx
    ├── vercel.json              # Vercel SPA rewrite rules
    ├── package.json
    └── vite.config.ts
```

---

## 👥 Team

**No Pressure** — PS7 · VITB Hackathon

> *Built to show what transparent, explainable, officer-facing AI tools for public administration could look like.*

---

## 📄 Licence

This project is for demonstration and academic purposes. The dataset is entirely synthetic and does not represent any real individual, village, or government record.
