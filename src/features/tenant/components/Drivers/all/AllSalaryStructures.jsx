import React, { useState } from 'react';
import { Wallet, Plus } from 'lucide-react';
import { useSalaryStructures } from '../../../queries/drivers/salaryStructureQuery';

import { LoadingState, ErrorState, EmptyState, GenericTableShimmer, PageLayoutShimmer } from '../common/StateFeedback';
import SalaryTable from '../sub-features/Salary/SalaryTable';
import { AddSalaryModal, EditSalaryModal, DeleteSalaryDialog, ViewSalaryModal, PAYMENT_FREQUENCIES } from '../sub-features/Salary/SalaryModals';
import DriverSelect from '../common/DriverSelect';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';
import Select from '../common/Select';
import Input from '../common/Input';

const AllSalaryStructures = () => {
  const [addOpen,      setAddOpen]      = useState(false);
  const [editSalary,   setEditSalary]   = useState(null);

  const [filters, setFilters] = useState({
    driver: '',
    payment_frequency: '',
    effective_from: '',
    effective_to: '',
  });

  const { data, isLoading, isError, error, refetch } = useSalaryStructures(filters);
  const driverMap = useDriverLookup();
  const salaries = data?.results ?? [];

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      driver: '',
      payment_frequency: '',
      effective_from: '',
      effective_to: '',
    });
  };

  if (isLoading && !data) return (
    <PageLayoutShimmer
      filterCount={4}
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-40' }, // Driver
        { headerWidth: 'w-12', cellWidth: 'w-12', width: 'w-20', type: 'mono' }, // Emp ID
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-32' }, // Base
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24' }, // Allow
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24' }, // Deduct
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24' }, // Net
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24', type: 'mono' }, // Trip
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24', type: 'mono' }, // Km
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24', type: 'mono' }, // OT
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24', type: 'badge' }, // Freq
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24' }, // From
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24' }, // To
        { headerWidth: 'w-24', cellWidth: 'w-32', width: 'w-32' }, // Notes
        { headerWidth: 'w-10', cellWidth: 'w-14', width: 'w-16', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError)   return <div className="p-6"><ErrorState message="Failed to load salary structures" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col relative">
      {/* ── Modals ── */}
      {addOpen      && <AddSalaryModal    driverId={null} onClose={() => setAddOpen(false)} />}
      {editSalary   && <EditSalaryModal   salary={editSalary} driverId={editSalary.driver} onClose={() => setEditSalary(null)} />}

      <div className="p-6 lg:p-8 flex-1 flex flex-col min-h-0">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Salary Structures</h1>
            <p className="text-sm text-gray-500 mt-1">Manage salary structures for all drivers</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#0043A8] transition-all">
              <Plus size={16} /> Add Salary
            </button>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* ── Filters Bar ── */}
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white flex-wrap gap-4">
            <div className="flex gap-3 items-center flex-wrap flex-1">
        <div>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Driver</p>
           <DriverSelect 
             value={filters.driver} 
             onChange={(val) => handleFilterChange('driver', val)} 
             className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
           />
        </div>
        <div>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Payment Frequency</p>
           <Select 
             value={filters.payment_frequency} 
             onChange={(e) => handleFilterChange('payment_frequency', e.target.value)}
             className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
           >
             <option value="">All Frequencies</option>
             {PAYMENT_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
           </Select>
        </div>
        <div>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Effective From</p>
           <Input 
             type="date" 
             value={filters.effective_from} 
             onChange={(e) => handleFilterChange('effective_from', e.target.value)} 
             className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
           />
        </div>
        <div className="flex items-end gap-2">
           <div className="flex-1">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Effective To</p>
              <Input 
                type="date" 
                value={filters.effective_to} 
                onChange={(e) => handleFilterChange('effective_to', e.target.value)} 
                className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
              />
           </div>
            </div>
          </div>
          <button 
            onClick={clearFilters}
            className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors mb-1 self-end"
          >
            Clear
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-h-0 overflow-auto">
          {salaries.length === 0 ? (
          <div className="py-20">
            <EmptyState icon={Wallet} title="No salary structures found" description="No salary structures have been defined yet." />
          </div>
        ) : (
          <SalaryTable salaries={salaries} onEdit={setEditSalary} showDriver={true} driverMap={driverMap} />
        )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default AllSalaryStructures;
