import React from 'react';
import { DistrictData } from '../../types/schemas';
import RiskBadge from '../common/RiskBadge';
import RiskScore from '../common/RiskScore';
import ClaimFlowSankey from './ClaimFlowSankey';
import AnimatedNumber from '../common/AnimatedNumber';
import { Building2, AlertTriangle, CheckCircle2, Clock, XCircle, FileText, Sparkles } from 'lucide-react';

interface DistrictSummaryProps {
  district: DistrictData;
  onClose?: () => void;
  onFilterStatus?: (status: string | null) => void;
  activeFilter?: string | null;
}

export default function DistrictSummary({ district, onClose, onFilterStatus, activeFilter = null }: DistrictSummaryProps) {
  const handleFilter = (status: string | null) => {
    const newFilter = activeFilter === status ? null : status;
    if (onFilterStatus) onFilterStatus(newFilter);
  };

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden space-y-4 text-slate-200">
      {/* Header */}
      <div className="p-4 bg-slate-900/80 border-b border-slate-700/50 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">{district.name} District</h3>
            <RiskBadge level={district.riskCategory} size="sm" />
          </div>
          <p className="text-xs text-slate-400">{district.stateName} State</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-xs transition cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="px-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <button 
          onClick={() => handleFilter(null)}
          className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${activeFilter === null ? 'bg-slate-700 border-slate-500 shadow-inner' : 'bg-slate-800/60 border-slate-700 hover:bg-slate-700/80'}`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Claims</span>
          <p className="text-lg font-bold font-mono text-white mt-0.5">
            <AnimatedNumber value={district.totalClaims} format={(v) => v.toLocaleString('en-IN')} />
          </p>
        </button>

        <button 
          onClick={() => handleFilter('Pending')}
          className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${activeFilter === 'Pending' ? 'bg-amber-900/80 border-amber-500 shadow-inner' : 'bg-amber-900/20 border-amber-700/40 hover:bg-amber-900/40'}`}
        >
          <span className="text-[10px] text-amber-500 uppercase font-semibold">Pending</span>
          <p className="text-lg font-bold font-mono text-amber-300 mt-0.5">
            <AnimatedNumber value={district.pendingClaims} format={(v) => v.toLocaleString('en-IN')} /> ({district.pendingRate}%)
          </p>
        </button>

        <button 
          onClick={() => handleFilter('Approved')}
          className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${activeFilter === 'Approved' ? 'bg-emerald-900/80 border-emerald-500 shadow-inner' : 'bg-emerald-900/20 border-emerald-700/40 hover:bg-emerald-900/40'}`}
        >
          <span className="text-[10px] text-emerald-500 uppercase font-semibold">Approved Rate</span>
          <p className="text-lg font-bold font-mono text-emerald-300 mt-0.5">
            <AnimatedNumber value={district.approvalRate} />%
          </p>
        </button>

        <button 
          onClick={() => handleFilter('Rejected')}
          className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${activeFilter === 'Rejected' ? 'bg-rose-900/80 border-rose-500 shadow-inner' : 'bg-rose-900/20 border-rose-700/40 hover:bg-rose-900/40'}`}
        >
          <span className="text-[10px] text-rose-500 uppercase font-semibold">Rejection Rate</span>
          <p className="text-lg font-bold font-mono text-rose-300 mt-0.5">
            <AnimatedNumber value={district.rejectionRate} />%
          </p>
        </button>
      </div>

      {/* Risk and SLA Row */}
      <div className="px-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-slate-400 text-[11px] font-medium">Overall Risk Score</span>
            <p className="text-[11px] text-slate-300">High Risk Claims: <strong className="text-rose-400 font-mono">{district.highRiskClaimsCount}</strong></p>
          </div>
          <RiskScore score={district.overallRiskScore} size="lg" />
        </div>

        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 flex items-center gap-3">
          <div className="p-2 bg-slate-700/60 text-indigo-400 rounded-lg shrink-0 border border-slate-600/50">
            <Clock className="size-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[11px] font-medium">Avg Processing Time</span>
            <p className="text-base font-bold font-mono text-white">{district.avgProcessingTimeDays} days</p>
          </div>
        </div>
      </div>

      {/* Sankey Flow Diagram */}
      <div className="px-4">
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/50">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Claim Lifecycle Flow</h4>
          <ClaimFlowSankey 
            total={district.totalClaims}
            pending={district.pendingClaims}
            approved={Math.round(district.totalClaims * (district.approvalRate / 100))}
            rejected={Math.round(district.totalClaims * (district.rejectionRate / 100))}
          />
        </div>
      </div>

      {/* "Why Is This District Red?" Prominent AI Card */}
      {district.whyRedReason && (
        <div className="mx-4 p-3.5 bg-gradient-to-br from-rose-950 to-slate-900 text-white rounded-xl border border-rose-800/80 space-y-2.5">
          <div className="flex items-center gap-2 border-b border-rose-800/60 pb-2">
            <Sparkles className="size-4 text-rose-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-200">
              Why Is This District Red?
            </h4>
          </div>
          <p className="text-xs text-rose-100/90 leading-relaxed font-normal">
            {district.whyRedReason.summary}
          </p>
          <div className="space-y-1 bg-rose-950/50 p-2.5 rounded-lg border border-rose-900/50 text-[11px]">
            <span className="font-semibold text-rose-300">Main Contributing Factors:</span>
            <ul className="space-y-0.5 text-slate-200 pl-3 list-disc">
              {district.whyRedReason.factors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
          <p className="text-[11px] text-rose-300 font-mono">
            Comparison: {district.whyRedReason.stateAvgComparison}
          </p>
        </div>
      )}

      {/* Key Anomaly Indicators */}
      {district.keyAnomalies && district.keyAnomalies.length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Key Anomaly Indicators</h4>
          <ul className="space-y-1.5">
            {district.keyAnomalies.map((anom, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-700 p-2 bg-slate-50 rounded-lg border border-slate-200/80 flex items-start gap-2"
              >
                <AlertTriangle className="size-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span>{anom}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
