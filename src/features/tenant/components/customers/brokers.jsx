import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronDown, Loader2, AlertTriangle, Briefcase, Pencil, RotateCcw,
  MapPin, Phone, FileText, ClipboardList, Wallet, History, Building2, Info as LucideInfo,
  Search, Plus, RefreshCw, Users, CheckCircle, PauseCircle, AlertCircle, Eye, Download
} from 'lucide-react';
import {
  Modal, Field, Input, Sel, Section, DeleteConfirm, Badge,
  InfoCard, SectionHeader, EmptyState,
  RelationshipManagementFields, CreatePortalUserSection, RelationshipOverviewSection
} from './Common/CustomerCommon';
import {
  useCustomerAddresses, useCustomerContacts, useCustomerDocuments,
  useCustomerContracts, useCustomerNotes, useCustomerCreditHistory,
  useBrokers, useCustomers, useCreateBroker, useUpdateBroker, useDeleteBroker,
  useConsignors, useConsignees, useAgents
} from '../../queries/customers/customersQuery';
import { useUsers } from '../../queries/users/userQuery';
import { TableShimmer, ErrorState } from '../Vehicles/Common/StateFeedback';
import CustomerListFilterBar from './Common/CustomerListFilterBar';

const EMPTY_FORM = {
  customer_id: '',
  legal_name: '',
  tax_id: '',
  pan_number: '',
  broker_code: '',
  commission_rate: '',
  commission_type: 'PERCENTAGE',
  payment_terms: '',
  license_number: '',
  license_expiry: '',
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
    phone: ''
  }
};

const STATUS_STYLES = {
  'ACTIVE': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'INACTIVE': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'SUSPENDED': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'DELETED': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const getStatusStyle = (status) => STATUS_STYLES[status] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };

const BrokersDashboard = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [ordering, setOrdering] = useState('customer__legal_name');
  const [currentPage, setCurrentPage] = useState(1);

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading, isError, error, refetch } = useBrokers({
    page: currentPage,
    ...(statusFilter === 'DELETED' && { deleted_only: true }),
    ...(statusFilter && statusFilter !== 'DELETED' && { customer__status: statusFilter }),
    ...(ordering && { ordering }),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data: customerData } = useCustomers({ limit: 1000 });
  const { data: consigneeData } = useConsignees({ limit: 1000 });
  const { data: brokerData } = useBrokers({ limit: 1000 });
  const { data: agentData } = useAgents({ limit: 1000 });
  const { data: consignorData } = useConsignors({ limit: 1000 });

  const allEntities = useMemo(() => {
    const customers = customerData?.results ?? customerData ?? [];
    const consignors = consignorData?.results ?? consignorData ?? [];
    const consignees = consigneeData?.results ?? consigneeData ?? [];
    const brokers = brokerData?.results ?? brokerData ?? [];
    const agents = agentData?.results ?? agentData ?? [];
    return [...customers, ...consignors, ...consignees, ...brokers, ...agents];
  }, [customerData, consignorData, consigneeData, brokerData, agentData]);

  const userToCustomerMap = useMemo(() => {
    const map = {};
    allEntities.forEach(c => {
      const uid = c.user?.id || 
                  c.user_id || 
                  c.portal_user_id || 
                  c.portal_user?.id || 
                  c.customer?.user?.id || 
                  c.customer?.user_id ||
                  c.customer?.portal_user_id;

      if (uid) {
        const name = c.legal_name || 
                     c.trading_name || 
                     c.name || 
                     c.customer?.legal_name || 
                     c.customer?.trading_name || 
                     'Another Entity';
        map[String(uid)] = name;
      }
    });
    return map;
  }, [allEntities]);

  const allCustomers = customerData?.results ?? customerData ?? [];
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [deleteError, setDeleteError] = useState(null);
  const [createPortalUser, setCreatePortalUser] = useState(true);

  const { data: userData } = useUsers({ limit: 1000 });
  const allUsers = userData?.results ?? userData ?? [];

  const portalUsers = useMemo(() => {
    return (allUsers || []).filter(u => u.account_type === 'PORTAL' || u.account_type === 'PORTAL_USER' || u.account_type === 'PORTAL_CLIENT' || u.account_type === 'CUSTOMER');
  }, [allUsers]);

  const eligibleCustomers = allCustomers.filter(c =>
    c.customer_type === 'BROKER' ||
    c.customer_type === 'BOTH' ||
    c.customer_type === 'OTHER' ||
    c.id === form.customer_id
  );

  const createMutation = useCreateBroker();
  const updateMutation = useUpdateBroker();
  const deleteMutation = useDeleteBroker();

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setModal({ type: 'create' });
    setCreatePortalUser(true);
  };

  const openEdit = (b) => {
    const { customer: cust = {}, ...brok } = b;
    const editId = cust.id || brok.id;
    console.log('Opening Broker Edit:', { profile_id: brok.id, customer_id: cust.id, target_id: editId });
    setForm({
      ...EMPTY_FORM,
      customer_id: cust.id ?? '',
      legal_name: cust.legal_name ?? '',
      tax_id: cust.tax_id ?? '',
      pan_number: cust.pan_number ?? '',
      broker_code: brok.broker_code ?? '',
      commission_rate: brok.commission_rate ?? '',
      commission_type: brok.commission_type ?? 'PERCENTAGE',
      payment_terms: brok.payment_terms ?? '',
      license_number: brok.license_number ?? '',
      license_expiry: brok.license_expiry ?? '',
      sales_person_id: cust.sales_person_id ?? cust.sales_person?.id ?? '',
      account_manager_id: cust.account_manager_id ?? cust.account_manager?.id ?? '',
      user_id: cust.user_id ?? '',
      status: cust.status ?? 'ACTIVE',
    });
    setErrors({});
    setModal({ type: 'edit', id: editId, broker: b });
  };

  const openView = (b) => {
    setModal({ type: 'view', id: b.customer?.id || b.id, broker: b });
  };

  const closeModal = () => { setModal(null); setErrors({}); };

  // Auto-generate broker code from legal name in create mode
  useEffect(() => {
    if (modal?.type === 'create' && form.legal_name && !form.broker_code) {
      const initials = (form.legal_name || 'BRK')
        .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
      const suffix = Math.floor(100 + Math.random() * 900);
      setField('broker_code', `BRK-${initials}-${suffix}`);
    }
  }, [form.legal_name, modal?.type]);

  const validate = () => {
    const e = {};
    if (form.legal_name) {
      const match = eligibleCustomers.find(c => c.legal_name?.toLowerCase() === form.legal_name.toLowerCase());
      if (match) form.customer_id = match.id;
    }
    if (!form.legal_name?.trim()) e.legal_name = 'Legal Name is required';
    if (!form.tax_id?.trim()) e.tax_id = 'Tax ID is required';
    if (!form.pan_number?.trim()) e.pan_number = 'PAN number is required';
    if (!form.broker_code?.trim()) {
      const initials = (form.legal_name || 'BRK').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
      form.broker_code = `BRK-${initials}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    if (createPortalUser && modal?.type === 'create') {
      if (!form.user.email) e['user.email'] = 'Email is required';
      if (!form.user.username) e['user.username'] = 'Username is required';
      if (!form.user.password) e['user.password'] = 'Password is required';
      if (form.user.password !== form.user.password_confirm) e['user.password_confirm'] = 'Passwords must match';
      if (!form.user.first_name) e['user.first_name'] = 'First name is required';
      if (!form.user.phone) e['user.phone'] = 'Phone is required';
    }
    if (modal?.type === 'create' && !createPortalUser && !form.user_id) {
      e.user_id = 'Select an existing linked user or create a portal user';
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

    // Try to match existing customer by legal name
    const selectedCustomer = eligibleCustomers.find(
      c => c.legal_name?.toLowerCase() === form.legal_name?.toLowerCase()
    ) || {};

    // Clean up to avoid 400 errors from nested objects
    const {
      id: _id,
      customer: _customer,
      customer_code: _customer_code,
      created_at: _created_at,
      updated_at: _updated_at,
      ...cleanPayload
    } = { ...selectedCustomer, ...form };

    const payload = cleanPayload;

    if (createPortalUser && modal.type === 'create') {
      // user is handled via create mutation usually
    } else {
      delete payload.user;
    }

    // Explicitly set null for empty fields to avoid backend validation errors
    ['sales_person_id', 'account_manager_id', 'user_id', 'license_expiry', 'commission_rate'].forEach(key => {
      if (payload[key] === '' || (typeof payload[key] === 'string' && !payload[key].trim())) {
        payload[key] = null;
      }
    });

    console.log('Submitting Broker Update/Create:', { type: modal.type, id: modal.id, payload });

    if (modal.type === 'create') {
      createMutation.mutate(payload, {
        onSuccess: () => closeModal(),
        onError: (err) => {
          if (err.response?.status === 400 && err.response.data?.details) {
            setErrors(err.response.data.details);
          } else {
            setErrors(prev => ({ ...prev, _generic: `Create Failed: ${err.response?.data?.detail || err.message}` }));
          }
        }
      });
    } else {
      updateMutation.mutate({ id: modal.id, data: payload }, {
        onSuccess: () => closeModal(),
        onError: (err) => {
          if (err.response?.status === 400 && err.response.data?.details) {
            setErrors(err.response.data.details);
          } else {
            setErrors(prev => ({ ...prev, _generic: `Update Failed: ${err.response?.data?.detail || err.message}` }));
          }
        }
      });
    }
  };

  const brokers = data?.results ?? data ?? [];
  const total = data?.count ?? brokers.length;
  const active = brokers.filter(b => b.customer?.status === 'ACTIVE' || b.customer?.status === 'Active').length;
  const inactive = brokers.filter(b => b.customer?.status === 'INACTIVE' || b.customer?.status === 'Inactive').length;
  const suspended = brokers.filter(b => b.customer?.status === 'SUSPENDED' || b.customer?.status === 'Suspended').length;
  const resetFilters = () => { setSearch(''); setDebouncedSearch(''); setStatus(''); setOrdering('customer__legal_name'); setCurrentPage(1); };

  const COLUMNS = [
    {
      header: 'Customer Code',
      render: b => (
        <div className="flex flex-col items-start gap-0.5 leading-none">
          <span className="font-mono text-[13px] font-black text-[#172B4D] block">
            {b.customer?.customer_code ?? '—'}
          </span>
          <span className="text-[9px] font-mono text-blue-500/60 tracking-tighter uppercase font-bold block">
            Brkr: {b.broker_code ?? '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Legal Name',
      render: b => (
        <div className="text-left py-1">
          <span className="font-bold text-[#172B4D] text-[13px] block leading-tight">
            {b.customer?.legal_name || b.legal_name || '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Commission',
      render: b => (
        <div className="flex flex-col gap-1 text-[11px]">
          <span className="font-semibold text-gray-600">Type: <span className="text-gray-700 font-bold">{b.commission_type || 'PERCENTAGE'}</span></span>
          <span className="font-semibold text-gray-600">Rate: <span className="text-gray-700 font-bold">{b.commission_rate ? `${b.commission_rate}${b.commission_type === 'PERCENTAGE' ? '%' : ' Flat'}` : '—'}</span></span>
        </div>
      ),
    },
    {
      header: 'License',
      render: b => (
        <div className="flex flex-col gap-1 text-[11px]">
          <span className="font-semibold text-gray-600">No: <span className="font-bold text-gray-700">{b.license_number || '—'}</span></span>
          <span className="font-semibold text-gray-600">Expiry: <span className="font-bold text-gray-700">{b.license_expiry || '—'}</span></span>
        </div>
      ),
    },
    {
      header: 'Status',
      render: b => {
        const status = b.customer?.is_deleted ? 'DELETED' : (b.customer?.status || 'ACTIVE');
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
      render: b => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(b); }}
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
          <h2 className="text-2xl font-bold text-[#172B4D]">Brokers</h2>
          <p className="text-gray-500 text-sm tracking-tight">Manage broker profiles and commission structures</p>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="relative group/search">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
            <input
              type="text"
              placeholder="Search broker name, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50  transition-all shadow-sm hover:shadow-md hover:border-gray-300"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
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
              title="Export Brokers"
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
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> New Broker
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
            { value: 'DELETED', label: 'Deleted' },
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

        {isLoading ? <TableShimmer rows={8} /> :
          isError ? <ErrorState message="Failed to load brokers" onRetry={refetch} /> : (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                  <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {COLUMNS.map(c => (
                      <th key={c.header} className="px-4 py-4">{c.header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {brokers.map(b => (
                    <tr key={b.id} onClick={() => openView(b)} className="hover:bg-blue-50/40 transition-all cursor-pointer border-l-2 border-l-transparent hover:border-l-[#0052CC] group/row">
                      {COLUMNS.map(col => (
                        <td key={col.header} className="px-4 py-3 whitespace-nowrap align-middle">{col.render(b)}</td>
                      ))}
                    </tr>
                  ))}
                  {brokers.length === 0 && (
                    <tr>
                      <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-gray-400">
                        <Briefcase size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No brokers found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        {/* Bottom Info Row */}
        {!isLoading && !isError && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
            <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
              Showing <span className="font-bold text-[#172B4D]">{brokers.length}</span> of <span className="font-bold text-[#172B4D]">{total}</span> brokers
            </div>
          </div>
        )}
      </div>

      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <Modal
          title={modal.type === 'create' ? 'Add New Broker' : 'Edit Broker Profile'}
          onClose={closeModal}
          onSubmit={handleSubmit}
          submitting={createMutation.isPending || updateMutation.isPending}
          onDelete={modal.type === 'edit' ? () => { closeModal(); setDelete(modal.broker); } : null}
          maxWidth="max-w-xl"
        >
          <div className="grid grid-cols-2 gap-4">
            {errors._generic && (
              <div className="col-span-2 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} /> {errors._generic}
              </div>
            )}

            {/* Portal User creation at the very beginning for Brokers too */}
            {modal.type === 'create' && (
              <CreatePortalUserSection
                createPortalUser={createPortalUser}
                setCreatePortalUser={setCreatePortalUser}
                form={form}
                setField={setField}
                errors={errors}
                moduleName="Broker"
              />
            )}

            {/* Relationship fields moved to the top and commented out in Common, but here we just keep the call */}
            <RelationshipManagementFields
              form={form}
              setField={setField}
              allUsers={allUsers}
              errors={errors}
              portalUsers={portalUsers}
              userToCustomerMap={userToCustomerMap}
              initial={modal.broker}
              createPortalUser={createPortalUser}
              disabled={modal.type === 'view'}
            />

            <Section title="Basic Information" className="col-span-2" />
            <Field label="Legal Name" required error={errors.legal_name}>
              <Input
                value={form.legal_name || ''}
                onChange={e => {
                  const val = e.target.value;
                  setField('legal_name', val);
                  const match = eligibleCustomers.find(c => c.legal_name?.toLowerCase() === val.toLowerCase());
                  if (match) setField('customer_id', match.id);
                  else setField('customer_id', '');
                }}
                disabled={modal.type === 'edit'}
                placeholder="Enter customer legal name..."
              />
            </Field>
            <Field label="Tax ID (GSTIN)" required error={errors.tax_id}>
              <Input
                value={form.tax_id || ''}
                onChange={e => setField('tax_id', e.target.value)}
                disabled={modal.type === 'view'}
                placeholder="e.g. 27AAACR5055K1ZV"
              />
            </Field>
            <Field label="PAN Number" required error={errors.pan_number}>
              <Input
                value={form.pan_number || ''}
                onChange={e => setField('pan_number', e.target.value)}
                disabled={modal.type === 'view'}
                placeholder="e.g. AAACR5055K"
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
            <Field label="Brokerage Type">
              <Sel value={form.commission_type} onChange={e => setField('commission_type', e.target.value)}>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Fee</option>
              </Sel>
            </Field>
            <Field label="Commission Rate">
              <Input type="number" value={form.commission_rate} onChange={e => setField('commission_rate', e.target.value)} placeholder={form.commission_type === 'PERCENTAGE' ? '%' : 'Amount'} />
            </Field>
            <Field label="Payment Terms" className="col-span-2">
              <Input value={form.payment_terms} onChange={e => setField('payment_terms', e.target.value)} placeholder="e.g. Net 30 days" />
            </Field>
            <Field label="License Number">
              <Input value={form.license_number} onChange={e => setField('license_number', e.target.value)} placeholder="e.g. BR-LIC-9988" />
            </Field>
            <Field label="License Expiry">
              <Input type="date" value={form.license_expiry} onChange={e => setField('license_expiry', e.target.value)} />
            </Field>

          </div>
        </Modal>
      )}

      {deleteTarget && (
        <DeleteConfirm
          label="Broker Profile"
          message={deleteError}
          onClose={() => { setDelete(null); setDeleteError(null); }}
          onConfirm={() => {
            const delId = deleteTarget.customer?.id || deleteTarget.id;
            setDeleteError(null);
            console.log('Deleting Broker Profile:', { id: deleteTarget.id, customer_id: deleteTarget.customer?.id, target: delId });
            deleteMutation.mutate(delId, {
              onSuccess: () => { setDelete(null); setDeleteError(null); },
              onError: (err) => {
                setDeleteError(`Delete Failed: ${err.response?.data?.detail || err.message}`);
              }
            });
          }}
          deleting={deleteMutation.isPending}
        />
      )}

      {modal?.type === 'view' && (
        <Modal
          title={`View — ${modal.broker?.customer?.legal_name || modal.broker?.broker_code}`}
          onClose={closeModal}
          maxWidth="max-w-4xl"
        >
          <BrokerOverview
            broker={modal.broker}
            onEdit={() => {
              const b = modal.broker;
              closeModal();
              setTimeout(() => openEdit(b), 100);
            }}
          />
        </Modal>
      )}
    </div>
  );
};





const BrokerOverview = ({ broker: b, onEdit }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
    {/* Shared Relationship Info at the very TOP */}
    <RelationshipOverviewSection item={b} showWarehouse={false} />

    <div className="grid grid-cols-2 gap-4">
      <InfoCard label="Legal Name" value={b.customer?.legal_name} accent />
      <InfoCard label="Customer Code" value={b.customer?.customer_code} />
      <InfoCard label="Broker Code" value={b.broker_code} />
      <InfoCard label="Payment Terms" value={b.payment_terms || 'Not Set'} />
      <InfoCard label="License Number" value={b.license_number || 'Not Set'} />
    </div>

    <Section title="Commission Details" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Commission Rate" value={b.commission_rate ? `${b.commission_rate}${b.commission_type === 'PERCENTAGE' ? '%' : ' Flat'}` : 'N/A'} />
      <InfoCard label="Commission Type" value={b.commission_type || 'PERCENTAGE'} />
    </div>

    <Section title="Compliance" />
    <div className="grid grid-cols-1 gap-3">
      <InfoCard label="License Expiry" value={b.license_expiry || 'Not Set'} />
    </div>



  </div>
);







export default BrokersDashboard;