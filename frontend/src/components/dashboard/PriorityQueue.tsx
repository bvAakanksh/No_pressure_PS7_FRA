import React from 'react';
import { PriorityQueueItem } from '../../types/schemas';
import RiskScore from '../common/RiskScore';
import { AlertCircle, ShieldAlert, ArrowUpRight } from 'lucide-react';

interface PriorityQueueProps {
  items: PriorityQueueItem[];
  onSelectClaim: (claimId: string) => void;
}

export default function PriorityQueue({ items, onSelectClaim }: PriorityQueueProps) {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-rose-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider">AI Priority Investigation Queue</h3>
        </div>
        <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
          {items.length} High Risk Items
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div
            key={item.claimId}
            onClick={() => onSelectClaim(item.claimId)}
            className="p-3.5 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <span className="size-6 rounded-full bg-rose-100 text-rose-800 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                #{item.priorityRank}
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-900">{item.claimId}</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {item.districtName}, {item.villageName}
                  </span>
                </div>
                <p className="text-xs font-medium text-rose-700 flex items-center gap-1">
                  <AlertCircle className="size-3 shrink-0" />
                  <span>{item.mainAnomaly}</span>
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>Age in pipeline: <strong className="font-mono text-slate-700">{item.ageDays} days</strong></span>
                  <span>Status: <strong className="text-slate-700">{item.status}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
              <RiskScore score={item.riskScore} size="md" showBar={false} />
              <button className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white rounded-lg transition cursor-pointer">
                <ArrowUpRight className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
