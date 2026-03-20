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

export const TableShimmer = ({ rows = 5, cols = 6 }) => (
  <div className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="bg-gray-50 h-10 border-b border-gray-100 flex items-center px-4 gap-4">
      {[...Array(cols)].map((_, i) => (
        <div key={i} className="h-3 bg-gray-200 rounded w-20" />
      ))}
    </div>
    <div className="divide-y divide-gray-50">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="px-4 py-4 flex items-center gap-4">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className={`h-4 bg-gray-100 rounded ${j === 0 ? 'w-32' : 'w-24'}`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const CardShimmer = ({ count = 1 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="p-5 bg-white border border-gray-100 rounded-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-2 bg-gray-100 rounded w-16" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-gray-50 rounded w-full" />
          <div className="h-2 bg-gray-50 rounded w-5/6" />
        </div>
        <div className="flex justify-between pt-2">
          <div className="h-4 bg-gray-100 rounded w-20" />
          <div className="h-4 bg-gray-100 rounded w-12" />
        </div>
      </div>
    ))}
  </div>
);

export const TabContentShimmer = () => (
   <div className="p-6 space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
         <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="h-3 bg-gray-100 rounded w-64" />
         </div>
         <div className="h-10 bg-gray-200 rounded-xl w-32" />
      </div>
      <div className="h-64 bg-gray-50 rounded-2xl border border-gray-100" />
   </div>
);

export const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    {Icon && <Icon size={40} className="mb-3 opacity-20" />}
    <p className="text-sm font-bold text-gray-600">{title}</p>
    {description && <p className="text-xs mt-1 text-gray-400">{description}</p>}
  </div>
);
