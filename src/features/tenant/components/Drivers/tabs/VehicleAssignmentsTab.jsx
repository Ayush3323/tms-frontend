import React, { useState } from 'react';
import { Plus, Truck } from 'lucide-react';
import { useDriverVehicleAssignments } from '../../../queries/drivers/vehicleAssignmentQuery';

import { LoadingState, ErrorState, EmptyState } from '../common/StateFeedback';
import AssignmentTable from '../sub-features/Assignments/AssignmentTable';
import { AddAssignmentModal, EditAssignmentModal, DeleteAssignmentDialog } from '../sub-features/Assignments/AssignmentModals';

const VehicleTab = ({ driverId }) => {
  const [addOpen,          setAddOpen]          = useState(false);
  const [editAssignment,   setEditAssignment]   = useState(null);
  const [deleteAssignment, setDeleteAssignment] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverVehicleAssignments(driverId);
  const assignments = data?.results ?? [];

  if (isLoading) return <LoadingState message="Loading vehicle assignments..." />;
  if (isError)   return <ErrorState message="Failed to load vehicle assignments" error={error?.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* ── Modals ── */}
      {addOpen         && <AddAssignmentModal    driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editAssignment   && <EditAssignmentModal   assignment={editAssignment} driverId={driverId} onClose={() => setEditAssignment(null)} />}
      {deleteAssignment && <DeleteAssignmentDialog assignment={deleteAssignment} driverId={driverId} onClose={() => setDeleteAssignment(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Vehicle Assignments</h3>
          <p className="text-xs text-gray-400 mt-0.5">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
          <Plus size={14} /> Assign Vehicle
        </button>
      </div>

      {/* ── Empty State ── */}
      {assignments.length === 0 && (
        <EmptyState
          icon={Truck}
          title="No vehicle assignments found"
          description="Click Assign Vehicle to add one"
        />
      )}

      {/* ── Table ── */}
      {assignments.length > 0 && (
        <AssignmentTable 
          assignments={assignments} 
          onEdit={setEditAssignment} 
          onDelete={setDeleteAssignment} 
          showDriver={false}
        />
      )}
    </>
  );
};

export default VehicleTab;