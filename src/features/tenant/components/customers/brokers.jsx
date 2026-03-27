import React, { useState, useEffect } from 'react';
import {
  ChevronDown, Loader2, AlertTriangle, Briefcase, Pencil, RotateCcw,
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
  useBrokers, useCustomers, useCreateBroker, useUpdateBroker, useDeleteBroker
} from '../../queries/customers/customersQuery';
import { TableShimmer, ErrorState } from '../Vehicles/Common/StateFeedback';

const EMPTY_FORM = {
  customer_id: '',
  broker_code: '',
  commission_rate: '',
  brokerage_type: 'PERCENTAGE',
  is_internal_broker: false,
  specialization: '',
  regions_covered: '',
};

const STATUS_STYLES = {
  'ACTIVE': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'INACTIVE': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'SUSPENDED': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const getStatusStyle = (status) => STATUS_STYLES[status] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };

const BrokersDashboard = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
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
    ...(statusFilter && { status: statusFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data: customerData } = useCustomers({ limit: 1000 });
  const allCustomers = customerData?.results ?? customerData ?? [];
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

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
  };

  const openEdit = (b) => {
    setForm({
      customer_id: b.customer?.id ?? '',
      broker_code: b.broker_code ?? '',
      commission_rate: b.commission_rate ?? '',
      brokerage_type: b.brokerage_type ?? 'PERCENTAGE',
      is_internal_broker: b.is_internal_broker ?? false,
      regions_covered: b.regions_covered?.join(', ') || '',
    });
    setErrors({});
    setModal({ type: 'edit', id: b.id, broker: b });
  };

  const openView = (b) => {
    setModal({ type: 'view', id: b.id, broker: b });
  };

  const closeModal = () => { setModal(null); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.customer_id) e.customer_id = 'Customer is required';
    if (!form.broker_code?.trim()) e.broker_code = 'Broker code is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const setField = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  const handleSubmit = () => {
    if (!validate()) return;

    // Merge the selected customer's data into the payload (required by the API)
    const selectedCustomer = eligibleCustomers.find(c => c.id === form.customer_id) || {};
    const payload = {
      ...selectedCustomer,
      ...form,
      regions_covered: form.regions_covered ? form.regions_covered.split(',').map(s => s.trim()).filter(Boolean) : []
    };

    // Clean up to avoid collisions
    delete payload.customer;
    delete payload.customer_code;
    if (modal.type === 'create') delete payload.id;

    // Nullify empty numeric fields
    if (!payload.commission_rate) payload.commission_rate = null;

    if (modal.type === 'create') {
      createMutation.mutate(payload, { onSuccess: () => closeModal() });
    } else {
      updateMutation.mutate({ id: modal.id, data: payload }, { onSuccess: () => closeModal() });
    }
  };

  const brokers = data?.results ?? data ?? [];
  const total = data?.count ?? brokers.length;
  const active = brokers.filter(b => b.customer?.status === 'ACTIVE' || b.customer?.status === 'Active').length;
  const inactive = brokers.filter(b => b.customer?.status === 'INACTIVE' || b.customer?.status === 'Inactive').length;
  const suspended = brokers.filter(b => b.customer?.status === 'SUSPENDED' || b.customer?.status === 'Suspended').length;

  const COLUMNS = [
    {
      header: 'Legal Name',
      render: b => (
        <div className="text-left">
          <button onClick={() => openView(b)}
            className="font-bold text-[#172B4D] text-[13px] hover:text-[#0052CC] transition-all hover:scale-105 active:scale-95 text-left block">
            {b.customer?.legal_name ?? '—'}
          </button>
          <div className="text-[11px] font-mono text-gray-400">{b.broker_code ?? ''}</div>
        </div>
      ),
    },
    {
      header: 'Type & Specialization',
      render: b => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-700">{b.brokerage_type}</span>
          <span className="text-[10px] text-gray-400 font-medium uppercase">{b.specialization || 'General'}</span>
        </div>
      ),
    },
    {
      header: 'Commission',
      render: b => (
        <span className="font-bold text-gray-700 text-[13px]">
          {b.commission_rate ? `${b.commission_rate}${b.brokerage_type === 'PERCENTAGE' ? '%' : ' Flat'}` : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: b => {
        const status = b.customer?.status || 'ACTIVE';
        const st = getStatusStyle(status);
        return (
          <Badge className={`${st.bg} ${st.text} border-transparent`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot} mr-1.5`} />
            {status}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      render: b => (
        <button onClick={() => openEdit(b)} className="p-2 text-gray-400 hover:text-[#0052CC] transition-all">
          <Pencil size={14} />
        </button>
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

        {/* Filters & Pagination Row */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-50 h-[60px]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => { setStatus(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[12px] font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:border-gray-200 cursor-pointer shadow-sm"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            {statusFilter && (
              <button onClick={() => { setStatus(''); setCurrentPage(1); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Clear Filter">
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
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
                    <tr key={b.id} className="hover:bg-blue-50/30 transition-colors">
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
            <Field label="Customer" required error={errors.customer_id}>
              <Sel value={form.customer_id} onChange={e => setField('customer_id', e.target.value)} disabled={modal.type === 'edit'}>
                <option value="">-- Select Customer --</option>
                {eligibleCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.legal_name}</option>
                ))}
              </Sel>
            </Field>
            <Field label="Broker Code" required error={errors.broker_code}>
              <Input value={form.broker_code} onChange={e => setField('broker_code', e.target.value)} placeholder="e.g. BRK-001" />
            </Field>
            <Field label="Brokerage Type">
              <Sel value={form.brokerage_type} onChange={e => setField('brokerage_type', e.target.value)}>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FLAT">Flat Fee</option>
              </Sel>
            </Field>
            <Field label="Commission Rate">
              <Input type="number" value={form.commission_rate} onChange={e => setField('commission_rate', e.target.value)} placeholder={form.brokerage_type === 'PERCENTAGE' ? '%' : 'Amount'} />
            </Field>
            <Field label="Specialization" className="col-span-2">
              <Input value={form.specialization} onChange={e => setField('specialization', e.target.value)} placeholder="e.g. Cold Chain, Oversized Cargo" />
            </Field>
            <Field label="Regions Covered" className="col-span-2">
              <Input value={form.regions_covered} onChange={e => setField('regions_covered', e.target.value)} placeholder="e.g. North India, Maharashtra (comma separated)" />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium text-[#172B4D] col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <input type="checkbox" checked={form.is_internal_broker} onChange={e => setField('is_internal_broker', e.target.checked)} className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-[#0052CC]" />
              <span>Is Internal Broker</span>
            </label>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <DeleteConfirm
          label="Broker Profile"
          onClose={() => setDelete(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDelete(null) })}
          deleting={deleteMutation.isPending}
        />
      )}

      {modal?.type === 'view' && (
        <Modal
          title={`View — ${modal.broker?.customer?.legal_name || modal.broker?.broker_code}`}
          onClose={closeModal}
          maxWidth="max-w-4xl"
        >
          <ViewBrokerContent
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

const TABS = [
  { id: 'OVERVIEW', label: 'Overview', icon: LucideInfo },
  { id: 'ADDRESSES', label: 'Addresses', icon: MapPin },
  { id: 'CONTACTS', label: 'Contacts', icon: Phone },
  { id: 'DOCUMENTS', label: 'Documents', icon: FileText },
  { id: 'CONTRACTS', label: 'Contracts', icon: ClipboardList },
  { id: 'NOTES', label: 'Notes', icon: LucideInfo },
  { id: 'CREDIT', label: 'Credit', icon: History },
];

const ViewBrokerContent = ({ broker: b, onEdit }) => {
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const customerId = b?.customer?.id;

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="flex items-center gap-1 border-b border-gray-100 mb-4 overflow-x-auto no-scrollbar pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold whitespace-nowrap transition-all rounded-t-xl
              ${activeTab === tab.id
                ? 'text-[#0052CC] bg-[#EBF3FF] border-b-2 border-[#0052CC]'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {activeTab === 'OVERVIEW' && <BrokerOverview broker={b} onEdit={onEdit} />}
        {activeTab === 'ADDRESSES' && <CustomerAddresses customerId={customerId} />}
        {activeTab === 'CONTACTS' && <CustomerContacts customerId={customerId} />}
        {activeTab === 'DOCUMENTS' && <CustomerDocuments customerId={customerId} />}
        {activeTab === 'CONTRACTS' && <CustomerContracts customerId={customerId} />}
        {activeTab === 'NOTES' && <CustomerNotes customerId={customerId} />}
        {activeTab === 'CREDIT' && <CustomerCreditHistoryView customerId={customerId} currentLimit={b?.customer?.credit_limit} />}
      </div>
    </div>
  );
};

const BrokerOverview = ({ broker: b, onEdit }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
    <div className="grid grid-cols-2 gap-4">
      <InfoCard label="Legal Name" value={b.customer?.legal_name} accent />
      <InfoCard label="Broker Code" value={b.broker_code} />
      <InfoCard label="Internal Broker" value={b.is_internal_broker ? 'Yes' : 'No'} />
      <InfoCard label="Specialization" value={b.specialization || 'General'} />
    </div>

    <Section title="Commission Details" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Commission Rate" value={b.commission_rate ? `${b.commission_rate}${b.brokerage_type === 'PERCENTAGE' ? '%' : ' Flat'}` : 'N/A'} />
      <InfoCard label="Brokerage Type" value={b.brokerage_type} />
    </div>

    <Section title="Coverage" />
    <div className="grid grid-cols-1 gap-3">
      <InfoCard label="Regions Covered" value={b.regions_covered?.join(', ') || 'No specific regions'} />
    </div>

    <div className="pt-3 border-t border-gray-100 flex justify-end">
      <button onClick={onEdit}
        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm">
        <Pencil size={14} /> Edit Profile
      </button>
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
      <SectionHeader title="Broker Notes" count={notes?.length} icon={LucideInfo} />
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

export default BrokersDashboard;