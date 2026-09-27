import React, { useEffect, useRef, useState } from 'react';
import { Claim } from '../../types/schemas';
import RiskScore from '../common/RiskScore';
import { Eye, MapPin, FileText, ChevronDown, X, Filter } from 'lucide-react';

interface ClaimTableProps {
  claims: Claim[];
  selectedClaimId?: string | null;
  onSelectClaim: (claimId: string) => void;
  anomalyType?: string;
  onAnomalyTypeChange?: (val: string) => void;
}

const ANOMALY_OPTIONS = [
  { value: 'All',               label: 'All Types',          dot: 'bg-slate-400',   pill: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'Severe Anomaly',    label: 'Severe Anomaly',     dot: 'bg-purple-500',  pill: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'Boundary Overlap',  label: 'Boundary Overlap',   dot: 'bg-rose-500',    pill: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'Duplicate Suspect', label: 'Duplicate Suspect',  dot: 'bg-amber-500',   pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'Minor Mismatch',    label: 'Minor Mismatch',     dot: 'bg-slate-500',   pill: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'Clean',             label: 'Clean',              dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export default function ClaimTable({
  claims,
  selectedClaimId,
  onSelectClaim,
  anomalyType = 'All',
  onAnomalyTypeChange,
}: ClaimTableProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popoverOpen]);

  const activeOption = ANOMALY_OPTIONS.find(o => o.value === anomalyType) ?? ANOMALY_OPTIONS[0];
  const isFiltered = anomalyType !== 'All';

  const handleSelect = (val: string) => {
    onAnomalyTypeChange?.(val);
    setPopoverOpen(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Approved':               return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected':               return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Pending':                return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Under Field Inspection': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Committee Review':    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:                       return 'bg-slate-100 text-slate-700 border-slate-200';
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

              {/* ── Clickable / filterable Anomaly Tag header ── */}
              <th className="py-3 px-3.5">
                <div className="relative inline-block">
                  <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setPopoverOpen(v => !v)}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 transition select-none cursor-pointer ${
                      isFiltered
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                        : 'hover:bg-slate-200 text-slate-500'
                    }`}
                    title="Filter by Anomaly Tag"
                  >
                    {isFiltered && (
                      <span className={`size-1.5 rounded-full ${activeOption.dot} inline-block flex-shrink-0`} />
                    )}
                    <Filter className="size-3 flex-shrink-0" />
                    <span>Anomaly Tag</span>
                    {isFiltered ? (
                      <span className="text-[9px] font-bold ml-0.5 truncate max-w-[72px]">
                        {activeOption.label}
                      </span>
                    ) : (
                      <ChevronDown
                        className={`size-3 flex-shrink-0 transition-transform duration-150 ${popoverOpen ? 'rotate-180' : ''}`}
                      />
                    )}
                    {isFiltered && (
                      <span
                        role="button"
                        aria-label="Clear anomaly filter"
                        className="ml-0.5 hover:text-rose-600 transition cursor-pointer flex-shrink-0"
                        onMouseDown={e => { e.stopPropagation(); handleSelect('All'); }}
                      >
                        <X className="size-3" />
                      </span>
                    )}
                  </button>

                  {/* Popover dropdown */}
                  {popoverOpen && (
                    <div
                      ref={popoverRef}
                      className="absolute left-0 top-full mt-1.5 z-50 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5"
                      style={{ minWidth: '13rem' }}
                    >
                      <p className="px-3 pt-1.5 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        Filter by Anomaly Tag
                      </p>
                      {ANOMALY_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelect(opt.value)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition cursor-pointer ${
                            anomalyType === opt.value ? 'bg-slate-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span className={`size-2 rounded-full flex-shrink-0 ${opt.dot}`} />
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${opt.pill}`}>
                            {opt.label}
                          </span>
                          {anomalyType === opt.value && (
                            <span className="ml-auto text-indigo-600 font-bold text-[10px]">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </th>

              <th className="py-3 px-3.5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {claims.map(claim => {
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
                      <span>
                        {claim.districtName},{' '}
                        <span className="text-slate-500">{claim.villageName}</span>
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-900">{claim.applicantName}</td>
                  <td className="py-3 px-3.5 font-mono text-slate-800">{claim.claimedAreaHectares} Ha</td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full border font-medium text-[11px] inline-block ${getStatusStyle(claim.status)}`}
                    >
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
                      onClick={e => {
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
