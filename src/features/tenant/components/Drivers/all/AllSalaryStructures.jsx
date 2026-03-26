import React, { useState } from 'react';
import { Wallet, Plus, RefreshCw, Download, Upload, RotateCcw } from 'lucide-react';
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
        <div className="flex items-center mb-8">
          <div className="w-1/4">
            <h1 className="text-2xl font-black text-[#172B4D] uppercase tracking-tight">Salary Structures</h1>
            <p className="text-gray-500 text-sm tracking-tight mt-0.5">Manage salary structures for all drivers</p>
          </div>
          <div className="flex-1" />
          <div className="flex items-center justify-end gap-2 ml-auto">
            <div className="flex items-center gap-2">
              <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95 group">
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} /><span>Refresh</span>
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
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Structures:</span>
                  <span className="text-[18px] font-black text-[#172B4D]">{data?.count ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Avg Base:</span>
                  <span className="text-[18px] font-black text-blue-600">
                    ₹{(salaries.reduce((acc, s) => acc + (parseFloat(s.base_salary) || 0), 0) / (salaries.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Monthly:</span>
                  <span className="text-[18px] font-black text-green-600">{salaries.filter(s => s.payment_frequency === 'MONTHLY').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Weekly:</span>
                  <span className="text-[18px] font-black text-amber-600">{salaries.filter(s => s.payment_frequency === 'WEEKLY').length}</span>
                </div>
              </>
            )}
            <div className="ml-auto flex justify-end">
              <button onClick={() => setAddOpen(true)} className="bg-[#0052CC] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-md active:scale-95 group">
                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> Add Salary
              </button>
            </div>
          </div>

          {/* ── Filters Bar ── */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 bg-white flex-wrap">
            <DriverSelect value={filters.driver} onChange={(val) => handleFilterChange('driver', val)}
              className="text-xs py-1.5 font-medium text-[#172B4D] rounded-lg bg-gray-50 border-gray-100" />
            <Select value={filters.payment_frequency} onChange={(e) => handleFilterChange('payment_frequency', e.target.value)}
              className="text-xs py-1.5 font-medium text-[#172B4D] rounded-lg bg-gray-50 border-gray-100">
              <option value="">All Frequencies</option>
              {PAYMENT_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
            <Input type="date" value={filters.effective_from} onChange={(e) => handleFilterChange('effective_from', e.target.value)}
              className="text-xs py-1.5 font-medium text-[#172B4D] rounded-lg bg-gray-50 border-gray-100" />
            <Input type="date" value={filters.effective_to} onChange={(e) => handleFilterChange('effective_to', e.target.value)}
              className="text-xs py-1.5 font-medium text-[#172B4D] rounded-lg bg-gray-50 border-gray-100" />
            {(filters.driver || filters.payment_frequency || filters.effective_from || filters.effective_to) && (
              <button onClick={clearFilters} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Clear">
                <RotateCcw size={14} />
              </button>
            )}
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
