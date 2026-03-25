import React, { useState, useMemo } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { useIncidents } from '../../../queries/drivers/incidentsAndAttendance';

import { LoadingState, ErrorState, EmptyState, GenericTableShimmer, PageLayoutShimmer } from '../common/StateFeedback';
import IncidentTable from '../sub-features/Incidents/IncidentTable';
import { AddIncidentModal, EditIncidentModal, DeleteIncidentDialog, VehicleSelect } from '../sub-features/Incidents/IncidentModals';
import DriverSelect from '../common/DriverSelect';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';
import { useVehiclesList } from '../../../queries/drivers/vehicleAssignmentQuery';
import { useUsers } from '../../../queries/users/userQuery';
import { INCIDENT_TYPES, SEVERITY_TYPES, RESOLUTION_LIST } from '../common/constants';
import Select from '../common/Select';
import Input from '../common/Input';

const AllIncidents = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [editIncident, setEditIncident] = useState(null);

  const [filters, setFilters] = useState({
    driver: '',
    vehicle: '',
    trip_id: '',
    incident_type: '',
    severity: '',
    resolution_status: '',
    incident_date: '',
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useIncidents(filters);
  const driverMap = useDriverLookup();
  const { data: vehiclesData } = useVehiclesList();
  
  const vehicleMap = (vehiclesData?.results ?? []).reduce((acc, v) => ({
    ...acc, [v.id]: v.registration_number
  }), {});

  const { data: usersData } = useUsers({ page_size: 1000 });
  const userMap = useMemo(() => {
    const map = {};
    usersData?.results?.forEach(u => {
      map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'System User';
    });
    return map;
  }, [usersData]);

  const incidents = data?.results ?? [];

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      driver: '',
      vehicle: '',
      trip_id: '',
      incident_type: '',
      severity: '',
      resolution_status: '',
      incident_date: '',
    });
  };

  if (isLoading && !data) return (
    <PageLayoutShimmer
      filterCount={7}
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'min-w-[140px]' }, // Driver
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'min-w-[100px]', type: 'mono' }, // Emp ID
        { headerWidth: 'w-20', cellWidth: 'w-24', width: 'min-w-[120px]', type: 'badge' }, // Type
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'min-w-[100px]', type: 'mono' }, // Vehicle
        { headerWidth: 'w-12', cellWidth: 'w-12', width: 'min-w-[80px]', type: 'mono' }, // Trip
        { headerWidth: 'w-28', cellWidth: 'w-32', width: 'min-w-[150px]' }, // Date
        { headerWidth: 'w-20', cellWidth: 'w-24', width: 'min-w-[120px]' }, // Location
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'min-w-[100px]', type: 'badge' }, // Severity
        { headerWidth: 'w-32', cellWidth: 'w-40', width: 'min-w-[200px]' }, // Description
        { headerWidth: 'w-20', cellWidth: 'w-24', width: 'min-w-[120px]', type: 'badge' }, // Status
        { headerWidth: 'w-32', cellWidth: 'w-40', width: 'min-w-[200px]' }, // Res Notes
        { headerWidth: 'w-20', cellWidth: 'w-28', width: 'min-w-[120px]' }, // Res By
        { headerWidth: 'w-28', cellWidth: 'w-32', width: 'min-w-[150px]' }, // Res At
        { headerWidth: 'w-20', cellWidth: 'w-20', width: 'min-w-[120px]', type: 'mono' }, // Police
        { headerWidth: 'w-20', cellWidth: 'w-20', width: 'min-w-[120px]', type: 'mono' }, // Insurance
        { headerWidth: 'w-10', cellWidth: 'w-14', width: 'min-w-[80px]', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError) return <div className="p-6"><ErrorState message="Failed to load incidents" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col relative">
      {/* ── Modals ── */}
      {addOpen && <AddIncidentModal driverId={null} onClose={() => setAddOpen(false)} />}
      {editIncident && <EditIncidentModal incident={editIncident} driverId={editIncident.driver} onClose={() => setEditIncident(null)} />}

      <div className="p-6 lg:p-8 flex-1 flex flex-col min-h-0">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Driver Incidents</h1>
            <p className="text-sm text-gray-500 mt-1">Monitor and manage incidents across all drivers</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#0043A8] transition-all">
              <Plus size={16} /> Add Incident
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
                <div className="h-5 bg-gray-200 rounded w-28"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Incidents:</span>
                  <span className="text-[18px] font-black text-[#172B4D]">{data?.count ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Resolved:</span>
                  <span className="text-[18px] font-black text-green-600">{incidents.filter(i => i.resolution_status === 'RESOLVED').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Pending:</span>
                  <span className="text-[18px] font-black text-amber-600">{incidents.filter(i => i.resolution_status === 'PENDING').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Critical:</span>
                  <span className="text-[18px] font-black text-red-600">{incidents.filter(i => i.severity === 'HIGH' || i.severity === 'CRITICAL').length}</span>
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
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Trip ID</p>
            <Input 
              placeholder="Search trip..." 
              value={filters.trip_id} 
              onChange={(e) => handleFilterChange('trip_id', e.target.value)} 
              className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
            />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Incident Type</p>
            <Select 
              value={filters.incident_type} 
              onChange={(e) => handleFilterChange('incident_type', e.target.value)}
              className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
            >
              <option value="">All Types</option>
              {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Severity</p>
            <Select 
              value={filters.severity} 
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
            >
              <option value="">All Severities</option>
              {SEVERITY_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Resolution Status</p>
            <Select 
              value={filters.resolution_status} 
              onChange={(e) => handleFilterChange('resolution_status', e.target.value)}
              className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
            >
              <option value="">All Status</option>
              {RESOLUTION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Incident Date</p>
              <Input 
                type="date" 
                value={filters.incident_date} 
                onChange={(e) => handleFilterChange('incident_date', e.target.value)} 
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
          {incidents.length === 0 ? (
            <div className="py-20">
              <EmptyState icon={AlertTriangle} title="No incidents found" description="No incidents have been reported yet." />
            </div>
          ) : (
            <IncidentTable 
              incidents={incidents} 
              onEdit={setEditIncident} 
              showDriver={true} 
              driverMap={driverMap}
              vehicleMap={vehicleMap}
              userMap={userMap}
            />
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default AllIncidents;
