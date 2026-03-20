import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useDriverPerformanceMetrics } from '../../../queries/drivers/performanceMetricsQuery';

import { LoadingState, ErrorState, EmptyState, TabContentShimmer } from '../common/StateFeedback';
import PerformanceTable from '../sub-features/Performance/PerformanceTable';
import { AddPerformanceModal, EditPerformanceModal, DeletePerformanceDialog } from '../sub-features/Performance/PerformanceModals';

const PerformanceTab = ({ driverId }) => {
  const [addOpen,      setAddOpen]      = useState(false);
  const [editMetric,   setEditMetric]   = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverPerformanceMetrics(driverId);
  const metrics = data?.results ?? [];

  if (isLoading) return <TabContentShimmer />;
  if (isError)   return <ErrorState message="Failed to load performance metrics" error={error?.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* ── Modals ── */}
      {addOpen      && <AddPerformanceModal    driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editMetric   && <EditPerformanceModal   metric={editMetric} driverId={driverId} onClose={() => setEditMetric(null)} />}
      {deleteRecord && <DeletePerformanceDialog metric={deleteRecord} driverId={driverId} onClose={() => setDeleteRecord(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Performance Metrics</h3>
          <p className="text-xs text-gray-400 mt-0.5">{metrics.length} record{metrics.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
          Add Metric
        </button>
      </div>

      {/* ── Empty State ── */}
      {metrics.length === 0 && (
        <EmptyState
          icon={BarChart3}
          title="No performance metrics found"
          description="Enter data above to create your first record"
        />
      )}

      {/* ── Table ── */}
      {metrics.length > 0 && (
        <PerformanceTable 
          metrics={metrics} 
          onEdit={setEditMetric} 
          onDelete={setDeleteRecord} 
          showDriver={false}
        />
      )}
    </>
  );
};

export default PerformanceTab;