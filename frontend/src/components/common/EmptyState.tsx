import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title = 'No records found',
  description = 'No matching claim records or decision metrics match your filter criteria.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="w-full py-12 px-4 flex flex-col items-center justify-center text-center bg-white rounded-xl border border-slate-200">
      <div className="p-3 bg-slate-100 text-slate-500 rounded-full mb-3">
        <Inbox className="size-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mt-1">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xs transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
