import React, { useState } from 'react';
import { BarChart3, Plus, RefreshCw } from 'lucide-react';
import { usePerformanceMetrics } from '../../../queries/drivers/performanceMetricsQuery';

import { LoadingState, ErrorState, EmptyState } from '../common/StateFeedback';
import PerformanceTable from '../sub-features/Performance/PerformanceTable';
import { AddPerformanceModal, EditPerformanceModal, DeletePerformanceDialog } from '../sub-features/Performance/PerformanceModals';
import DriverSelect from '../common/DriverSelect';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';
import Input from '../common/Input';

const AllPerformance = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [editMetric, setEditMetric] = useState(null);

  const [filters, setFilters] = useState({
    driver: '',
    period_start: '',
    period_end: '',
  });

  const { data, isLoading, isError, error, refetch, isFetching } = usePerformanceMetrics(filters);
  const driverMap = useDriverLookup();
  const metrics = data?.results ?? [];

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      driver: '',
      period_start: '',
      period_end: '',
    });
  };

  if (isLoading && !data) return <div className="p-6"><LoadingState message="Loading all performance metrics..." /></div>;
  if (isError) return <div className="p-6"><ErrorState message="Failed to load metrics" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* ── Modals ── */}
      {addOpen && <AddPerformanceModal driverId={null} onClose={() => setAddOpen(false)} />}
      {editMetric && <EditPerformanceModal metric={editMetric} driverId={editMetric.driver} onClose={() => setEditMetric(null)} />}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Performance Metrics</h1>
          <p className="text-sm text-gray-500 mt-1">Global performance overview across all drivers</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} disabled={isFetching} className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50">
            <RefreshCw size={20} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] shadow-lg shadow-blue-200 transition-all active:scale-95">
            <Plus size={18} /> Add Metric
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Driver</p>
          <DriverSelect value={filters.driver} onChange={(val) => handleFilterChange('driver', val)} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Period Start</p>
          <Input type="date" value={filters.period_start} onChange={(e) => handleFilterChange('period_start', e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Period End</p>
            <Input type="date" value={filters.period_end} onChange={(e) => handleFilterChange('period_end', e.target.value)} />
          </div>
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {metrics.length === 0 ? (
          <div className="py-20">
            <EmptyState icon={BarChart3} title="No metrics found" description="No performance metrics have been recorded yet." />
          </div>
        ) : (
          <div className="p-4">
            <PerformanceTable metrics={metrics} onEdit={setEditMetric} showDriver={true} driverMap={driverMap} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AllPerformance;
