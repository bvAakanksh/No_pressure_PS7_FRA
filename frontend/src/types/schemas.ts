/**
 * Data Schemas for the Forest Rights Act (FRA) Decision Support System
 */

export interface StateData {
  id: string;
  name: string;
  code: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  highRiskClaims: number;
  avgProcessingTimeDays: number;
  overallRiskScore: number;
}

export interface DistrictData {
  id: string;
  stateId: string;
  stateName: string;
  name: string;
  code: string;
  center: [number, number];
  bounds?: [[number, number], [number, number]];
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  approvalRate: number; // percentage e.g. 68.5
  rejectionRate: number;
  pendingRate: number;
  avgProcessingTimeDays: number;
  overallRiskScore: number; // 0 - 100
  highRiskClaimsCount: number;
  riskCategory: 'low' | 'medium' | 'high' | 'critical';
  keyAnomalies: string[];
  whyRedReason?: {
    summary: string;
    factors: string[];
    stateAvgComparison: string;
    affectedClaimsCount: number;
  };
}

export interface Claim {
  id: string;
  stateId: string;
  districtId: string;
  districtName: string;
  villageName: string;
  applicantName: string;
  claimType: 'Individual Forest Rights (IFR)' | 'Community Forest Rights (CFR)' | 'Community Forest Resource Rights (CRR)';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Under Field Inspection' | 'In Committee Review';
  riskScore: number; // 0 - 100
  riskLevel: 'low' | 'medium' | 'high';
  claimedAreaHectares: number;
  referenceAreaHectares: number;
  areaMismatchPercentage: number;
  forestBoundaryOverlapPercentage: number;
  submissionDate: string;
  lastUpdatedDate: string;
  anomalyStatus: 'Clean' | 'Minor Mismatch' | 'Boundary Overlap' | 'Duplicate Suspect' | 'Severe Anomaly';
  coordinates: [number, number]; // [lat, lng]
  riskFactorBreakdown: {
    factor: string;
    scoreContribution: number;
    weightPercentage: number;
    description: string;
  }[];
  aiExplanation: {
    summary: string;
    suspiciousFactors: string[];
    flagReason: string;
    confidenceScore: number; // 0 - 100
  };
  journeyTimeline: TimelineEvent[];
  nearbyAnomalies: {
    claimId: string;
    villageName: string;
    distanceKm: number;
    riskScore: number;
    anomalyType: string;
    coordinates: [number, number];
  }[];
}

export interface TimelineEvent {
  stage: 'Submitted' | 'Verification' | 'Field Inspection' | 'Committee Review' | 'Final Decision';
  date: string;
  completed: boolean;
  current: boolean;
  assignedOfficer?: string;
  notes?: string;
  durationDays?: number;
  isDelayed?: boolean;
  delayReason?: string;
}

export interface AnomalyCluster {
  id: string;
  districtId: string;
  districtName: string;
  center: [number, number];
  claimCount: number;
  severity: 'medium' | 'high' | 'critical';
  primaryAnomalyType: string;
  avgRiskScore: number;
  affectedClaims: string[];
}

export interface PriorityQueueItem {
  priorityRank: number;
  claimId: string;
  districtName: string;
  villageName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  mainAnomaly: string;
  ageDays: number;
  status: string;
}

export interface DistrictBenchmark {
  districtId: string;
  districtName: string;
  stateAvg: {
    approvalRate: number;
    rejectionRate: number;
    pendingRate: number;
    avgProcessingTimeDays: number;
    highRiskClaimsPercentage: number;
  };
  districtMetrics: {
    approvalRate: number;
    rejectionRate: number;
    pendingRate: number;
    avgProcessingTimeDays: number;
    highRiskClaimsPercentage: number;
  };
  differences: {
    approvalRateDiff: number;
    rejectionRateDiff: number;
    pendingRateDiff: number;
    avgProcessingTimeDiff: number;
    highRiskDiff: number;
  };
}

export interface HistoricalTimePoint {
  periodLabel: string;
  date: string;
  totalClaims: number;
  approved: number;
  rejected: number;
  pending: number;
  avgProcessingTimeDays: number;
  highRiskClaims: number;
}

export interface PeriodComparison {
  periodA: {
    label: string;
    approvalRate: number;
    rejectionRate: number;
    pendingClaims: number;
    avgProcessingTimeDays: number;
    highRiskClaims: number;
  };
  periodB: {
    label: string;
    approvalRate: number;
    rejectionRate: number;
    pendingClaims: number;
    avgProcessingTimeDays: number;
    highRiskClaims: number;
  };
}

export interface DuplicateMatch {
  id: string;
  claimA: {
    id: string;
    applicant: string;
    village: string;
    areaHectares: number;
    coordinates: [number, number];
  };
  claimB: {
    id: string;
    applicant: string;
    village: string;
    areaHectares: number;
    coordinates: [number, number];
  };
  similarityPercentage: number;
  matchingFactors: string[];
  status: 'Flagged for Review' | 'Investigating' | 'Resolved / Confirmed Duplicate' | 'Dismissed';
}

export interface LandMismatchItem {
  claimId: string;
  districtName: string;
  villageName: string;
  claimedAreaHectares: number;
  referenceAreaHectares: number;
  differenceHectares: number;
  mismatchPercentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  surveyNumber: string;
  status: string;
}

export interface BoundaryOverlapItem {
  claimId: string;
  districtName: string;
  villageName: string;
  claimedAreaHectares: number;
  forestBoundaryType: string; // e.g. "Reserve Forest - Division IV", "National Park Buffer"
  overlapPercentage: number;
  status: 'Prohibited Overlap' | 'Conditional Boundary' | 'Permissible CFR Area';
  severity: 'medium' | 'high' | 'critical';
}

export interface RiskWeights {
  processingDelay: number;
  rejectionPattern: number;
  landAreaMismatch: number;
  duplicateProbability: number;
  boundaryOverlap: number;
  satelliteDiscrepancy: number;
}

export interface NaturalLanguageQueryResult {
  query: string;
  interpretedFilters: {
    state?: string;
    stateIds?: string[];
    district?: string;
    region?: string;
    minRiskScore?: number;
    riskLevel?: 'low' | 'medium' | 'high';
    maxRejectionRate?: number;
    status?: string;
    claimType?: string;
  };
  matchedCount: number;
  matchingClaimIds: string[];
  summaryMessage: string;
}
