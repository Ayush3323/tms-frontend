import React, { useState, useMemo } from 'react';
import { AlertTriangle, Plus, RefreshCw, Download, Upload, RotateCcw } from 'lucide-react';
import { useIncidents } from '../../../queries/drivers/incidentsAndAttendance';

import { LoadingState, ErrorState, EmptyState, GenericTableShimmer, PageLayoutShimmer } from '../common/StateFeedback';
import IncidentTable from '../sub-features/Incidents/IncidentTable';
import { AddIncidentModal, EditIncidentModal, ViewIncidentModal, DeleteIncidentDialog, VehicleSelect } from '../sub-features/Incidents/IncidentModals';
import DriverSelect from '../common/DriverSelect';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';
import { useVehiclesList } from '../../../queries/drivers/vehicleAssignmentQuery';
import { useUsers } from '../../../queries/users/userQuery';
import { useTrips } from '../../../queries/orders/ordersQuery';
import { INCIDENT_TYPES, SEVERITY_TYPES, RESOLUTION_LIST } from '../common/constants';
import Select from '../common/Select';
import Input from '../common/Input';

const AllIncidents = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [editIncident, setEditIncident] = useState(null);
  const [viewIncident, setViewIncident] = useState(null);

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

  const { data: tripsData } = useTrips({ page_size: 1000 });
  const tripMap = useMemo(() => {
    const results = tripsData?.results || (Array.isArray(tripsData) ? tripsData : []);
    return results.reduce((acc, t) => ({
      ...acc, [t.id]: t.trip_number
    }), {});
  }, [tripsData]);

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
        { headerWidth: 'w-24', cellWidth: 'w-28' }, // Driver
        { headerWidth: 'w-16', cellWidth: 'w-16', type: 'mono' }, // Emp ID
        { headerWidth: 'w-20', cellWidth: 'w-24', type: 'badge' }, // Type
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'mono' }, // Vehicle
        { headerWidth: 'w-12', cellWidth: 'w-12', type: 'mono' }, // Trip
        { headerWidth: 'w-28', cellWidth: 'w-32' }, // Date
        { headerWidth: 'w-20', cellWidth: 'w-24' }, // Location
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'badge' }, // Severity
        { headerWidth: 'w-20', cellWidth: 'w-24', type: 'badge' }, // Status
        { headerWidth: 'w-10', cellWidth: 'w-14', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError) return <div className="p-6"><ErrorState message="Failed to load incidents" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col relative">
      {/* ── Modals ── */}
      {addOpen && <AddIncidentModal driverId={null} onClose={() => setAddOpen(false)} />}
      {editIncident && <EditIncidentModal incident={editIncident} driverId={editIncident.driver} onClose={() => setEditIncident(null)} />}
      {viewIncident && (
        <ViewIncidentModal 
          incident={viewIncident} 
          driverName={driverMap[viewIncident.driver]?.name}
          employeeId={driverMap[viewIncident.driver]?.employee_id}
          vehicleName={vehicleMap[viewIncident.vehicle]}
          tripNumber={tripMap[viewIncident.trip_id]}
          userMap={userMap}
          onClose={() => setViewIncident(null)} 
        />
      )}

      <div className="p-6 lg:p-8 flex-1 flex flex-col min-h-0">
        {/* ── Header ── */}
        <div className="flex items-center mb-8">
          <div className="w-1/4">
            <h1 className="text-2xl font-black text-[#172B4D] uppercase tracking-tight">Driver Incidents</h1>
            <p className="text-gray-500 text-sm tracking-tight mt-0.5">Monitor and manage incidents across all drivers</p>
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
            <div className="ml-auto flex justify-end">
              <button onClick={() => setAddOpen(true)} className="bg-[#0052CC] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-md active:scale-95 group">
                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> Add Incident
              </button>
            </div>
          </div>

          {/* ── Filters Bar ── */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 bg-white flex-wrap">
            <DriverSelect value={filters.driver} onChange={(val) => handleFilterChange('driver', val)}
              className="text-xs py-1.5 font-bold text-[#172B4D] rounded-lg bg-white border border-gray-200 hover:bg-[#EDF1F7] transition-colors" />
            <VehicleSelect value={filters.vehicle} onChange={(e) => handleFilterChange('vehicle', e.target.value)}
              className="text-xs py-1.5 font-bold text-[#172B4D] rounded-lg bg-white border border-gray-200 hover:bg-[#EDF1F7] transition-colors" />
            <Select value={filters.incident_type} onChange={(e) => handleFilterChange('incident_type', e.target.value)}
              className="text-xs py-1.5 font-bold text-[#172B4D] rounded-lg bg-white border border-gray-200 hover:bg-[#EDF1F7] transition-colors">
              <option value="">All Types</option>
              {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select value={filters.severity} onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="text-xs py-1.5 font-bold text-[#172B4D] rounded-lg bg-white border border-gray-200 hover:bg-[#EDF1F7] transition-colors">
              <option value="">All Severities</option>
              {SEVERITY_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select value={filters.resolution_status} onChange={(e) => handleFilterChange('resolution_status', e.target.value)}
              className="text-xs py-1.5 font-bold text-[#172B4D] rounded-lg bg-white border border-gray-200 hover:bg-[#EDF1F7] transition-colors">
              <option value="">All Status</option>
              {RESOLUTION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-[#EDF1F7] transition-colors">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight whitespace-nowrap">Incident:</span>
              <input type="date" value={filters.incident_date} onChange={(e) => handleFilterChange('incident_date', e.target.value)}
                className="px-1 py-0.5 text-xs bg-transparent border-none focus:ring-0 text-[#172B4D] font-bold cursor-pointer" />
            </div>
            {(filters.driver || filters.vehicle || filters.incident_type || filters.severity || filters.resolution_status || filters.incident_date) && (
              <button onClick={clearFilters} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Clear">
                <RotateCcw size={14} />
              </button>
            )}
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
              onView={setViewIncident}
              showDriver={true} 
              driverMap={driverMap}
              vehicleMap={vehicleMap}
              tripMap={tripMap}
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
