Build the frontend for an AI-powered Forest Rights Act (FRA) Decision Support System.

IMPORTANT CONTEXT:
This is a hackathon project. I am responsible for the frontend. A separate teammate will build/connect the backend later. Therefore, the frontend MUST be designed for easy backend integration.

Do NOT build the backend.
Do NOT create a database.
Do NOT put API logic directly inside UI components.

Use:

* React
* Vite
* Tailwind CSS
* React Router
* Leaflet + React Leaflet for maps
* Recharts for charts
* Lucide React for icons

DESIGN:
Create a professional government decision-support dashboard, not a generic startup dashboard.

Use:

* clean light interface
* dark navy/blue-gray text
* subtle borders
* restrained use of red/orange/green for risk states
* dense but readable information
* responsive layout
* consistent cards, tables, badges and side panels
* map should be a major visual element

MAIN NAVIGATION:

1. Overview
2. Claims
3. Risk & Anomalies
4. Districts
5. Analysis
6. Settings

==================================================

1. OVERVIEW
   ==================================================

Create an India-first interactive FRA map.

Top KPI cards:

* Total Claims
* Pending Claims
* Approved Claims
* Rejected Claims
* High Risk Claims

Main map:

* Start at India level.
* Use GeoJSON boundaries for Indian states.
* Clicking a state zooms into that state.
* Once zoomed into a state, show district-level markers/areas.
* Districts should be visually differentiated by risk/severity.
* Clicking a district opens a district summary panel.

District summary should contain:

* District name
* Total claims
* Pending
* Approved
* Rejected
* Approval rate
* Average processing time
* Overall risk score
* Number of high-risk claims
* Key anomaly indicators

Add a global Natural-Language Map Search input.

Examples:
"Show high-risk claims in Bastar"
"Show districts with rejection rate above 25%"
"Show pending claims in Chhattisgarh"

For now, natural-language search can use mock responses.
Make the search UI and result state realistic and easy to connect to a backend API later.

==================================================
2. CLAIMS
=========

Create a searchable/filterable claims management page.

Filters:

* Claim ID
* State
* District
* Village
* Status
* Risk level
* Date range
* Anomaly type

Claims table columns:

* Claim ID
* District
* Village
* Status
* Risk Score
* Claimed Area
* Submission Date
* Anomaly Status

Clicking a claim opens Claim Detail.

Claim Detail must contain:

A. Claim Risk Score

* 0–100 score
* Low / Medium / High
* Visual score indicator
* Breakdown of contributing factors

B. AI Anomaly Explanation
Display:

* Why this claim was flagged
* Main suspicious factors
* AI-generated summary
* Confidence score

C. Claim Journey Timeline
Show:

* Submitted
* Verification
* Field Inspection
* Committee Review
* Final Decision

Highlight delays between stages.

D. Nearby Anomalies

* Show nearby suspicious claims
* Distance
* Risk score
* Anomaly type
* "View on map" action

E. Land Area Mismatch
Show:

* Claimed area
* Reference/official area
* Difference
* Percentage mismatch
* Severity

F. Forest Boundary Overlap
Show:

* Claim boundary
* Relevant forest boundary
* Overlap percentage
* Status

==================================================
3. RISK & ANOMALIES
===================

Create an investigation dashboard.

A. AI Priority Queue

Rank claims by risk/priority.

Columns:

* Priority
* Claim ID
* District
* Risk score
* Main anomaly
* Age/delay
* Status

B. Geographic Anomaly Clustering

Create a map showing anomaly hotspots.

Display:

* clusters
* number of suspicious claims
* severity
* district

Clicking a cluster zooms into it.

C. Nearby Anomalies

Allow selecting a claim and seeing nearby risky claims.

==================================================
4. DISTRICTS
============

Create a district performance dashboard.

Allow selecting:

* State
* District

Display:

* Total claims
* Approval rate
* Rejection rate
* Pending claims
* Average processing time
* Risk score

Create a prominent AI card:

"Why Is This District Red?"

It should explain:

* why the district is high risk
* main contributing factors
* comparison to state average
* affected claims

Add District vs State Benchmarking.

Example:

Metric | District | State Avg | Difference

Approval Rate
Rejection Rate
Pending Rate
Average Processing Time
High Risk Claims

Use visual indicators for better/worse performance.

==================================================
5. ANALYSIS
===========

A. Historical Time Slider

Create a timeline slider.

Allow selecting different dates/periods.

Charts/map should visually update when the selected period changes.

Track:

* Claims
* Approvals
* Rejections
* Pending
* Average processing time
* Risk claims

B. Before vs After Comparison

Allow user to select:

* Period A
* Period B

Compare:

* Approval rate
* Rejection rate
* Pending claims
* Processing time
* High-risk claims

C. Duplicate Claim Finder

Create a table of potentially duplicate claims.

Show:

* Claim A
* Claim B
* Similarity %
* Matching factors
* Status

Clicking a pair should open a comparison view.

D. Land Area Mismatch Detection

Create an analysis view showing claims where claimed area differs significantly from reference data.

E. Forest Boundary Overlap Detection

Create an analysis view showing claims with significant forest boundary overlap.

==================================================
6. SETTINGS
===========

Create Risk Score Configuration.

Allow adjusting weights for:

* Processing Delay
* Rejection Pattern
* Land Area Mismatch
* Duplicate Probability
* Boundary Overlap
* Other factors

Display sliders and percentage values.

Ensure weights add up to 100%.

Include:

* Apply Changes
* Reset Defaults

==================================================
BACKEND INTEGRATION REQUIREMENTS
================================

This is extremely important.

Create a clean frontend data architecture.

NEVER hardcode mock data directly into page components.

Create:

src/data/mockData.js

This should contain realistic mock data for:

* claims
* districts
* states
* anomalies
* timelines
* benchmarks
* duplicate matches
* land mismatches
* boundary overlaps

Create:

src/services/api.js

All future backend requests MUST go through this file.

Define functions such as:

getStates()
getDistricts(stateId)
getDistrictSummary(districtId)
getClaims(filters)
getClaim(claimId)
getClaimRisk(claimId)
getClaimTimeline(claimId)
getNearbyAnomalies(claimId)
getAnomalyClusters(filters)
getPriorityQueue()
getDistrictBenchmark(districtId)
getHistoricalData(filters)
comparePeriods(periodA, periodB)
getDuplicateClaims()
getLandMismatches()
getBoundaryOverlaps()
naturalLanguageQuery(query)
calculateRiskWeights(weights)

For now, these functions should return mock data.

The UI should call these service functions rather than importing mock data directly.

This way my teammate can later replace the implementation inside api.js with fetch/Axios calls to the backend without changing the UI components.

Create:

src/types/schemas.js

Define the expected structure of:

* Claim
* District
* State
* Anomaly
* TimelineEvent
* Benchmark
* DuplicateMatch
* LandMismatch
* BoundaryOverlap
* RiskWeights
* NaturalLanguageQueryResult

Use consistent IDs across all mock data.

Create:

.env.example

with:

VITE_API_BASE_URL=http://localhost:8000/api

Do not hardcode the backend URL anywhere else.

==================================================
MAP REQUIREMENTS
================

Use Leaflet.

Create reusable map components.

Do not tightly couple the map to a specific page.

Create reusable components such as:

FRAMap
StateLayer
DistrictLayer
ClaimMarkers
AnomalyClusters
MapLegend

The map should support:

* state selection
* district selection
* claim selection
* risk visualization
* anomaly visualization
* zooming
* popups
* overlays

Use GeoJSON files where appropriate.

If real India/district GeoJSON is unavailable, create a clearly separated mock GeoJSON structure and document where it should be replaced.

==================================================
COMPONENT ARCHITECTURE
======================

Break the UI into reusable components.

Avoid giant files.

Use components such as:

KpiCard
RiskBadge
RiskScore
ClaimTable
ClaimDetailPanel
Timeline
AnomalyCard
PriorityQueue
DistrictSummary
BenchmarkChart
ComparisonChart
MapLegend
FilterBar
SearchBar
AIExplanationCard
LoadingState
EmptyState
ErrorState

==================================================
IMPORTANT UX REQUIREMENTS
=========================

Every API-dependent component should have:

* loading state
* error state
* empty state

Use realistic loading skeletons.

Use clickable rows/cards where appropriate.

Maintain navigation state when moving:
Overview → State → District → Claim.

A user should be able to navigate back naturally.

Do not create fake buttons that do nothing unless they are clearly marked as future functionality.

==================================================
DELIVERABLE
===========

Build the complete frontend.

Make it functional using mock data.

Prioritize:

1. Overview map
2. Claim search/detail
3. Risk & anomaly dashboard
4. District dashboard
5. Analysis
6. Settings

After implementation, provide a README explaining:

* how to run the frontend
* folder structure
* mock data structure
* API service architecture
* expected backend endpoints
* environment variables
* exactly what my backend teammate needs to replace/connect

Do not implement the backend.
Do not restructure the project unnecessarily.
Do not introduce unnecessary dependencies.