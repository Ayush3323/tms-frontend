import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Download, RefreshCw, Eye,
  Users, CheckCircle, AlertCircle, PauseCircle,
  ChevronDown, Loader2, AlertTriangle, UserPlus, Pencil, RotateCcw
} from 'lucide-react';
import { useConsignors, useCreateConsignor, useUpdateConsignor, useDeleteConsignor, useCustomers } from '../../queries/customers/customersQuery';
import { StatCard, Modal, Field, Input, Sel, Section, DeleteConfirm, fmtDate } from '../Vehicles/Common/VehicleCommon';

const EMPTY_FORM = {
  customer_id: '',
  consignor_code: '',
  hazardous_material_handling: false,
  temperature_controlled: false,
  business_volume_tons_per_month: '',
  business_volume_value_per_month: '',
  loading_bay_count: '',
  avg_loading_time_minutes: '',
  preferred_vehicle_types: '',
};

const STATUS_STYLES = {
  'ACTIVE': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'Active': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'INACTIVE': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'Inactive': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'SUSPENDED': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'Suspended': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const getStatusStyle = (status) => STATUS_STYLES[status] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };

const Consignors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isError, error, refetch } = useConsignors({
    page: currentPage,
    ...(statusFilter && { status: statusFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data: customerData } = useCustomers({ limit: 1000 });
  const allCustomers = customerData?.results ?? customerData ?? [];
  const eligibleCustomers = allCustomers.filter(c => c.customer_type === 'CONSIGNOR' || c.customer_type === 'BOTH' || c.customer_type === 'OTHER');

  const [modal, setModal] = useState(null);
  const [deleteTarget, setDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const createMutation = useCreateConsignor();
  const updateMutation = useUpdateConsignor();
  const deleteMutation = useDeleteConsignor();

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setModal({ type: 'create' });
  };

  const openEdit = (c) => {
    setForm({
      customer_id: c.customer_id ?? '',
      consignor_code: c.consignor_code ?? '',
      business_volume_tons_per_month: c.business_volume_tons_per_month ?? '',
      business_volume_value_per_month: c.business_volume_value_per_month ?? '',
      hazardous_material_handling: c.hazardous_material_handling ?? false,
      temperature_controlled: c.temperature_controlled ?? false,
      loading_bay_count: c.loading_bay_count ?? '',
      avg_loading_time_minutes: c.avg_loading_time_minutes ?? '',
      preferred_vehicle_types: c.preferred_vehicle_types?.join(', ') || '',
    });
    setErrors({});
    setModal({ type: 'edit', id: c.id, consignor: c });
  };

  const openView = (c) => {
    openEdit(c);
    setModal({ type: 'view', id: c.id, consignor: c });
  };

  const closeModal = () => { setModal(null); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.customer_id) e.customer_id = 'Customer ID is required';
    if (!form.consignor_code?.trim()) e.consignor_code = 'Consignor code is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const setField = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  const handleSubmit = () => {
    if (!validate()) return;

    // Merge the selected customer's data into the payload
    const selectedCustomer = eligibleCustomers.find(c => c.id === form.customer_id) || {};
    const payload = { ...selectedCustomer, ...form };

    // Clean up to prevent sending the customer's nested object or original ID collision
    delete payload.customer;
    if (modal.type === 'create') delete payload.id;

    // Nullify empty number fields
    if (!payload.business_volume_tons_per_month) payload.business_volume_tons_per_month = null;
    if (!payload.business_volume_value_per_month) payload.business_volume_value_per_month = null;
    if (!payload.loading_bay_count) payload.loading_bay_count = null;
    if (!payload.avg_loading_time_minutes) payload.avg_loading_time_minutes = null;

    // Process preferred vehicle types as array
    if (payload.preferred_vehicle_types) {
      payload.preferred_vehicle_types = payload.preferred_vehicle_types.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      payload.preferred_vehicle_types = [];
    }

    if (modal.type === 'create') {
      createMutation.mutate(payload, { onSuccess: () => closeModal() });
    } else {
      updateMutation.mutate({ id: modal.id, data: payload }, { onSuccess: () => closeModal() });
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  const consignors = data?.results ?? data ?? [];
  const total = data?.count ?? consignors.length;
  const active = consignors.filter(c => c.customer?.status === 'ACTIVE' || c.customer?.status === 'Active').length;
  const inactive = consignors.filter(c => c.customer?.status === 'INACTIVE' || c.customer?.status === 'Inactive').length;
  const suspended = consignors.filter(c => c.customer?.status === 'SUSPENDED' || c.customer?.status === 'Suspended').length;

  const resetFilters = () => { setSearchTerm(''); setStatus(''); setCurrentPage(1); };

  const COLUMNS = [
    {
      header: 'Legal Name',
      render: c => (
        <div className="text-left">
          <button onClick={() => openView(c)} className="font-bold text-[#172B4D] text-[13px] hover:text-[#0052CC] transition-all hover:scale-105 active:scale-95 text-left block">
            {c.customer?.legal_name ?? '—'}
          </button>
          <div className="text-[11px] font-semibold text-gray-500 mt-0.5">
            Consignor Code: <span className="font-mono text-[#0052CC]">{c.consignor_code ?? '—'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Operations',
      render: c => (
        <div className="flex flex-col gap-1 text-[11px]">
          <span className="font-semibold text-gray-600">Hazardous: <span className={c.hazardous_material_handling ? "text-red-500" : "text-green-600"}>{c.hazardous_material_handling ? 'Yes' : 'No'}</span></span>
          <span className="font-semibold text-gray-600">Temp Ctrl: <span className={c.temperature_controlled ? "text-blue-500" : "text-gray-500"}>{c.temperature_controlled ? 'Yes' : 'No'}</span></span>
        </div>
      ),
    },
    {
      header: 'Business Volume',
      render: c => (
        <div className="flex flex-col gap-1 text-[11px]">
          <span className="font-semibold text-gray-600">Tons/Mo: {c.business_volume_tons_per_month || '—'}</span>
          <span className="font-semibold text-gray-600">Value/Mo: {c.business_volume_value_per_month ? `₹${Number(c.business_volume_value_per_month).toLocaleString('en-IN')}` : '—'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      render: c => {
        const status = c.customer?.status;
        const st = getStatusStyle(status);
        return (
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit whitespace-nowrap ${st.bg} ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {status || '—'}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: c => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(c)} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all">
            <Pencil size={12} /> Edit
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 flex flex-col gap-6 bg-[#F8FAFC] flex-1 min-h-0 overflow-hidden relative">

      {/* Page Title & Search Section */}
      <div className="flex items-center mb-8">
        {/* Title Block */}
        <div className="w-1/4">
          <h2 className="text-2xl font-bold text-[#172B4D]">Consignors</h2>
          <p className="text-gray-500 text-sm tracking-tight">Manage consignor profiles and credit details</p>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="relative group/search">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
            <input
              type="text"
              placeholder="Search consignor name, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50  transition-all shadow-sm hover:shadow-md hover:border-gray-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-2 text-gray-400 hover:text-red-500 transition-all duration-500 hover:rotate-180 p-1.5 rounded-full hover:bg-red-50 flex items-center justify-center group/reset"
                title="Clear search"
              >
                <RotateCcw size={18} className="animate-in fade-in zoom-in spin-in-180 duration-500 group-hover/reset:scale-110" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center justify-end gap-2 ml-auto">
          <div className="flex items-center gap-2 mr-2">
            <button
              title="Refresh Data"
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 group"
            >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              <span>Refresh</span>
            </button>
            <button
              title="Import Consignors"
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95"
            >
              <Upload size={14} />
              <span>Import</span>
            </button>
            <button
              title="Export Consignors"
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
          <div className="w-px h-8 bg-gray-200 mx-1" />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
        {/* Stats Row */}
        <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          {isLoading ? (
            <div className="flex gap-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total:</span>
                <span className="text-[18px] font-black text-[#172B4D]">{total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Active:</span>
                <span className="text-[18px] font-black text-green-600">{active}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Inactive:</span>
                <span className="text-[18px] font-black text-orange-500">{inactive}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Suspended:</span>
                <span className="text-[18px] font-black text-red-500">{suspended}</span>
              </div>
            </>
          )}
          <div className="ml-auto w-1/4 flex justify-end">
            <button
              onClick={openCreate}
              className="mr-0 bg-[#0052CC] text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-lg hover:shadow-blue-200 active:scale-95 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> New Consignor
            </button>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-6 ml-auto justify-between h-15">
            {/* Quick Filters in Pagination Row */}
            <div className="flex items-center gap-3 px-5">
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-s font text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:border-gray-200 cursor-pointer shadow-sm"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              {statusFilter && (
                <button
                  onClick={() => {
                    setStatus('');
                    setCurrentPage(1);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Clear Filters"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>

            <div className="justify-between h-10 w-px bg-gray-100 hidden sm:block px-5" />

            <div className="flex items-center justify-between gap-3 px-5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Previous
              </button>

              <div className="flex items-center justify-center min-w-8 h-8 bg-[#0052CC] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
                {currentPage}
              </div>

              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!data?.next || isLoading}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin text-[#0052CC]" />
            <span className="text-sm">Loading consignors...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
            <AlertTriangle size={32} />
            <p className="text-sm font-medium">Failed to load consignors</p>
            <p className="text-xs text-gray-400">{error?.response?.data?.detail || error?.message}</p>
            <button onClick={() => refetch()} className="mt-2 px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8]">Try Again</button>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-sm relative">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  {COLUMNS.map(c => (
                    <th key={c.header} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{c.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {consignors.map(c => (
                  <tr key={c.id || c.code} className="hover:bg-blue-50/30 transition-colors">
                    {COLUMNS.map(col => (
                      <td key={col.header} className="px-4 py-3 whitespace-nowrap align-middle">{col.render(c)}</td>
                    ))}
                  </tr>
                ))}
                {consignors.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-gray-400">
                      <UserPlus size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No consignors found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Section */}
        {!isLoading && !isError && (
          <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-white gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
                Showing <span className="font-bold text-[#172B4D]">{consignors.length}</span> of <span className="font-bold text-[#172B4D]">{total}</span> consignors
              </div>
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteConfirm label="Consignor" onClose={() => setDelete(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDelete(null) })}
          deleting={deleteMutation.isPending} />
      )}

      {(modal?.type === 'create' || modal?.type === 'edit' || modal?.type === 'view') && (
        <Modal
          title={modal.type === 'create' ? 'Add New Consignor' : (modal.type === 'view' ? `View — ${modal.consignor?.customer?.legal_name || modal.consignor?.consignor_code}` : `Edit — ${modal.consignor?.customer?.legal_name || modal.consignor?.consignor_code}`)}
          onClose={closeModal}
          onSubmit={modal.type === 'view' ? null : handleSubmit}
          submitting={submitting}
          onDelete={modal.type === 'edit' ? () => { closeModal(); setDelete(modal.consignor); } : null}
          maxWidth="max-w-2xl"
        >
          <div className="grid grid-cols-2 gap-4">
            <Section title="Consignor Details" className="col-span-2" />
            <Field label="Customer ID" required error={errors.customer_id}>
              <Sel value={form.customer_id} onChange={e => setField('customer_id', e.target.value)} disabled={modal.type === 'edit' || modal.type === 'view'}>
                <option value="">-- Select Customer --</option>
                {eligibleCustomers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.legal_name || c.trading_name || 'Unnamed'} ({c.customer_code})
                  </option>
                ))}
              </Sel>
            </Field>
            <Field label="Consignor Code" required error={errors.consignor_code}>
              <Input value={form.consignor_code} onChange={e => setField('consignor_code', e.target.value)} disabled={modal.type === 'view'}
                placeholder="e.g. CONS-001" />
            </Field>

            <Section title="Operations" className="col-span-2" />
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[#172B4D] bg-gray-50 border border-gray-200 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox" className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-[#0052CC]" disabled={modal.type === 'view'}
                  checked={form.hazardous_material_handling} onChange={e => setField('hazardous_material_handling', e.target.checked)} />
                <span className="flex-1">Hazardous Material Handling</span>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-[#172B4D] bg-gray-50 border border-gray-200 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox" className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-[#0052CC]" disabled={modal.type === 'view'}
                  checked={form.temperature_controlled} onChange={e => setField('temperature_controlled', e.target.checked)} />
                <span className="flex-1">Temperature Controlled</span>
              </label>
            </div>

            <Section title="Business Volume & Logistics" className="col-span-2" />
            <Field label="Business Volume (Tons/Mo)">
              <Input type="number" value={form.business_volume_tons_per_month || ''} disabled={modal.type === 'view'} onChange={e => setField('business_volume_tons_per_month', e.target.value)} />
            </Field>
            <Field label="Business Volume (Value/Mo)">
              <Input type="number" value={form.business_volume_value_per_month || ''} disabled={modal.type === 'view'} onChange={e => setField('business_volume_value_per_month', e.target.value)} />
            </Field>

            <Field label="Loading Bay Count">
              <Input type="number" value={form.loading_bay_count || ''} disabled={modal.type === 'view'} onChange={e => setField('loading_bay_count', e.target.value)} />
            </Field>
            <Field label="Avg Loading Time (mins)">
              <Input type="number" value={form.avg_loading_time_minutes || ''} disabled={modal.type === 'view'} onChange={e => setField('avg_loading_time_minutes', e.target.value)} />
            </Field>

            <Field label="Preferred Vehicle Types" className="col-span-2">
              <Input value={form.preferred_vehicle_types} onChange={e => setField('preferred_vehicle_types', e.target.value)} disabled={modal.type === 'view'}
                placeholder="TRUCK, VAN, TRAILER (comma separated)" />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Consignors;