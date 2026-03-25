import React, { useState, useMemo } from 'react';
import { Truck, Plus } from 'lucide-react';
import { useVehicleAssignments } from '../../../queries/drivers/vehicleAssignmentQuery';

import { LoadingState, ErrorState, EmptyState, GenericTableShimmer, PageLayoutShimmer } from '../common/StateFeedback';
import AssignmentTable from '../sub-features/Assignments/AssignmentTable';
import { AddAssignmentModal, EditAssignmentModal, DeleteAssignmentDialog, VehicleSelect } from '../sub-features/Assignments/AssignmentModals';
import DriverSelect from '../common/DriverSelect';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';
import { useUsers } from '../../../queries/users/userQuery';
import { useCurrentUser } from '../../../queries/users/userActionQuery';
import { ASSIGNMENT_TYPES } from '../common/constants';
import Select from '../common/Select';
import Input from '../common/Input';

const AllAssignments = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);

  const [filters, setFilters] = useState({
    driver: '',
    vehicle: '',
    assignment_type: '',
    is_active: '',
    assigned_date: '',
  });

  // useVehicleAssignments(filters) to fetch filtered assignments
  const { data, isLoading, isError, error, refetch } = useVehicleAssignments(filters);
  const driverMap = useDriverLookup();
  const { data: usersData } = useUsers({ page_size: 1000 });
  const { data: currentUser } = useCurrentUser();
  
  const userMap = useMemo(() => {
    const map = {};
    usersData?.results?.forEach(u => {
      map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'System User';
    });
    return map;
  }, [usersData]);

  const assignments = data?.results ?? [];

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      driver: '',
      vehicle: '',
      assignment_type: '',
      is_active: '',
      assigned_date: '',
    });
  };

  if (isLoading && !data) return (
    <PageLayoutShimmer
      filterCount={6}
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-40' }, // Driver
        { headerWidth: 'w-12', cellWidth: 'w-12', width: 'w-20', type: 'mono' }, // Emp ID
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24', type: 'mono' }, // Vehicle
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24', type: 'badge' }, // Type
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24' }, // Assigned Date
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24' }, // Unassigned Date
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24', type: 'badge' }, // Active
        { headerWidth: 'w-20', cellWidth: 'w-24', width: 'w-24' }, // By
        { headerWidth: 'w-24', cellWidth: 'w-32', width: 'w-40' }, // Notes
        { headerWidth: 'w-10', cellWidth: 'w-14', width: 'w-16', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError) return <div className="p-6"><ErrorState message="Failed to load assignments" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col relative">
      {/* ── Modals ── */}
      {addOpen && <AddAssignmentModal driverId={null} onClose={() => setAddOpen(false)} />}
      {editAssignment && <EditAssignmentModal assignment={editAssignment} driverId={editAssignment.driver} onClose={() => setEditAssignment(null)} />}

      <div className="p-6 lg:p-8 flex-1 flex flex-col min-h-0">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Vehicle Assignments</h1>
            <p className="text-sm text-gray-500 mt-1">Manage vehicle assignments for all drivers</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#0043A8] transition-all">
              <Plus size={16} /> Add Assignment
            </button>
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
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Assignments:</span>
                  <span className="text-[18px] font-black text-[#172B4D]">{data?.count ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Active:</span>
                  <span className="text-[18px] font-black text-green-600">{assignments.filter(a => a.is_active).length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Inactive:</span>
                  <span className="text-[18px] font-black text-amber-600">{assignments.filter(a => !a.is_active).length}</span>
                </div>
              </>
            )}
          </div>

          {/* ── Filters Bar ── */}
          <div className="p-4 border-b border-gray-50 bg-white">
            <div className="flex flex-wrap gap-4 items-end">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Driver</p>
            <DriverSelect 
              value={filters.driver} 
              onChange={(val) => handleFilterChange('driver', val)} 
              className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
            />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Vehicle</p>
            <VehicleSelect 
              value={filters.vehicle} 
              onChange={(e) => handleFilterChange('vehicle', e.target.value)} 
              className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg shadow-none"
            />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Assignment Type</p>
            <Select 
              value={filters.assignment_type} 
              onChange={(e) => handleFilterChange('assignment_type', e.target.value)}
              className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
            >
              <option value="">All Types</option>
              {ASSIGNMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </Select>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</p>
            <Select 
              value={filters.is_active} 
              onChange={(e) => handleFilterChange('is_active', e.target.value)}
              className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
            >
              <option value="">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </Select>
          </div>
          <div className="flex items-end gap-2 lg:col-span-2">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Assigned Date</p>
              <Input 
                type="date" 
                value={filters.assigned_date} 
                onChange={(e) => handleFilterChange('assigned_date', e.target.value)} 
                className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
              />
            </div>
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors mb-1"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-h-0 overflow-auto">
          {assignments.length === 0 ? (
          <div className="py-20">
            <EmptyState icon={Truck} title="No assignments found" description="No vehicles have been assigned to drivers yet." />
          </div>
        ) : (
          <AssignmentTable assignments={assignments} onEdit={setEditAssignment} showDriver={true} driverMap={driverMap} userMap={userMap} currentUser={currentUser} />
        )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default AllAssignments;
