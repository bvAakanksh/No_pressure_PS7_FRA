import React from 'react';
import { AnomalyCluster } from '../../types/schemas';
import { AlertOctagon, MapPin, Eye } from 'lucide-react';

interface AnomalyCardProps {
  cluster: AnomalyCluster;
  onZoomCluster?: (clusterId: string) => void;
}

export default function AnomalyCard({ cluster, onZoomCluster }: AnomalyCardProps) {
  const getSeverityBg = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'high':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:shadow-xs transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <MapPin className="size-3.5 text-slate-500" />
          <span>{cluster.districtName} Cluster</span>
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getSeverityBg(cluster.severity)}`}>
          {cluster.severity}
        </span>
      </div>

      <p className="text-xs text-slate-600 font-medium">{cluster.primaryAnomalyType}</p>

      <div className="flex items-center justify-between text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded border border-slate-100">
        <span>Claims: <strong className="text-slate-900">{cluster.claimCount}</strong></span>
        <span>Avg Risk: <strong className="text-rose-700">{cluster.avgRiskScore}/100</strong></span>
      </div>

      {onZoomCluster && (
        <button
          onClick={() => onZoomCluster(cluster.id)}
          className="w-full mt-1 py-1 px-2.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-medium rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
        >
          <Eye className="size-3" />
          <span>Inspect Cluster on Map</span>
        </button>
      )}
    </div>
  );
}
