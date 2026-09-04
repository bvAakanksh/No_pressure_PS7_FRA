import React from 'react';
import { PeriodComparison } from '../../types/schemas';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

interface ComparisonChartProps {
  comparison: PeriodComparison;
}

export default function ComparisonChart({ comparison }: ComparisonChartProps) {
  const { periodA, periodB } = comparison;

  const getDiff = (valB: number, valA: number, suffix: string = '%', isLowerBetter: boolean = false) => {
    const diff = Number((valB - valA).toFixed(1));
    const isBetter = isLowerBetter ? diff <= 0 : diff >= 0;
    return (
      <div className={`flex items-center gap-1 font-mono font-bold text-xs ${isBetter ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'} px-2 py-0.5 rounded border border-current/20`}>
        {diff > 0 ? <ArrowUpRight className="size-3.5" /> : diff < 0 ? <ArrowDownRight className="size-3.5" /> : <Minus className="size-3.5" />}
        <span>{diff > 0 ? `+${diff}` : diff}{suffix}</span>
      </div>
    );
  };

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
      <div className="border-b border-slate-100 pb-2">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Before vs After Period Comparison
        </h3>
        <p className="text-[11px] text-slate-500">
          Comparative delta analysis between <strong className="text-slate-800">{periodA.label}</strong> and <strong className="text-slate-800">{periodB.label}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Metric 1: Approval Rate */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Approval Rate</span>
          <div className="flex items-baseline justify-between font-mono text-xs">
            <div>
              <span className="text-slate-500 text-[10px]">{periodA.label}: </span>
              <span className="font-semibold text-slate-800">{periodA.approvalRate}%</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">{periodB.label}: </span>
              <span className="font-bold text-slate-900">{periodB.approvalRate}%</span>
            </div>
          </div>
          {getDiff(periodB.approvalRate, periodA.approvalRate, '%', false)}
        </div>

        {/* Metric 2: Processing Time */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Avg Processing Time</span>
          <div className="flex items-baseline justify-between font-mono text-xs">
            <div>
              <span className="text-slate-500 text-[10px]">{periodA.label}: </span>
              <span className="font-semibold text-slate-800">{periodA.avgProcessingTimeDays}d</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">{periodB.label}: </span>
              <span className="font-bold text-slate-900">{periodB.avgProcessingTimeDays}d</span>
            </div>
          </div>
          {getDiff(periodB.avgProcessingTimeDays, periodA.avgProcessingTimeDays, ' days', true)}
        </div>

        {/* Metric 3: High Risk Claims */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">High-Risk Flagged Claims</span>
          <div className="flex items-baseline justify-between font-mono text-xs">
            <div>
              <span className="text-slate-500 text-[10px]">{periodA.label}: </span>
              <span className="font-semibold text-slate-800">{periodA.highRiskClaims}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">{periodB.label}: </span>
              <span className="font-bold text-slate-900">{periodB.highRiskClaims}</span>
            </div>
          </div>
          {getDiff(periodB.highRiskClaims, periodA.highRiskClaims, ' claims', true)}
        </div>
      </div>
    </div>
  );
}
