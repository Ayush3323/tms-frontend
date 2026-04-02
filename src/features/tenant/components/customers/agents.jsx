import React, { useState, useEffect } from 'react';
import {
  ChevronDown, Loader2, AlertTriangle, Briefcase, Pencil, Anchor, RotateCcw,
  MapPin, Phone, FileText, ClipboardList, History, Building2, Info as LucideInfo,
  Search, Plus, RefreshCw, Users, CheckCircle, PauseCircle, AlertCircle, Eye, Download
} from 'lucide-react';
import {
  Modal, Field, Input, Sel, Section, DeleteConfirm, Badge,
  InfoCard, SectionHeader, EmptyState
} from '../Vehicles/Common/VehicleCommon';
import {
  useCustomerAddresses, useCustomerContacts, useCustomerDocuments,
  useCustomerContracts, useCustomerNotes, useCustomerCreditHistory,
  useAgents, useCustomers, useCreateAgent, useUpdateAgent, useDeleteAgent
} from '../../queries/customers/customersQuery';
import { TableShimmer, ErrorState } from '../Vehicles/Common/StateFeedback';
import CustomerListFilterBar from './CustomerListFilterBar';

const EMPTY_FORM = {
  customer_id: '',
  agent_code: '',
  territory: '',
  commission_rate: '',
  commission_type: 'PERCENTAGE',
  contact_person: '',
  status: 'ACTIVE',
};

const STATUS_STYLES = {
  'ACTIVE': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'INACTIVE': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'SUSPENDED': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const getStatusStyle = (status) => STATUS_STYLES[status] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };

const AgentsDashboard = () => {
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

  const { data, isLoading, isError, error, refetch } = useAgents({
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

  const eligibleCustomers = allCustomers.filter(c =>
    c.customer_type === 'AGENT' ||
    c.customer_type === 'BOTH' ||
    c.customer_type === 'OTHER' ||
    c.id === form.customer_id
  );

  const createMutation = useCreateAgent();
  const updateMutation = useUpdateAgent();
  const deleteMutation = useDeleteAgent();

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setModal({ type: 'create' });
  };

  const openEdit = (a) => {
    setForm({
      customer_id: a.customer?.id ?? '',
      agent_code: a.agent_code ?? '',
      territory: a.territory ?? '',
      commission_rate: a.commission_rate ?? '',
      commission_type: a.commission_type ?? 'PERCENTAGE',
      contact_person: a.contact_person ?? '',
      status: a.customer?.status ?? 'ACTIVE',
    });
    setErrors({});
    setModal({ type: 'edit', id: a.id, agent: a });
  };

  const openView = (a) => {
    setModal({ type: 'view', id: a.id, agent: a });
  };
  const closeModal = () => { setModal(null); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.customer_id) e.customer_id = 'Customer is required';
    if (!form.agent_code?.trim()) e.agent_code = 'Agent code is required';
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
    };

    // Clean up to avoid collisions
    delete payload.customer;
    delete payload.customer_code;
    if (modal.type === 'create') delete payload.id;
    if (!payload.commission_rate) payload.commission_rate = null;

    if (modal.type === 'create') {
      createMutation.mutate(payload, { onSuccess: () => closeModal() });
    } else {
      updateMutation.mutate({ id: modal.id, data: payload }, { onSuccess: () => closeModal() });
    }
  };

  const agents = data?.results ?? data ?? [];
  const total = data?.count ?? agents.length;
  const active = agents.filter(a => a.customer?.status === 'ACTIVE' || a.customer?.status === 'Active').length;
  const inactive = agents.filter(a => a.customer?.status === 'INACTIVE' || a.customer?.status === 'Inactive').length;
  const suspended = agents.filter(a => a.customer?.status === 'SUSPENDED' || a.customer?.status === 'Suspended').length;
  const resetFilters = () => { setSearch(''); setDebouncedSearch(''); setStatus(''); setOrdering('customer__legal_name'); setCurrentPage(1); };

  const COLUMNS = [
    {
      header: 'Agency / Customer',
      render: a => (
        <div className="text-left">
          <button onClick={() => openView(a)}
            className="font-bold text-[#172B4D] text-[13px] hover:text-[#0052CC] transition-all hover:scale-105 active:scale-95 text-left block">
            {a.customer?.legal_name || '—'}
          </button>
          <div className="text-[11px] font-mono text-gray-400">{a.agent_code ?? ''}</div>
        </div>
      ),
    },
    {
      header: 'License & Type',
      render: a => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-700">{a.commission_type || 'PERCENTAGE'}</span>
          <span className="text-[10px] text-gray-400 font-medium uppercase">Contact: {a.contact_person || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Territory',
      render: a => (
        <span className="text-xs text-gray-600">{a.territory || 'Not Set'}</span>
      ),
    },
    {
      header: 'Status',
      render: a => {
        const status = a.customer?.status || 'ACTIVE';
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
      render: a => (
        <button onClick={() => openEdit(a)} className="p-2 text-gray-400 hover:text-[#0052CC] transition-all">
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
          <h2 className="text-2xl font-bold text-[#172B4D]">Agents</h2>
          <p className="text-gray-500 text-sm tracking-tight">Clearing, Forwarding, and Port Agents</p>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="relative group/search">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
            <input
              type="text"
              placeholder="Search agency, code..."
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
              title="Export Agents"
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
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> New Agent
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

        {isLoading ? <TableShimmer rows={8} /> :
          isError ? <ErrorState message="Failed to load agents" onRetry={refetch} /> : (
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
                  {agents.map(a => (
                    <tr key={a.id} className="hover:bg-blue-50/30 transition-colors">
                      {COLUMNS.map(col => (
                        <td key={col.header} className="px-4 py-3 whitespace-nowrap align-middle">{col.render(a)}</td>
                      ))}
                    </tr>
                  ))}
                  {agents.length === 0 && (
                    <tr>
                      <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-gray-400">
                        <Anchor size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No agents found</p>
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
              Showing <span className="font-bold text-[#172B4D]">{agents.length}</span> of <span className="font-bold text-[#172B4D]">{total}</span> agents
            </div>
          </div>
        )}
      </div>

      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <Modal
          title={modal.type === 'create' ? 'Add New Agent' : 'Edit Agent Profile'}
          onClose={closeModal}
          onSubmit={handleSubmit}
          submitting={createMutation.isPending || updateMutation.isPending}
          onDelete={modal.type === 'edit' ? () => { closeModal(); setDelete(modal.agent); } : null}
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
            <Field label="Agent Code" required error={errors.agent_code}>
              <Input value={form.agent_code} onChange={e => setField('agent_code', e.target.value)} placeholder="e.g. AG-001" />
            </Field>
            <Field label="Status">
              <Sel value={form.status} onChange={e => setField('status', e.target.value)} disabled={modal.type === 'view'}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BLACKLISTED">Blacklisted</option>
              </Sel>
            </Field>
            <Field label="Territory" className="col-span-2">
              <Input value={form.territory} onChange={e => setField('territory', e.target.value)} placeholder="e.g. Mumbai region" />
            </Field>
            <Field label="Commission Type">
              <Sel value={form.commission_type} onChange={e => setField('commission_type', e.target.value)}>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed</option>
              </Sel>
            </Field>
            <Field label="Commission Rate">
              <Input type="number" value={form.commission_rate} onChange={e => setField('commission_rate', e.target.value)} placeholder={form.commission_type === 'PERCENTAGE' ? '%' : 'Amount'} />
            </Field>
            <Field label="Contact Person" className="col-span-2">
              <Input value={form.contact_person} onChange={e => setField('contact_person', e.target.value)} placeholder="e.g. Rahul Sharma" />
            </Field>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <DeleteConfirm
          label="Agent Profile"
          onClose={() => setDelete(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDelete(null) })}
          deleting={deleteMutation.isPending}
        />
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

const ViewAgentContent = ({ agent: a, onEdit }) => {
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const customerId = a?.customer?.id;

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
        {activeTab === 'OVERVIEW' && <AgentOverview agent={a} onEdit={onEdit} />}
        {activeTab === 'ADDRESSES' && <CustomerAddresses customerId={customerId} />}
        {activeTab === 'CONTACTS' && <CustomerContacts customerId={customerId} />}
        {activeTab === 'DOCUMENTS' && <CustomerDocuments customerId={customerId} />}
        {activeTab === 'CONTRACTS' && <CustomerContracts customerId={customerId} />}
        {activeTab === 'NOTES' && <CustomerNotes customerId={customerId} />}
        {activeTab === 'CREDIT' && <CustomerCreditHistoryView customerId={customerId} currentLimit={a?.customer?.credit_limit} />}
      </div>
    </div>
  );
};

const AgentOverview = ({ agent: a, onEdit }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
    <div className="grid grid-cols-2 gap-4">
      <InfoCard label="Legal Name" value={a.customer?.legal_name} accent />
      <InfoCard label="Agent Code" value={a.agent_code} />
      <InfoCard label="Contact Person" value={a.contact_person || 'Not Set'} />
    </div>

    <Section title="Commission & Coverage" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Commission Type" value={a.commission_type || 'PERCENTAGE'} />
      <InfoCard label="Commission Rate" value={a.commission_rate ? `${a.commission_rate}${a.commission_type === 'PERCENTAGE' ? '%' : ''}` : 'Not Set'} />
      <InfoCard label="Territory" value={a.territory || 'Not Set'} />
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
      <SectionHeader title="Agent Notes" count={notes?.length} icon={LucideInfo} />
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

export default AgentsDashboard;
