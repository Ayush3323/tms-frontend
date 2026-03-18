import React, { useState } from 'react';
import { GraduationCap, Plus, RefreshCw } from 'lucide-react';
import { useTrainingRecords } from '../../../queries/drivers/trainingAndMedicalQuery';

import { LoadingState, ErrorState, EmptyState } from '../common/StateFeedback';
import TrainingTable from '../sub-features/Training/TrainingTable';
import { AddTrainingModal, EditTrainingModal, DeleteTrainingDialog } from '../sub-features/Training/TrainingModals';
import DriverSelect from '../common/DriverSelect';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';
import Select from '../common/Select';
import { TRAINING_TYPES, TRAINING_STATUS } from '../common/constants';
import Input from '../common/Input';

const AllTraining = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const [filters, setFilters] = useState({
    driver: '',
    training_type: '',
    status: '',
    training_date: '',
    expiry_date: '',
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useTrainingRecords(filters);
  const driverMap = useDriverLookup();
  const records = data?.results ?? [];

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      driver: '',
      training_type: '',
      status: '',
      training_date: '',
      expiry_date: '',
    });
  };

  if (isLoading) return <div className="p-6"><LoadingState message="Loading all training records..." /></div>;
  if (isError) return <div className="p-6"><ErrorState message="Failed to load records" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* ── Modals ── */}
      {addOpen && <AddTrainingModal driverId={null} onClose={() => setAddOpen(false)} />}
      {editRecord && <EditTrainingModal record={editRecord} driverId={editRecord.driver} onClose={() => setEditRecord(null)} />}
      {deleteRecord && <DeleteTrainingDialog record={deleteRecord} driverId={deleteRecord.driver} onClose={() => setDeleteRecord(null)} />}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Training Records</h1>
          <p className="text-sm text-gray-500 mt-1">Manage training and certifications for all drivers</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} disabled={isFetching} className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50">
            <RefreshCw size={20} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] shadow-lg shadow-blue-200 transition-all active:scale-95">
            <Plus size={18} /> Add Record
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Driver</p>
          <DriverSelect value={filters.driver} onChange={(val) => handleFilterChange('driver', val)} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Training Type</p>
          <Select value={filters.training_type} onChange={(e) => handleFilterChange('training_type', e.target.value)}>
            <option value="">All Types</option>
            {TRAINING_TYPES.map(t => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</p>
          <Select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <option value="">All Status</option>
            {TRAINING_STATUS.map(s => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Training Date</p>
          <Input type="date" value={filters.training_date} onChange={(e) => handleFilterChange('training_date', e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Expiry Date</p>
            <Input type="date" value={filters.expiry_date} onChange={(e) => handleFilterChange('expiry_date', e.target.value)} />
          </div>
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {records.length === 0 ? (
          <div className="py-20">
            <EmptyState icon={GraduationCap} title="No records found" description="No training records have been added yet." />
          </div>
        ) : (
          <div className="p-4">
            <TrainingTable records={records} onEdit={setEditRecord} onDelete={setDeleteRecord} showDriver={true} driverMap={driverMap} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AllTraining;
