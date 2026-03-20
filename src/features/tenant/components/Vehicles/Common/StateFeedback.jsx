import React from 'react';
import { Loader2, AlertCircle, RefreshCw, Plus } from 'lucide-react';

export const LoadingState = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
    <Loader2 size={20} className="animate-spin text-[#0052CC]" />
    <span className="text-sm font-medium">{message}</span>
  </div>
);

export const ErrorState = ({ message = 'Failed to load data', error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
    <AlertCircle size={32} />
    <p className="text-sm font-bold text-gray-700 font-mono tracking-tight">{message}</p>
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

export const TableShimmer = ({ rows = 5, cols = 6 }) => (
  <div className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="bg-gray-50 h-11 border-b border-gray-100 flex items-center px-4 gap-8">
      {[...Array(cols)].map((_, i) => (
        <div key={i} className={`h-2.5 bg-gray-200 rounded ${i === 0 ? 'w-32' : 'w-20'}`} />
      ))}
    </div>
    <div className="divide-y divide-gray-50">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="px-4 py-4 flex items-center gap-8">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className={`h-3 bg-gray-100 rounded ${j === 0 ? 'w-36 h-4' : 'w-20'}`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const CardShimmer = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="h-3 bg-gray-100 rounded w-20" />
          <div className="w-8 h-8 bg-gray-50 rounded-lg" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-12" />
      </div>
    ))}
  </div>
);

export const TabContentShimmer = () => (
  <div className="space-y-6 animate-pulse p-1">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 rounded w-40" />
        <div className="h-3 bg-gray-100 rounded w-56" />
      </div>
      <div className="h-9 bg-gray-200 rounded-lg w-24" />
    </div>
    <div className="h-64 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center">
       <Loader2 className="animate-spin text-gray-200" size={32} />
    </div>
  </div>
);
