import React from 'react';
import { RotateCcw } from 'lucide-react';

const CustomerListFilterBar = ({
  statusFilter,
  onStatusChange,
  statusOptions = [],
  ordering,
  onOrderingChange,
  orderingOptions = [],
  extraFilters = null,
  onClearFilters,
  clearVisible = false,
  currentPage,
  onPrevPage,
  onNextPage,
  hasNextPage,
  isLoading,
}) => {
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-50 min-h-[60px]">
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[12px] font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:border-gray-200 cursor-pointer shadow-sm"
        >
          <option value="">All Statuses</option>
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {orderingOptions.length > 0 && (
          <select
            value={ordering}
            onChange={(e) => onOrderingChange(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[12px] font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:border-gray-200 cursor-pointer shadow-sm"
          >
            {orderingOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {extraFilters}

        {clearVisible && (
          <button
            onClick={onClearFilters}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Clear filters"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onPrevPage}
          disabled={currentPage === 1 || isLoading}
          className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          Previous
        </button>
        <div className="flex items-center justify-center min-w-8 h-8 bg-[#0052CC] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
          {currentPage}
        </div>
        <button
          onClick={onNextPage}
          disabled={!hasNextPage || isLoading}
          className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CustomerListFilterBar;
