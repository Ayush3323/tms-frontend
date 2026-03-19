import React, { useState, useMemo } from 'react';
import { Plus, Truck } from 'lucide-react';
import { useDriverVehicleAssignments } from '../../../queries/drivers/vehicleAssignmentQuery';
import { useUsers } from '../../../queries/users/userQuery';

import { LoadingState, ErrorState, EmptyState } from '../common/StateFeedback';
import AssignmentTable from '../sub-features/Assignments/AssignmentTable';
import { AddAssignmentModal, EditAssignmentModal, DeleteAssignmentDialog } from '../sub-features/Assignments/AssignmentModals';

const VehicleTab = ({ driverId }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);
  const [deleteAssignment, setDeleteAssignment] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverVehicleAssignments(driverId);
  const { data: usersData } = useUsers({ page_size: 1000 });

  const userMap = useMemo(() => {
    const map = {};
    usersData?.results?.forEach(u => {
      map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'System User';
    });
    return map;
  }, [usersData]);

  const assignments = data?.results ?? [];
  const hasActiveAssignment = assignments.some(a => a.is_active === true);

  if (isLoading) return <LoadingState message="Loading vehicle assignments..." />;
  if (isError) return <ErrorState message="Failed to load vehicle assignments" error={error?.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* ── Modals ── */}
      {addOpen && <AddAssignmentModal driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editAssignment && <EditAssignmentModal assignment={editAssignment} driverId={driverId} onClose={() => setEditAssignment(null)} />}
      {deleteAssignment && <DeleteAssignmentDialog assignment={deleteAssignment} driverId={driverId} onClose={() => setDeleteAssignment(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Vehicle Assignments</h3>
          <p className="text-xs text-gray-400 mt-0.5">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => setAddOpen(true)}
            disabled={hasActiveAssignment}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> Assign Vehicle
          </button>
          {hasActiveAssignment && (
            <p className="text-[10px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 italic">
              * Driver already has an active vehicle.
            </p>
          )}
        </div>
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
          userMap={userMap}
        />
      )}
    </>
  );
};

export default VehicleTab;