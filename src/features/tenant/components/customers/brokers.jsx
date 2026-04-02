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
import CustomerListFilterBar from './CustomerListFilterBar';

const EMPTY_FORM = {
  customer_id: '',
  legal_name: '',
  broker_code: '',
  commission_rate: '',
  commission_type: 'PERCENTAGE',
  payment_terms: '',
  license_number: '',
  license_expiry: '',
  status: 'ACTIVE',
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
      legal_name: b.customer?.legal_name ?? '',
      broker_code: b.broker_code ?? '',
      commission_rate: b.commission_rate ?? '',
      commission_type: b.commission_type ?? 'PERCENTAGE',
      payment_terms: b.payment_terms ?? '',
      license_number: b.license_number ?? '',
      license_expiry: b.license_expiry ?? '',
      status: b.customer?.status ?? 'ACTIVE',
    });
    setErrors({});
    setModal({ type: 'edit', id: b.id, broker: b });
  };

  const openView = (b) => {
    setModal({ type: 'view', id: b.id, broker: b });
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
    if (!form.legal_name?.trim()) e.customer_id = 'Legal Name is required';
    if (!form.broker_code?.trim()) {
      const initials = (form.legal_name || 'BRK').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
      form.broker_code = `BRK-${initials}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const setField = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  const handleSubmit = () => {
    if (!validate()) return;

    // Try to match existing customer by legal name
    const selectedCustomer = eligibleCustomers.find(
      c => c.legal_name?.toLowerCase() === form.legal_name?.toLowerCase()
    ) || {};

    const payload = {
      ...selectedCustomer,
      ...form,
    };

    delete payload.customer;
    delete payload.customer_code;
    if (modal.type === 'create') delete payload.id;

    if (!payload.commission_rate) payload.commission_rate = null;
    if (!payload.license_expiry) payload.license_expiry = null;

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
        const status = b.customer?.status || 'ACTIVE';
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
                disabled={modal.type === 'edit'}
                placeholder="Enter customer legal name..."
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

    <div className="pt-3 border-t border-gray-100">
      <p className="text-[10px] text-gray-400 font-mono italic">Use the Edit button on the table row to modify this profile.</p>
    </div>
  </div>
);







export default BrokersDashboard;