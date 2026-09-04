import React from 'react';

export default function MapLegend() {
  return (
    <div className="bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-slate-200 shadow-sm text-xs space-y-2 max-w-xs">
      <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 flex items-center justify-between">
        <span>Map Legend</span>
        <span className="text-[10px] text-slate-500 font-normal">Risk Level</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-emerald-500 border border-emerald-600 inline-block"></span>
          <span>Low (&lt;40)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-amber-500 border border-amber-600 inline-block"></span>
          <span>Medium (40-70)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-rose-500 border border-rose-600 inline-block"></span>
          <span>High (70-85)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-purple-700 border border-purple-800 inline-block"></span>
          <span>Critical (&gt;85)</span>
        </div>
      </div>
      <div className="border-t border-slate-100 pt-1.5 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-red-500 animate-ping"></span>
          Anomaly Cluster
        </span>
        <span>Click to Zoom</span>
      </div>
    </div>
  );
}
