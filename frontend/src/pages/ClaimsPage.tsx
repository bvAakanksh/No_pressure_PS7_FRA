import React, { useEffect, useRef, useState } from 'react';
import ClaimTable from '../components/dashboard/ClaimTable';
import ClaimDetailPanel from '../components/dashboard/ClaimDetailPanel';
import FilterBar from '../components/common/FilterBar';
import SearchBar from '../components/common/SearchBar';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { Claim, StateData, DistrictData } from '../types/schemas';
import { getClaims, getStates, getDistricts, getClaim, getClaimRisk, getClaimTimeline, getNearbyAnomalies } from '../services/api';

export default function ClaimsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [claims, setClaims] = useState<Claim[]>([]);
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
      const [fetchedClaims, fetchedStates, fetchedDistricts] = await Promise.all([
        getClaims({
          claimId: searchQuery,
          stateId,
          districtId,
          status,
          riskLevel: riskLevel as any,
          anomalyType,
        }),
        getStates(),
        getDistricts(stateId),
      ]);
      setClaims(fetchedClaims);
      setStates(fetchedStates);
      setDistricts(fetchedDistricts);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch claims data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, stateId, districtId, status, riskLevel, anomalyType]);

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
    setSearchQuery('');
    setStateId('');
    setDistrictId('');
    setStatus('All');
    setRiskLevel('All');
    setAnomalyType('All');
    handleCloseDetail();
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Control Bar */}
      <div className="space-y-3">
        <SearchBar
          onSearch={(q) => setSearchQuery(q)}
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
          onStateChange={setStateId}
          onDistrictChange={setDistrictId}
          onStatusChange={setStatus}
          onRiskLevelChange={setRiskLevel}
          onAnomalyTypeChange={setAnomalyType}
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
                Claim Records ({claims.length})
              </h2>
            </div>
            <ClaimTable
              claims={claims}
              selectedClaimId={selectedClaimId}
              onSelectClaim={handleSelectClaim}
            />
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
