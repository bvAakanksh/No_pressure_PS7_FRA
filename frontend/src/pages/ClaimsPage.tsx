import React, { useEffect, useRef, useState } from 'react';
import ClaimTable from '../components/dashboard/ClaimTable';
import ClaimDetailPanel from '../components/dashboard/ClaimDetailPanel';
import FilterBar from '../components/common/FilterBar';
import SearchBar from '../components/common/SearchBar';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { Claim, StateData, DistrictData } from '../types/schemas';
import { getClaimsPage, getStates, getDistricts, getClaim, getClaimRisk, getClaimTimeline, getNearbyAnomalies } from '../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ClaimsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [claims, setClaims] = useState<Claim[]>([]);
  const [totalClaims, setTotalClaims] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [status, setStatus] = useState('All');
  const [riskLevel, setRiskLevel] = useState('All');
  const [anomalyType, setAnomalyType] = useState('All');

  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailRequest = useRef(0);
  const detailPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedClaimId) return;
    const frame = requestAnimationFrame(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedClaimId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedClaims = await getClaimsPage({
          claimId: searchQuery,
          stateId,
          districtId,
          status,
          riskLevel: riskLevel as any,
          anomalyType,
        }, page, pageSize);
      setClaims(fetchedClaims.items);
      setTotalClaims(fetchedClaims.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch claims data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([getStates(), getDistricts(stateId || undefined)])
      .then(([fetchedStates, fetchedDistricts]) => {
        setStates(fetchedStates);
        setDistricts(fetchedDistricts);
      })
      .catch((err: any) => setError(err.message || 'Failed to load claim filters'));
  }, [stateId]);

  useEffect(() => {
    void fetchData();
  }, [searchQuery, stateId, districtId, status, riskLevel, anomalyType, page]);

  const handleSelectClaim = async (cId: string) => {
    const requestId = ++detailRequest.current;
    setSelectedClaimId(cId);
    setSelectedClaim(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const [detail, risk, timeline, nearbyAnomalies] = await Promise.all([
        getClaim(cId),
        getClaimRisk(cId) as Promise<Pick<Claim, 'riskScore' | 'riskLevel' | 'riskFactorBreakdown'>>,
        getClaimTimeline(cId) as Promise<Claim['journeyTimeline']>,
        getNearbyAnomalies(cId) as Promise<Claim['nearbyAnomalies']>,
      ]);
      if (!detail) throw new Error('Claim details were not found.');
      if (requestId !== detailRequest.current) return;
      setSelectedClaim({
        ...detail,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        riskFactorBreakdown: risk.riskFactorBreakdown,
        journeyTimeline: timeline,
        nearbyAnomalies,
      });
    } catch (err: any) {
      if (requestId === detailRequest.current) {
        setDetailError(err.message || 'Unable to load claim details.');
      }
    } finally {
      if (requestId === detailRequest.current) setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    detailRequest.current += 1;
    setSelectedClaimId(null);
    setSelectedClaim(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  const handleResetFilters = () => {
    setPage(1);
    setSearchQuery('');
    setStateId('');
    setDistrictId('');
    setStatus('All');
    setRiskLevel('All');
    setAnomalyType('All');
    handleCloseDetail();
  };

  const updateFilter = (setter: (value: string) => void) => (value: string) => {
    setPage(1);
    setter(value);
  };
  const pageCount = Math.max(1, Math.ceil(totalClaims / pageSize));
  const goToPage = (nextPage: number) => {
    setSelectedClaimId(null);
    setSelectedClaim(null);
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Control Bar */}
      <div className="space-y-3">
        <SearchBar
          onSearch={updateFilter(setSearchQuery)}
          placeholder="Search by Claim ID, Applicant Name, Village..."
          isNlpMode={false}
        />

        <FilterBar
          stateId={stateId}
          districtId={districtId}
          status={status}
          riskLevel={riskLevel}
          anomalyType={anomalyType}
          states={states}
          districts={districts}
          onStateChange={updateFilter(setStateId)}
          onDistrictChange={updateFilter(setDistrictId)}
          onStatusChange={updateFilter(setStatus)}
          onRiskLevelChange={updateFilter(setRiskLevel)}
          onAnomalyTypeChange={updateFilter(setAnomalyType)}
          onReset={handleResetFilters}
        />
      </div>

      {/* Main Grid: Claims Table + Side Detail Panel */}
      {loading ? (
        <LoadingState message="Fetching filtered claim records from database..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : claims.length === 0 ? (
        <EmptyState
          title="No claims match filter criteria"
          description="Try broadening your state, district, or risk level selections."
          actionLabel="Reset All Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className={`${selectedClaimId ? 'lg:col-span-7' : 'lg:col-span-12'} ${selectedClaimId ? 'order-2 lg:order-1' : ''} transition-all`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Claim Records ({totalClaims.toLocaleString()})
              </h2>
            </div>
            <ClaimTable
              claims={claims}
              selectedClaimId={selectedClaimId}
              onSelectClaim={handleSelectClaim}
            />
            <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-xs text-slate-600">
              <span>Page {page} of {pageCount} ({pageSize} per page)</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => goToPage(page - 1)} disabled={page === 1} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronLeft className="size-3.5" /> Previous
                </button>
                <button type="button" onClick={() => goToPage(page + 1)} disabled={page === pageCount} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40">
                  Next <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Selected Claim Detail Panel */}
          {selectedClaimId && (
            <div ref={detailPanelRef} className="order-1 lg:order-2 lg:col-span-5 lg:sticky lg:top-20">
              {detailLoading ? (
                <LoadingState message="Loading selected claim details..." height="h-[420px]" />
              ) : detailError ? (
                <ErrorState
                  title="Unable to load claim details"
                  message={detailError}
                  onRetry={() => handleSelectClaim(selectedClaimId)}
                />
              ) : selectedClaim ? (
                <ClaimDetailPanel
                  claim={selectedClaim}
                  onClose={handleCloseDetail}
                  onSelectClaimOnMap={handleSelectClaim}
                />
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
