import React from 'react';

interface RiskScoreProps {
  score: number; // 0 to 100
  showBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function RiskScore({ score, showBar = true, size = 'md' }: RiskScoreProps) {
  const getScoreColor = (val: number) => {
    if (val >= 85) return 'text-purple-700 bg-purple-100 border-purple-200';
    if (val >= 70) return 'text-rose-700 bg-rose-100 border-rose-200';
    if (val >= 40) return 'text-amber-700 bg-amber-100 border-amber-200';
    return 'text-emerald-700 bg-emerald-100 border-emerald-200';
  };

  const getBarColor = (val: number) => {
    if (val >= 85) return 'bg-purple-600';
    if (val >= 70) return 'bg-rose-500';
    if (val >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 font-mono font-semibold',
    md: 'text-sm px-2 py-0.5 font-mono font-bold',
    lg: 'text-base px-2.5 py-1 font-mono font-bold',
  };

  return (
    <div className="flex flex-col gap-1 inline-block">
      <div className="flex items-center gap-2">
        <span className={`rounded border ${getScoreColor(score)} ${sizeClasses[size]}`}>
          {score}/100
        </span>
      </div>
      {showBar && (
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full ${getBarColor(score)} rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
