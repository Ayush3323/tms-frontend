import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Download, RefreshCw, Eye,
  Users, CheckCircle, AlertCircle, PauseCircle,
  ChevronDown, Loader2, AlertTriangle, Building2, Pencil, X, Save, Trash2, RotateCcw,
  MapPin, Phone, FileText, ClipboardList, Wallet, History, Info as LucideInfo
} from 'lucide-react';
import { 
  useCustomers, useCustomer, useCreateCustomer, useUpdateCustomer, useDeleteCustomer,
  useCustomerAddresses, useCustomerContacts, useCustomerDocuments,
  useCustomerContracts, useCustomerCreditHistory, useCustomerNotes
} from '../../queries/customers/customersQuery';
import { StatCard, Modal, Field, Input, Sel, Section, EmptyState, Badge, SectionHeader, InfoCard } from '../Vehicles/Common/VehicleCommon';
import { TableShimmer, ErrorState } from '../Vehicles/Common/StateFeedback';

// ── Status Styles ────────────────────────────────────────────────────
const STATUS_STYLES = {
  ACTIVE: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  INACTIVE: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  SUSPENDED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  BLACKLISTED: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
};
const getStatusStyle = (s) => STATUS_STYLES[s] || STATUS_STYLES.INACTIVE;

// ── Tier badge colors ────────────────────────────────────────────────
const TIER_STYLES = {
  PLATINUM: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  GOLD: 'bg-amber-50 text-amber-700 border-amber-200',
  SILVER: 'bg-gray-50 text-gray-600 border-gray-200',
  STANDARD: 'bg-gray-50 text-gray-500 border-gray-200',
};

// ── Empty form template ──────────────────────────────────────────────
const EMPTY_FORM = {
  customer_code: '', customer_type: 'OTHER', legal_name: '', trading_name: '',
  tax_id: '', pan_number: '', registration_number: '', incorporation_date: '',
  status: 'ACTIVE', customer_tier: 'STANDARD',
  credit_limit: '', payment_terms: '', credit_rating: '', credit_score: '',
  business_type: '', industry_sector: '', website: '', notes: '',
  sales_person_id: '', account_manager_id: '', parent_customer_id: '', user_id: ''
};

// ═══════════════════════════════════════════════════════════════════════
// ── MAIN COMPONENT ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
const CustomersDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState(null);   // { type: 'view'|'create'|'edit', id?: string }
  const [deleteTarget, setDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // ── API Hooks ───────────────────────────────────────────────────────
  const { data, isLoading, isError, error, refetch } = useCustomers({
    page: currentPage,
    ...(statusFilter && { status: statusFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
  });
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const customers = data?.results ?? data ?? [];
  const total = data?.count ?? customers.length;
  const active = customers.filter(c => c.status === 'ACTIVE').length;
  const inactive = customers.filter(c => c.status === 'INACTIVE').length;
  const suspended = customers.filter(c => c.status === 'SUSPENDED').length;

  const resetFilters = () => { setSearchTerm(''); setStatus(''); setCurrentPage(1); };

  // ── Modal Handlers ──────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setModal({ type: 'create' });
  };

  const openView = (c) => {
    setModal({ type: 'view', id: c.id, customer: c });
  };

  const openEdit = (c) => {
    setForm({
      customer_code: c.customer_code ?? '',
      customer_type: c.customer_type ?? 'OTHER',
      legal_name: c.legal_name ?? '',
      trading_name: c.trading_name ?? '',
      tax_id: c.tax_id ?? '',
      pan_number: c.pan_number ?? '',
      registration_number: c.registration_number ?? '',
      incorporation_date: c.incorporation_date ?? '',
      status: c.status ?? 'ACTIVE',
      customer_tier: c.customer_tier ?? 'STANDARD',
      credit_limit: c.credit_limit ?? '',
      payment_terms: c.payment_terms ?? '',
      credit_rating: c.credit_rating ?? '',
      credit_score: c.credit_score ?? '',
      business_type: c.business_type ?? '',
      industry_sector: c.industry_sector ?? '',
      website: c.website ?? '',
      notes: c.notes ?? '',
      sales_person_id: c.sales_person_id ?? '',
      account_manager_id: c.account_manager_id ?? '',
      parent_customer_id: c.parent_customer_id ?? '',
      user_id: c.user_id ?? ''
    });
    setErrors({});
    setModal({ type: 'edit', id: c.id, customer: c });
  };

  const closeModal = () => { setModal(null); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.legal_name.trim()) e.legal_name = 'Legal name is required';
    if (!form.customer_type) e.customer_type = 'Select a type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = { ...form };

    // Convert numbers/nulls correctly
    if (payload.credit_limit) payload.credit_limit = String(payload.credit_limit);
    if (payload.credit_score) payload.credit_score = Number(payload.credit_score);
    else delete payload.credit_score;

    // Nullify empty ID or Date strings
    ['user_id', 'sales_person_id', 'account_manager_id', 'parent_customer_id', 'incorporation_date'].forEach(key => {
      if (typeof payload[key] === 'string' && !payload[key].trim()) payload[key] = null;
    });

    // customer_code is system-generated
    delete payload.customer_code;

    if (modal.type === 'create') {
      createMutation.mutate(payload, { onSuccess: () => closeModal() });
    } else {
      updateMutation.mutate({ id: modal.id, data: payload }, { onSuccess: () => closeModal() });
    }
  };

  const setField = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  // ── Column Definitions ──────────────────────────────────────────────
  const COLUMNS = [
    {
      header: 'Legal Name',
      render: c => (
        <div className="text-left">
          <button onClick={() => openView(c)}
            className="font-bold text-[#172B4D] text-[13px] hover:text-[#0052CC] transition-all hover:scale-105 active:scale-95 text-left block">
            {c.legal_name ?? '—'}
          </button>
          <div className="text-[11px] font-mono text-gray-400">{c.customer_code ?? ''}</div>
        </div>
      ),
    },
    {
      header: 'Customer Type',
      render: c => (
        <Badge className="bg-blue-50 text-blue-600 border-blue-100">
          {c.customer_type ?? '—'}
        </Badge>
      ),
    },
    {
      header: 'Tier',
      render: c => {
        const t = c.customer_tier ?? 'STANDARD';
        return (
          <Badge className={TIER_STYLES[t] || TIER_STYLES.STANDARD}>
            {t}
          </Badge>
        );
      },
    },
    {
      header: 'Credit Limit',
      render: c => (
        <span className="font-bold text-gray-700 text-[13px]">
          {c.credit_limit ? `₹${Number(c.credit_limit).toLocaleString('en-IN')}` : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: c => {
        const st = getStatusStyle(c.status);
        return (
          <Badge className={`${st.bg} ${st.text} border-transparent`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {c.status}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      render: c => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(c)}
            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all">
            <Pencil size={12} /> Edit
          </button>
        </div>
      ),
    },
  ];

  // ═══════════════════════════════════════════════════════════════════
  // ── RENDER ─────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 flex flex-col gap-6 bg-[#F8FAFC] flex-1 min-h-0 overflow-hidden relative">

      {/* Page Title & Search Section */}
      <div className="flex items-center mb-8">
        {/* Title Block */}
        <div className="w-1/4">
          <h2 className="text-2xl font-bold text-[#172B4D]">Customers</h2>
          <p className="text-gray-500 text-sm tracking-tight">Manage customer profiles and operations</p>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="relative group/search">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
            <input
              type="text"
              placeholder="Search customer name, code..."
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
              title="Export Customers"
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
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> New Customer
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
                  <option value="BLACKLISTED">BLACKLISTED</option>
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

            <div className="justify-between h-10 w-px bg-gray-100 hidden sm:block" />

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

        {/* Loading State */}
        {isLoading && <TableShimmer rows={8} cols={6} />}

        {/* Error State */}
        {isError && (
          <ErrorState message="Failed to load customers" error={error?.response?.data?.detail || error?.message} onRetry={() => refetch()} />
        )}

        {/* Data Table */}
        {!isLoading && !isError && (
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
                {customers.map(c => (
                  <tr key={c.id || c.customer_code} className="hover:bg-blue-50/30 transition-colors">
                    {COLUMNS.map(col => (
                      <td key={col.header} className="px-4 py-3 whitespace-nowrap align-middle">{col.render(c)}</td>
                    ))}
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-8">
                      <EmptyState icon={Building2} text="No customers found" onAdd={openCreate} addLabel="Add Your First Customer" />
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
                Showing <span className="font-bold text-[#172B4D]">{customers.length}</span> of <span className="font-bold text-[#172B4D]">{total}</span> customers
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── VIEW MODAL ─────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {modal?.type === 'view' && (
        <Modal title="Customer Details" onClose={closeModal} isView maxWidth="max-w-xl">
          <ViewCustomerContent customer={modal.customer} onEdit={() => openEdit(modal.customer)} />
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── CREATE / EDIT MODAL ────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <Modal
          title={modal.type === 'create' ? 'Add New Customer' : `Edit — ${modal.customer?.legal_name}`}
          onClose={closeModal}
          onSubmit={handleSubmit}
          submitting={submitting}
          onDelete={modal.type === 'edit' ? () => { closeModal(); setDelete(modal.customer); } : null}
          maxWidth="max-w-2xl"
        >
          <div className="grid grid-cols-2 gap-4">
            <Section title="Basic Information" className="col-span-2" />

            <Field label="Legal Name" required error={errors.legal_name}>
              <Input value={form.legal_name} onChange={e => setField('legal_name', e.target.value)}
                placeholder="Full legal name" />
            </Field>
            <Field label="Trading Name">
              <Input value={form.trading_name} onChange={e => setField('trading_name', e.target.value)}
                placeholder="Short / trading name" />
            </Field>
            <Field label="Customer Type" required error={errors.customer_type}>
              <Sel value={form.customer_type} onChange={e => setField('customer_type', e.target.value)}>
                <option value="CONSIGNOR">CONSIGNOR</option>
                <option value="CONSIGNEE">CONSIGNEE</option>
                <option value="BOTH">BOTH</option>
                <option value="BROKER">BROKER</option>
                <option value="AGENT">AGENT</option>
                <option value="OTHER">OTHER</option>
              </Sel>
            </Field>

            <Section title="Tax & Registration" className="col-span-2" />

            <Field label="Tax ID (GSTIN)">
              <Input value={form.tax_id} onChange={e => setField('tax_id', e.target.value)}
                placeholder="e.g. 27AAACR5055K1ZV" />
            </Field>
            <Field label="PAN Number">
              <Input value={form.pan_number} onChange={e => setField('pan_number', e.target.value)}
                placeholder="e.g. AAACR5055K" />
            </Field>
            <Field label="Registration No.">
              <Input value={form.registration_number} onChange={e => setField('registration_number', e.target.value)}
                placeholder="e.g. U52100DL..." />
            </Field>
            <Field label="Incorporation Date">
              <Input type="date" value={form.incorporation_date} onChange={e => setField('incorporation_date', e.target.value)} />
            </Field>

            <Section title="Financial Details" className="col-span-2" />

            <Field label="Credit Limit (₹)">
              <Input type="number" value={form.credit_limit} onChange={e => setField('credit_limit', e.target.value)}
                placeholder="e.g. 1000000" />
            </Field>
            <Field label="Customer Tier">
              <Sel value={form.customer_tier} onChange={e => setField('customer_tier', e.target.value)}>
                <option value="PLATINUM">PLATINUM</option>
                <option value="GOLD">GOLD</option>
                <option value="SILVER">SILVER</option>
                <option value="STANDARD">STANDARD</option>
              </Sel>
            </Field>
            <Field label="Payment Terms">
              <Input value={form.payment_terms} onChange={e => setField('payment_terms', e.target.value)}
                placeholder="e.g. Net 30" />
            </Field>
            <Field label="Status">
              <Sel value={form.status} onChange={e => setField('status', e.target.value)}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="BLACKLISTED">BLACKLISTED</option>
              </Sel>
            </Field>

            <Section title="Additional Info" className="col-span-2" />

            <Field label="Business Type">
              <Input value={form.business_type} onChange={e => setField('business_type', e.target.value)}
                placeholder="e.g. Pvt Ltd" />
            </Field>
            <Field label="Industry Sector">
              <Input value={form.industry_sector} onChange={e => setField('industry_sector', e.target.value)}
                placeholder="e.g. Logistics" />
            </Field>
            <Field label="Website" className="col-span-2">
              <Input value={form.website} onChange={e => setField('website', e.target.value)}
                placeholder="https://example.com" />
            </Field>

            <Section title="Assignments & Meta" className="col-span-2" />

            <Field label="Sales Person ID">
              <Input value={form.sales_person_id} onChange={e => setField('sales_person_id', e.target.value)}
                placeholder="UUID" />
            </Field>
            <Field label="Account Mgr ID">
              <Input value={form.account_manager_id} onChange={e => setField('account_manager_id', e.target.value)}
                placeholder="UUID" />
            </Field>
            <Field label="Parent Customer ID">
              <Input value={form.parent_customer_id} onChange={e => setField('parent_customer_id', e.target.value)}
                placeholder="UUID" />
            </Field>
            <Field label="User ID">
              <Input value={form.user_id} onChange={e => setField('user_id', e.target.value)}
                placeholder="UUID" />
            </Field>

            <Field label="Notes" className="col-span-2">
              <Input value={form.notes} onChange={e => setField('notes', e.target.value)}
                placeholder="Additional notes..." />
            </Field>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <DeleteConfirm 
          label="Customer" 
          onClose={() => setDelete(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDelete(null) })}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ── VIEW CONTENT SUB-COMPONENT ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════
// ── VIEW CONTENT SUB-COMPONENT ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'OVERVIEW', label: 'Overview', icon: Building2 },
  { id: 'ADDRESSES', label: 'Addresses', icon: MapPin },
  { id: 'CONTACTS', label: 'Contacts', icon: Phone },
  { id: 'DOCUMENTS', label: 'Documents', icon: FileText },
  { id: 'CONTRACTS', label: 'Contracts', icon: ClipboardList },
  { id: 'NOTES', label: 'Notes', icon: LucideInfo },
  { id: 'CREDIT', label: 'Credit', icon: Wallet },
];

const ViewCustomerContent = ({ customer: c, onEdit }) => {
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Tabs Header */}
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

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto pr-1">
        {activeTab === 'OVERVIEW' && (
          <CustomerOverview customer={c} onEdit={onEdit} />
        )}
        {activeTab === 'ADDRESSES' && (
          <CustomerAddresses customerId={c.id} />
        )}
        {activeTab === 'CONTACTS' && (
          <CustomerContacts customerId={c.id} />
        )}
        {activeTab === 'DOCUMENTS' && (
          <CustomerDocuments customerId={c.id} />
        )}
        {activeTab === 'CONTRACTS' && (
          <CustomerContracts customerId={c.id} />
        )}
        {activeTab === 'NOTES' && (
          <CustomerNotes customerId={c.id} />
        )}
        {activeTab === 'CREDIT' && (
          <CustomerCreditHistoryView customerId={c.id} currentLimit={c.credit_limit} />
        )}
      </div>
    </div>
  );
};

// ── Tab: Overview ────────────────────────────────────────────────────
const CustomerOverview = ({ customer: c, onEdit }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
    <div className="grid grid-cols-2 gap-4">
      <InfoCard label="Legal Name" value={c.legal_name} accent />
      <InfoCard label="Customer Code" value={c.customer_code} />
      <InfoCard label="Trading Name" value={c.trading_name} />
      <InfoCard label="Type" value={c.customer_type} />
    </div>

    <Section title="Tax & Registration" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Tax ID (GSTIN)" value={c.tax_id} />
      <InfoCard label="PAN Number" value={c.pan_number} />
      <InfoCard label="Registration No." value={c.registration_number} />
      <InfoCard label="Incorporation Date" value={c.incorporation_date ? new Date(c.incorporation_date).toLocaleDateString() : null} />
    </div>

    <Section title="Financial Details" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Credit Limit" value={c.credit_limit ? `₹${Number(c.credit_limit).toLocaleString('en-IN')}` : null} />
      <InfoCard label="Customer Tier" value={c.customer_tier} />
      <InfoCard label="Payment Terms" value={c.payment_terms} />
      <InfoCard label="Status" value={c.status} />
    </div>

    <div className="pt-3 border-t border-gray-100 flex justify-end">
      <button onClick={onEdit}
        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm">
        <Pencil size={14} /> Edit Customer
      </button>
    </div>
  </div>
);

// ── Tab: Addresses ──────────────────────────────────────────────────
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
                    {addr.is_default && (
                      <Badge className="bg-green-50 text-green-700 border-green-200">Default</Badge>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#172B4D] leading-tight">{addr.address_line1}</p>
                  {addr.address_line2 && <p className="text-xs text-gray-500 mt-0.5">{addr.address_line2}</p>}
                  <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-tight">
                    {addr.city}, {addr.state} — {addr.postal_code}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Tab: Contacts ───────────────────────────────────────────────────
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
            <div key={contact.id} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-all flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#172B4D] font-black text-sm border border-gray-100">
                  {contact.first_name[0]}{contact.last_name[0]}
                </div>
                <div>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Tab: Documents ──────────────────────────────────────────────────
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
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#172B4D]">{doc.document_type}</p>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tight">{doc.document_number}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Badge className={doc.verified_status === 'VERIFIED' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}>
                      {doc.verified_status}
                    </Badge>
                    {doc.expiry_date && (
                      <span className="text-[10px] font-bold text-gray-400">Expires: {new Date(doc.expiry_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
              <a href={doc.file_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-[#0052CC] hover:text-white transition-all">
                <Eye size={14} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Tab: Contracts ──────────────────────────────────────────────────
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
                <Badge className={contract.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                  {contract.status}
                </Badge>
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

// ── Tab: Notes ──────────────────────────────────────────────────────
const CustomerNotes = ({ customerId }) => {
  const { data: notes, isLoading } = useCustomerNotes(customerId);
  if (isLoading) return <Loader2 size={24} className="animate-spin text-[#0052CC] mx-auto my-12" />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Customer Notes" count={notes?.length} icon={LucideInfo} />
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

// ── Tab: Credit History ─────────────────────────────────────────────
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

export default CustomersDashboard;