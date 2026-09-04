# FRA Decision Support Frontend

A React, TypeScript and Vite frontend for the synthetic FRA decision-support dashboard. It uses the FastAPI service in `../backend` through `src/services/api.ts`.

---

## 🚀 Quick Start Guide

### 1. Installation
Install project dependencies:
```bash
pnpm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default content of `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 3. Development Server
Start Vite dev server:
```bash
pnpm dev
```

---

## 📁 Folder Structure

```
├── .env.example                # Example environment variable file
├── README.md                   # Backend integration & setup guide
├── index.html                  # Main HTML shell
├── package.json                # Project dependencies
├── src/
│   ├── main.tsx                # Entrypoint
│   ├── App.tsx                 # Router Provider setup
│   ├── routes.ts               # React Router Data mode routes
│   ├── index.css               # Global Tailwind CSS v4 & Leaflet imports
│   ├── types/
│   │   └── schemas.ts          # Core TypeScript Data Schemas (Claim, District, State, etc.)
│   ├── data/
│   │   ├── mockData.ts         # High-fidelity mock datasets with consistent IDs
│   │   └── mockGeoJSON.ts      # Vector GeoJSON boundaries for Indian states & districts
│   ├── services/
│   │   └── api.ts              # API Service Abstraction Layer (SWAP OUT FOR BACKEND)
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.tsx   # Top Navigation & Header shell
│   │   ├── map/
│   │   │   ├── FRAMap.tsx      # Main Leaflet map component
│   │   │   └── MapLegend.tsx   # Floating map risk legend
│   │   ├── common/
│   │   │   ├── KpiCard.tsx     # Reusable KPI metric card
│   │   │   ├── RiskBadge.tsx   # Color-coded risk badge (Low/Med/High/Critical)
│   │   │   ├── RiskScore.tsx   # Visual 0-100 risk score indicator
│   │   │   ├── FilterBar.tsx   # Multi-attribute claims filter bar
│   │   │   ├── SearchBar.tsx   # Natural Language map search bar
│   │   │   ├── AIExplanationCard.tsx # AI anomaly analysis banner
│   │   │   ├── LoadingState.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorState.tsx
│   │   └── dashboard/
│   │       ├── ClaimTable.tsx         # Searchable claims table
│   │       ├── ClaimDetailPanel.tsx   # Comprehensive claim detail drawer
│   │       ├── Timeline.tsx           # SLA journey timeline with delay bottlenecks
│   │       ├── AnomalyCard.tsx        # Anomaly hotspot card
│   │       ├── PriorityQueue.tsx      # Ranked AI priority investigation queue
│   │       ├── DistrictSummary.tsx    # "Why Is This District Red?" summary panel
│   │       ├── BenchmarkChart.tsx     # District vs State benchmarking bar chart & table
│   │       └── ComparisonChart.tsx    # Before vs After delta comparison card
│   └── pages/
│       ├── OverviewPage.tsx       # 1. Overview (Interactive map & top KPIs)
│       ├── ClaimsPage.tsx         # 2. Claims (Filterable table & claim detail)
│       ├── RiskAnomaliesPage.tsx  # 3. Risk & Anomalies (AI Priority Queue & clusters)
│       ├── DistrictsPage.tsx      # 4. Districts (District performance & benchmarking)
│       ├── AnalysisPage.tsx       # 5. Analysis (Timeline slider, duplicates, land/boundary)
│       └── SettingsPage.tsx       # 6. Settings (Risk score weight configuration)
```

---

## Backend connection

Set `VITE_API_BASE_URL` in `.env`. All pages use the HTTP functions in `src/services/api.ts`; no page reads CSV data directly.

---

## 📡 Expected Backend API Endpoints

Your backend should implement the following REST endpoints matching the data schemas defined in `src/types/schemas.ts`:

| Service Function | HTTP Method | Expected Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| `getStates()` | `GET` | `/api/states` | List all states with aggregated claims & risk scores |
| `getDistricts(stateId)` | `GET` | `/api/districts?stateId={id}` | List districts filtered by state |
| `getDistrictSummary(districtId)`| `GET` | `/api/districts/{districtId}` | Get single district metrics and "Why Red?" explanation |
| `getClaims(filters)` | `GET` | `/api/claims?...` | Filter claims by state, district, status, risk, anomaly |
| `getClaim(claimId)` | `GET` | `/api/claims/{claimId}` | Get full claim detail including journey timeline & risk factors |
| `getClaimRisk(claimId)` | `GET` | `/api/claims/{claimId}/risk` | Get risk breakdown factors |
| `getClaimTimeline(claimId)` | `GET` | `/api/claims/{claimId}/timeline` | Get SLA stage events |
| `getNearbyAnomalies(claimId)` | `GET` | `/api/claims/{claimId}/nearby` | Get nearby spatial anomaly claims |
| `getAnomalyClusters()` | `GET` | `/api/anomalies/clusters` | Get geographic anomaly hotspot clusters |
| `getPriorityQueue()` | `GET` | `/api/anomalies/priority-queue` | Get ranked high-risk queue for investigation |
| `getDistrictBenchmark(dId)` | `GET` | `/api/districts/{dId}/benchmark` | Get district metrics vs state averages |
| `getHistoricalData()` | `GET` | `/api/analysis/historical` | Get historical time-series quarterly data |
| `comparePeriods(pA, pB)` | `GET` | `/api/analysis/compare?periodA={a}&periodB={b}` | Compare two historical periods |
| `getDuplicateClaims()` | `GET` | `/api/analysis/duplicates` | Get potential duplicate claim pairs |
| `getLandMismatches()` | `GET` | `/api/analysis/land-mismatches` | Get claims with land size discrepancies |
| `getBoundaryOverlaps()` | `GET` | `/api/analysis/boundary-overlaps` | Get claims with Reserve Forest overlaps |
| `naturalLanguageQuery(q)` | `POST` | `/api/nlp/search` | Parse natural language prompt (e.g. "Show high-risk claims in Bastar") |
| `calculateRiskWeights(weights)` | `POST` | `/api/settings/risk-weights` | Update risk score weights configuration |

---

## 📊 Key Data Schemas (`src/types/schemas.ts`)

- **`Claim`**: `id`, `stateId`, `districtId`, `villageName`, `applicantName`, `claimType`, `status`, `riskScore`, `claimedAreaHectares`, `referenceAreaHectares`, `forestBoundaryOverlapPercentage`, `journeyTimeline`, `riskFactorBreakdown`, `aiExplanation`, etc.
- **`DistrictData`**: `id`, `name`, `approvalRate`, `rejectionRate`, `avgProcessingTimeDays`, `overallRiskScore`, `whyRedReason`, `keyAnomalies`.
- **`DuplicateMatch`**: `claimA`, `claimB`, `similarityPercentage`, `matchingFactors`, `status`.
