import React from 'react';
import { Bot, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

interface AIExplanationCardProps {
  summary: string;
  suspiciousFactors: string[];
  flagReason?: string;
  confidenceScore?: number;
  title?: string;
}

export default function AIExplanationCard({
  summary,
  suspiciousFactors,
  flagReason,
  confidenceScore = 92,
  title = 'AI Anomaly & Spatial Audit Analysis',
}: AIExplanationCardProps) {
  return (
    <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl shadow-xs border border-indigo-900/60 space-y-3">
      <div className="flex items-center justify-between border-b border-indigo-800/50 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-wide uppercase text-indigo-200">{title}</h4>
            {flagReason && <p className="text-[11px] text-indigo-300/80">{flagReason}</p>}
          </div>
        </div>
        {confidenceScore && (
          <div className="flex items-center gap-1.5 bg-indigo-900/80 px-2.5 py-1 rounded-full border border-indigo-700/60 text-[11px]">
            <Bot className="size-3.5 text-indigo-300" />
            <span className="font-mono text-indigo-200 font-semibold">{confidenceScore}% AI Confidence</span>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-200 leading-relaxed font-normal">{summary}</p>

      {suspiciousFactors && suspiciousFactors.length > 0 && (
        <div className="space-y-1.5 bg-indigo-950/60 p-3 rounded-lg border border-indigo-900/40">
          <div className="text-[11px] font-semibold text-rose-300 flex items-center gap-1">
            <ShieldAlert className="size-3.5" />
            <span>Key Risk Indicators Detected:</span>
          </div>
          <ul className="space-y-1">
            {suspiciousFactors.map((factor, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-rose-400 mt-0.5">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
