import React, { useState } from 'react';
import { Truck, Plus, RefreshCw } from 'lucide-react';
import { useVehicleAssignments } from '../../../queries/drivers/vehicleAssignmentQuery';

import { LoadingState, ErrorState, EmptyState } from '../common/StateFeedback';
import AssignmentTable from '../sub-features/Assignments/AssignmentTable';
import { AddAssignmentModal, EditAssignmentModal, DeleteAssignmentDialog, VehicleSelect } from '../sub-features/Assignments/AssignmentModals';
import DriverSelect from '../common/DriverSelect';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';
import { ASSIGNMENT_TYPES } from '../common/constants';
import Select from '../common/Select';
import Input from '../common/Input';

const AllAssignments = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);
  const [deleteAssignment, setDeleteAssignment] = useState(null);

  const [filters, setFilters] = useState({
    driver: '',
    vehicle: '',
    assignment_type: '',
    is_active: '',
    assigned_date: '',
  });

  // useVehicleAssignments(filters) to fetch filtered assignments
  const { data, isLoading, isError, error, refetch, isFetching } = useVehicleAssignments(filters);
  const driverMap = useDriverLookup();
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

  if (isLoading) return <div className="p-6"><LoadingState message="Loading all vehicle assignments..." /></div>;
  if (isError) return <div className="p-6"><ErrorState message="Failed to load assignments" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* ── Modals ── */}
      {addOpen && <AddAssignmentModal driverId={null} onClose={() => setAddOpen(false)} />}
      {editAssignment && <EditAssignmentModal assignment={editAssignment} driverId={editAssignment.driver} onClose={() => setEditAssignment(null)} />}
      {deleteAssignment && <DeleteAssignmentDialog assignment={deleteAssignment} driverId={deleteAssignment.driver} onClose={() => setDeleteAssignment(null)} />}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Vehicle Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vehicle assignments for all drivers</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} disabled={isFetching} className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50">
            <RefreshCw size={20} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] shadow-lg shadow-blue-200 transition-all active:scale-95">
            <Plus size={18} /> Assign Vehicle
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Driver</p>
            <DriverSelect value={filters.driver} onChange={(val) => handleFilterChange('driver', val)} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Vehicle</p>
            <VehicleSelect value={filters.vehicle} onChange={(e) => handleFilterChange('vehicle', e.target.value)} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Type</p>
            <Select value={filters.assignment_type} onChange={(e) => handleFilterChange('assignment_type', e.target.value)}>
              <option value="">All Types</option>
              {ASSIGNMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </Select>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</p>
            <Select value={filters.is_active} onChange={(e) => handleFilterChange('is_active', e.target.value)}>
              <option value="">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </Select>
          </div>
          <div className="flex items-end gap-2 lg:col-span-2">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Assigned Date</p>
              <Input type="date" value={filters.assigned_date} onChange={(e) => handleFilterChange('assigned_date', e.target.value)} />
            </div>
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
      {/* ── Content ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {assignments.length === 0 ? (
          <div className="py-20">
            <EmptyState icon={Truck} title="No assignments found" description="No vehicles have been assigned to drivers yet." />
          </div>
        ) : (
          <div className="p-4">
            <AssignmentTable assignments={assignments} onEdit={setEditAssignment} onDelete={setDeleteAssignment} showDriver={true} driverMap={driverMap} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AllAssignments;
