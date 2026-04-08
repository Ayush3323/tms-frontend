import React, { useState, useMemo } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { useDriverIncidents } from '../../../queries/drivers/incidentsAndAttendance';
import { useUsers } from '../../../queries/users/userQuery';
import { useCurrentUser } from '../../../queries/users/userActionQuery';
import { useVehiclesList } from '../../../queries/drivers/vehicleAssignmentQuery';
import { useTrips } from '../../../queries/orders/ordersQuery';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';

import { LoadingState, ErrorState, EmptyState, TabLayoutShimmer } from '../common/StateFeedback';
import IncidentTable from '../sub-features/Incidents/IncidentTable';
import { AddIncidentModal, EditIncidentModal, ViewIncidentModal, DeleteIncidentDialog } from '../sub-features/Incidents/IncidentModals';

const IncidentsTab = ({ driverId }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [editIncident, setEditIncident] = useState(null);
  const [viewIncident, setViewIncident] = useState(null);
  const [deleteIncident, setDeleteIncident] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverIncidents(driverId);
  const { data: usersData } = useUsers({ page_size: 1000 });
  const { data: currentUser } = useCurrentUser();
  const { data: vehiclesData } = useVehiclesList();
  const { data: tripsData } = useTrips({ page_size: 1000 });
  const driverMap = useDriverLookup();

  const vehicleMap = useMemo(() => {
    return (vehiclesData?.results ?? []).reduce((acc, v) => ({
      ...acc, [v.id]: v.registration_number
    }), {});
  }, [vehiclesData]);

  const tripMap = useMemo(() => {
    const results = tripsData?.results || (Array.isArray(tripsData) ? tripsData : []);
    return results.reduce((acc, t) => ({
      ...acc, [t.id]: t.trip_number
    }), {});
  }, [tripsData]);

  const userMap = useMemo(() => {
    const map = {};
    usersData?.results?.forEach(u => {
      map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'System User';
    });
    return map;
  }, [usersData]);

  const incidents = data?.results ?? [];

  if (isLoading) return (
     <TabLayoutShimmer
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28' }, // Driver
        { headerWidth: 'w-12', cellWidth: 'w-12', type: 'mono' }, // Emp ID
        { headerWidth: 'w-20', cellWidth: 'w-24', type: 'badge' }, // Type
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'mono' }, // Vehicle
        { headerWidth: 'w-10', cellWidth: 'w-12', type: 'mono' }, // Trip ID
        { headerWidth: 'w-28', cellWidth: 'w-32' }, // Date
        { headerWidth: 'w-20', cellWidth: 'w-24' }, // Location
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'badge' }, // Severity
        { headerWidth: 'w-20', cellWidth: 'w-24', type: 'badge' }, // Status
        { headerWidth: 'w-10', cellWidth: 'w-14', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError)   return <ErrorState message="Failed to load incidents" error={error?.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* ── Modals ── */}
      {addOpen && <AddIncidentModal driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editIncident && <EditIncidentModal incident={editIncident} driverId={driverId} onClose={() => setEditIncident(null)} />}
      {viewIncident && (
        <ViewIncidentModal 
          incident={viewIncident} 
          driverName={driverMap[driverId]?.name} 
          employeeId={driverMap[driverId]?.employee_id}
          vehicleName={vehicleMap[viewIncident.vehicle]}
          tripNumber={tripMap[viewIncident.trip_id]}
          userMap={userMap}
          currentUser={currentUser}
          onClose={() => setViewIncident(null)} 
        />
      )}
      {deleteIncident && <DeleteIncidentDialog incident={deleteIncident} driverId={driverId} onClose={() => setDeleteIncident(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Incidents</h3>
          <p className="text-xs text-gray-400 mt-0.5">{incidents.length} incident{incidents.length !== 1 ? 's' : ''} found</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#2563eb] to-[#4f46e5] rounded-lg shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={14} /> Add Incident
        </button>
      </div>

      {/* ── Empty State ── */}
      {incidents.length === 0 && (
        <EmptyState
          icon={AlertTriangle}
          title="No incident records found"
          description="Click Add Incident to record one"
        />
      )}

      {/* ── Table ── */}
      {incidents.length > 0 && (
        <IncidentTable
          incidents={incidents}
          onEdit={setEditIncident}
          onView={setViewIncident}
          onDelete={setDeleteIncident}
          showDriver={false}
          driverMap={driverMap}
          vehicleMap={vehicleMap}
          tripMap={tripMap}
          userMap={userMap}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

export default IncidentsTab;