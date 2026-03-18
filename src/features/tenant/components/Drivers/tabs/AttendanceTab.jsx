import React, { useState } from 'react';
import { Plus, CalendarCheck } from 'lucide-react';
import { useDriverAttendance } from '../../../queries/drivers/incidentsAndAttendance';

import { LoadingState, ErrorState, EmptyState } from '../common/StateFeedback';
import AttendanceTable from '../sub-features/Attendance/AttendanceTable';
import { AddAttendanceModal, EditAttendanceModal, DeleteAttendanceDialog } from '../sub-features/Attendance/AttendanceModals';

const AttendanceTab = ({ driverId }) => {
  const [addOpen,      setAddOpen]      = useState(false);
  const [editRecord,   setEditRecord]   = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverAttendance(driverId);
  const records = data?.results ?? [];

  if (isLoading) return <LoadingState message="Loading attendance..." />;
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
          showDriver={false}
        />
      )}
    </>
  );
};

export default AttendanceTab;