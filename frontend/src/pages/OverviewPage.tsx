import React, { useEffect, useState } from 'react';
import FRAMap from '../components/map/FRAMap';
import KpiCard from '../components/common/KpiCard';
import SearchBar from '../components/common/SearchBar';
import DistrictSummary from '../components/dashboard/DistrictSummary';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { StateData, DistrictData, Claim } from '../types/schemas';
import {
  getStates,
  getDistricts,
  getDistrictSummary,
  getClaims,
  naturalLanguageQuery,
} from '../services/api';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bot,
  Sparkles,
  MapPin,
  RefreshCw,
} from 'lucide-react';

const MAP_CLAIM_LIMIT = 500;
const REGION_VIEWPORTS: Record<string, { center: [number, number]; zoom: number; label: string }> = {
  north: { center: [29, 79], zoom: 5.5, label: 'North India Region' },
  south: { center: [15, 78], zoom: 5.5, label: 'South India Region' },
  east: { center: [24, 85], zoom: 5.5, label: 'East India Region' },
  west: { center: [20.5, 73], zoom: 5.5, label: 'West India Region' },
  central: { center: [23, 79], zoom: 5.5, label: 'Central India Region' },
  northeast: { center: [25.5, 92], zoom: 5.5, label: 'Northeast India Region' },
};

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);

  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [searchSummary, setSearchSummary] = useState<string | null>(null);
  const [searchQuestion, setSearchQuestion] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedStates, fetchedDistricts, fetchedClaims] = await Promise.all([
        getStates(),
        getDistricts(),
        getClaims({}, 1, MAP_CLAIM_LIMIT),
      ]);
      setStates(fetchedStates);
      setDistricts(fetchedDistricts);
      setClaims(fetchedClaims);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to API service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectState = async (stateId: string) => {
    if (!stateId) {
      setSelectedRegion(null);
      setSelectedState(null);
      setSelectedDistrict(null);
      return;
    }
    const st = states.find((s) => s.id === stateId || s.code === stateId) || null;
    setSelectedRegion(null);
    setSelectedState(st);
    setSelectedDistrict(null);
  };

  const handleSelectDistrict = async (districtId: string) => {
    if (!districtId) {
      setSelectedDistrict(null);
      return;
    }
    setSelectedRegion(null);
    const dt = await getDistrictSummary(districtId);
    setSelectedDistrict(dt);
  };

  const handleNlpSearch = async (query: string) => {
    if (!query) {
      setSearchSummary(null);
      setSearchQuestion(null);
      loadInitialData();
      return;
    }
    try {
      setIsAnswering(true);
      setSearchQuestion(query);
      const result = await naturalLanguageQuery(query);
      const mapSummary = result.matchedCount > MAP_CLAIM_LIMIT
        ? `${result.summaryMessage} Map markers show the ${MAP_CLAIM_LIMIT} highest-risk matching locations.`
        : `${result.summaryMessage} Map markers show all matching locations.`;
      setSearchSummary(mapSummary);

      const stateId = result.interpretedFilters.state;
      const stateIds = result.interpretedFilters.stateIds;
      const districtId = result.interpretedFilters.district;
      const district = districtId ? districts.find((d) => d.id === districtId) || null : null;
      const resolvedStateId = stateIds?.length === 1 ? stateIds[0] : stateId || district?.stateId;
      setSelectedState(resolvedStateId ? states.find((s) => s.id === resolvedStateId) || null : null);
      setSelectedDistrict(district);
      setSelectedRegion(result.interpretedFilters.region || null);

      // The same backend interpretation drives the visible markers, rather
      // than merely changing the map camera.
      const matchingClaims = await getClaims({
        stateId: resolvedStateId,
        stateIds,
        districtId,
        status: result.interpretedFilters.status,
        riskLevel: result.interpretedFilters.minRiskScore && result.interpretedFilters.minRiskScore >= 70
          ? 'high'
          : result.interpretedFilters.riskLevel,
        minRiskScore: result.interpretedFilters.minRiskScore,
        claimType: result.interpretedFilters.claimType,
        dateRange: { start: result.interpretedFilters.startDate, end: result.interpretedFilters.endDate },
      }, 1, Math.min(Math.max(result.matchedCount, 50), MAP_CLAIM_LIMIT));
      setClaims(matchingClaims);
    } catch (err) {
      console.error(err);
      setSearchSummary('I could not answer that request because the decision-support service is unavailable. Please try again.');
    } finally {
      setIsAnswering(false);
    }
  };

  // Calculate aggregated top KPIs based on selected state or national total
  const aggregateTotalClaims = selectedState
    ? selectedState.totalClaims
    : states.reduce((acc, s) => acc + s.totalClaims, 0);

  const aggregatePendingClaims = selectedState
    ? selectedState.pendingClaims
    : states.reduce((acc, s) => acc + s.pendingClaims, 0);

  const aggregateApprovedClaims = selectedState
    ? selectedState.approvedClaims
    : states.reduce((acc, s) => acc + s.approvedClaims, 0);

  const aggregateRejectedClaims = selectedState
    ? selectedState.rejectedClaims
    : states.reduce((acc, s) => acc + s.rejectedClaims, 0);

  const aggregateHighRiskClaims = selectedState
    ? selectedState.highRiskClaims
    : states.reduce((acc, s) => acc + s.highRiskClaims, 0);

  if (loading) return <LoadingState message="Initializing India FRA GIS Map and Decision Models..." />;
  if (error) return <ErrorState message={error} onRetry={loadInitialData} />;

  return (
    <div className="space-y-6">
      {/* Top Natural Language Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
        <SearchBar onSearch={handleNlpSearch} />
        {(searchQuestion || isAnswering) && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-950 space-y-2.5">
            <div className="flex items-center gap-2 font-semibold text-indigo-800">
              <Bot className="size-4 text-indigo-600" />
              <span>FRA AI Assistant</span>
              {isAnswering && <span className="font-normal text-indigo-600">Analyzing the synthetic FRA records…</span>}
            </div>
            {searchQuestion && (
              <p className="bg-white/80 border border-indigo-100 rounded-md px-2.5 py-2 text-slate-700">
                <span className="font-semibold">You asked: </span>{searchQuestion}
              </p>
            )}
            {searchSummary && <p className="leading-relaxed"><span className="font-semibold">Answer: </span>{searchSummary}</p>}
            <button
              onClick={() => {
                setSearchSummary(null);
                setSearchQuestion(null);
                setSelectedRegion(null);
                setSelectedState(null);
                setSelectedDistrict(null);
                loadInitialData();
              }}
              className="text-[11px] font-medium text-indigo-700 underline hover:text-indigo-900 cursor-pointer"
            >
              Clear NLP Filter
            </button>
          </div>
        )}
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <KpiCard
          title="Total Claims"
          value={aggregateTotalClaims}
          icon={FileText}
          subtitle={selectedState ? selectedState.name : 'National Total'}
        />
        <KpiCard
          title="Pending Claims"
          value={aggregatePendingClaims}
          icon={Clock}
          variant="pending"
          trend={{ value: `${((aggregatePendingClaims / aggregateTotalClaims) * 100).toFixed(1)}% Queue`, isNeutral: true }}
        />
        <KpiCard
          title="Approved Claims"
          value={aggregateApprovedClaims}
          icon={CheckCircle2}
          variant="approved"
          trend={{ value: `${((aggregateApprovedClaims / aggregateTotalClaims) * 100).toFixed(1)}% Rate`, isPositive: true }}
        />
        <KpiCard
          title="Rejected Claims"
          value={aggregateRejectedClaims}
          icon={XCircle}
          variant="rejected"
          trend={{ value: `${((aggregateRejectedClaims / aggregateTotalClaims) * 100).toFixed(1)}% Rate`, isNeutral: true }}
        />
        <KpiCard
          title="High Risk Claims"
          value={aggregateHighRiskClaims}
          icon={AlertTriangle}
          variant="danger"
          trend={{ value: 'Priority Audit', isPositive: false }}
        />
      </div>

      {/* Active Location breadcrumb */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
        <div className="flex items-center gap-2 font-medium text-slate-700">
          <MapPin className="size-4 text-indigo-600" />
          <span>Active GIS Scope:</span>
          <span className="font-bold text-slate-900">
            {selectedDistrict
              ? `${selectedState?.name || 'State'} → ${selectedDistrict.name} District`
              : selectedState
              ? `${selectedState.name} State`
                : selectedRegion && REGION_VIEWPORTS[selectedRegion]
                ? REGION_VIEWPORTS[selectedRegion].label
                : 'All India View'}
          </span>
        </div>
        {(selectedState || selectedDistrict || selectedRegion) && (
          <button
            onClick={() => {
              setSelectedState(null);
              setSelectedDistrict(null);
              setSelectedRegion(null);
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="size-3" />
            <span>Reset to India Level</span>
          </button>
        )}
      </div>

      {/* Main Interactive Map & Side Summary Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Map Component */}
        <div className={selectedDistrict ? "lg:col-span-7 transition-all" : "lg:col-span-12 transition-all"}>
          <FRAMap
            selectedState={selectedState}
            selectedDistrict={selectedDistrict}
            viewCenter={selectedRegion ? REGION_VIEWPORTS[selectedRegion]?.center : undefined}
            viewZoom={selectedRegion ? REGION_VIEWPORTS[selectedRegion]?.zoom : undefined}
            claims={claims}
            onSelectState={(stId) => handleSelectState(stId)}
            onSelectDistrict={(dtId) => handleSelectDistrict(dtId)}
          />
        </div>

        {/* District Summary Side Panel (Appears when district selected) */}
        {selectedDistrict && (
          <div className="lg:col-span-5 space-y-4">
            <DistrictSummary
              district={selectedDistrict}
              onClose={() => setSelectedDistrict(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
