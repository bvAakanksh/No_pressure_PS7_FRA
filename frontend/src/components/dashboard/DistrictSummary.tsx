import React from 'react';
import { DistrictData } from '../../types/schemas';
import RiskBadge from '../common/RiskBadge';
import RiskScore from '../common/RiskScore';
import { Building2, AlertTriangle, CheckCircle2, Clock, XCircle, FileText, Sparkles } from 'lucide-react';

interface DistrictSummaryProps {
  district: DistrictData;
  onClose?: () => void;
}

export default function DistrictSummary({ district, onClose }: DistrictSummaryProps) {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-indigo-400" />
            <h3 className="text-base font-bold">{district.name} District</h3>
            <RiskBadge level={district.riskCategory} size="sm" />
          </div>
          <p className="text-xs text-slate-400">{district.stateName} State</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="px-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Claims</span>
          <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {district.totalClaims.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200/60">
          <span className="text-[10px] text-amber-700 uppercase font-semibold">Pending</span>
          <p className="text-lg font-bold font-mono text-amber-900 mt-0.5">
            {district.pendingClaims.toLocaleString('en-IN')} ({district.pendingRate}%)
          </p>
        </div>

        <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200/60">
          <span className="text-[10px] text-emerald-700 uppercase font-semibold">Approved Rate</span>
          <p className="text-lg font-bold font-mono text-emerald-900 mt-0.5">
            {district.approvalRate}%
          </p>
        </div>

        <div className="p-2.5 bg-rose-50/60 rounded-lg border border-rose-200/60">
          <span className="text-[10px] text-rose-700 uppercase font-semibold">Rejection Rate</span>
          <p className="text-lg font-bold font-mono text-rose-900 mt-0.5">
            {district.rejectionRate}%
          </p>
        </div>
      </div>

      {/* Risk and SLA Row */}
      <div className="px-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-slate-500 text-[11px] font-medium">Overall Risk Score</span>
            <p className="text-[11px] text-slate-600">High Risk Claims: <strong className="text-rose-700 font-mono">{district.highRiskClaimsCount}</strong></p>
          </div>
          <RiskScore score={district.overallRiskScore} size="lg" />
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-slate-200/70 text-slate-700 rounded-lg shrink-0">
            <Clock className="size-5" />
          </div>
          <div>
            <span className="text-slate-500 text-[11px] font-medium">Avg Processing Time</span>
            <p className="text-base font-bold font-mono text-slate-900">{district.avgProcessingTimeDays} days</p>
          </div>
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
