import React, { useState } from 'react';
import {
  Search, Plus, Download, RefreshCw, Eye,
  Users, CheckCircle, AlertCircle, PauseCircle,
  ChevronDown, Loader2, AlertTriangle, Building2, Pencil, X, Save, Trash2
} from 'lucide-react';
import { useCustomers, useCustomer, useCreateCustomer, useUpdateCustomer } from '../../queries/customers/customersQuery';
import { StatCard, Modal, Field, Input, Sel, Section, EmptyState, Badge } from '../Vehicles/Common/VehicleCommon';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState(null);   // { type: 'view'|'create'|'edit', id?: string }
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // ── API Hooks ───────────────────────────────────────────────────────
  const { data, isLoading, isError, error, refetch } = useCustomers({
    page: currentPage,
    ...(statusFilter && { status: statusFilter }),
    ...(search && { search }),
  });
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  const customers = data?.results ?? data ?? [];
  const total = data?.count ?? customers.length;
  const active = customers.filter(c => c.status === 'ACTIVE').length;
  const inactive = customers.filter(c => c.status === 'INACTIVE').length;
  const suspended = customers.filter(c => c.status === 'SUSPENDED').length;

  const resetFilters = () => { setSearch(''); setStatus(''); setCurrentPage(1); };

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
    if (!form.customer_code.trim()) e.customer_code = 'Customer code is required';
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
      if (!payload[key]?.trim()) payload[key] = null;
    });

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

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            All registered customers — click <span className="text-[#0052CC] font-semibold">View</span> for full details
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
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all shadow-sm">
            <Plus size={15} /> Add Customer
          </button>
        </div>
      </div>

      {/* ── Table Card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden flex-1 flex flex-col min-h-0 mt-2">
        {/* Compact Stats Row */}
        <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          {isLoading ? (
            <div className="flex gap-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
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
        </div>


        {/* Filters */}
        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white flex-wrap gap-4">
          <div className="flex gap-3 items-center flex-wrap flex-1">
            <div className="relative min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search customer name, code, tax ID..."
                value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => { setStatus(e.target.value); setCurrentPage(1); }}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer">
                <option value="">All Status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="BLACKLISTED">BLACKLISTED</option>
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all">
              <RefreshCw size={13} /> Reset
            </button>
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
      </div>

      {/* Footer */}
      {!isLoading && !isError && (
        <div className="flex items-center justify-between mt-2 px-2">
          <div className="text-sm text-gray-500">
            Showing <span className="font-bold text-[#172B4D]">{customers.length}</span> of <span className="font-bold text-[#172B4D]">{total}</span> customers
          </div>
        </div>
      )}

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
          maxWidth="max-w-2xl"
        >
          <div className="grid grid-cols-2 gap-4">
            <Section title="Basic Information" className="col-span-2" />

            <Field label="Customer Code" required error={errors.customer_code}>
              <Input value={form.customer_code} onChange={e => setField('customer_code', e.target.value)}
                placeholder="e.g. CUST-RIL-001" disabled={modal.type === 'edit'} />
            </Field>
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
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ── VIEW CONTENT SUB-COMPONENT ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
const DetailRow = ({ label, value, mono }) => (
  <div>
    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
    <div className={`text-sm font-bold ${mono ? 'font-mono text-[#0052CC]' : 'text-[#172B4D]'}`}>
      {value || <span className="text-gray-300 font-normal">—</span>}
    </div>
  </div>
);

const ViewCustomerContent = ({ customer: c, onEdit }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 gap-4">
      <DetailRow label="Legal Name" value={c.legal_name} />
      <DetailRow label="Customer Code" value={c.customer_code} mono />
      <DetailRow label="Trading Name" value={c.trading_name} />
      <DetailRow label="Type" value={c.customer_type} />
    </div>

    <Section title="Tax & Registration" />
    <div className="grid grid-cols-2 gap-4">
      <DetailRow label="Tax ID (GSTIN)" value={c.tax_id} mono />
      <DetailRow label="PAN Number" value={c.pan_number} mono />
      <DetailRow label="Registration No." value={c.registration_number} mono />
      <DetailRow label="Incorporation Date" value={c.incorporation_date} />
    </div>

    <Section title="Financial Details" />
    <div className="grid grid-cols-2 gap-4">
      <DetailRow label="Credit Limit" value={c.credit_limit ? `₹${Number(c.credit_limit).toLocaleString('en-IN')}` : null} />
      <DetailRow label="Customer Tier" value={c.customer_tier} />
      <DetailRow label="Payment Terms" value={c.payment_terms} />
      <DetailRow label="Credit Rating" value={c.credit_rating} />
      <DetailRow label="Credit Score" value={c.credit_score} />
      <DetailRow label="Status" value={c.status} />
    </div>

    <Section title="Assignments & Meta" />
    <div className="grid grid-cols-2 gap-4">
      <DetailRow label="Sales Person ID" value={c.sales_person_id} mono />
      <DetailRow label="Account Mgr ID" value={c.account_manager_id} mono />
      <DetailRow label="Parent Customer ID" value={c.parent_customer_id} mono />
      <DetailRow label="User ID" value={c.user_id} mono />
      <DetailRow label="Created At" value={c.created_at ? new Date(c.created_at).toLocaleString() : null} />
      <DetailRow label="Updated At" value={c.updated_at ? new Date(c.updated_at).toLocaleString() : null} />
    </div>

    <Section title="Other" />
    <div className="grid grid-cols-2 gap-4">
      <DetailRow label="Business Type" value={c.business_type} />
      <DetailRow label="Industry Sector" value={c.industry_sector} />
      <DetailRow label="Website" value={c.website} />
      <DetailRow label="Notes" value={c.notes} className="col-span-2" />
    </div>

    <div className="pt-3 border-t border-gray-100 flex justify-end">
      <button onClick={onEdit}
        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm">
        <Pencil size={14} /> Edit Customer
      </button>
    </div>
  </div>
);

export default CustomersDashboard;