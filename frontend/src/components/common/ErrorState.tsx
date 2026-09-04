import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = 'Failed to load backend response',
  message = 'An error occurred while connecting to the decision support API service. Please verify your backend server status or configuration.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="w-full p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex flex-col items-center text-center">
      <div className="p-2.5 bg-rose-100 rounded-full text-rose-600 mb-2">
        <AlertTriangle className="size-6" />
      </div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="text-xs text-rose-700 max-w-lg mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className="size-3.5" />
          <span>Retry API Connection</span>
        </button>
      )}
    </div>
  );
}
