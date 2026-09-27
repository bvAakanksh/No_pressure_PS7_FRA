import React from 'react';
import { Loader2, Wifi } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  height?: string;
  waking?: boolean;
}

export default function LoadingState({
  message = 'Loading decision data...',
  subMessage,
  height = 'h-48',
  waking = false,
}: LoadingStateProps) {
  return (
    <div className={`w-full ${height} flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-xl border border-slate-200/80`}>
      {waking ? (
        <Wifi className="size-7 text-amber-500 animate-pulse mb-3" />
      ) : (
        <Loader2 className="size-7 text-indigo-600 animate-spin mb-3" />
      )}
      <p className="text-sm font-medium text-slate-600 text-center">{message}</p>
      {subMessage && (
        <p className="text-xs text-slate-400 mt-1 text-center max-w-xs">{subMessage}</p>
      )}
      <div className="w-48 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
        <div className={`h-full rounded-full ${waking ? 'bg-amber-400 animate-pulse w-1/3' : 'bg-indigo-600 animate-pulse w-2/3'}`} />
      </div>
    </div>
  );
}
