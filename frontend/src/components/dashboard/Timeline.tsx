import React from 'react';
import { TimelineEvent } from '../../types/schemas';
import { CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react';

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Claim Processing Journey</h4>
        <span className="text-[11px] text-slate-500">Stage SLA Pipeline</span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((evt, idx) => {
          return (
            <div key={idx} className="relative flex items-start group">
              {/* Timeline Icon Node */}
              <div
                className={`absolute -left-6 top-0.5 size-5 rounded-full flex items-center justify-center border bg-white ${
                  evt.completed
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-50'
                    : evt.current
                    ? evt.isDelayed
                      ? 'border-rose-600 text-rose-600 bg-rose-50 animate-pulse'
                      : 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-slate-300 text-slate-300'
                }`}
              >
                {evt.completed ? (
                  <CheckCircle2 className="size-3.5" />
                ) : evt.current ? (
                  evt.isDelayed ? <AlertCircle className="size-3.5" /> : <Clock className="size-3.5" />
                ) : (
                  <Circle className="size-2.5 fill-slate-300" />
                )}
              </div>

              {/* Event Content */}
              <div className="flex-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${evt.current ? 'text-slate-900' : 'text-slate-700'}`}>
                    {evt.stage}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">{evt.date}</span>
                </div>

                {evt.assignedOfficer && (
                  <p className="text-[11px] text-slate-600">
                    Assigned: <span className="font-medium text-slate-800">{evt.assignedOfficer}</span>
                  </p>
                )}

                {evt.durationDays && (
                  <p className="text-[11px] text-slate-500 font-mono">
                    Time spent in stage: {evt.durationDays} days
                  </p>
                )}

                {evt.isDelayed && (
                  <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-700 font-medium flex items-start gap-1">
                    <AlertCircle className="size-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>Delay Bottleneck: {evt.delayReason || 'Extended administrative verification lag'}</span>
                  </div>
                )}

                {evt.notes && <p className="text-[11px] text-slate-600 italic border-t border-slate-200/60 pt-1 mt-1">{evt.notes}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
