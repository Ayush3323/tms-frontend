import React, { useState, useMemo } from 'react';
import { AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import { useIncidents } from '../../../queries/drivers/incidentsAndAttendance';

import { LoadingState, ErrorState, EmptyState, TableShimmer } from '../common/StateFeedback';
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
    <div className="p-6 space-y-6">
      <div className="h-20 bg-gray-50 rounded-2xl animate-pulse" />
      <TableShimmer rows={10} cols={8} />
    </div>
  );
  if (isError) return <div className="p-6"><ErrorState message="Failed to load incidents" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* ── Modals ── */}
      {addOpen && <AddIncidentModal driverId={null} onClose={() => setAddOpen(false)} />}
      {editIncident && <EditIncidentModal incident={editIncident} driverId={editIncident.driver} onClose={() => setEditIncident(null)} />}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Driver Incidents</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and manage incidents across all drivers</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} disabled={isFetching} className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50">
            <RefreshCw size={20} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] shadow-lg shadow-blue-200 transition-all active:scale-95">
            <Plus size={18} /> Add Incident
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">driver</p>
            <DriverSelect value={filters.driver} onChange={(val) => handleFilterChange('driver', val)} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">vehicle</p>
            <VehicleSelect value={filters.vehicle} onChange={(e) => handleFilterChange('vehicle', e.target.value)} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">trip_id</p>
            <Input placeholder="Search trip..." value={filters.trip_id} onChange={(e) => handleFilterChange('trip_id', e.target.value)} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">incident_type</p>
            <Select value={filters.incident_type} onChange={(e) => handleFilterChange('incident_type', e.target.value)}>
              <option value="">All Types</option>
              {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">severity</p>
            <Select value={filters.severity} onChange={(e) => handleFilterChange('severity', e.target.value)}>
              <option value="">All Severities</option>
              {SEVERITY_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">resolution_status</p>
            <Select value={filters.resolution_status} onChange={(e) => handleFilterChange('resolution_status', e.target.value)}>
              <option value="">All Status</option>
              {RESOLUTION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">incident_date</p>
              <Input type="date" value={filters.incident_date} onChange={(e) => handleFilterChange('incident_date', e.target.value)} />
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
        {incidents.length === 0 ? (
          <div className="py-20">
            <EmptyState icon={AlertTriangle} title="No incidents found" description="No incidents have been reported yet." />
          </div>
        ) : (
          <div className="p-4">
            <IncidentTable 
              incidents={incidents} 
              onEdit={setEditIncident} 
              showDriver={true} 
              driverMap={driverMap}
              vehicleMap={vehicleMap}
              userMap={userMap}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AllIncidents;
