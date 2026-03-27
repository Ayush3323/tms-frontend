import React, { useState } from 'react';
import { BarChart3, Plus, RefreshCw, Download, Upload, RotateCcw } from 'lucide-react';
import { usePerformanceMetrics } from '../../../queries/drivers/performanceMetricsQuery';

import { LoadingState, ErrorState, EmptyState, GenericTableShimmer, PageLayoutShimmer } from '../common/StateFeedback';
import PerformanceTable from '../sub-features/Performance/PerformanceTable';
import { AddPerformanceModal, EditPerformanceModal, ViewPerformanceModal, DeletePerformanceDialog } from '../sub-features/Performance/PerformanceModals';
import DriverSelect from '../common/DriverSelect';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';
import Input from '../common/Input';

const AllPerformance = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [editMetric, setEditMetric] = useState(null);
  const [viewMetric, setViewMetric] = useState(null);

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
      {viewMetric && (
        <ViewPerformanceModal 
          record={viewMetric} 
          driverName={driverMap[viewMetric.driver]?.name} 
          employeeId={driverMap[viewMetric.driver]?.employee_id}
          onClose={() => setViewMetric(null)} 
        />
      )}

      <div className="p-6 lg:p-8 flex-1 flex flex-col min-h-0">
        {/* ── Header ── */}
        <div className="flex items-center mb-8">
          <div className="w-1/4">
            <h1 className="text-2xl font-black text-[#172B4D] uppercase tracking-tight">Performance Metrics</h1>
            <p className="text-gray-500 text-sm tracking-tight mt-0.5">Global performance overview across all drivers</p>
          </div>
          <div className="flex-1" />
          <div className="flex items-center justify-end gap-2 ml-auto">
            <div className="flex items-center gap-2">
              <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95 group">
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} /><span>Refresh</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95">
                <Upload size={14} /><span>Import</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95">
                <Download size={14} /><span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
          {/* Compact Stats Row */}
          <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            {isLoading ? (
              <div className="flex gap-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-28"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Records:</span>
                  <span className="text-[18px] font-black text-[#172B4D]">{data?.count ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Avg Rating:</span>
                  <span className="text-[18px] font-black text-blue-600">
                    {(metrics.reduce((acc, m) => acc + (parseFloat(m.overall_rating) || 0), 0) / (metrics.length || 1)).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Trips:</span>
                  <span className="text-[18px] font-black text-green-600">{metrics.reduce((acc, m) => acc + (parseInt(m.total_trips) || 0), 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Distance:</span>
                  <span className="text-[18px] font-black text-amber-600">{metrics.reduce((acc, m) => acc + (parseFloat(m.total_distance) || 0), 0).toLocaleString()} km</span>
                </div>
              </>
            )}
            <div className="ml-auto flex justify-end">
              <button onClick={() => setAddOpen(true)} className="bg-[#0052CC] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-md active:scale-95 group">
                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> Add Metric
              </button>
            </div>
          </div>

          {/* ── Filters Bar ── */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 bg-white flex-wrap">
            <DriverSelect value={filters.driver} onChange={(val) => handleFilterChange('driver', val)}
              className="text-xs py-1.5 font-bold text-[#172B4D] rounded-lg bg-white border border-gray-200 hover:bg-[#EDF1F7] transition-colors" />
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-2 rounded-lg hover:bg-[#EDF1F7] transition-colors">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Start:</span>
              <input 
                type="date" 
                value={filters.period_start} 
                onChange={(e) => handleFilterChange('period_start', e.target.value)}
                className="text-xs py-1 px-1 bg-transparent border-none focus:ring-0 font-bold text-[#172B4D]" 
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-2 rounded-lg hover:bg-[#EDF1F7] transition-colors">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">End:</span>
              <input 
                type="date" 
                value={filters.period_end} 
                onChange={(e) => handleFilterChange('period_end', e.target.value)}
                className="text-xs py-1 px-1 bg-transparent border-none focus:ring-0 font-bold text-[#172B4D]" 
              />
            </div>
            {(filters.driver || filters.period_start || filters.period_end) && (
              <button onClick={clearFilters} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Clear">
                <RotateCcw size={14} />
              </button>
            )}
          </div>

        {/* ── Content ── */}
        <div className="flex-1 min-h-0 overflow-auto">
          {metrics.length === 0 ? (
          <div className="py-20">
            <EmptyState icon={BarChart3} title="No metrics found" description="No performance metrics have been recorded yet." />
          </div>
        ) : (
          <PerformanceTable metrics={metrics} onEdit={setEditMetric} onView={setViewMetric} showDriver={true} driverMap={driverMap} />
        )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default AllPerformance;
