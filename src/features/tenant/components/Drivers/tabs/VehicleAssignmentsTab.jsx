import React, { useState, useMemo } from 'react';
import { Plus, Truck } from 'lucide-react';
import { useDriverVehicleAssignments } from '../../../queries/drivers/vehicleAssignmentQuery';
import { useUsers } from '../../../queries/users/userQuery';
import { useCurrentUser } from '../../../queries/users/userActionQuery';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';

import { LoadingState, ErrorState, EmptyState, TabLayoutShimmer } from '../common/StateFeedback';
import AssignmentTable from '../sub-features/Assignments/AssignmentTable';
import { AddAssignmentModal, EditAssignmentModal, DeleteAssignmentDialog } from '../sub-features/Assignments/AssignmentModals';

const VehicleTab = ({ driverId }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);
  const [deleteAssignment, setDeleteAssignment] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverVehicleAssignments(driverId);
  const { data: usersData } = useUsers({ page_size: 1000 });
  const { data: currentUser } = useCurrentUser();
  const driverMap = useDriverLookup();

  const userMap = useMemo(() => {
    const map = {};
    usersData?.results?.forEach(u => {
      map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'System User';
    });
    return map;
  }, [usersData]);

  const assignments = data?.results ?? [];
  const hasActiveAssignment = assignments.some(a => a.is_active === true);

  if (isLoading) return (
    <TabLayoutShimmer
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28' }, // Driver
        { headerWidth: 'w-12', cellWidth: 'w-12', type: 'mono' }, // Emp ID
        { headerWidth: 'w-20', cellWidth: 'w-24', type: 'mono' }, // Vehicle
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'badge' }, // Type
        { headerWidth: 'w-20', cellWidth: 'w-24' }, // Assigned Date
        { headerWidth: 'w-20', cellWidth: 'w-24' }, // Unassigned Date
        { headerWidth: 'w-12', cellWidth: 'w-16', type: 'badge' }, // Active
        { headerWidth: 'w-20', cellWidth: 'w-24' }, // Assigned By
        { headerWidth: 'w-28', cellWidth: 'w-40' }, // Notes
        { headerWidth: 'w-10', cellWidth: 'w-14', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
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
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#2563eb] to-[#4f46e5] rounded-lg shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
          driverMap={driverMap}
          userMap={userMap}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

export default VehicleTab;