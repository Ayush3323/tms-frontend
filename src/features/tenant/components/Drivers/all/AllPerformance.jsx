import React, { useState } from 'react';
import { BarChart3, Plus } from 'lucide-react';
import { usePerformanceMetrics } from '../../../queries/drivers/performanceMetricsQuery';

import { LoadingState, ErrorState, EmptyState, GenericTableShimmer, PageLayoutShimmer } from '../common/StateFeedback';
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

  const { data, isLoading, isError, error, refetch } = usePerformanceMetrics(filters);
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

  if (isLoading && !data) return (
    <PageLayoutShimmer
      filterCount={3}
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28', type: 'multiline', subWidth: 'w-16' }, // Driver
        { headerWidth: 'w-12', cellWidth: 'w-12', type: 'mono' }, // Emp ID
        { headerWidth: 'w-20', cellWidth: 'w-20', type: 'multiline', subWidth: 'w-16' }, // Period
        { headerWidth: 'w-12', cellWidth: 'w-12' }, // Trips
        { headerWidth: 'w-16', cellWidth: 'w-16' }, // Distance
        { headerWidth: 'w-16', cellWidth: 'w-16' }, // OT
        { headerWidth: 'w-16', cellWidth: 'w-16' }, // Fuel
        { headerWidth: 'w-16', cellWidth: 'w-16' }, // Safety
        { headerWidth: 'w-16', cellWidth: 'w-12' }, // Rating
        { headerWidth: 'w-24', cellWidth: 'w-32' }, // Notes
        { headerWidth: 'w-10', cellWidth: 'w-14', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError) return <div className="p-6"><ErrorState message="Failed to load metrics" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col relative">
      {/* ── Modals ── */}
      {addOpen && <AddPerformanceModal driverId={null} onClose={() => setAddOpen(false)} />}
      {editMetric && <EditPerformanceModal metric={editMetric} driverId={editMetric.driver} onClose={() => setEditMetric(null)} />}

      <div className="p-6 lg:p-8 flex-1 flex flex-col min-h-0">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Performance Metrics</h1>
            <p className="text-sm text-gray-500 mt-1">Global performance overview across all drivers</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#0043A8] transition-all">
              <Plus size={16} /> Add Metric
            </button>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* ── Filters Bar ── */}
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white flex-wrap gap-4">
            <div className="flex gap-3 items-center flex-wrap flex-1">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Driver</p>
          <DriverSelect 
            value={filters.driver} 
            onChange={(val) => handleFilterChange('driver', val)} 
            className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
          />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Period Start</p>
          <Input 
            type="date" 
            value={filters.period_start} 
            onChange={(e) => handleFilterChange('period_start', e.target.value)} 
            className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Period End</p>
            <Input 
              type="date" 
              value={filters.period_end} 
              onChange={(e) => handleFilterChange('period_end', e.target.value)} 
              className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
            />
          </div>
            </div>
          </div>
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors mb-1 self-end"
          >
            Clear
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-h-0 overflow-auto">
          {metrics.length === 0 ? (
          <div className="py-20">
            <EmptyState icon={BarChart3} title="No metrics found" description="No performance metrics have been recorded yet." />
          </div>
        ) : (
          <PerformanceTable metrics={metrics} onEdit={setEditMetric} showDriver={true} driverMap={driverMap} />
        )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default AllPerformance;
