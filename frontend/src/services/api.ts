/** Central HTTP client. The FastAPI service returns the UI schema directly. */
import { StateData, DistrictData, Claim, AnomalyCluster, PriorityQueueItem, DistrictBenchmark, HistoricalTimePoint, PeriodComparison, DuplicateMatch, LandMismatchItem, BoundaryOverlapItem, RiskWeights, NaturalLanguageQueryResult } from '../types/schemas';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, ...init });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || `API request failed (${response.status})`);
  return response.json() as Promise<T>;
}
function params(values: object) { const p = new URLSearchParams(); Object.entries(values as Record<string, string | undefined>).forEach(([k,v]) => v && p.set(k,v)); const q=p.toString(); return q ? `?${q}` : ''; }

export interface ClaimFilters { claimId?: string; stateId?: string; districtId?: string; villageName?: string; status?: string; riskLevel?: 'low' | 'medium' | 'high'; minRiskScore?: number; anomalyType?: string; claimType?: string; dateRange?: { start?: string; end?: string }; }
export const getStates = () => request<StateData[]>('/states');
export const getDistricts = (stateId?: string) => request<DistrictData[]>(`/districts${params({ stateId })}`);
export async function getDistrictSummary(districtId: string): Promise<DistrictData | null> { try { return await request<DistrictData>(`/districts/${encodeURIComponent(districtId)}/summary`); } catch { return null; } }
export function getClaims(filters: ClaimFilters = {}): Promise<Claim[]> { return request(`/claims${params({ claimId: filters.claimId, stateId: filters.stateId, districtId: filters.districtId, villageName: filters.villageName, status: filters.status, riskLevel: filters.riskLevel, minRiskScore: filters.minRiskScore?.toString(), anomalyType: filters.anomalyType, claimType: filters.claimType, startDate: filters.dateRange?.start, endDate: filters.dateRange?.end })}`); }
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
export const calculateRiskWeights = (weights: RiskWeights) => request<{ success: boolean; updatedWeights: RiskWeights }>('/risk-weights', { method: 'POST', body: JSON.stringify(weights) });
