import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  height?: string;
}

export default function LoadingState({ message = 'Loading decision data...', height = 'h-48' }: LoadingStateProps) {
  return (
    <div className={`w-full ${height} flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-xl border border-slate-200/80`}>
      <Loader2 className="size-7 text-indigo-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
      <div className="w-48 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
        <div className="bg-indigo-600 h-full animate-pulse rounded-full w-2/3"></div>
      </div>
    </div>
  );
}
