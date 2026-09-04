import React from 'react';
import { Claim } from '../../types/schemas';
import RiskBadge from '../common/RiskBadge';
import RiskScore from '../common/RiskScore';
import { Eye, MapPin, Calendar, FileText } from 'lucide-react';

interface ClaimTableProps {
  claims: Claim[];
  selectedClaimId?: string | null;
  onSelectClaim: (claimId: string) => void;
}

export default function ClaimTable({ claims, selectedClaimId, onSelectClaim }: ClaimTableProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Under Field Inspection':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Committee Review':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3.5">Claim ID</th>
              <th className="py-3 px-3.5">District / Village</th>
              <th className="py-3 px-3.5">Applicant</th>
              <th className="py-3 px-3.5">Claimed Area</th>
              <th className="py-3 px-3.5">Status</th>
              <th className="py-3 px-3.5">Risk Score</th>
              <th className="py-3 px-3.5">Anomaly Tag</th>
              <th className="py-3 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {claims.map((claim) => {
              const isSelected = claim.id === selectedClaimId;
              return (
                <tr
                  key={claim.id}
                  onClick={() => onSelectClaim(claim.id)}
                  className={`hover:bg-slate-50/80 transition cursor-pointer ${
                    isSelected ? 'bg-indigo-50/50 font-medium' : ''
                  }`}
                >
                  <td className="py-3 px-3.5 font-mono font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <FileText className="size-3.5 text-slate-400" />
                      <span>{claim.id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-1 text-slate-800">
                      <MapPin className="size-3 text-slate-400" />
                      <span>{claim.districtName}, <span className="text-slate-500">{claim.villageName}</span></span>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-900">{claim.applicantName}</td>
                  <td className="py-3 px-3.5 font-mono text-slate-800">
                    {claim.claimedAreaHectares} Ha
                  </td>
                  <td className="py-3 px-3.5">
                    <span className={`px-2 py-0.5 rounded-full border font-medium text-[11px] inline-block ${getStatusStyle(claim.status)}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <RiskScore score={claim.riskScore} size="sm" showBar={false} />
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                        claim.anomalyStatus === 'Severe Anomaly'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : claim.anomalyStatus === 'Boundary Overlap'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : claim.anomalyStatus === 'Duplicate Suspect'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : claim.anomalyStatus === 'Minor Mismatch'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {claim.anomalyStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClaim(claim.id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-md font-medium text-xs transition cursor-pointer"
                    >
                      <Eye className="size-3" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
