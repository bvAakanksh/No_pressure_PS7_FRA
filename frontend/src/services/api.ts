/** Central HTTP client. The FastAPI service returns the UI schema directly. */
import { StateData, DistrictData, Claim, AnomalyCluster, PriorityQueueItem, DistrictBenchmark, HistoricalTimePoint, PeriodComparison, DuplicateMatch, LandMismatchItem, BoundaryOverlapItem, RiskWeights, NaturalLanguageQueryResult } from '../types/schemas';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || `API request failed (${response.status})`);
  return response.json() as Promise<T>;
}
async function requestWithMeta<T>(path: string): Promise<{ data: T; total: number; page: number; pageSize: number }> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || `API request failed (${response.status})`);
  return {
    data: await response.json() as T,
    total: Number(response.headers.get('X-Total-Count') || 0),
    page: Number(response.headers.get('X-Page') || 1),
    pageSize: Number(response.headers.get('X-Page-Size') || 50),
  };
}
function params(values: object) { const p = new URLSearchParams(); Object.entries(values as Record<string, string | undefined>).forEach(([k,v]) => v && p.set(k,v)); const q=p.toString(); return q ? `?${q}` : ''; }

export interface ClaimFilters { claimId?: string; stateId?: string; stateIds?: string[]; districtId?: string; villageName?: string; status?: string; riskLevel?: 'low' | 'medium' | 'high'; minRiskScore?: number; anomalyType?: string; claimType?: string; dateRange?: { start?: string; end?: string }; }
let statesRequest: Promise<StateData[]> | null = null;
const districtRequests = new Map<string, Promise<DistrictData[]>>();
const districtSummaryRequests = new Map<string, Promise<DistrictData | null>>();

export const getStates = () => {
  if (!statesRequest) statesRequest = request<StateData[]>('/states').catch((error) => { statesRequest = null; throw error; });
  return statesRequest;
};
export const getDistricts = (stateId?: string) => {
  const key = stateId || 'all';
  const existing = districtRequests.get(key);
  if (existing) return existing;
  const pending = request<DistrictData[]>(`/districts${params({ stateId })}`).catch((error) => { districtRequests.delete(key); throw error; });
  districtRequests.set(key, pending);
  return pending;
};
export function getDistrictSummary(districtId: string): Promise<DistrictData | null> {
  const existing = districtSummaryRequests.get(districtId);
  if (existing) return existing;
  const pending = request<DistrictData>(`/districts/${encodeURIComponent(districtId)}/summary`).catch(() => null);
  districtSummaryRequests.set(districtId, pending);
  return pending;
}
export interface ClaimsPage { items: Claim[]; total: number; page: number; pageSize: number; }
export function getClaimsPage(filters: ClaimFilters = {}, page = 1, pageSize = 50): Promise<ClaimsPage> {
  return requestWithMeta<Claim[]>(`/claims${params({ claimId: filters.claimId, stateId: filters.stateId, stateIds: filters.stateIds?.join(','), districtId: filters.districtId, villageName: filters.villageName, status: filters.status, riskLevel: filters.riskLevel, minRiskScore: filters.minRiskScore?.toString(), anomalyType: filters.anomalyType, claimType: filters.claimType, startDate: filters.dateRange?.start, endDate: filters.dateRange?.end, page: page.toString(), pageSize: pageSize.toString() })}`).then(({ data, total, page: responsePage, pageSize: responsePageSize }) => ({ items: data, total, page: responsePage, pageSize: responsePageSize }));
}
export function getClaims(filters: ClaimFilters = {}, page = 1, pageSize = 50): Promise<Claim[]> { return getClaimsPage(filters, page, pageSize).then((result) => result.items); }
export async function getClaim(claimId: string): Promise<Claim | null> { try { return await request<Claim>(`/claims/${encodeURIComponent(claimId)}`); } catch { return null; } }
export const getClaimRisk = (claimId: string) => request(`/claims/${encodeURIComponent(claimId)}/risk`);
export const getClaimTimeline = (claimId: string) => request(`/claims/${encodeURIComponent(claimId)}/timeline`);
export const getNearbyAnomalies = (claimId: string) => request(`/claims/${encodeURIComponent(claimId)}/nearby-anomalies`);
export const getAnomalyClusters = (filters: { districtId?: string } = {}) => request<AnomalyCluster[]>(`/anomalies/clusters${params(filters)}`);
export const getPriorityQueue = () => request<PriorityQueueItem[]>('/priority-queue');
export async function getDistrictBenchmark(districtId: string): Promise<DistrictBenchmark | null> { try { return await request<DistrictBenchmark>(`/districts/${encodeURIComponent(districtId)}/benchmark`); } catch { return null; } }
export const getHistoricalData = (filters?: { groupBy?: string; stateId?: string; districtId?: string }) => request<HistoricalTimePoint[]>(`/analytics/historical${params(filters || {})}`);
export const comparePeriods = (periodA: string, periodB: string) => request<PeriodComparison>(`/analytics/compare-periods${params({ periodA, periodB })}`);
export const getDuplicateClaims = () => request<DuplicateMatch[]>('/analytics/duplicate-claims');
export const getLandMismatches = () => request<LandMismatchItem[]>('/analytics/land-mismatches');
export const getBoundaryOverlaps = () => request<BoundaryOverlapItem[]>('/analytics/boundary-overlaps');
export const naturalLanguageQuery = (query: string) => request<NaturalLanguageQueryResult>('/natural-language-query', { method: 'POST', body: JSON.stringify({ query }) });
export async function calculateRiskWeights(weights: RiskWeights): Promise<{ success: boolean; updatedWeights: RiskWeights }> {
  const result = await request<{ success: boolean; updatedWeights: RiskWeights }>('/risk-weights', { method: 'POST', body: JSON.stringify(weights) });
  statesRequest = null;
  districtRequests.clear();
  districtSummaryRequests.clear();
  return result;
}
