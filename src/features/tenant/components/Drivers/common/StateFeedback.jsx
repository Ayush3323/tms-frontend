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

export const TableShimmer = ({ rows = 5, cols = 8 }) => (
  <div className="w-full bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="bg-gray-50/80 h-12 border-b border-gray-100 flex items-center px-6 gap-6">
      {[...Array(cols)].map((_, i) => (
        <div key={i} className={`h-2.5 bg-gray-200 rounded-full ${i === 0 ? 'w-32' : (i === 1 ? 'w-16' : 'w-24')}`} />
      ))}
    </div>
    <div className="divide-y divide-gray-50">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="px-6 py-5 flex items-center gap-6">
          {[...Array(cols)].map((_, j) => {
            const isBadge = [0, 3, 7, 8].includes(j % 10);
            const isShort = [1, 2, 4, 5, 6].includes(j % 10);
            return (
              <div
                key={j}
                className={`h-4 bg-gray-50/80 ${isBadge ? 'rounded-full w-28 h-7 opacity-70' : (isShort ? 'rounded-lg w-16' : 'rounded-lg w-24')} ${j === 0 ? 'w-40' : ''}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  </div>
);

export const PageShimmer = ({ columns = 5 }) => (
  <div className="p-6 space-y-6 animate-pulse">
    {/* Header Shimmer */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 rounded-xl w-72" />
        <div className="h-4 bg-gray-100 rounded-lg w-[450px]" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-xl border border-gray-200/50" />
        <div className="h-11 bg-gray-200 rounded-xl w-44" />
      </div>
    </div>

    {/* Filters Shimmer */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
      {[...Array(columns)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-2.5 bg-gray-200/80 rounded-full w-20 ml-1.5" />
          <div className="h-11 bg-white border border-gray-100 rounded-xl w-full shadow-sm shadow-gray-100/50" />
        </div>
      ))}
    </div>

    {/* Table Content Shimmer */}
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <TableShimmer rows={10} cols={columns + 3} />
    </div>
  </div>
);

export const CardShimmer = ({ count = 1 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="p-5 bg-white border border-gray-100 rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
          <div className="space-y-2.5">
            <div className="h-3.5 bg-gray-200 rounded-lg w-28" />
            <div className="h-2.5 bg-gray-100 rounded-lg w-20" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-2 bg-gray-50 rounded-lg w-full" />
          <div className="h-2 bg-gray-50 rounded-lg w-11/12" />
        </div>
        <div className="flex justify-between pt-2">
          <div className="h-5 bg-gray-100 rounded-full w-24" />
          <div className="h-5 bg-gray-100 rounded-lg w-14" />
        </div>
      </div>
    ))}
  </div>
);

export const TabContentShimmer = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-3">
        <div className="h-7 bg-gray-200 rounded-xl w-56" />
        <div className="h-4 bg-gray-100 rounded-lg w-80" />
      </div>
      <div className="h-11 bg-gray-200 rounded-xl w-36" />
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <TableShimmer rows={6} cols={7} />
    </div>
  </div>
);

export const DetailShimmer = () => (
  <div className="p-6 space-y-6 animate-pulse bg-[#F8FAFC] min-h-screen">
    {/* Breadcrumb Shimmer */}
    <div className="flex items-center gap-2">
      <div className="h-4 bg-gray-200 rounded-lg w-20" />
      <div className="h-4 bg-gray-100 rounded-lg w-4" />
      <div className="h-4 bg-gray-200 rounded-lg w-32" />
    </div>

    {/* Hero Card Shimmer */}
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start gap-6">
        <div className="w-20 h-20 bg-gray-100 rounded-xl shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-7 bg-gray-200 rounded-xl w-64" />
          <div className="flex gap-2">
            <div className="h-6 bg-gray-100 rounded-lg w-20" />
            <div className="h-6 bg-gray-100 rounded-lg w-24" />
            <div className="h-6 bg-gray-100 rounded-lg w-24" />
          </div>
          <div className="flex gap-4">
            <div className="h-4 bg-gray-50 rounded-lg w-32" />
            <div className="h-4 bg-gray-50 rounded-lg w-40" />
            <div className="h-4 bg-gray-50 rounded-lg w-36" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-10 bg-gray-200 rounded-lg w-32" />
          <div className="h-10 bg-gray-100 rounded-lg w-32" />
        </div>
      </div>
    </div>

    {/* Tabs Shimmer */}
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex border-b border-gray-100 px-2 overflow-x-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="px-5 py-4 border-b-2 border-transparent">
            <div className="h-3 bg-gray-100 rounded-full w-16" />
          </div>
        ))}
      </div>
      <div className="p-6 space-y-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-4 border border-gray-100/50 rounded-xl p-5">
            <div className="h-4 bg-gray-200 rounded-lg w-40" />
            <div className="grid grid-cols-5 gap-6 mt-4">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="h-2 bg-gray-100 rounded-full w-12" />
                  <div className="h-4 bg-gray-50 rounded-lg w-24" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    {Icon && <Icon size={40} className="mb-3 opacity-20" />}
    <p className="text-sm font-bold text-gray-600">{title}</p>
    {description && <p className="text-xs mt-1 text-gray-400">{description}</p>}
  </div>
);
