import React from 'react';
import { Claim } from '../../types/schemas';
import RiskBadge from '../common/RiskBadge';
import RiskScore from '../common/RiskScore';
import AIExplanationCard from '../common/AIExplanationCard';
import Timeline from './Timeline';
import { X, MapPin, Calendar, FileText, AlertTriangle, Layers, Maximize2, ExternalLink } from 'lucide-react';

interface ClaimDetailPanelProps {
  claim: Claim;
  onClose: () => void;
  onSelectClaimOnMap?: (claimId: string) => void;
}

export default function ClaimDetailPanel({ claim, onClose, onSelectClaimOnMap }: ClaimDetailPanelProps) {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold font-mono tracking-wide">{claim.id}</h3>
            <RiskBadge level={claim.riskLevel} size="sm" />
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            {claim.applicantName} • {claim.villageName}, {claim.districtName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="p-4 space-y-5 overflow-y-auto divide-y divide-slate-100 text-xs">
        {/* Top Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-medium">Claim Type</span>
            <p className="font-semibold text-slate-800 text-xs mt-0.5">{claim.claimType}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-medium">Status</span>
            <p className="font-semibold text-slate-800 text-xs mt-0.5">{claim.status}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-medium">Submitted Date</span>
            <p className="font-mono text-slate-800 text-xs mt-0.5">{claim.submissionDate}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-medium">Claimed Area</span>
            <p className="font-mono font-bold text-slate-900 text-xs mt-0.5">{claim.claimedAreaHectares} Ha</p>
          </div>
        </div>

        {/* Section A: Claim Risk Score & Factor Breakdown */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">A. Risk Assessment Score</h4>
            <RiskScore score={claim.riskScore} size="lg" />
          </div>

          <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-600">Contributing Risk Factors:</span>
            <div className="space-y-2 mt-1">
              {claim.riskFactorBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{item.factor}</span>
                    <span className="font-mono text-rose-700 font-semibold">+{item.scoreContribution} pts</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section B: AI Anomaly Explanation */}
        <div className="pt-4">
          <AIExplanationCard
            title="B. AI Anomaly & Satellite Intelligence"
            summary={claim.aiExplanation.summary}
            suspiciousFactors={claim.aiExplanation.suspiciousFactors}
            flagReason={claim.aiExplanation.flagReason}
            confidenceScore={claim.aiExplanation.confidenceScore}
          />
        </div>

        {/* Section E & F: Land Area Mismatch & Forest Boundary Overlap */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Land Area Mismatch */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold border-b border-slate-200 pb-1.5">
              <Maximize2 className="size-3.5 text-indigo-600" />
              <span>E. Land Area Mismatch</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Claimed Area:</span>
                <span className="font-bold text-slate-900">{claim.claimedAreaHectares} Ha</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Reference Area:</span>
                <span className="text-slate-900">{claim.referenceAreaHectares} Ha</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold border-t border-slate-200 pt-1">
                <span>Area Discrepancy:</span>
                <span>+{(claim.claimedAreaHectares - claim.referenceAreaHectares).toFixed(2)} Ha ({claim.areaMismatchPercentage}%)</span>
              </div>
            </div>
          </div>

          {/* Forest Boundary Overlap */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold border-b border-slate-200 pb-1.5">
              <Layers className="size-3.5 text-rose-600" />
              <span>F. Forest Boundary Overlap</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Reserve Forest Overlap:</span>
                <span className="font-mono font-bold text-rose-700">{claim.forestBoundaryOverlapPercentage}%</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Status:</span>
                <span className="font-semibold text-slate-800">{claim.anomalyStatus}</span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                Spatial polygon intersects Kanger Reserve Forest Compartment #142.
              </p>
            </div>
          </div>
        </div>

        {/* Section C: Claim Journey Timeline */}
        <div className="pt-4">
          <Timeline events={claim.journeyTimeline} />
        </div>

        {/* Section D: Nearby Anomalies */}
        {claim.nearbyAnomalies && claim.nearbyAnomalies.length > 0 && (
          <div className="pt-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">D. Nearby Spatial Anomalies</h4>
            <div className="space-y-2">
              {claim.nearbyAnomalies.map((nearby, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-900">{nearby.claimId}</span>
                      <RiskScore score={nearby.riskScore} size="sm" showBar={false} />
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {nearby.anomalyType} • Distance: <span className="font-mono font-medium">{nearby.distanceKm} km</span>
                    </p>
                  </div>
                  {onSelectClaimOnMap && (
                    <button
                      onClick={() => onSelectClaimOnMap(nearby.claimId)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <ExternalLink className="size-3" />
                      <span>View</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
