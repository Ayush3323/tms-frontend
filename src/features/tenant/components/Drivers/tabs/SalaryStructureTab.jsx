import React, { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { useDriverSalaryStructures } from '../../../queries/drivers/salaryStructureQuery';
import { useUsers } from '../../../queries/users/userQuery';
import { useCurrentUser } from '../../../queries/users/userActionQuery';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';

import { LoadingState, ErrorState, EmptyState, TabLayoutShimmer } from '../common/StateFeedback';
import SalaryTable from '../sub-features/Salary/SalaryTable';
import { AddSalaryModal, EditSalaryModal, DeleteSalaryDialog, ViewSalaryModal } from '../sub-features/Salary/SalaryModals';

const SalaryTab = ({ driverId }) => {
  const [addOpen,      setAddOpen]      = useState(false);
  const [editSalary,   setEditSalary]   = useState(null);
  const [deleteSalary, setDeleteSalary] = useState(null);
  const [viewSalary,   setViewSalary]   = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverSalaryStructures(driverId);
  const { data: usersData } = useUsers({ page_size: 1000 });
  const { data: currentUser } = useCurrentUser();
  const driverMap = useDriverLookup();
  const salaries = data?.results ?? [];

  const userMap = React.useMemo(() => {
    const map = {};
    usersData?.results?.forEach(u => {
      map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'System User';
    });
    return map;
  }, [usersData]);

  if (isLoading) return (
     <TabLayoutShimmer
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28' }, // Driver
        { headerWidth: 'w-12', cellWidth: 'w-12', type: 'mono' }, // Emp ID
        { headerWidth: 'w-24', cellWidth: 'w-32' }, // Base
        { headerWidth: 'w-16', cellWidth: 'w-20' }, // Allow
        { headerWidth: 'w-16', cellWidth: 'w-20' }, // Deduct
        { headerWidth: 'w-16', cellWidth: 'w-20' }, // Net
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'mono' }, // Trip
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'mono' }, // Km
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'mono' }, // OT
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'badge' }, // Freq
        { headerWidth: 'w-16', cellWidth: 'w-20' }, // From
        { headerWidth: 'w-16', cellWidth: 'w-20' }, // To
        { headerWidth: 'w-24', cellWidth: 'w-32' }, // Notes
        { headerWidth: 'w-10', cellWidth: 'w-14', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError)   return <ErrorState message="Failed to load salary structures" error={error?.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* ── Modals ── */}
      {addOpen      && <AddSalaryModal    driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editSalary   && <EditSalaryModal   salary={editSalary} driverId={driverId} onClose={() => setEditSalary(null)} />}
      {deleteSalary && <DeleteSalaryDialog salary={deleteSalary} driverId={driverId} onClose={() => setDeleteSalary(null)} />}
      {viewSalary   && (
        <ViewSalaryModal   
          salary={viewSalary} 
          onClose={() => setViewSalary(null)} 
          driverName={driverMap[driverId]?.name}
          employeeId={driverMap[driverId]?.employee_id}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Salary Structures</h3>
          <p className="text-xs text-gray-400 mt-0.5">{salaries.length} structure{salaries.length !== 1 ? 's' : ''} found</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#2563eb] to-[#4f46e5] rounded-lg shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={14} /> Add Salary
        </button>
      </div>

      {/* ── Empty State ── */}
      {salaries.length === 0 && (
        <EmptyState
          icon={Wallet}
          title="No salary structures found"
          description="Click Add Salary to add one"
        />
      )}

      {/* ── Table ── */}
      {salaries.length > 0 && (
        <SalaryTable 
          salaries={salaries} 
          onEdit={setEditSalary} 
          onView={setViewSalary}
          showDriver={false}
          driverMap={driverMap}
          userMap={userMap}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

export default SalaryTab;
