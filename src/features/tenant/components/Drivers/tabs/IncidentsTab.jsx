import React, { useState, useMemo } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { useDriverIncidents } from '../../../queries/drivers/incidentsAndAttendance';
import { useUsers } from '../../../queries/users/userQuery';

import { LoadingState, ErrorState, EmptyState } from '../common/StateFeedback';
import IncidentTable from '../sub-features/Incidents/IncidentTable';
import { AddIncidentModal, EditIncidentModal, DeleteIncidentDialog } from '../sub-features/Incidents/IncidentModals';

const IncidentsTab = ({ driverId }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [editIncident, setEditIncident] = useState(null);
  const [deleteIncident, setDeleteIncident] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverIncidents(driverId);
  const { data: usersData } = useUsers({ page_size: 1000 });

  const userMap = useMemo(() => {
    const map = {};
    usersData?.results?.forEach(u => {
      map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'System User';
    });
    return map;
  }, [usersData]);

  const incidents = data?.results ?? [];

  if (isLoading) return <LoadingState message="Loading incidents..." />;
  if (isError)   return <ErrorState message="Failed to load incidents" error={error?.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* ── Modals ── */}
      {addOpen && <AddIncidentModal driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editIncident && <EditIncidentModal incident={editIncident} driverId={driverId} onClose={() => setEditIncident(null)} />}
      {deleteIncident && <DeleteIncidentDialog incident={deleteIncident} driverId={driverId} onClose={() => setDeleteIncident(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Incidents</h3>
          <p className="text-xs text-gray-400 mt-0.5">{incidents.length} incident{incidents.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
          <Plus size={14} /> Report Incident
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
          onDelete={setDeleteIncident} 
          showDriver={false}
          userMap={userMap}
        />
      )}
    </>
  );
};

export default IncidentsTab;