import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronDown, Loader2, AlertTriangle, UserPlus, Pencil, RotateCcw,
  MapPin, Phone, FileText, ClipboardList, Wallet, History, Building2, Info as LucideInfo,
  Search, Plus, RefreshCw, Users, CheckCircle, PauseCircle, AlertCircle, Eye, Download
} from 'lucide-react';
import {
  Modal, Field, Input, Sel, Section, DeleteConfirm, Badge,
  InfoCard, SectionHeader, EmptyState
} from '../Vehicles/Common/VehicleCommon';
import {
  useCustomerAddresses, useCustomerContacts, useCustomerDocuments,
  useCustomerContracts, useCustomerNotes, useCustomerCreditHistory,
  useConsignors, useCustomers, useCreateConsignor, useUpdateConsignor, useDeleteConsignor
} from '../../queries/customers/customersQuery';
import { useUsers } from '../../queries/users/userQuery';
import { useVehicleTypes } from '../../queries/vehicles/vehicletypeQuery';
import { TableShimmer, ErrorState } from '../Vehicles/Common/StateFeedback';
import CustomerListFilterBar from './CustomerListFilterBar';

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
  warehouse_address: '',
  sales_person_id: '',
  account_manager_id: '',
  user_id: '',
  status: 'ACTIVE',
  user: {
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
    account_type: 'CUSTOMER'
  }
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
  const [ordering, setOrdering] = useState('customer__legal_name');
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
    ...(statusFilter && { customer__status: statusFilter }),
    ...(ordering && { ordering }),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data: customerData } = useCustomers({ limit: 1000 });
  const allCustomers = customerData?.results ?? customerData ?? [];

  const [modal, setModal] = useState(null);
  const [deleteTarget, setDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [createPortalUser, setCreatePortalUser] = useState(false);

  const { data: userData } = useUsers({ limit: 1000 });
  const allUsers = userData?.results ?? userData ?? [];

  const userToCustomerMap = useMemo(() => {
    const map = {};
    allCustomers?.forEach(c => {
      const uid = c.user?.id || c.user_id || c.portal_user_id;
      if (uid) {
        map[String(uid)] = c.legal_name || c.name || c.trading_name || 'Another Customer';
      }
    });
    console.log('UserToCustomerMap Built:', map);
    return map;
  }, [allCustomers]);

  const portalUsers = useMemo(() => {
    return (allUsers || []).filter(u => u.account_type === 'CUSTOMER');
  }, [allUsers]);

  const eligibleCustomers = allCustomers.filter(c =>
    c.customer_type === 'CONSIGNOR' ||
    c.customer_type === 'BOTH' ||
    c.customer_type === 'OTHER' ||
    c.id === form.customer_id
  );

  // Auto-generate Consignor Code when Customer is selected in Create mode
  useEffect(() => {
    if (modal?.type === 'create' && form.customer_id && !form.consignor_code) {
      const customer = eligibleCustomers.find(c => c.id === form.customer_id);
      if (customer) {
        const initials = (customer.legal_name || 'CONS')
          .split(' ')
          .map(word => word[0])
          .join('')
          .toUpperCase()
          .slice(0, 3);
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        setField('consignor_code', `CONS-${initials}-${randomSuffix}`);
      }
    }
  }, [form.customer_id, modal?.type]);

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
      legal_name: c.customer?.legal_name ?? '',
      consignor_code: c.consignor_code ?? '',
      business_volume_tons_per_month: c.business_volume_tons_per_month ?? '',
      business_volume_value_per_month: c.business_volume_value_per_month ?? '',
      hazardous_material_handling: c.hazardous_material_handling ?? false,
      temperature_controlled: c.temperature_controlled ?? false,
      loading_bay_count: c.loading_bay_count ?? '',
      avg_loading_time_minutes: c.avg_loading_time_minutes ?? '',
      preferred_vehicle_types: c.preferred_vehicle_types?.join(', ') || '',
      warehouse_address: c.warehouse_address ?? '',
      sales_person_id: c.customer?.sales_person_id ?? c.customer?.sales_person?.id ?? '',
      account_manager_id: c.customer?.account_manager_id ?? c.customer?.account_manager?.id ?? '',
      user_id: c.customer?.user_id ?? '',
      status: c.customer?.status ?? 'ACTIVE',
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
    if (!form.customer_id) e.customer_id = 'Select a customer';
    if (!form.consignor_code?.trim()) e.consignor_code = 'Consignor code is required';

    if (createPortalUser && modal?.type === 'create') {
      if (!form.user.email) e['user.email'] = 'Email is required';
      if (!form.user.username) e['user.username'] = 'Username is required';
      if (!form.user.password) e['user.password'] = 'Password is required';
      if (form.user.password !== form.user.password_confirm) e['user.password_confirm'] = 'Passwords must match';
      if (!form.user.first_name) e['user.first_name'] = 'First name is required';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const setField = (key, value) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [key]: value }));
    }
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleSubmit = () => {
    if (!validate()) return;

    // Merge the selected customer's data into the payload
    const selectedCustomer = eligibleCustomers.find(c => c.id === form.customer_id) || {};
    const payload = { ...selectedCustomer, ...form };

    // Clean up to prevent sending the customer's nested object or original ID collision
    if (createPortalUser && modal.type === 'create') {
      // user is already in payload because form.user is in payload
    } else {
      delete payload.user;
    }

    delete payload.customer;
    delete payload.customer_code;
    if (modal.type === 'create') delete payload.id;

    // Nullify empty ID and address fields
    ['sales_person_id', 'account_manager_id', 'user_id', 'warehouse_address'].forEach(key => {
      if (typeof payload[key] === 'string' && !payload[key].trim()) payload[key] = null;
    });

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
      createMutation.mutate(payload, {
        onSuccess: () => closeModal(),
        onError: (err) => {
          if (err.response?.status === 400 && err.response.data?.details) {
            setErrors(err.response.data.details);
          }
        }
      });
    } else {
      updateMutation.mutate({ id: modal.id, data: payload }, {
        onSuccess: () => closeModal(),
        onError: (err) => {
          if (err.response?.status === 400 && err.response.data?.details) {
            setErrors(err.response.data.details);
          }
        }
      });
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  const consignors = data?.results ?? data ?? [];
  const total = data?.count ?? consignors.length;
  const active = consignors.filter(c => c.customer?.status === 'ACTIVE' || c.customer?.status === 'Active').length;
  const inactive = consignors.filter(c => c.customer?.status === 'INACTIVE' || c.customer?.status === 'Inactive').length;
  const suspended = consignors.filter(c => c.customer?.status === 'SUSPENDED' || c.customer?.status === 'Suspended').length;

  const resetFilters = () => { setSearchTerm(''); setStatus(''); setOrdering('customer__legal_name'); setCurrentPage(1); };

  const COLUMNS = [
    {
      header: 'Customer Code',
      render: c => (
        <div className="flex flex-col items-start gap-0.5 leading-none">
          <span className="font-mono text-[13px] font-black text-[#172B4D] block">
            {c.customer?.customer_code ?? '—'}
          </span>
          <span className="text-[9px] font-mono text-blue-500/60 tracking-tighter uppercase font-bold block">
            Cons: {c.consignor_code ?? '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Legal Name',
      render: c => (
        <div className="text-left py-1">
          <span className="font-bold text-[#172B4D] text-[13px] block leading-tight">
            {c.customer?.legal_name || c.legal_name || '—'}
          </span>
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
          <span className="font-semibold text-gray-600">Tons/M: {c.business_volume_tons_per_month || '—'}</span>
          <span className="font-semibold text-gray-600">Value/M: {c.business_volume_value_per_month ? `₹${Number(c.business_volume_value_per_month).toLocaleString('en-IN')}` : '—'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      render: c => {
        const status = c.customer?.status || 'ACTIVE';
        const st = getStatusStyle(status);
        return (
          <Badge className={`${st.bg} ${st.text} border-transparent`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {status}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      render: c => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(c); }}
            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all active:scale-95 shadow-sm"
          >
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
          <p className="text-gray-500 text-sm tracking-tight">Manage consignor profiles and logistics</p>
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
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
              <span>Refresh</span>
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
        <CustomerListFilterBar
          statusFilter={statusFilter}
          onStatusChange={(value) => { setStatus(value); setCurrentPage(1); }}
          statusOptions={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
            { value: 'SUSPENDED', label: 'Suspended' },
            { value: 'BLACKLISTED', label: 'Blacklisted' },
          ]}
          ordering={ordering}
          onOrderingChange={(value) => { setOrdering(value); setCurrentPage(1); }}
          orderingOptions={[
            { value: 'customer__legal_name', label: 'Name A-Z' },
            { value: '-customer__legal_name', label: 'Name Z-A' },
            { value: '-created_at', label: 'Newest' },
            { value: 'created_at', label: 'Oldest' },
          ]}
          clearVisible={statusFilter || ordering !== 'customer__legal_name'}
          onClearFilters={resetFilters}
          currentPage={currentPage}
          onPrevPage={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          onNextPage={() => setCurrentPage(prev => prev + 1)}
          hasNextPage={!!data?.next}
          isLoading={isLoading}
        />

        {isLoading && <TableShimmer rows={8} cols={5} />}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
            <AlertTriangle size={32} />
            <p className="text-sm font-medium">Failed to load consignors</p>
            <p className="text-xs text-gray-400">{error?.response?.data?.detail || error?.message}</p>
            <button onClick={() => refetch()} className="mt-2 px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8]">Try Again</button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div className="flex-1 overflow-auto min-h-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                  <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {COLUMNS.map(c => (
                      <th key={c.header} className="px-4 py-4">{c.header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {consignors.map(c => (
                    <tr
                      key={c.id || (c.customer?.customer_code + '-' + c.consignor_code)}
                      onClick={() => openView(c)}
                      className="hover:bg-blue-50/40 transition-all cursor-pointer border-l-2 border-l-transparent hover:border-l-[#0052CC] group/row"
                    >
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

            {/* Bottom Info Row */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
              <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
                Showing <span className="font-bold text-[#172B4D]">{consignors.length}</span> of <span className="font-bold text-[#172B4D]">{total}</span> consignors
              </div>
            </div>
          </>
        )}
      </div>

      {deleteTarget && (
        <DeleteConfirm label="Consignor" onClose={() => setDelete(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.customer_id || deleteTarget.id, { onSuccess: () => setDelete(null) })}
          deleting={deleteMutation.isPending} />
      )}

      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <Modal
          title={modal.type === 'create' ? 'Add New Consignor' : `Edit — ${modal.consignor?.customer?.legal_name || modal.consignor?.consignor_code}`}
          onClose={closeModal}
          onSubmit={handleSubmit}
          submitting={submitting}
          onDelete={modal.type === 'edit' ? () => { closeModal(); setDelete(modal.consignor); } : null}
          maxWidth="max-w-2xl"
        >
          <div className="grid grid-cols-2 gap-4">
            <Section title="Consignor Details" className="col-span-2" />
            <Field label="Legal Name" required error={errors.customer_id}>
              <Input
                value={form.legal_name || ''}
                onChange={e => {
                  const val = e.target.value;
                  setField('legal_name', val);
                  const match = eligibleCustomers.find(c => c.legal_name?.toLowerCase() === val.toLowerCase());
                  if (match) setField('customer_id', match.id);
                  else setField('customer_id', '');
                }}
                disabled={modal.type === 'edit' || modal.type === 'view'}
                placeholder="Enter customer legal name..."
                className="bg-white"
              />
            </Field>
            <Field label="Status">
              <Sel value={form.status} onChange={e => setField('status', e.target.value)} disabled={modal.type === 'view'}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BLACKLISTED">Blacklisted</option>
              </Sel>
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
              <VehicleTypeMultiSelect
                value={form.preferred_vehicle_types}
                onChange={val => setField('preferred_vehicle_types', val)}
                disabled={modal.type === 'view'}
              />
            </Field>

            <Field label="Warehouse Address" className="col-span-2">
              <Input
                value={form.warehouse_address || ''}
                onChange={e => setField('warehouse_address', e.target.value)}
                disabled={modal.type === 'view'}
                placeholder="Enter full warehouse address..."
              />
            </Field>

            <Section title="Relationship Management" className="col-span-2" />
            <Field label="Sales Person">
              <Sel
                value={form.sales_person_id || ''}
                onChange={e => setField('sales_person_id', e.target.value)}
                disabled={modal.type === 'view'}
              >
                <option value="">-- No Assignment --</option>
                {allUsers.filter(u => u.account_type === 'EMPLOYEE' || u.account_type === 'MANAGER').map(u => (
                  <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
                ))}
              </Sel>
            </Field>
            <Field label="Account Manager">
              <Sel
                value={form.account_manager_id || ''}
                onChange={e => setField('account_manager_id', e.target.value)}
                disabled={modal.type === 'view'}
              >
                <option value="">-- No Assignment --</option>
                {allUsers.filter(u => u.account_type === 'EMPLOYEE' || u.account_type === 'MANAGER').map(u => (
                  <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
                ))}
              </Sel>
            </Field>
            {!createPortalUser && (
              <Field label="Portal User (Linked User)" className="col-span-2" error={errors.user_id}>
                <Sel
                  value={form.user_id || ''}
                  onChange={e => setField('user_id', e.target.value)}
                  disabled={modal.type === 'view'}
                >
                  <option value="">-- No Linked User --</option>
                  {portalUsers.map(u => {
                    const linkedTo = userToCustomerMap[String(u.id)];
                    // If it's already linked to THIS customer, we should allow it (though it might already be selected)
                    const currentUserId = modal?.consignor?.customer?.user_id || modal?.consignor?.customer?.user?.id;
                    const isLinkedToOther = linkedTo && String(u.id) !== String(currentUserId);
                    const displayName = u.full_name || u.username;
                    
                    return (
                      <option key={u.id} value={u.id} disabled={isLinkedToOther}>
                        {displayName} ({u.email}){linkedTo ? ` — [Linked to ${linkedTo}]` : ''}
                      </option>
                    );
                  })}
                </Sel>
              </Field>
            )}

            {modal.type === 'create' && (
              <div className="col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-2">
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={createPortalUser}
                    onChange={e => setCreatePortalUser(e.target.checked)}
                    className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-bold text-[#172B4D]">Create New Portal User for this Consignor</span>
                </label>

                {createPortalUser && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Field label="Username" required error={errors['user.username']}>
                      <Input
                        value={form.user.username}
                        onChange={e => setField('user.username', e.target.value)}
                        placeholder="john_doe"
                      />
                    </Field>
                    <Field label="Email Address" required error={errors['user.email']}>
                      <Input
                        type="email"
                        value={form.user.email}
                        onChange={e => setField('user.email', e.target.value)}
                        placeholder="john@example.com"
                      />
                    </Field>
                    <Field label="Password" required error={errors['user.password']}>
                      <Input
                        type="password"
                        value={form.user.password}
                        onChange={e => setField('user.password', e.target.value)}
                        placeholder="••••••••"
                      />
                    </Field>
                    <Field label="Confirm Password" required error={errors['user.password_confirm']}>
                      <Input
                        type="password"
                        value={form.user.password_confirm}
                        onChange={e => setField('user.password_confirm', e.target.value)}
                        placeholder="••••••••"
                      />
                    </Field>
                    <Field label="First Name" required error={errors['user.first_name']}>
                      <Input
                        value={form.user.first_name}
                        onChange={e => setField('user.first_name', e.target.value)}
                        placeholder="John"
                      />
                    </Field>
                    <Field label="Last Name" error={errors['user.last_name']}>
                      <Input
                        value={form.user.last_name}
                        onChange={e => setField('user.last_name', e.target.value)}
                        placeholder="Doe"
                      />
                    </Field>
                    <Field label="Phone Number" error={errors['user.phone']}>
                      <Input
                        value={form.user.phone}
                        onChange={e => setField('user.phone', e.target.value)}
                        placeholder="+91 ..."
                      />
                    </Field>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {modal?.type === 'view' && (
        <Modal
          title={`View — ${modal.consignor?.customer?.legal_name || modal.consignor?.consignor_code}`}
          onClose={closeModal}
          maxWidth="max-w-4xl"
          isView={true}
        >
          <ViewConsignorContent
            consignor={modal.consignor}
            onEdit={() => {
              const c = modal.consignor;
              closeModal();
              setTimeout(() => openEdit(c), 100);
            }}
          />
        </Modal>
      )}
    </div>
  );
};

// TABS removed as per user request to simplify the view

const ViewConsignorContent = ({ consignor: c, onEdit }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <ConsignorOverview consignor={c} onEdit={onEdit} />
    </div>
  );
};

const ConsignorOverview = ({ consignor: c, onEdit }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
    <div className="grid grid-cols-2 gap-4">
      <InfoCard label="Legal Name" value={c.customer?.legal_name} accent />
      <InfoCard label="Customer Code" value={c.customer?.customer_code} />
      <InfoCard label="Consignor Code" value={c.consignor_code} />
      <InfoCard label="Status" value={c.customer?.status} />
    </div>

    <Section title="Tax & Identification" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Tax ID (GSTIN)" value={c.customer?.tax_id} />
      <InfoCard label="PAN Number" value={c.customer?.pan_number} />
    </div>

    <Section title="Operations" />
    <div className="grid grid-cols-2 gap-4">
      <InfoCard label="Hazardous Handling" value={c.hazardous_material_handling ? 'Yes' : 'No'} />
      <InfoCard label="Temp Controlled" value={c.temperature_controlled ? 'Yes' : 'No'} />
    </div>

    <Section title="Logistics Details" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Loading Bays" value={c.loading_bay_count} />
      <InfoCard label="Avg Loading Time" value={c.avg_loading_time_minutes ? `${c.avg_loading_time_minutes} mins` : null} />
      <InfoCard label="Preferred Vehicles" value={c.preferred_vehicle_types?.join(', ')} />
    </div>

    <Section title="Business Volume" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Monthly Tons" value={c.business_volume_tons_per_month} />
      <InfoCard label="Monthly Value" value={c.business_volume_value_per_month ? `₹${Number(c.business_volume_value_per_month).toLocaleString('en-IN')}` : null} />
    </div>

    <Section title="Relationship Management" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Sales Person" value={c.customer?.sales_person?.full_name || c.customer?.sales_person?.name || 'Not Assigned'} />
      <InfoCard label="Account Manager" value={c.customer?.account_manager?.full_name || c.customer?.account_manager?.name || 'Not Assigned'} />
      <InfoCard label="Portal User" value={c.customer?.portal_user?.username || c.customer?.user?.username || 'None'} />
      <InfoCard label="Warehouse Address" value={c.warehouse_address || 'Not Provided'} />
    </div>

    <div className="pt-3 border-t border-gray-100 flex justify-end items-center gap-4">
      <p className="text-[10px] text-gray-400 font-mono italic mr-auto">Created: {c.created_at ? new Date(c.created_at).toLocaleString() : '—'}</p>
    </div>
  </div>
);

const CustomerAddresses = ({ customerId }) => {
  const { data: addresses, isLoading } = useCustomerAddresses(customerId);
  if (isLoading) return <Loader2 size={24} className="animate-spin text-[#0052CC] mx-auto my-12" />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Stored Addresses" count={addresses?.length} icon={MapPin} />
      {addresses?.length === 0 ? (
        <EmptyState text="No addresses found" icon={MapPin} />
      ) : (
        <div className="grid gap-3">
          {addresses?.map(addr => (
            <div key={addr.id} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-all flex justify-between items-start group">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <MapPin size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0052CC]">{addr.address_type}</span>
                    {addr.is_default && <Badge className="bg-green-50 text-green-700 border-green-200">Default</Badge>}
                  </div>
                  <p className="text-sm font-bold text-[#172B4D] leading-tight">{addr.address_line1}</p>
                  {addr.address_line2 && <p className="text-xs text-gray-500 mt-0.5">{addr.address_line2}</p>}
                  <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-tight">{addr.city}, {addr.state} — {addr.postal_code}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomerContacts = ({ customerId }) => {
  const { data: contacts, isLoading } = useCustomerContacts(customerId);
  if (isLoading) return <Loader2 size={24} className="animate-spin text-[#0052CC] mx-auto my-12" />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Contact Directory" count={contacts?.length} icon={Phone} />
      {contacts?.length === 0 ? (
        <EmptyState text="No contacts found" icon={Phone} />
      ) : (
        <div className="grid gap-3">
          {contacts?.map(contact => (
            <div key={contact.id} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-all flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#172B4D] font-black text-sm border border-gray-100 shrink-0">
                {contact.first_name?.[0]}{contact.last_name?.[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-[#172B4D]">{contact.first_name} {contact.last_name}</p>
                  {contact.is_primary && <Badge className="bg-blue-50 text-blue-700 border-blue-200">Primary</Badge>}
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">{contact.designation || 'Staff'}</p>
                <div className="flex items-center gap-4 mt-2">
                  {contact.email && <span className="text-[11px] text-[#0052CC] font-mono flex items-center gap-1"><FileText size={10} /> {contact.email}</span>}
                  {contact.mobile && <span className="text-[11px] text-gray-500 font-bold flex items-center gap-1"><Phone size={10} /> {contact.mobile}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomerDocuments = ({ customerId }) => {
  const { data: docs, isLoading } = useCustomerDocuments(customerId);
  if (isLoading) return <Loader2 size={24} className="animate-spin text-[#0052CC] mx-auto my-12" />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Compliance Documents" count={docs?.length} icon={FileText} />
      {docs?.length === 0 ? (
        <EmptyState text="No documents uploaded" icon={FileText} />
      ) : (
        <div className="grid gap-3">
          {docs?.map(doc => (
            <div key={doc.id} className="p-3 pr-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-all flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><FileText size={20} /></div>
                <div>
                  <p className="text-sm font-bold text-[#172B4D]">{doc.document_type}</p>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tight">{doc.document_number}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Badge className={doc.verified_status === 'VERIFIED' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}>{doc.verified_status}</Badge>
                    {doc.expiry_date && <span className="text-[10px] font-bold text-gray-400">Expires: {new Date(doc.expiry_date).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
              <a href={doc.file_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-[#0052CC] hover:text-white transition-all"><Eye size={14} /></a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomerContracts = ({ customerId }) => {
  const { data: contracts, isLoading } = useCustomerContracts(customerId);
  if (isLoading) return <Loader2 size={24} className="animate-spin text-[#0052CC] mx-auto my-12" />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Legal Contracts" count={contracts?.length} icon={ClipboardList} />
      {contracts?.length === 0 ? (
        <EmptyState text="No contracts active" icon={ClipboardList} />
      ) : (
        <div className="grid gap-3">
          {contracts?.map(contract => (
            <div key={contract.id} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-black text-[#172B4D]">{contract.contract_number}</p>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{contract.contract_type}</p>
                </div>
                <Badge className={contract.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>{contract.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-50">
                <div>
                  <span className="text-[10px] font-black text-gray-300 uppercase block mb-0.5">Start Date</span>
                  <span className="text-xs font-bold text-[#172B4D]">{new Date(contract.start_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-300 uppercase block mb-0.5">End Date</span>
                  <span className="text-xs font-bold text-[#172B4D]">{contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Indefinite'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomerNotes = ({ customerId }) => {
  const { data: notes, isLoading } = useCustomerNotes(customerId);
  if (isLoading) return <Loader2 size={24} className="animate-spin text-[#0052CC] mx-auto my-12" />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Consignor Notes" count={notes?.length} icon={LucideInfo} />
      {notes?.length === 0 ? (
        <EmptyState text="No notes available" icon={LucideInfo} />
      ) : (
        <div className="space-y-3">
          {notes?.map(note => (
            <div key={note.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <Badge className="bg-white border-gray-200 text-gray-600 tracking-widest uppercase">{note.note_type}</Badge>
                <span className="text-[10px] text-gray-400 font-bold">{new Date(note.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed italic">"{note.note}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomerCreditHistoryView = ({ customerId, currentLimit }) => {
  const { data: history, isLoading } = useCustomerCreditHistory(customerId);
  if (isLoading) return <Loader2 size={24} className="animate-spin text-[#0052CC] mx-auto my-12" />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Credit Limit History" count={history?.length} icon={History} />
      <div className="p-4 bg-[#EBF3FF] rounded-xl border border-[#0052CC]/10 mb-6">
        <p className="text-[10px] font-black text-[#0052CC] uppercase tracking-widest mb-1 text-center">Current Active Limit</p>
        <p className="text-3xl font-black text-[#172B4D] text-center">₹{Number(currentLimit || 0).toLocaleString('en-IN')}</p>
      </div>

      {history?.length === 0 ? (
        <EmptyState text="No history entries" icon={History} />
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
          {history?.map(entry => (
            <div key={entry.id} className="relative">
              <div className="absolute -left-[2.15rem] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-[#0052CC]" />
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-black text-[#172B4D]">₹{Number(entry.credit_limit).toLocaleString('en-IN')}</p>
                <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(entry.effective_date).toLocaleDateString()}</span>
              </div>
              {entry.reason && <p className="text-xs text-gray-400 leading-tight italic">Reason: {entry.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// CustomerAutocomplete removed as per user request for a plain text field

const VehicleTypeMultiSelect = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  const { data: vtData, isLoading } = useVehicleTypes({ all: true }, { enabled: open || !!value });
  const allTypes = vtData?.results ?? vtData ?? [];

  const selectedIds = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  const filtered = query
    ? allTypes.filter(t => (t.type_name || t.name || '').toLowerCase().includes(query.toLowerCase()))
    : allTypes;

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const toggle = (typeName) => {
    let next;
    if (selectedIds.includes(typeName)) {
      next = selectedIds.filter(id => id !== typeName);
    } else {
      next = [...selectedIds, typeName];
    }
    onChange(next.join(', '));
  };

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full min-h-[42px] px-3 py-2 border border-gray-200 rounded-xl bg-white flex flex-wrap gap-1.5 items-center transition-all
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-[#0052CC]/40 focus-within:ring-2 focus-within:ring-[#0052CC]/10'}`}
      >
        {selectedIds.length === 0 ? (
          <span className="text-sm text-gray-400">Select vehicle types...</span>
        ) : (
          selectedIds.map(id => (
            <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#0052CC] text-[11px] font-bold rounded-md border border-blue-100 uppercase tracking-tighter">
              {id}
              {!disabled && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggle(id); }}
                  className="hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              )}
            </span>
          ))
        )}
        <ChevronDown size={14} className={`ml-auto text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search vehicle types..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20"
              />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto p-1 py-2">
            {isLoading ? (
              <li className="px-4 py-6 text-center"><Loader2 size={24} className="animate-spin text-[#0052CC] mx-auto" /></li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-8 text-sm text-gray-400 text-center italic">No vehicle types found</li>
            ) : (
              filtered.map(t => {
                const name = t.type_name || t.name;
                const isSelected = selectedIds.includes(name);
                return (
                  <li
                    key={t.id}
                    onClick={() => toggle(name)}
                    className={`px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between group
                      ${isSelected ? 'bg-blue-50 text-[#0052CC]' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>{name}</span>
                      {t.capacity_tons && <span className="text-[10px] text-gray-400 uppercase font-black">Capacity: {t.capacity_tons} tons</span>}
                    </div>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#0052CC]" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Consignors;
