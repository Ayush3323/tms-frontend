import React, { useState } from 'react';
import { HeartPulse, Plus, RefreshCw, Download, Upload, RotateCcw } from 'lucide-react';
import { useMedicalRecords } from '../../../queries/drivers/trainingAndMedicalQuery';

import { LoadingState, ErrorState, EmptyState, PageLayoutShimmer } from '../common/StateFeedback';
import MedicalTable from '../sub-features/Medical/MedicalTable';
import { AddMedicalModal, EditMedicalModal, DeleteMedicalDialog } from '../sub-features/Medical/MedicalModals';
import { FITNESS_STATUS } from '../common/constants';
import DriverSelect from '../common/DriverSelect';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';
import Select from '../common/Select';
import Input from '../common/Input';

const AllMedical = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const [filters, setFilters] = useState({
    driver: '',
    fitness_status: '',
    examination_date: '',
    next_due_date: '',
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useMedicalRecords(filters);
  const driverMap = useDriverLookup();
  const records = data?.results ?? [];

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      driver: '',
      fitness_status: '',
      examination_date: '',
      next_due_date: '',
    });
  };

  if (isLoading && !data) return (
    <PageLayoutShimmer
      filterCount={4}
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-40' }, // Driver
        { headerWidth: 'w-12', cellWidth: 'w-12', width: 'w-20', type: 'mono' }, // Emp ID
        { headerWidth: 'w-20', cellWidth: 'w-24', width: 'w-24' }, // Exam Date
        { headerWidth: 'w-20', cellWidth: 'w-24', width: 'w-24', type: 'mono' }, // Next Due
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24', type: 'badge' }, // Status
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-20', type: 'mono' }, // Blood Group
        { headerWidth: 'w-24', cellWidth: 'w-32', width: 'w-32' }, // Doctor
        { headerWidth: 'w-20', cellWidth: 'w-24', width: 'w-28' }, // Cert No
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24' }, // File
        { headerWidth: 'w-24', cellWidth: 'w-32', width: 'w-32' }, // Restrictions
        { headerWidth: 'w-24', cellWidth: 'w-32', width: 'w-32' }, // Notes
        { headerWidth: 'w-10', cellWidth: 'w-14', width: 'w-16', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError) return <div className="p-6"><ErrorState message="Failed to load records" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col relative">
      {/* ── Modals ── */}
      {addOpen && <AddMedicalModal driverId={null} onClose={() => setAddOpen(false)} />}
      {editRecord && <EditMedicalModal record={editRecord} driverId={editRecord.driver} onClose={() => setEditRecord(null)} />}

      <div className="p-6 lg:p-8 flex-1 flex flex-col min-h-0">
        {/* ── Header ── */}
        <div className="flex items-center mb-8">
          <div className="w-1/4">
            <h1 className="text-2xl font-black text-[#172B4D] uppercase tracking-tight">Medical Records</h1>
            <p className="text-gray-500 text-sm tracking-tight mt-0.5">Manage health and medical history for all drivers</p>
          </div>
          <div className="flex-1" />
          <div className="flex items-center justify-end gap-2 ml-auto">
            <div className="flex items-center gap-2">
              <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95 group">
                <RefreshCw size={14} className={isFetching ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} /><span>Refresh</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95">
                <Upload size={14} /><span>Import</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95">
                <Download size={14} /><span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
          {/* Compact Stats Row */}
          <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            {isLoading ? (
              <div className="flex gap-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-28"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Records:</span>
                  <span className="text-[18px] font-black text-[#172B4D]">{data?.count ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Fit:</span>
                  <span className="text-[18px] font-black text-green-600">{records.filter(r => r.fitness_status === 'FIT').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Unfit:</span>
                  <span className="text-[18px] font-black text-red-600">{records.filter(r => r.fitness_status === 'UNFIT').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Restrictions:</span>
                  <span className="text-[18px] font-black text-amber-600">{records.filter(r => r.fitness_status === 'FIT_WITH_RESTRICTIONS').length}</span>
                </div>
              </>
            )}
            <div className="ml-auto flex justify-end">
              <button onClick={() => setAddOpen(true)} className="bg-[#0052CC] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-md active:scale-95 group">
                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> Add Record
              </button>
            </div>
          </div>

          {/* ── Filters Bar ── */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 bg-white flex-wrap">
            <DriverSelect value={filters.driver} onChange={(val) => handleFilterChange('driver', val)}
              className="text-xs py-1.5 font-medium text-[#172B4D] rounded-lg bg-gray-50 border-gray-100" />
            <Select value={filters.fitness_status} onChange={(e) => handleFilterChange('fitness_status', e.target.value)}
              className="text-xs py-1.5 font-medium text-[#172B4D] rounded-lg bg-gray-50 border-gray-100">
              <option value="">All Status</option>
              {FITNESS_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input type="date" value={filters.examination_date} onChange={(e) => handleFilterChange('examination_date', e.target.value)}
              className="text-xs py-1.5 font-medium text-[#172B4D] rounded-lg bg-gray-50 border-gray-100" />
            <Input type="date" value={filters.next_due_date} onChange={(e) => handleFilterChange('next_due_date', e.target.value)}
              className="text-xs py-1.5 font-medium text-[#172B4D] rounded-lg bg-gray-50 border-gray-100" />
            {(filters.driver || filters.fitness_status || filters.examination_date || filters.next_due_date) && (
              <button onClick={clearFilters} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Clear">
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          {/* ── Content ── */}
          <div className="flex-1 min-h-0 overflow-auto">
            {records.length === 0 ? (
              <div className="py-20">
                <EmptyState icon={HeartPulse} title="No records found" description="No medical records have been added yet." />
              </div>
            ) : (
              <MedicalTable records={records} onEdit={setEditRecord} showDriver={true} driverMap={driverMap} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllMedical;
