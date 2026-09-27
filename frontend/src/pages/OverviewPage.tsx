import React, { useEffect, useState, useMemo } from 'react';
import TemporalPlayback from '../components/dashboard/TemporalPlayback';
import FRAMap from '../components/map/FRAMap';
import KpiCard from '../components/common/KpiCard';
import ChatbotAssistant from '../components/common/ChatbotAssistant';
import DistrictSummary from '../components/dashboard/DistrictSummary';
import ClaimDetailPanel from '../components/dashboard/ClaimDetailPanel';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { StateData, DistrictData, Claim, NaturalLanguageQueryResult } from '../types/schemas';
import { getStates, getDistricts, getDistrictSummary, getClaims, getClaim, naturalLanguageQuery } from '../services/api';
import { FileText, Clock, CheckCircle2, XCircle, AlertTriangle, MapPin, RefreshCw, X } from 'lucide-react';

const MAP_CLAIM_LIMIT = 500;
const REGION_VIEWPORTS: Record<string, { center: [number, number]; zoom: number; label: string }> = {
  north: { center: [29, 79], zoom: 5.5, label: 'North India Region' },
  south: { center: [15, 78], zoom: 5.5, label: 'South India Region' },
  east: { center: [24, 85], zoom: 5.5, label: 'East India Region' },
  west: { center: [20.5, 73], zoom: 5.5, label: 'West India Region' },
  central: { center: [23, 79], zoom: 5.5, label: 'Central India Region' },
  northeast: { center: [25.5, 92], zoom: 5.5, label: 'Northeast India Region' },
};
const REGION_STATE_IDS: Record<string, string[]> = {
  north: ['jammu-and-kashmir', 'himachal-pradesh', 'uttarakhand', 'rajasthan', 'uttar-pradesh'],
  south: ['andhra-pradesh', 'karnataka', 'kerala', 'tamil-nadu', 'telangana'],
  east: ['bihar', 'jharkhand', 'odisha'],
  west: ['gujarat', 'maharashtra'],
  central: ['chhattisgarh', 'madhya-pradesh'],
  northeast: ['assam', 'tripura'],
};
const resultStateIds = (region: string) => REGION_STATE_IDS[region] || [];

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
  const [queryMetrics, setQueryMetrics] = useState<NaturalLanguageQueryResult['summaryMetrics']>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, any> | null>(null);
  const [matchedCount, setMatchedCount] = useState<number | null>(null);
  const [selectedClaimDetail, setSelectedClaimDetail] = useState<Claim | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Temporal Playback State
  const [playbackDate, setPlaybackDate] = useState<string>('2025-01-01');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Status Filter State (for Bi-directional cross-filtering)
  const [activeKpiFilter, setActiveKpiFilter] = useState<string | null>(null);

  const handleKpiClick = (filter: string | null) => {
    setActiveKpiFilter(prev => prev === filter ? null : filter);
  };

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackDate(prev => {
          const curr = new Date(prev).getTime();
          const step = 15 * 24 * 60 * 60 * 1000; // 15 days
          const next = curr + step;
          const end = new Date('2025-01-01').getTime();
          if (next >= end) {
            setIsPlaying(false);
            return '2025-01-01';
          }
          return new Date(next).toISOString().split('T')[0];
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const filteredMapClaims = useMemo(() => {
    return claims.filter(c => {
      const isBeforePlayback = new Date(c.submissionDate).getTime() <= new Date(playbackDate).getTime();
      let matchesFilter = true;
      if (activeKpiFilter === 'Pending') matchesFilter = c.status === 'Pending';
      else if (activeKpiFilter === 'Approved') matchesFilter = c.status === 'Approved';
      else if (activeKpiFilter === 'Rejected') matchesFilter = c.status === 'Rejected';
      else if (activeKpiFilter === 'HighRisk') matchesFilter = c.riskScore >= 75;

      return isBeforePlayback && matchesFilter;
    });
  }, [claims, playbackDate, activeKpiFilter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleClearNlp = () => {
    setSearchSummary(null);
    setSearchQuestion(null);
    setQueryMetrics(null);
    setActiveFilters(null);
    setMatchedCount(null);
    setSelectedRegion(null);
    setSelectedState(null);
    setSelectedDistrict(null);
    loadInitialData();
  };

  const handleNlpSearch = async (query: string) => {
    if (!query || !query.trim()) {
      handleClearNlp();
      return;
    }
    try {
      setIsAnswering(true);
      setSearchQuestion(query.trim());
      const result = await naturalLanguageQuery(query.trim());
      
      setQueryMetrics(result.summaryMetrics || null);
      setActiveFilters(result.interpretedFilters || null);
      setMatchedCount(result.matchedCount ?? 0);
      setSearchSummary(result.summaryMessage);

      // Extract geographic intent
      const stateId = result.interpretedFilters.state;
      const stateIds = result.interpretedFilters.stateIds;
      const districtId = result.interpretedFilters.district;
      const district = districtId
        ? districts.find((d) => d.id === districtId || d.name.toLowerCase() === districtId.toLowerCase()) || null
        : null;
      const resolvedStateId = stateIds?.length === 1 ? stateIds[0] : stateId || district?.stateId;
      setSelectedState(resolvedStateId ? states.find((s) => s.id === resolvedStateId || s.code === resolvedStateId) || null : null);
      setSelectedDistrict(district);
      setSelectedRegion(result.interpretedFilters.region || null);

      // Prioritize directly returned matching claims from backend NLU
      if (result.matchingClaims && result.matchingClaims.length > 0) {
        setClaims(result.matchingClaims);
      } else {
        // Fallback fetch if backend only supplied filter coordinates
        const matchingClaims = await getClaims({
          stateId: resolvedStateId,
          stateIds,
          districtId,
          status: result.interpretedFilters.status,
          workflow: result.interpretedFilters.workflow,
          claimId: result.interpretedFilters.claimId,
          villageName: result.interpretedFilters.villageName,
          riskLevel: result.interpretedFilters.minRiskScore && result.interpretedFilters.minRiskScore >= 70
            ? 'high'
            : result.interpretedFilters.riskLevel,
          minRiskScore: result.interpretedFilters.minRiskScore,
          anomalyType: result.interpretedFilters.anomalyType,
          claimType: result.interpretedFilters.claimType,
          dateRange: { start: result.interpretedFilters.startDate, end: result.interpretedFilters.endDate },
        }, 1, Math.min(Math.max(result.matchedCount, 50), MAP_CLAIM_LIMIT));
        setClaims(matchingClaims);
      }
    } catch (err: any) {
      console.error(err);
      setSearchSummary('I could not process that request because the decision-support service is unavailable. Please check backend.');
    } finally {
      setIsAnswering(false);
    }
  };

  const handleSelectClaim = async (claimId: string) => {
    try {
      const fullClaim = await getClaim(claimId);
      if (fullClaim) {
        setSelectedClaimDetail(fullClaim);
      }
    } catch (e) {
      console.error('Failed to load claim detail', e);
    }
  };

  // Calculate aggregated top KPIs based on selected state or national total
  const aggregateTotalClaims = queryMetrics
    ? queryMetrics.totalClaims
    : selectedState
    ? selectedState.totalClaims
    : selectedRegion
    ? states.filter((state) => REGION_VIEWPORTS[selectedRegion] && resultStateIds(selectedRegion).includes(state.id)).reduce((acc, state) => acc + state.totalClaims, 0)
    : states.reduce((acc, s) => acc + s.totalClaims, 0);

  const aggregatePendingClaims = queryMetrics
    ? queryMetrics.pendingClaims
    : selectedState
    ? selectedState.pendingClaims
    : selectedRegion
    ? states.filter((state) => resultStateIds(selectedRegion).includes(state.id)).reduce((acc, state) => acc + state.pendingClaims, 0)
    : states.reduce((acc, s) => acc + s.pendingClaims, 0);

  const aggregateApprovedClaims = queryMetrics
    ? queryMetrics.approvedClaims
    : selectedState
    ? selectedState.approvedClaims
    : selectedRegion
    ? states.filter((state) => resultStateIds(selectedRegion).includes(state.id)).reduce((acc, state) => acc + state.approvedClaims, 0)
    : states.reduce((acc, s) => acc + s.approvedClaims, 0);

  const aggregateRejectedClaims = queryMetrics
    ? queryMetrics.rejectedClaims
    : selectedState
    ? selectedState.rejectedClaims
    : selectedRegion
    ? states.filter((state) => resultStateIds(selectedRegion).includes(state.id)).reduce((acc, state) => acc + state.rejectedClaims, 0)
    : states.reduce((acc, s) => acc + s.rejectedClaims, 0);

  const aggregateHighRiskClaims = queryMetrics
    ? queryMetrics.highRiskClaims
    : selectedState
    ? selectedState.highRiskClaims
    : selectedRegion
    ? states.filter((state) => resultStateIds(selectedRegion).includes(state.id)).reduce((acc, state) => acc + state.highRiskClaims, 0)
    : states.reduce((acc, s) => acc + s.highRiskClaims, 0);

  // Safe percentage calculations preventing NaN
  const total = aggregateTotalClaims;
  const pendingPct = total > 0 ? ((aggregatePendingClaims / total) * 100).toFixed(1) : '0.0';
  const approvedPct = total > 0 ? ((aggregateApprovedClaims / total) * 100).toFixed(1) : '0.0';
  const rejectedPct = total > 0 ? ((aggregateRejectedClaims / total) * 100).toFixed(1) : '0.0';

  const kpiScopeSubtitle = queryMetrics
    ? `AI Query: "${searchQuestion || 'Filtered'}"`
    : selectedDistrict
    ? `District: ${selectedDistrict.name}`
    : selectedState
    ? `State: ${selectedState.name}`
    : selectedRegion && REGION_VIEWPORTS[selectedRegion]
    ? REGION_VIEWPORTS[selectedRegion].label
    : 'National Total';

  if (loading) return <LoadingState message="Initializing India FRA GIS Map and Decision Models..." />;
  if (error) return <ErrorState message={error} onRetry={loadInitialData} />;

  return (
    <div className="space-y-6">
      {/* Floating Command Palette Trigger */}
      <button 
        onClick={() => setIsPaletteOpen(true)}
        className="w-full bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-3 flex items-center justify-between text-slate-300 transition-colors shadow-sm cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-500/20 rounded-md text-indigo-400">
            <RefreshCw className="size-4" />
          </div>
          <span className="font-medium text-sm">Ask AI Assistant...</span>
        </div>
        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-xs font-mono">⌘K</kbd>
        </div>
      </button>

      {/* Floating Command Palette Modal */}
      {isPaletteOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPaletteOpen(false)} />
          <div className="relative w-full max-w-4xl shadow-2xl rounded-2xl overflow-hidden ring-1 ring-slate-700/50">
            <ChatbotAssistant
              onExecuteQuery={(q) => { handleNlpSearch(q); setIsPaletteOpen(false); }}
              onClearQuery={handleClearNlp}
              isLoading={isAnswering}
              activeQuery={searchQuestion}
              activeSummary={searchSummary}
              activeMetrics={queryMetrics}
              activeFilters={activeFilters}
              matchedCount={matchedCount}
            />
          </div>
        </div>
      )}

      {/* Top Synchronized KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <KpiCard
          title="Total Claims"
          value={aggregateTotalClaims}
          icon={FileText}
          subtitle={kpiScopeSubtitle}
          active={activeKpiFilter === null}
          onClick={() => handleKpiClick(null)}
        />
        <KpiCard
          title="Pending Claims"
          value={aggregatePendingClaims}
          icon={Clock}
          variant="pending"
          subtitle={kpiScopeSubtitle}
          trend={{ value: `${pendingPct}% Queue`, isNeutral: true }}
          active={activeKpiFilter === 'Pending'}
          onClick={() => handleKpiClick('Pending')}
        />
        <KpiCard
          title="Approved Claims"
          value={aggregateApprovedClaims}
          icon={CheckCircle2}
          variant="approved"
          subtitle={kpiScopeSubtitle}
          trend={{ value: `${approvedPct}% Rate`, isPositive: true }}
          active={activeKpiFilter === 'Approved'}
          onClick={() => handleKpiClick('Approved')}
        />
        <KpiCard
          title="Rejected Claims"
          value={aggregateRejectedClaims}
          icon={XCircle}
          variant="rejected"
          subtitle={kpiScopeSubtitle}
          trend={{ value: `${rejectedPct}% Rate`, isNeutral: true }}
          active={activeKpiFilter === 'Rejected'}
          onClick={() => handleKpiClick('Rejected')}
        />
        <KpiCard
          title="High Risk Claims"
          value={aggregateHighRiskClaims}
          icon={AlertTriangle}
          variant="danger"
          subtitle={kpiScopeSubtitle}
          trend={{ value: 'Priority Audit', isPositive: false }}
          active={activeKpiFilter === 'HighRisk'}
          onClick={() => handleKpiClick('HighRisk')}
        />
      </div>

      {/* Active Location & AI Filter Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
        <div className="flex items-center gap-2 font-medium text-slate-700">
          <MapPin className="size-4 text-indigo-600 shrink-0" />
          <span>Active Scope:</span>
          <span className="font-bold text-slate-900">
            {searchQuestion ? (
              <span className="text-indigo-700">AI Filtered: "{searchQuestion}"</span>
            ) : selectedDistrict ? (
              `${selectedState?.name || 'State'} → ${selectedDistrict.name} District`
            ) : selectedState ? (
              `${selectedState.name} State`
            ) : selectedRegion && REGION_VIEWPORTS[selectedRegion] ? (
              REGION_VIEWPORTS[selectedRegion].label
            ) : (
              'All India View'
            )}
          </span>
          <span className="text-slate-400 text-[11px] ml-1">
            ({claims.length.toLocaleString()} locations visible on map)
          </span>
        </div>
        {(selectedState || selectedDistrict || selectedRegion || searchQuestion) && (
          <button
            onClick={handleClearNlp}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="size-3" />
            <span>Reset to All-India Scope</span>
          </button>
        )}
      </div>

      {/* Main Interactive Map & Side Summary Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Map Component */}
        <div className={selectedDistrict || selectedClaimDetail ? "lg:col-span-7 transition-all space-y-4" : "lg:col-span-12 transition-all space-y-4"}>
          <FRAMap
            selectedState={selectedState}
            selectedDistrict={selectedDistrict}
            viewCenter={selectedRegion ? REGION_VIEWPORTS[selectedRegion]?.center : undefined}
            viewZoom={selectedRegion ? REGION_VIEWPORTS[selectedRegion]?.zoom : undefined}
            claims={filteredMapClaims}
            selectedClaimId={selectedClaimDetail?.id}
            onSelectState={(stId) => handleSelectState(stId)}
            onSelectDistrict={(dtId) => handleSelectDistrict(dtId)}
            onSelectClaim={handleSelectClaim}
            filterBadge={searchQuestion ? `AI Query: "${searchQuestion}" (${claims.length} claims)` : null}
            onResetFilter={handleClearNlp}
            onExecuteQuery={handleNlpSearch}
            filterSummaryMessage={searchSummary}
          />
          <TemporalPlayback 
            startDate="2022-01-01" 
            endDate="2025-01-01" 
            currentDate={playbackDate} 
            onChange={setPlaybackDate} 
            isPlaying={isPlaying} 
            onPlayPause={setIsPlaying} 
          />
        </div>

        {/* Side Panel: Claim Detail Panel or District Summary */}
        {selectedClaimDetail ? (
          <div className="lg:col-span-5 space-y-4">
            <ClaimDetailPanel
              claim={selectedClaimDetail}
              onClose={() => setSelectedClaimDetail(null)}
            />
          </div>
        ) : selectedDistrict ? (
          <div className="lg:col-span-5 space-y-4">
            <DistrictSummary
              district={selectedDistrict}
              onClose={() => { setSelectedDistrict(null); setActiveKpiFilter(null); }}
              onFilterStatus={setActiveKpiFilter}
              activeFilter={activeKpiFilter}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
