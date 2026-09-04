import React from 'react';

interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high' | 'critical' | string;
  size?: 'sm' | 'md' | 'lg';
}

export default function RiskBadge({ level, size = 'md' }: RiskBadgeProps) {
  const normLevel = level.toLowerCase();

  const styles: Record<string, string> = {
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-rose-50 text-rose-700 border-rose-200',
    critical: 'bg-purple-50 text-purple-800 border-purple-200 font-bold',
  };

  const badgeStyle = styles[normLevel] || styles.medium;

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1 uppercase tracking-wider',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md border ${badgeStyle} ${sizeStyles[size]}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          normLevel === 'low'
            ? 'bg-emerald-500'
            : normLevel === 'medium'
            ? 'bg-amber-500'
            : normLevel === 'high'
            ? 'bg-rose-500'
            : 'bg-purple-600 animate-pulse'
        }`}
      ></span>
      <span className="capitalize">{level} Risk</span>
    </span>
  );
}
