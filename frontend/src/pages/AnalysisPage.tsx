import React, { useEffect, useMemo, useState } from 'react';
import ComparisonChart from '../components/dashboard/ComparisonChart';
import FRAMap from '../components/map/FRAMap';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import {
  HistoricalTimePoint,
  PeriodComparison,
  DuplicateMatch,
  LandMismatchItem,
  BoundaryOverlapItem,
} from '../types/schemas';
import {
  getHistoricalData,
  comparePeriods,
  getDuplicateClaims,
  getLandMismatches,
  getBoundaryOverlaps,
  getClaims,
  getDistricts,
  getStates,
} from '../services/api';
import { Claim, DistrictData, StateData } from '../types/schemas';
import {
  BarChart3,
  Copy,
  Maximize2,
  Layers,
  Calendar,
  Layers3,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'timeline' | 'duplicates' | 'land' | 'boundary'>('timeline');

  // Timeline & Comparison State
  const [historicalData, setHistoricalData] = useState<HistoricalTimePoint[]>([]);
  const [sliderIndex, setSliderIndex] = useState(5); // Q2 2024
  const [periodALabel, setPeriodALabel] = useState('Q1 2023');
  const [periodBLabel, setPeriodBLabel] = useState('Q2 2024');
  const [comparison, setComparison] = useState<PeriodComparison | null>(null);
  const [mapClaims, setMapClaims] = useState<Claim[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);
  const [selectedMapClaimId, setSelectedMapClaimId] = useState<string | null>(null);

  // Analysis Datasets
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateMatch | null>(null);
  const [landMismatches, setLandMismatches] = useState<LandMismatchItem[]>([]);
  const [boundaryOverlaps, setBoundaryOverlaps] = useState<BoundaryOverlapItem[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hist, claims, stateRecords, districtRecords] = await Promise.all([
        getHistoricalData(),
        getClaims(),
        getStates(),
        getDistricts(),
      ]);
      setHistoricalData(hist);
      setMapClaims(claims);
      setStates(stateRecords);
      setDistricts(districtRecords);

      void comparePeriods(periodALabel, periodBLabel).then(setComparison).catch(() => setComparison(null));
    } catch (err: any) {
      setError(err.message || 'Failed to load analysis metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'duplicates' && duplicateMatches.length === 0) {
      void getDuplicateClaims().then(setDuplicateMatches).catch(() => setError('Failed to load duplicate-claim analysis'));
    }
    if (activeTab === 'land' && landMismatches.length === 0) {
      void getLandMismatches().then(setLandMismatches).catch(() => setError('Failed to load land-area analysis'));
    }
    if (activeTab === 'boundary' && boundaryOverlaps.length === 0) {
      void getBoundaryOverlaps().then(setBoundaryOverlaps).catch(() => setError('Failed to load boundary-overlap analysis'));
    }
  }, [activeTab, boundaryOverlaps.length, duplicateMatches.length, landMismatches.length]);

  const handlePeriodChange = async (pA: string, pB: string) => {
    setPeriodALabel(pA);
    setPeriodBLabel(pB);
    const comp = await comparePeriods(pA, pB);
    setComparison(comp);
  };

  const loadTimelineForLocation = async (stateId?: string, districtId?: string, preferredDate?: string) => {
    const data = await getHistoricalData({ stateId, districtId });
    setHistoricalData(data);
    const matchingIndex = preferredDate
      ? data.findIndex((point) => point.date === preferredDate)
      : -1;
    setSliderIndex(matchingIndex >= 0 ? matchingIndex : Math.max(data.length - 1, 0));
  };

  const handleMapClaimSelect = async (claimId: string) => {
    const claim = mapClaims.find((item) => item.id === claimId);
    if (!claim) return;
    const district = districts.find((item) => item.id === claim.districtId) || null;
    const state = states.find((item) => item.id === claim.stateId) || null;
    setSelectedMapClaimId(claimId);
    setSelectedDistrict(district);
    setSelectedState(state);
    const quarterDate = `${claim.submissionDate.slice(0, 4)}-${String(Math.floor((Number(claim.submissionDate.slice(5, 7)) - 1) / 3) * 3 + 1).padStart(2, '0')}-01`;
    await loadTimelineForLocation(claim.stateId, claim.districtId, quarterDate);
  };

  const handleMapStateSelect = async (stateId: string) => {
    const state = states.find((item) => item.id === stateId) || null;
    setSelectedState(state);
    setSelectedDistrict(null);
    setSelectedMapClaimId(null);
    await loadTimelineForLocation(stateId || undefined);
  };

  const handleMapDistrictSelect = async (districtId: string) => {
    const district = districts.find((item) => item.id === districtId) || null;
    const state = states.find((item) => item.id === district?.stateId) || null;
    setSelectedDistrict(district);
    setSelectedState(state);
    setSelectedMapClaimId(null);
    await loadTimelineForLocation(district?.stateId, districtId || undefined);
  };

  const currentPoint = historicalData[sliderIndex] || historicalData[historicalData.length - 1];
  const visibleMapClaims = useMemo(
    () => currentPoint
      ? mapClaims.filter((claim) => {
          const month = Number(claim.submissionDate.slice(5, 7));
          const periodDate = `${claim.submissionDate.slice(0, 4)}-${String(Math.floor((month - 1) / 3) * 3 + 1).padStart(2, '0')}-01`;
          return periodDate === currentPoint.date && (!selectedDistrict || claim.districtId === selectedDistrict.id);
        })
      : [],
    [currentPoint, mapClaims, selectedDistrict],
  );

  if (loading) return <LoadingState message="Running Analytical Algorithmic Scans..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="space-y-6">
      {/* Top Analysis Mode Sub-Navigation */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-1 text-xs">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'timeline' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="size-3.5" />
          <span>Historical Timeline & Comparison</span>
        </button>

        <button
          onClick={() => setActiveTab('duplicates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'duplicates' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Copy className="size-3.5 text-amber-500" />
          <span>Duplicate Claim Finder</span>
        </button>

        <button
          onClick={() => setActiveTab('land')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'land' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Maximize2 className="size-3.5 text-indigo-500" />
          <span>Land Area Discrepancies</span>
        </button>

        <button
          onClick={() => setActiveTab('boundary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'boundary' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="size-3.5 text-rose-500" />
          <span>Forest Boundary Overlaps</span>
        </button>
      </div>

      {/* TAB A: Historical Time Slider & Comparison */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Historical Time Slider Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  A. Interactive Historical Timeline Slider
                </h3>
                <p className="text-xs text-slate-500">
                  Drag slider to observe claim progression over historical quarterly windows
                </p>
              </div>
              {currentPoint && (
                <div className="px-3 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-mono font-bold">
                  Selected Window: {currentPoint.periodLabel} ({currentPoint.date})
                </div>
              )}
            </div>

            {/* Aligned year / quarter selector */}
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[1120px] space-y-2 px-1 py-2">
                <input
                  type="range"
                  min={0}
                  max={Math.max(historicalData.length - 1, 0)}
                  value={sliderIndex}
                  onChange={(e) => setSliderIndex(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  aria-label="Select historical quarter"
                />
                <div
                  className="grid border-b border-slate-200 pb-1"
                  style={{ gridTemplateColumns: `repeat(${historicalData.length}, minmax(48px, 1fr))` }}
                >
                  {historicalData.map((point, index) => {
                    const year = point.periodLabel.split(' ')[1];
                    const isYearStart = index === 0 || historicalData[index - 1].periodLabel.split(' ')[1] !== year;
                    if (!isYearStart) return null;
                    const span = historicalData.slice(index).findIndex((item) => item.periodLabel.split(' ')[1] !== year);
                    const yearSpan = span === -1 ? historicalData.length - index : span;
                    return (
                      <button
                        key={year}
                        type="button"
                        onClick={() => setSliderIndex(index)}
                        style={{ gridColumn: `${index + 1} / span ${yearSpan}` }}
                        className="text-center text-[11px] font-bold text-slate-600 hover:text-indigo-700 cursor-pointer"
                      >
                        {year}
                      </button>
                    );
                  })}
                </div>
                <div
                  className="grid"
                  style={{ gridTemplateColumns: `repeat(${historicalData.length}, minmax(48px, 1fr))` }}
                >
                  {historicalData.map((point, index) => (
                    <button
                      key={point.date}
                      type="button"
                      onClick={() => setSliderIndex(index)}
                      className={`rounded py-1 text-[11px] font-mono font-semibold transition cursor-pointer ${
                        sliderIndex === index
                          ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      {point.periodLabel.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic Historical Metrics for Selected Time Point */}
            {currentPoint && (
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs pt-2">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Claims</span>
                  <p className="text-base font-bold font-mono text-slate-900 mt-1">
                    {currentPoint.totalClaims.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 uppercase font-semibold">Approved</span>
                  <p className="text-base font-bold font-mono text-emerald-900 mt-1">
                    {currentPoint.approved.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="text-[10px] text-amber-700 uppercase font-semibold">Pending</span>
                  <p className="text-base font-bold font-mono text-amber-900 mt-1">
                    {currentPoint.pending.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                  <span className="text-[10px] text-rose-700 uppercase font-semibold">Rejected</span>
                  <p className="text-base font-bold font-mono text-rose-900 mt-1">
                    {currentPoint.rejected.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Avg SLA Time</span>
                  <p className="text-base font-bold font-mono text-slate-900 mt-1">
                    {currentPoint.avgProcessingTimeDays} days
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <span className="text-[10px] text-purple-800 uppercase font-semibold">High Risk</span>
                  <p className="text-base font-bold font-mono text-purple-900 mt-1">
                    {currentPoint.highRiskClaims}
                  </p>
                </div>
              </div>
            )}

            {/* Time Series Area Chart */}
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="periodLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  {currentPoint && (
                    <ReferenceLine
                      x={currentPoint.periodLabel}
                      stroke="#4f46e5"
                      strokeWidth={2}
                      label={{ value: currentPoint.periodLabel, position: 'top', fill: '#4338ca', fontSize: 11 }}
                    />
                  )}
                  <Area type="monotone" dataKey="approved" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="pending" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="rejected" stackId="1" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Linked Claim Map</h4>
                  <p className="text-xs text-slate-500">The map shows claims submitted in the selected quarter. Click a claim marker to focus the timeline on its district.</p>
                </div>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md px-2 py-1">
                  {selectedDistrict ? `${selectedDistrict.name} • ` : ''}{visibleMapClaims.length} claims in {currentPoint?.periodLabel}
                </span>
              </div>
              <FRAMap
                selectedState={selectedState}
                selectedDistrict={selectedDistrict}
                selectedClaimId={selectedMapClaimId}
                claims={visibleMapClaims}
                onSelectState={handleMapStateSelect}
                onSelectDistrict={handleMapDistrictSelect}
                onSelectClaim={handleMapClaimSelect}
                height={420}
              />
            </div>
          </div>

          {/* Section B: Before vs After Period Comparison */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                B. Period A vs Period B Comparison Selector
              </h3>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <label className="text-slate-500 font-medium">Period A:</label>
                  <select
                    value={periodALabel}
                    onChange={(e) => handlePeriodChange(e.target.value, periodBLabel)}
                    className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 font-semibold text-slate-800"
                  >
                    {historicalData.map((h) => (
                      <option key={h.periodLabel} value={h.periodLabel}>{h.periodLabel}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <label className="text-slate-500 font-medium">Period B:</label>
                  <select
                    value={periodBLabel}
                    onChange={(e) => handlePeriodChange(periodALabel, e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 font-semibold text-slate-800"
                  >
                    {historicalData.map((h) => (
                      <option key={h.periodLabel} value={h.periodLabel}>{h.periodLabel}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {comparison && <ComparisonChart comparison={comparison} />}
          </div>
        </div>
      )}

      {/* TAB B: Duplicate Claim Finder */}
      {activeTab === 'duplicates' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              C. AI Duplicate Claim Match Finder
            </h3>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
                    <th className="p-3">Match ID</th>
                    <th className="p-3">Claim A (First Applicant)</th>
                    <th className="p-3">Claim B (Matching Polygon)</th>
                    <th className="p-3">Similarity %</th>
                    <th className="p-3">Matching Factors</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {duplicateMatches.map((dup) => (
                    <tr
                      key={dup.id}
                      onClick={() => setSelectedDuplicate(dup)}
                      className="hover:bg-amber-50/50 cursor-pointer transition"
                    >
                      <td className="p-3 font-mono font-bold text-slate-900">{dup.id}</td>
                      <td className="p-3">
                        <div className="font-mono font-semibold text-slate-800">{dup.claimA.id}</div>
                        <div className="text-[11px] text-slate-500">{dup.claimA.applicant} ({dup.claimA.areaHectares} Ha)</div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono font-semibold text-slate-800">{dup.claimB.id}</div>
                        <div className="text-[11px] text-slate-500">{dup.claimB.applicant} ({dup.claimB.areaHectares} Ha)</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-rose-700">{dup.similarityPercentage}%</td>
                      <td className="p-3 text-[11px] text-slate-600">
                        <ul className="list-disc pl-3 space-y-0.5">
                          {dup.matchingFactors.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-medium text-[11px]">
                          {dup.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Duplicate Pair Comparison Side View */}
          {selectedDuplicate && (
            <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                  Duplicate Pair Comparison: {selectedDuplicate.id}
                </h4>
                <button
                  onClick={() => setSelectedDuplicate(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close Pair View
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-sans">Claim A</span>
                  <p className="text-slate-100 font-bold">{selectedDuplicate.claimA.id}</p>
                  <p className="text-slate-300 font-sans">Applicant: {selectedDuplicate.claimA.applicant}</p>
                  <p className="text-slate-300 font-sans">Village: {selectedDuplicate.claimA.village}</p>
                  <p className="text-slate-300 font-sans">Area: {selectedDuplicate.claimA.areaHectares} Ha</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-sans">Claim B</span>
                  <p className="text-slate-100 font-bold">{selectedDuplicate.claimB.id}</p>
                  <p className="text-slate-300 font-sans">Applicant: {selectedDuplicate.claimB.applicant}</p>
                  <p className="text-slate-300 font-sans">Village: {selectedDuplicate.claimB.village}</p>
                  <p className="text-slate-300 font-sans">Area: {selectedDuplicate.claimB.areaHectares} Ha</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB C: Land Area Mismatch Detection */}
      {activeTab === 'land' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
            D. Land Area Mismatch Audit
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
                  <th className="p-3">Claim ID</th>
                  <th className="p-3">District / Village</th>
                  <th className="p-3">Survey #</th>
                  <th className="p-3">Claimed Area</th>
                  <th className="p-3">Official Area</th>
                  <th className="p-3">Discrepancy</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {landMismatches.map((item) => (
                  <tr key={item.claimId} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{item.claimId}</td>
                    <td className="p-3">{item.districtName}, {item.villageName}</td>
                    <td className="p-3 font-mono text-slate-700">{item.surveyNumber}</td>
                    <td className="p-3 font-mono font-bold">{item.claimedAreaHectares} Ha</td>
                    <td className="p-3 font-mono">{item.referenceAreaHectares} Ha</td>
                    <td className="p-3 font-mono font-bold text-rose-700">
                      +{item.differenceHectares} Ha (+{item.mismatchPercentage}%)
                    </td>
                    <td className="p-3 uppercase font-bold text-[10px]">
                      <span className={`px-2 py-0.5 rounded border ${
                        item.severity === 'critical'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB D: Forest Boundary Overlap Detection */}
      {activeTab === 'boundary' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
            E. Forest Boundary Overlap Audit
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
                  <th className="p-3">Claim ID</th>
                  <th className="p-3">District / Village</th>
                  <th className="p-3">Forest Boundary Type</th>
                  <th className="p-3">Claim Area</th>
                  <th className="p-3">Overlap %</th>
                  <th className="p-3">Legal Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {boundaryOverlaps.map((item) => (
                  <tr key={item.claimId} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{item.claimId}</td>
                    <td className="p-3">{item.districtName}, {item.villageName}</td>
                    <td className="p-3 text-slate-800 font-medium">{item.forestBoundaryType}</td>
                    <td className="p-3 font-mono">{item.claimedAreaHectares} Ha</td>
                    <td className="p-3 font-mono font-bold text-rose-700">{item.overlapPercentage}%</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                        item.status === 'Prohibited Overlap'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
