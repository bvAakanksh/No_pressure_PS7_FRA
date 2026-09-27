import React from 'react';

export default function MapLegend() {
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl p-3 rounded-xl border border-slate-700/50 shadow-lg text-xs space-y-2 max-w-xs text-slate-200">
      <div className="font-semibold text-white border-b border-slate-700/50 pb-1 flex items-center justify-between">
        <span>Map Legend</span>
        <span className="text-[10px] text-slate-400 font-normal">Claim Status</span>
      </div>
      <div className="flex flex-col gap-y-1.5 text-slate-300">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-emerald-500 border border-emerald-400/50 shadow-sm shadow-emerald-500/20 inline-block"></span>
          <span className="font-medium text-emerald-100">Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-amber-500 border border-amber-400/50 shadow-sm shadow-amber-500/20 inline-block"></span>
          <span className="font-medium text-amber-100">Pending Review</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-rose-500 border border-rose-400/50 shadow-sm shadow-rose-500/20 inline-block"></span>
          <span className="font-medium text-rose-100">Rejected</span>
        </div>
      </div>
      <div className="border-t border-slate-700/50 pt-1.5 flex items-center justify-between text-[11px] text-slate-400 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-rose-500 animate-ping"></span>
          Anomaly Cluster
        </span>
        <span>Click to Zoom</span>
      </div>
    </div>
  );
}
