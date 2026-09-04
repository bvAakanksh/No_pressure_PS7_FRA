import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  stateId: string;
  districtId: string;
  status: string;
  riskLevel: string;
  anomalyType: string;
  states: { id: string; name: string }[];
  districts: { id: string; name: string }[];
  onStateChange: (val: string) => void;
  onDistrictChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onRiskLevelChange: (val: string) => void;
  onAnomalyTypeChange: (val: string) => void;
  onReset: () => void;
}

export default function FilterBar({
  stateId,
  districtId,
  status,
  riskLevel,
  anomalyType,
  states,
  districts,
  onStateChange,
  onDistrictChange,
  onStatusChange,
  onRiskLevelChange,
  onAnomalyTypeChange,
  onReset,
}: FilterBarProps) {
  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
      <div className="flex items-center gap-1.5 text-slate-500 font-semibold pr-2 border-r border-slate-200">
        <Filter className="size-3.5" />
        <span>Filters</span>
      </div>

      {/* State Selector */}
      <div className="flex items-center gap-1.5">
        <label className="text-slate-500 font-medium">State:</label>
        <select
          value={stateId}
          onChange={(e) => {
            onStateChange(e.target.value);
            onDistrictChange('');
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-800"
        >
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* District Selector */}
      <div className="flex items-center gap-1.5">
        <label className="text-slate-500 font-medium">District ({districts.length} available):</label>
        <select
          value={districtId}
          onChange={(e) => onDistrictChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-800"
        >
          <option value="">All Districts</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {stateId ? d.name : `${d.name} — ${d.stateName}`}
            </option>
          ))}
        </select>
      </div>

      {/* Claim Status */}
      <div className="flex items-center gap-1.5">
        <label className="text-slate-500 font-medium">Status:</label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-800"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Under Field Inspection">Under Field Inspection</option>
          <option value="In Committee Review">In Committee Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Risk Level */}
      <div className="flex items-center gap-1.5">
        <label className="text-slate-500 font-medium">Risk Level:</label>
        <select
          value={riskLevel}
          onChange={(e) => onRiskLevelChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-800"
        >
          <option value="All">All Risk Levels</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>
      </div>

      {/* Anomaly Type */}
      <div className="flex items-center gap-1.5">
        <label className="text-slate-500 font-medium">Anomaly:</label>
        <select
          value={anomalyType}
          onChange={(e) => onAnomalyTypeChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-800"
        >
          <option value="All">All Types</option>
          <option value="Severe Anomaly">Severe Anomaly</option>
          <option value="Boundary Overlap">Boundary Overlap</option>
          <option value="Duplicate Suspect">Duplicate Suspect</option>
          <option value="Minor Mismatch">Minor Mismatch</option>
          <option value="Clean">Clean</option>
        </select>
      </div>

      {/* Reset button */}
      <button
        onClick={onReset}
        className="ml-auto flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
      >
        <RotateCcw className="size-3" />
        <span>Reset Filters</span>
      </button>
    </div>
  );
}
