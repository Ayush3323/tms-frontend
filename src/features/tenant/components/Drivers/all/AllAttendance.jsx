import React, { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { useAttendance } from '../../../queries/drivers/incidentsAndAttendance';

import { LoadingState, ErrorState, EmptyState, PageLayoutShimmer } from '../common/StateFeedback';
import AttendanceTable from '../sub-features/Attendance/AttendanceTable';
import { AddAttendanceModal, EditAttendanceModal, DeleteAttendanceDialog } from '../sub-features/Attendance/AttendanceModals';
import DriverSelect from '../common/DriverSelect';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';
import { ATTENDANCE_STATUS_LIST } from '../common/constants';
import Select from '../common/Select';
import Input from '../common/Input';

const AllAttendance = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [editAtten, setEditAtten] = useState(null);

  const [filters, setFilters] = useState({
    driver: '',
    status: '',
    date: '',
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useAttendance(filters);
  const driverMap = useDriverLookup();
  const attendance = data?.results ?? [];

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      driver: '',
      status: '',
      date: '',
    });
  };

  if (isLoading && !data) return (
    <PageLayoutShimmer
      filterCount={3}
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-40' }, // Driver
        { headerWidth: 'w-12', cellWidth: 'w-12', width: 'w-20', type: 'mono' }, // Emp ID
        { headerWidth: 'w-20', cellWidth: 'w-24', width: 'w-24' }, // Date
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24', type: 'badge' }, // Status
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24', type: 'mono' }, // In
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24', type: 'mono' }, // Out
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24' }, // Hours
        { headerWidth: 'w-24', cellWidth: 'w-32', width: 'w-32' }, // Notes
        { headerWidth: 'w-10', cellWidth: 'w-14', width: 'w-16', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError) return <div className="p-6"><ErrorState message="Failed to load attendance" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* ── Modals ── */}
      {addOpen && <AddAttendanceModal driverId={null} onClose={() => setAddOpen(false)} />}
      {editAtten && <EditAttendanceModal record={editAtten} driverId={editAtten.driver} onClose={() => setEditAtten(null)} />}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Driver Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Track attendance across all drivers</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#2563eb] to-[#4f46e5] rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus size={18} /> Add Record
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Driver</p>
          <DriverSelect 
            value={filters.driver} 
            onChange={(val) => handleFilterChange('driver', val)} 
            className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
          />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</p>
          <Select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
          >
            <option value="">All Status</option>
            {ATTENDANCE_STATUS_LIST.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Date</p>
            <Input 
              type="date" 
              value={filters.date} 
              onChange={(e) => handleFilterChange('date', e.target.value)} 
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
        {attendance.length === 0 ? (
          <div className="py-20">
            <EmptyState icon={Calendar} title="No attendance records found" description="No attendance has been logged yet." />
          </div>
        ) : (
          <div className="p-4">
            <AttendanceTable records={attendance} onEdit={setEditAtten} showDriver={true} driverMap={driverMap} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AllAttendance;
