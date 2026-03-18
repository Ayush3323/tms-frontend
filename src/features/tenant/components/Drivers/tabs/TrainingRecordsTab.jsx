import React, { useState } from 'react';
import { Plus, GraduationCap } from 'lucide-react';
import { useDriverTrainingRecords } from '../../../queries/drivers/trainingAndMedicalQuery';

import { LoadingState, ErrorState, EmptyState } from '../common/StateFeedback';
import TrainingTable from '../sub-features/Training/TrainingTable';
import { AddTrainingModal, EditTrainingModal, DeleteTrainingDialog } from '../sub-features/Training/TrainingModals';

const TrainingRecordsTab = ({ driverId }) => {
  const [addOpen,      setAddOpen]      = useState(false);
  const [editRecord,   setEditRecord]   = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverTrainingRecords(driverId);
  const records = data?.results ?? [];

  if (isLoading) return <LoadingState message="Loading training records..." />;
  if (isError)   return <ErrorState message="Failed to load training records" error={error?.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* ── Modals ── */}
      {addOpen && <AddTrainingModal driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editRecord && <EditTrainingModal record={editRecord} driverId={driverId} onClose={() => setEditRecord(null)} />}
      {deleteRecord && <DeleteTrainingDialog record={deleteRecord} driverId={driverId} onClose={() => setDeleteRecord(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Training Records</h3>
          <p className="text-xs text-gray-400 mt-0.5">{records.length} record{records.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
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
          onDelete={setDeleteRecord} 
          showDriver={false}
        />
      )}
    </>
  );
};

export default TrainingRecordsTab;