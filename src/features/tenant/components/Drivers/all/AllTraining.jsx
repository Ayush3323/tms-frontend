import React, { useState } from 'react';
import { GraduationCap, Plus } from 'lucide-react';
import { useTrainingRecords } from '../../../queries/drivers/trainingAndMedicalQuery';

import { LoadingState, ErrorState, EmptyState, PageLayoutShimmer } from '../common/StateFeedback';
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

  if (isLoading && !data) return (
    <PageLayoutShimmer
      filterCount={5}
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-40' }, // Driver
        { headerWidth: 'w-12', cellWidth: 'w-12', width: 'w-20', type: 'mono' }, // Emp ID
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-32' }, // Training Type
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24' }, // Date
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24', type: 'mono' }, // Expiry
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24', type: 'badge' }, // Status
        { headerWidth: 'w-20', cellWidth: 'w-24', width: 'w-24' }, // Trainer
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-28', type: 'mono' }, // Cert No
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24' }, // Cert File
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-32' }, // Notes
        { headerWidth: 'w-10', cellWidth: 'w-14', width: 'w-16', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError) return <div className="p-6"><ErrorState message="Failed to load records" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* ── Modals ── */}
      {addOpen && <AddTrainingModal driverId={null} onClose={() => setAddOpen(false)} />}
      {editRecord && <EditTrainingModal record={editRecord} driverId={editRecord.driver} onClose={() => setEditRecord(null)} />}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Training Records</h1>
          <p className="text-sm text-gray-500 mt-1">Manage training and certifications for all drivers</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#2563eb] to-[#4f46e5] rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus size={18} /> Add Record
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Driver</p>
          <DriverSelect 
            value={filters.driver} 
            onChange={(val) => handleFilterChange('driver', val)} 
            className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
          />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Training Type</p>
          <Select 
            value={filters.training_type} 
            onChange={(e) => handleFilterChange('training_type', e.target.value)}
            className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
          >
            <option value="">All Types</option>
            {TRAINING_TYPES.map(t => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</p>
          <Select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
          >
            <option value="">All Status</option>
            {TRAINING_STATUS.map(s => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Training Date</p>
          <Input 
            type="date" 
            value={filters.training_date} 
            onChange={(e) => handleFilterChange('training_date', e.target.value)}
            className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Expiry Date</p>
            <Input 
              type="date" 
              value={filters.expiry_date} 
              onChange={(e) => handleFilterChange('expiry_date', e.target.value)}
              className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
            />
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
            <TrainingTable records={records} onEdit={setEditRecord} showDriver={true} driverMap={driverMap} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AllTraining;
