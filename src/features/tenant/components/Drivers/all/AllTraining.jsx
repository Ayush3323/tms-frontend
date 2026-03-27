import React, { useState } from 'react';
import { GraduationCap, Plus, RefreshCw, Download, Upload, RotateCcw } from 'lucide-react';
import { useTrainingRecords } from '../../../queries/drivers/trainingAndMedicalQuery';

import { LoadingState, ErrorState, EmptyState, PageLayoutShimmer } from '../common/StateFeedback';
import TrainingTable from '../sub-features/Training/TrainingTable';
import { AddTrainingModal, EditTrainingModal, ViewTrainingModal, DeleteTrainingDialog } from '../sub-features/Training/TrainingModals';
import DriverSelect from '../common/DriverSelect';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';
import Select from '../common/Select';
import { TRAINING_TYPES, TRAINING_STATUS } from '../common/constants';
import Input from '../common/Input';

const AllTraining = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);

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
        { headerWidth: 'w-10', cellWidth: 'w-14', width: 'w-16', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError) return <div className="p-6"><ErrorState message="Failed to load records" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col relative">
      {/* ── Modals ── */}
      {addOpen && <AddTrainingModal driverId={null} onClose={() => setAddOpen(false)} />}
      {editRecord && <EditTrainingModal record={editRecord} driverId={editRecord.driver} onClose={() => setEditRecord(null)} />}
      {viewRecord && (
        <ViewTrainingModal 
          record={viewRecord} 
          driverName={driverMap[viewRecord.driver]?.name} 
          employeeId={driverMap[viewRecord.driver]?.employee_id}
          onClose={() => setViewRecord(null)} 
        />
      )}

      <div className="p-6 lg:p-8 flex-1 flex flex-col min-h-0">
        {/* ── Header ── */}
        <div className="flex items-center mb-8">
          <div className="w-1/4">
            <h1 className="text-2xl font-black text-[#172B4D] uppercase tracking-tight">Training Records</h1>
            <p className="text-gray-500 text-sm tracking-tight mt-0.5">Manage training and certifications for all drivers</p>
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
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Passed:</span>
                  <span className="text-[18px] font-black text-green-600">{records.filter(r => r.status === 'PASSED').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Failed:</span>
                  <span className="text-[18px] font-black text-red-600">{records.filter(r => r.status === 'FAILED').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Expired:</span>
                  <span className="text-[18px] font-black text-amber-600">{records.filter(r => r.is_expired).length}</span>
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
              className="text-xs py-1.5 font-bold text-[#172B4D] rounded-lg bg-white border border-gray-200 hover:bg-[#EDF1F7] transition-colors" />
            <Select value={filters.training_type} onChange={(e) => handleFilterChange('training_type', e.target.value)}
              className="text-xs py-1.5 font-bold text-[#172B4D] rounded-lg bg-white border border-gray-200 hover:bg-[#EDF1F7] transition-colors">
              <option value="">All Types</option>
              {TRAINING_TYPES.map(t => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
            </Select>
            <Select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}
              className="text-xs py-1.5 font-bold text-[#172B4D] rounded-lg bg-white border border-gray-200 hover:bg-[#EDF1F7] transition-colors">
              <option value="">All Status</option>
              {TRAINING_STATUS.map(s => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
            </Select>
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-2 rounded-lg hover:bg-[#EDF1F7] transition-colors">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Training:</span>
              <input 
                type="date" 
                value={filters.training_date} 
                onChange={(e) => handleFilterChange('training_date', e.target.value)}
                className="text-xs py-1 px-1 bg-transparent border-none focus:ring-0 font-bold text-[#172B4D]" 
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-2 rounded-lg hover:bg-[#EDF1F7] transition-colors">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Expiry:</span>
              <input 
                type="date" 
                value={filters.expiry_date} 
                onChange={(e) => handleFilterChange('expiry_date', e.target.value)}
                className="text-xs py-1 px-1 bg-transparent border-none focus:ring-0 font-bold text-[#172B4D]" 
              />
            </div>
            {(filters.driver || filters.training_type || filters.status || filters.training_date || filters.expiry_date) && (
              <button onClick={clearFilters} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Clear Filters">
                <RotateCcw size={14} />
              </button>
            )}
          </div>

            {/* ── Content ── */}
            <div className="flex-1 min-h-0 overflow-auto">
              {records.length === 0 ? (
                <div className="py-20">
                  <EmptyState icon={GraduationCap} title="No records found" description="No training records have been added yet." />
                </div>
              ) : (
                <TrainingTable records={records} onEdit={setEditRecord} onView={setViewRecord} showDriver={true} driverMap={driverMap} />
          )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default AllTraining;
