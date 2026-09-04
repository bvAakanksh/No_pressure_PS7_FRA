import React, { useEffect, useState } from 'react';
import DistrictSummary from '../components/dashboard/DistrictSummary';
import BenchmarkChart from '../components/dashboard/BenchmarkChart';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { DistrictData, StateData, DistrictBenchmark } from '../types/schemas';
import { getDistricts, getStates, getDistrictSummary, getDistrictBenchmark } from '../services/api';
import { Building2 } from 'lucide-react';

export default function DistrictsPage() {
  const [loading, setLoading] = useState(true);
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [directoryRefresh, setDirectoryRefresh] = useState(0);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);
  const [benchmark, setBenchmark] = useState<DistrictBenchmark | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadSelectors = async () => {
      setLoading(true);
      setError(null);
      try {
        const [fetchedStates, fetchedDistricts] = await Promise.all([
          getStates(),
          getDistricts(selectedStateId || undefined),
        ]);
        if (cancelled) return;
        setStates(fetchedStates);
        setDistricts(fetchedDistricts);
        const nextDistrictId = fetchedDistricts.some((district) => district.id === selectedDistrictId)
          ? selectedDistrictId
          : fetchedDistricts[0]?.id || '';
        setSelectedDistrictId(nextDistrictId);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load the district directory');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadSelectors();
    return () => { cancelled = true; };
  }, [selectedStateId, directoryRefresh]);

  useEffect(() => {
    if (!selectedDistrictId) {
      setSelectedDistrict(null);
      setBenchmark(null);
      return;
    }
    let cancelled = false;
    const loadDistrictAnalytics = async () => {
      setSelectionLoading(true);
      setError(null);
      try {
        const [summary, districtBenchmark] = await Promise.all([
          getDistrictSummary(selectedDistrictId),
          getDistrictBenchmark(selectedDistrictId),
        ]);
        if (!cancelled) {
          setSelectedDistrict(summary);
          setBenchmark(districtBenchmark);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load district performance analytics');
      } finally {
        if (!cancelled) setSelectionLoading(false);
      }
    };
    void loadDistrictAnalytics();
    return () => { cancelled = true; };
  }, [selectedDistrictId]);

  const retry = () => setDirectoryRefresh((value) => value + 1);

  if (loading && districts.length === 0) return <LoadingState message="Loading district directory and performance analytics..." />;
  if (error && !selectedDistrictId) return <ErrorState message={error} onRetry={retry} />;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">District Performance & Benchmark Analytics</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <label className="text-slate-500 font-medium">State:</label>
            <select value={selectedStateId} onChange={(event) => setSelectedStateId(event.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800">
              <option value="">All States</option>
              {states.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-slate-500 font-medium">District ({districts.length}):</label>
            <select value={selectedDistrictId} onChange={(event) => setSelectedDistrictId(event.target.value)} disabled={districts.length === 0} className="min-w-64 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {selectedStateId ? district.name : `${district.name} — ${district.stateName}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={retry} />}
      {selectionLoading ? (
        <LoadingState message="Loading selected district performance and benchmark..." height="h-56" />
      ) : selectedDistrict && benchmark ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6"><DistrictSummary district={selectedDistrict} /></div>
          <div className="lg:col-span-6"><BenchmarkChart benchmark={benchmark} /></div>
        </div>
      ) : !error ? (
        <LoadingState message="Select a district to view performance analytics." height="h-56" />
      ) : null}
    </div>
  );
}
