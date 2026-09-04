import React, { useEffect, useState } from 'react';
import PriorityQueue from '../components/dashboard/PriorityQueue';
import AnomalyCard from '../components/dashboard/AnomalyCard';
import FRAMap from '../components/map/FRAMap';
import ClaimDetailPanel from '../components/dashboard/ClaimDetailPanel';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { PriorityQueueItem, AnomalyCluster, Claim, DistrictData } from '../types/schemas';
import {
  getPriorityQueue,
  getAnomalyClusters,
  getClaims,
  getClaim,
  getDistricts,
} from '../services/api';
import { ShieldAlert, Flame, MapPin } from 'lucide-react';

export default function RiskAnomaliesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [priorityQueue, setPriorityQueue] = useState<PriorityQueueItem[]>([]);
  const [clusters, setClusters] = useState<AnomalyCluster[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);

  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [queueData, clusterData, claimsData, districtData] = await Promise.all([
        getPriorityQueue(),
        getAnomalyClusters(),
        getClaims(),
        getDistricts(),
      ]);
      setPriorityQueue(queueData);
      setClusters(clusterData);
      setClaims(claimsData);
      setDistricts(districtData);
    } catch (err: any) {
      setError(err.message || 'Failed to load risk analysis data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectClaim = async (cId: string) => {
    const detail = await getClaim(cId);
    setSelectedClaim(detail);
  };

  const handleZoomCluster = (clusterId: string) => {
    const target = clusters.find((c) => c.id === clusterId);
    if (target) {
      const dt = districts.find((d) => d.id === target.districtId);
      if (dt) setSelectedDistrict(dt);
    }
  };

  if (loading) return <LoadingState message="Calculating AI Anomaly Clusters & Priority Queue..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
            <ShieldAlert className="size-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide">Risk & Anomaly Intelligence Hub</h2>
            <p className="text-xs text-slate-400">
              Automated spatial clustering, land mismatch audit & risk rank queuing
            </p>
          </div>
        </div>
      </div>

      {/* Grid Layout: Anomaly Cluster Map + Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map view with hotspot clusters */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="size-4 text-rose-600" />
              <span>Geographic Anomaly Hotspot Clusters</span>
            </h3>
          </div>
          <FRAMap
            selectedDistrict={selectedDistrict}
            claims={claims}
            clusters={clusters}
            showClusters={true}
            onSelectDistrict={(dId) => {
              const dt = districts.find((d) => d.id === dId) || null;
              setSelectedDistrict(dt);
            }}
            onSelectClaim={handleSelectClaim}
          />
        </div>

        {/* Hotspot Cluster Cards List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Active Anomaly Hotspots ({clusters.length})
          </h3>
          <div className="space-y-3">
            {clusters.map((cluster) => (
              <AnomalyCard key={cluster.id} cluster={cluster} onZoomCluster={handleZoomCluster} />
            ))}
          </div>
        </div>
      </div>

      {/* AI Priority Queue Table & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={`${selectedClaim ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all`}>
          <PriorityQueue items={priorityQueue} onSelectClaim={handleSelectClaim} />
        </div>

        {selectedClaim && (
          <div className="lg:col-span-5 sticky top-20">
            <ClaimDetailPanel
              claim={selectedClaim}
              onClose={() => setSelectedClaim(null)}
              onSelectClaimOnMap={handleSelectClaim}
            />
          </div>
        )}
      </div>
    </div>
  );
}
