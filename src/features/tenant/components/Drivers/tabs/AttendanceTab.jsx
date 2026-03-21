import React, { useState, useMemo } from 'react';
import { Plus, CalendarCheck } from 'lucide-react';
import { useDriverAttendance } from '../../../queries/drivers/incidentsAndAttendance';
import { useUsers } from '../../../queries/users/userQuery';
import { useCurrentUser } from '../../../queries/users/userActionQuery';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';

import { LoadingState, ErrorState, EmptyState, TabLayoutShimmer } from '../common/StateFeedback';
import AttendanceTable from '../sub-features/Attendance/AttendanceTable';
import { AddAttendanceModal, EditAttendanceModal, DeleteAttendanceDialog } from '../sub-features/Attendance/AttendanceModals';

const AttendanceTab = ({ driverId }) => {
  const [addOpen,      setAddOpen]      = useState(false);
  const [editRecord,   setEditRecord]   = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverAttendance(driverId);
  const { data: usersData } = useUsers({ page_size: 1000 });
  const { data: currentUser } = useCurrentUser();
  const driverMap = useDriverLookup();
  const records = data?.results ?? [];

  const userMap = useMemo(() => {
    const map = {};
    usersData?.results?.forEach(u => {
      map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'System User';
    });
    return map;
  }, [usersData]);

  if (isLoading) return (
    <TabLayoutShimmer
      columns={[
        { headerWidth: 'w-20', cellWidth: 'w-24' }, // Date
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'badge' }, // Status
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'mono' }, // Check In
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'mono' }, // Check Out
        { headerWidth: 'w-20', cellWidth: 'w-16' }, // Total Hours
        { headerWidth: 'w-24', cellWidth: 'w-32' }, // Notes
        { headerWidth: 'w-10', cellWidth: 'w-14', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError)   return <ErrorState message="Failed to load attendance" error={error?.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* ── Modals ── */}
      {addOpen      && <AddAttendanceModal  driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editRecord   && <EditAttendanceModal record={editRecord} driverId={driverId} onClose={() => setEditRecord(null)} />}
      {deleteRecord && <DeleteAttendanceDialog record={deleteRecord} driverId={driverId} onClose={() => setDeleteRecord(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Attendance</h3>
          <p className="text-xs text-gray-400 mt-0.5">{records.length} record{records.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
          <Plus size={14} /> Add Attendance
        </button>
      </div>

      {/* ── Empty State ── */}
      {records.length === 0 && (
        <EmptyState
          icon={CalendarCheck}
          title="No attendance records found"
          description="Click Add Attendance to add one"
        />
      )}

      {/* ── Table ── */}
      {records.length > 0 && (
        <AttendanceTable 
          records={records} 
          onEdit={setEditRecord} 
          onDelete={setDeleteRecord} 
          showDriver={true}
          driverMap={driverMap}
          userMap={userMap}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

export default AttendanceTab;