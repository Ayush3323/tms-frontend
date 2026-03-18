import React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const LoadingState = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
    <Loader2 size={20} className="animate-spin text-[#0052CC]" />
    <span className="text-sm font-medium">{message}</span>
  </div>
);

export const ErrorState = ({ message = 'Failed to load data', error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
    <AlertCircle size={32} />
    <p className="text-sm font-bold text-gray-700">{message}</p>
    {error && <p className="text-xs text-gray-400">{error}</p>}
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-4 py-2 mt-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all shadow-md shadow-blue-100"
      >
        <RefreshCw size={13} /> Try Again
      </button>
    )}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    {Icon && <Icon size={40} className="mb-3 opacity-20" />}
    <p className="text-sm font-bold text-gray-600">{title}</p>
    {description && <p className="text-xs mt-1 text-gray-400">{description}</p>}
  </div>
);
