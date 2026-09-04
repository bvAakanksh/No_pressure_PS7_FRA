import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  icon?: LucideIcon;
  variant?: 'default' | 'pending' | 'approved' | 'rejected' | 'danger';
  active?: boolean;
  onClick?: () => void;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = 'default',
  active = false,
  onClick,
}: KpiCardProps) {
  const variantStyles = {
    default: {
      border: 'border-slate-200',
      iconBg: 'bg-slate-100 text-slate-700',
      activeBorder: 'border-slate-800 ring-1 ring-slate-800',
    },
    pending: {
      border: 'border-amber-200/80',
      iconBg: 'bg-amber-50 text-amber-700',
      activeBorder: 'border-amber-600 ring-1 ring-amber-600',
    },
    approved: {
      border: 'border-emerald-200/80',
      iconBg: 'bg-emerald-50 text-emerald-700',
      activeBorder: 'border-emerald-600 ring-1 ring-emerald-600',
    },
    rejected: {
      border: 'border-slate-200',
      iconBg: 'bg-rose-50 text-rose-700',
      activeBorder: 'border-rose-600 ring-1 ring-rose-600',
    },
    danger: {
      border: 'border-rose-200',
      iconBg: 'bg-rose-100 text-rose-800',
      activeBorder: 'border-rose-700 ring-1 ring-rose-700 bg-rose-50/30',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`p-4 bg-white rounded-xl border ${active ? style.activeBorder : style.border} shadow-2xs hover:shadow-xs transition duration-150 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${style.iconBg}`}>
            <Icon className="size-4" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </span>
        {trend && (
          <span
            className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
              trend.isNeutral
                ? 'bg-slate-100 text-slate-600'
                : trend.isPositive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
