import React, { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { useDriverSalaryStructures } from '../../../queries/drivers/salaryStructureQuery';

import { LoadingState, ErrorState, EmptyState } from '../common/StateFeedback';
import SalaryTable from '../sub-features/Salary/SalaryTable';
import { AddSalaryModal, EditSalaryModal, DeleteSalaryDialog, ViewSalaryModal } from '../sub-features/Salary/SalaryModals';

const SalaryTab = ({ driverId }) => {
  const [addOpen,      setAddOpen]      = useState(false);
  const [editSalary,   setEditSalary]   = useState(null);
  const [deleteSalary, setDeleteSalary] = useState(null);
  const [viewSalary,   setViewSalary]   = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverSalaryStructures(driverId);
  const salaries = data?.results ?? [];

  if (isLoading) return <LoadingState message="Loading salary structures..." />;
  if (isError)   return <ErrorState message="Failed to load salary structures" error={error?.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* ── Modals ── */}
      {addOpen      && <AddSalaryModal    driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editSalary   && <EditSalaryModal   salary={editSalary} driverId={driverId} onClose={() => setEditSalary(null)} />}
      {viewSalary   && <ViewSalaryModal   salary={viewSalary} onClose={() => setViewSalary(null)} />}
      {deleteSalary && <DeleteSalaryDialog salary={deleteSalary} driverId={driverId} onClose={() => setDeleteSalary(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Salary Structures</h3>
          <p className="text-xs text-gray-400 mt-0.5">{salaries.length} structure{salaries.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
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
          onDelete={setDeleteSalary} 
          onView={setViewSalary}
          showDriver={false}
        />
      )}
    </>
  );
};

export default SalaryTab;
