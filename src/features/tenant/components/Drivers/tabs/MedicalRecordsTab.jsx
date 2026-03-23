import React, { useState } from 'react';
import { Plus, Activity } from 'lucide-react';
import { useDriverMedicalRecords } from '../../../queries/drivers/trainingAndMedicalQuery';
import { useUsers } from '../../../queries/users/userQuery';
import { useCurrentUser } from '../../../queries/users/userActionQuery';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';

import { LoadingState, ErrorState, EmptyState, TabLayoutShimmer } from '../common/StateFeedback';
import MedicalTable from '../sub-features/Medical/MedicalTable';
import { AddMedicalModal, EditMedicalModal, DeleteMedicalDialog } from '../sub-features/Medical/MedicalModals';

const MedicalRecordsTab = ({ driverId }) => {
  const [addOpen,      setAddOpen]      = useState(false);
  const [editRecord,   setEditRecord]   = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverMedicalRecords(driverId);
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
        { headerWidth: 'w-20', cellWidth: 'w-24' }, // Exam Date
        { headerWidth: 'w-20', cellWidth: 'w-24', type: 'mono' }, // Next Due
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'badge' }, // Status
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'mono' }, // Blood
        { headerWidth: 'w-24', cellWidth: 'w-28' }, // Doctor
        { headerWidth: 'w-20', cellWidth: 'w-28' }, // Cert No
        { headerWidth: 'w-16', cellWidth: 'w-20' }, // File
        { headerWidth: 'w-28', cellWidth: 'w-32' }, // Restrictions
        { headerWidth: 'w-28', cellWidth: 'w-32' }, // Notes
        { headerWidth: 'w-10', cellWidth: 'w-14', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError) return <ErrorState message="Failed to load medical records" error={error?.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* ── Modals ── */}
      {addOpen    && <AddMedicalModal    driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editRecord && <EditMedicalModal   record={editRecord} driverId={driverId} onClose={() => setEditRecord(null)} />}
      {deleteRecord && <DeleteMedicalDialog record={deleteRecord} driverId={driverId} onClose={() => setDeleteRecord(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Medical Records</h3>
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
          icon={Activity}
          title="No medical records found"
          description="Click Add Record to add one"
        />
      )}

      {/* ── Table ── */}
      {records.length > 0 && (
        <MedicalTable 
          records={records} 
          onEdit={setEditRecord} 
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

export default MedicalRecordsTab;