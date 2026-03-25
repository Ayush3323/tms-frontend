import React, { useState } from 'react';
import {
  Search, Plus, Download, RefreshCw, Eye,
  Users, CheckCircle, AlertCircle, PauseCircle,
  ChevronDown, Loader2, AlertTriangle, UserPlus, Pencil
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
  'ACTIVE':    { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  'Active':    { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  'INACTIVE':  { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'Inactive':  { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'SUSPENDED': { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
  'Suspended': { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
};

const getStatusStyle = (status) => STATUS_STYLES[status] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };

const Consignors = () => {
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');

  const { data, isLoading, isError, error, refetch } = useConsignors({
    ...(statusFilter && { status: statusFilter }),
    ...(search       && { search }),
  });

  const { data: customerData } = useCustomers({ limit: 1000 });
  const allCustomers = customerData?.results ?? customerData ?? [];
  const eligibleCustomers = allCustomers.filter(c => c.customer_type === 'CONSIGNOR' || c.customer_type === 'BOTH' || c.customer_type === 'OTHER');

  const [modal, setModal]             = useState(null);   
  const [deleteTarget, setDelete]     = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [errors, setErrors]           = useState({});

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
  const total      = data?.count ?? consignors.length;
  const active     = consignors.filter(c => c.customer?.status === 'ACTIVE' || c.customer?.status === 'Active').length;
  const inactive   = consignors.filter(c => c.customer?.status === 'INACTIVE' || c.customer?.status === 'Inactive').length;
  const suspended  = consignors.filter(c => c.customer?.status === 'SUSPENDED' || c.customer?.status === 'Suspended').length;

  const resetFilters = () => { setSearch(''); setStatus(''); };

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

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Consignors</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            All registered consignors — click <span className="text-[#0052CC] font-semibold">View</span> for full details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <Download size={14} /> Export
          </button>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all shadow-sm">
            <Plus size={15} /> Add Consignor
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard loading={isLoading} label="Total"     value={total}     icon={Users}       color={{ value: 'text-[#172B4D]', iconBg: 'bg-blue-50',   iconText: 'text-blue-500' }} />
        <StatCard loading={isLoading} label="Active"    value={active}    icon={CheckCircle} color={{ value: 'text-green-600',  iconBg: 'bg-green-50',  iconText: 'text-green-500' }} />
        <StatCard loading={isLoading} label="Inactive"  value={inactive}  icon={AlertCircle} color={{ value: 'text-orange-500', iconBg: 'bg-orange-50', iconText: 'text-orange-500' }} />
        <StatCard loading={isLoading} label="Suspended" value={suspended} icon={PauseCircle} color={{ value: 'text-red-500',    iconBg: 'bg-red-50',    iconText: 'text-red-400' }} />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#172B4D]">📦 Consignor Registry</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manage consignor profiles and credit details</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
            <Plus size={14} /> Add Consignor
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search consignor name, code..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer">
              <option value="">All Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all">
            <RefreshCw size={13} /> Reset
          </button>
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

        {!isLoading && !isError && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>
              Showing <span className="font-bold text-gray-600">{consignors.length}</span>
              {data?.count && data.count !== consignors.length &&
                <> of <span className="font-bold text-gray-600">{data.count}</span></>
              } consignors
            </span>
            <span className="text-[11px]">Fleet Management System</span>
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