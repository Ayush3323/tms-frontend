import React, { useState } from 'react';
import { Plus, GraduationCap } from 'lucide-react';
import { useDriverTrainingRecords } from '../../../queries/drivers/trainingAndMedicalQuery';
import { useUsers } from '../../../queries/users/userQuery';
import { useCurrentUser } from '../../../queries/users/userActionQuery';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';

import { LoadingState, ErrorState, EmptyState, TabLayoutShimmer } from '../common/StateFeedback';
import TrainingTable from '../sub-features/Training/TrainingTable';
import { AddTrainingModal, EditTrainingModal, ViewTrainingModal, DeleteTrainingDialog } from '../sub-features/Training/TrainingModals';

const TrainingRecordsTab = ({ driverId }) => {
  const [addOpen,      setAddOpen]      = useState(false);
  const [editRecord,   setEditRecord]   = useState(null);
  const [viewRecord,   setViewRecord]   = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverTrainingRecords(driverId);
  const { data: usersData } = useUsers({ page_size: 1000 });
  const { data: currentUser } = useCurrentUser();
  const driverMap = useDriverLookup();
  const records = data?.results ?? [];

  const userMap = React.useMemo(() => {
    const map = {};
    usersData?.results?.forEach(u => {
      map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'System User';
    });
    return map;
  }, [usersData]);

  if (isLoading) return (
     <TabLayoutShimmer
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28' }, // Driver
        { headerWidth: 'w-12', cellWidth: 'w-12', type: 'mono' }, // Emp ID
        { headerWidth: 'w-20', cellWidth: 'w-32' }, // Type
        { headerWidth: 'w-16', cellWidth: 'w-20' }, // Date
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'mono' }, // Expiry
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'badge' }, // Status
        { headerWidth: 'w-20', cellWidth: 'w-24' }, // Trainer
        { headerWidth: 'w-24', cellWidth: 'w-28', type: 'mono' }, // Cert No
        { headerWidth: 'w-16', cellWidth: 'w-20' }, // File
        { headerWidth: 'w-24', cellWidth: 'w-32' }, // Notes
        { headerWidth: 'w-10', cellWidth: 'w-14', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError)   return <ErrorState message="Failed to load training records" error={error?.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* ── Modals ── */}
      {addOpen && <AddTrainingModal driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editRecord && <EditTrainingModal record={editRecord} driverId={driverId} onClose={() => setEditRecord(null)} />}
      {viewRecord && (
        <ViewTrainingModal 
          record={viewRecord} 
          driverName={driverMap[driverId]?.name} 
          employeeId={driverMap[driverId]?.employee_id}
          onClose={() => setViewRecord(null)} 
        />
      )}
      {deleteRecord && <DeleteTrainingDialog record={deleteRecord} driverId={driverId} onClose={() => setDeleteRecord(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Training Records</h3>
          <p className="text-xs text-gray-400 mt-0.5">{records.length} record{records.length !== 1 ? 's' : ''} found</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#2563eb] to-[#4f46e5] rounded-lg shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={14} /> Add Record
        </button>
      </div>

      {/* ── Empty State ── */}
      {records.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="No training records found"
          description="Click Add Record to add one"
        />
      )}

      {/* ── Table ── */}
      {records.length > 0 && (
        <TrainingTable 
          records={records} 
          onEdit={setEditRecord} 
          onView={setViewRecord}
          onDelete={setDeleteRecord} 
          showDriver={false}
          driverMap={driverMap}
          userMap={userMap}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

export default TrainingRecordsTab;