import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, RotateCcw, Loader2, AlertCircle, X,
  ChevronDown, Search, Pencil, Trash2,
  Calendar, Shield, ShieldCheck, ShieldAlert, ShieldOff, IndianRupee,
  Download, Upload, Eye
} from 'lucide-react';
import {
  useVehicleInsurances,
  useCreateVehicleInsurance,
  useUpdateVehicleInsurance,
  useDeleteVehicleInsurance,
} from '../../../queries/vehicles/vehicleInfoQuery';
import {
  Badge, InfoCard, SectionHeader, EmptyState, Modal, DeleteConfirm,
  Label, Input, Sel, Section, Field, StatCard, Textarea, VehicleSelect,
  fmtDate, fmtINR, ItemActions
} from '../Common/VehicleCommon';
import { TabContentShimmer, ErrorState } from '../Common/StateFeedback';

// ── Constants ─────────────────────────────────────────────────────────
const POLICY_TYPES = ['COMPREHENSIVE', 'THIRD_PARTY', 'FIRE_THEFT'];
const STATUS_OPTIONS = ['ACTIVE', 'EXPIRED', 'CANCELLED'];

const TYPE_COLORS = {
  COMPREHENSIVE: 'bg-blue-50 text-blue-600 border-blue-200',
  THIRD_PARTY: 'bg-purple-50 text-purple-600 border-purple-200',
  FIRE_THEFT: 'bg-orange-50 text-orange-600 border-orange-200',
};

const STATUS_COLORS = {
  ACTIVE: 'bg-green-50 text-green-600 border-green-200',
  INACTIVE: 'bg-gray-50 text-gray-500 border-gray-200',
  EXPIRED: 'bg-red-50 text-red-600 border-red-200',
  CANCELLED: 'bg-yellow-50 text-yellow-600 border-yellow-200',
};

const EMPTY_FORM = {
  vehicle: '',
  policy_number: '',
  policy_type: '',
  insurance_company: '',
  premium_amount: '',
  coverage_amount: '',
  issue_date: '',
  expiry_date: '',
  status: 'ACTIVE',
  notes: '',
};

// ── Expiry status helper ──────────────────────────────────────────────
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Expired', color: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' };
  if (diffDays <= 30) return { label: `${diffDays}d`, color: 'bg-orange-50 text-orange-600 border-orange-200', dot: 'bg-orange-500' };
  return { label: 'Active', color: 'bg-green-50 text-green-600 border-green-200', dot: 'bg-green-500' };
};

// ── Field components ──────────────────────────────────────────────────


// ─── Detail View ─────────────────────────────────────────────────────────────
// ─── Detail View ─────────────────────────────────────────────────────────────
const InsuranceDetailView = ({ data, onClose }) => {
  const expiryStatus = getExpiryStatus(data.expiry_date);
  const statusColor = STATUS_COLORS[data.status] ?? expiryStatus?.color ?? 'bg-green-50 text-green-600 border-green-200';
  const statusDot = data.status === 'ACTIVE' ? 'bg-green-500'
    : data.status === 'EXPIRED' ? 'bg-red-500'
      : data.status === 'INACTIVE' ? 'bg-gray-400'
        : data.status === 'CANCELLED' ? 'bg-yellow-500'
          : (expiryStatus?.dot ?? 'bg-green-500');
  const statusLabel = data.status_display ?? data.status ?? expiryStatus?.label ?? '—';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Policy Type">
          <Badge className={TYPE_COLORS[data.policy_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}>
            {data.policy_type_display ?? data.policy_type?.replace(/_/g, ' ') ?? '—'}
          </Badge>
        </Field>
        <Field label="Status">
          <Badge className={statusColor}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
            {statusLabel}
          </Badge>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Vehicle">
          <p className="text-sm font-bold text-[#172B4D] font-mono uppercase">
            {typeof data.vehicle === 'object'
              ? (data.vehicle?.registration_number ?? '—')
              : (data.vehicle_registration_number ?? data.vehicle_registration ?? data.vehicle_display ?? data.vehicle ?? '—')}
          </p>
        </Field>
        <Field label="Policy Number">
          <p className="text-sm font-black text-[#172B4D] font-mono">{data.policy_number || '—'}</p>
        </Field>
      </div>

      <Field label="Insurance Company">
        <p className="text-sm font-bold text-gray-700">{data.insurance_company || '—'}</p>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Premium Amount">
          {fmtINR(data.premium_amount)}
        </Field>
        <Field label="Coverage Amount">
          {fmtINR(data.coverage_amount)}
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Issue Date">
          <p className="text-sm text-gray-600 font-semibold">{fmtDate(data.issue_date)}</p>
        </Field>
        <Field label="Expiry Date">
          <p className="text-sm text-gray-600 font-semibold">{fmtDate(data.expiry_date)}</p>
        </Field>
      </div>

      <Field label="Notes">
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 min-h-[80px]">
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.notes || 'No extra notes provided.'}</p>
        </div>
      </Field>

      <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-[#0052CC] bg-blue-50 rounded-xl hover:bg-blue-100 transition-all">
          Close
        </button>
      </div>
    </div>
  );
};

// ── Add / Edit Modal ──────────────────────────────────────────────────
const InsuranceModal = ({ initial, onClose, isView, vehicleId, onDeleteRequest }) => {
  const isEdit = !!initial?.id && !isView;

  const resolveVehicleId = () => {
    if (vehicleId) return vehicleId;
    if (!initial?.vehicle) return '';
    if (typeof initial.vehicle === 'object') return initial.vehicle?.id ?? '';
    return initial.vehicle;
  };

  const [form, setForm] = useState(
    initial ? {
      vehicle: resolveVehicleId(),
      policy_number: initial.policy_number ?? '',
      policy_type: initial.policy_type ?? '',
      insurance_company: initial.insurance_company ?? '',
      premium_amount: initial.premium_amount ?? '',
      coverage_amount: initial.coverage_amount ?? '',
      issue_date: initial.issue_date ?? '',
      expiry_date: initial.expiry_date ?? '',
      status: initial.status ?? 'ACTIVE',
      notes: initial.notes ?? '',
    } : { ...EMPTY_FORM, vehicle: vehicleId ?? '' }
  );

  const create = useCreateVehicleInsurance();
  const update = useUpdateVehicleInsurance();
  const isPending = create.isPending || update.isPending;
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const [errors, setErrors] = useState({});

  const { data: checkData } = useVehicleInsurances(
    { vehicle: form.vehicle },
    { enabled: !!form.vehicle && !isEdit }
  );
  const hasExisting = (checkData?.results?.length ?? checkData?.length ?? 0) > 0;

  const handleSubmit = () => {
    const errs = {};
    if (!form.vehicle) errs.vehicle = 'Vehicle is required';
    if (form.issue_date && form.expiry_date && new Date(form.expiry_date) <= new Date(form.issue_date)) {
      errs.expiry_date = 'Must be after issue date';
    }
    if (!isEdit && hasExisting) {
      errs.vehicle = 'This vehicle already has an insurance policy. Please edit the existing one.';
    }
    if (Object.keys(errs).length > 0) return setErrors(errs);
    setErrors({});

    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    if (isEdit) update.mutate({ id: initial.id, data: clean }, { onSuccess: onClose });
    else create.mutate(clean, { onSuccess: onClose });
  };

  return (
    <Modal
      title={isView ? 'Policy Details' : isEdit ? 'Edit Policy' : 'Add Policy'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={isPending}
      // canSubmit={canSubmit} // Removed as per instructions
      isView={isView}
      onDelete={isEdit ? onDeleteRequest : null}
    >
      <div className="space-y-4">
        {isView ? (
          <InsuranceDetailView data={initial} onClose={onClose} />
        ) : (
          <>
            {!vehicleId && (
              <Field label="Vehicle" required={!isEdit} error={errors.vehicle}>
                <VehicleSelect value={form.vehicle} onChange={(id) => {
                  setForm(p => ({ ...p, vehicle: id }));
                  setErrors(p => ({ ...p, vehicle: null }));
                }} />
                {isEdit && !form.vehicle && (
                  <p className="text-[11px] text-orange-500 mt-1">⚠ Vehicle info not available in API — will be preserved on update</p>
                )}
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Policy Number</Label>
                <Input placeholder="e.g. POL-2024-001234" value={form.policy_number} onChange={set('policy_number')} />
              </div>
              <div>
                <Label required>Policy Type</Label>
                <Sel value={form.policy_type} onChange={set('policy_type')}>
                  <option value="">Select type</option>
                  {POLICY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </Sel>
              </div>
            </div>

            <div>
              <Label required>Insurance Company</Label>
              <Input placeholder="e.g. ICICI Lombard" value={form.insurance_company} onChange={set('insurance_company')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Premium Amount (₹)</Label>
                <Input type="number" placeholder="e.g. 50000" value={form.premium_amount} onChange={set('premium_amount')} />
              </div>
              <div>
                <Label>Coverage Amount (₹)</Label>
                <Input type="number" placeholder="e.g. 5000000" value={form.coverage_amount} onChange={set('coverage_amount')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Input type="date" value={form.issue_date} onChange={set('issue_date')} />
              </div>
              <Field label="Expiry Date" error={errors.expiry_date}>
                <Input type="date" value={form.expiry_date} onChange={set('expiry_date')} />
              </Field>
            </div>

            <div>
              <Label>Status</Label>
              <Sel value={form.status} onChange={set('status')}>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                ))}
              </Sel>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes ?? ''} onChange={set('notes')} placeholder="Any additional notes..." />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────────────────

// ── Main Page ─────────────────────────────────────────────────────────
const VehicleInsurance = ({ vehicleId, isTab }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setType] = useState('');
  const [modal, setModal] = useState(null);
  const [viewTarget, setView] = useState(null);
  const [deleteTarget, setDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const del = useDeleteVehicleInsurance();

  const { data, isLoading, isError, error, refetch } = useVehicleInsurances({
    ...(vehicleId && { vehicle: vehicleId }),
    ...(search && { search }),
    ...(typeFilter && { policy_type: typeFilter }),
    page: currentPage,
  });

  const docs = data?.results ?? data ?? [];
  const total = data?.count ?? docs.length;
  // Summary logic
  const active = docs.filter(d => d.status === 'ACTIVE').length;
  const expiring = docs.filter(d => {
    if (!d.expiry_date) return false;
    const diff = new Date(d.expiry_date) - new Date();
    return diff > 0 && diff <= (30 * 24 * 60 * 60 * 1000);
  }).length;
  const expired = docs.filter(d => d.status === 'EXPIRED' || (d.expiry_date && new Date(d.expiry_date) < new Date())).length;
  const hasInsurance = docs.length > 0;

  if (isLoading) return <TabContentShimmer />;
  if (isError) return <ErrorState message="Failed to load insurance" error={error?.message} onRetry={() => refetch()} />;

  const content = (
    <div className={`flex flex-col h-full ${isTab ? '' : 'p-6 bg-[#f8fafc] flex-1 min-h-0 overflow-hidden relative font-sans text-slate-900'}`}>

      {modal && (
        <InsuranceModal vehicleId={vehicleId} initial={modal === 'add' ? null : modal} onClose={() => setModal(null)} onDeleteRequest={() => { setModal(null); setDelete(modal); }} />
      )}
      {viewTarget && (
        <InsuranceModal vehicleId={vehicleId} initial={viewTarget} isView onClose={() => setView(null)} />
      )}
      {deleteTarget && (
        <DeleteConfirm
          title="Delete Insurance Policy?"
          message={<>Policy <span className="font-semibold text-gray-700">{deleteTarget.policy_number}</span> will be permanently deleted.</>}
          onConfirm={() => del.mutate(deleteTarget.id, { onSuccess: () => setDelete(null) })}
          onClose={() => setDelete(null)}
          deleting={del.isPending}
        />
      )}

      {!isTab && (
        <div className="flex items-center mb-8">
          <div className="w-1/4">
            <h2 className="text-2xl font-bold text-[#172B4D]">Insurance</h2>
            <p className="text-gray-500 text-sm tracking-tight">Comprehensive, Third Party, Fire & Theft</p>
          </div>

          <div className="flex-1 max-w-2xl px-8">
            <div className="relative group/search">
              <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
              <input
                type="text"
                placeholder="Search policy or vehicle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm hover:shadow-md hover:border-gray-300"
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

          <div className="flex items-center justify-end gap-2 ml-auto">
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 group"
              >
                <RotateCcw size={14} className={isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                <span>Refresh</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95">
                <Download size={14} />
                <span>Export</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95">
                <Upload size={14} />
                <span>Import</span>
              </button>
            </div>
            <div className="w-px h-8 bg-gray-200 mx-1" />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
        {/* Compact Stats Row */}
        <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Policies:</span>
            <span className="text-[18px] font-black text-[#172B4D]">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Active:</span>
            <span className="text-[18px] font-black text-emerald-600">{active}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Expiring Soon:</span>
            <span className="text-[18px] font-black text-orange-500">{expiring}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Expired:</span>
            <span className="text-[18px] font-black text-red-600">{expired}</span>
          </div>
          <div className="ml-auto w-1/4 flex justify-end">
            <button
              onClick={() => setModal('add')}
              className="mr-0 bg-[#0052CC] text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-lg hover:shadow-blue-200 active:scale-95 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Policy</span>
            </button>
          </div>
        </div>


        {/* Filters & Pagination Row */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-50 h-[60px]">
          <div className="flex items-center gap-6">
            {isTab && (
              <div className="relative w-64 text-gray-400">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search policy..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-[#0052CC]/10 text-[#172B4D] font-medium"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={e => setType(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:border-gray-200 cursor-pointer shadow-sm"
              >
                <option value="">All Types</option>
                {POLICY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {typeFilter && (
              <button
                onClick={() => setType('')}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Clear Filters"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
            >
              Previous
            </button>

            <div className="flex items-center justify-center min-w-8 h-8 bg-[#0052CC] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
              {currentPage}
            </div>

            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!data?.next || isLoading}
              className="px-4 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
            >
              Next
            </button>
          </div>
        </div>


        {!isLoading && !isError && (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-sm relative">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  {!vehicleId && <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Vehicle</th>}
                  {['Policy #', 'Type', 'Expiry Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docs.map(doc => {
                  const expiryStatus = getExpiryStatus(doc.expiry_date);
                  // Use API status first, fallback to expiry calculation
                  const statusColor = STATUS_COLORS[doc.status] ?? expiryStatus?.color ?? 'bg-green-50 text-green-600 border-green-200';
                  const statusDot = doc.status === 'ACTIVE' ? 'bg-green-500'
                    : doc.status === 'EXPIRED' ? 'bg-red-500'
                      : doc.status === 'INACTIVE' ? 'bg-gray-400'
                        : doc.status === 'CANCELLED' ? 'bg-yellow-500'
                          : (expiryStatus?.dot ?? 'bg-green-500');
                  const statusLabel = doc.status_display ?? doc.status ?? expiryStatus?.label ?? '—';

                  return (
                    <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors">

                      {/* Vehicle */}
                      {!vehicleId && (
                        <td className="px-4 py-3 whitespace-nowrap text-left">
                          <button onClick={() => setView(doc)}
                            className="font-bold text-[#172B4D] font-mono text-[13px] hover:text-[#0052CC] transition-all text-left uppercase hover:underline decoration-blue-400/30 underline-offset-4">
                            {typeof doc.vehicle === 'object'
                              ? (doc.vehicle?.registration_number ?? '—')
                              : (doc.vehicle_registration_number ?? doc.vehicle_registration ?? doc.vehicle_display ?? doc.vehicle ?? '—')}
                          </button>
                        </td>
                      )}

                      {/* Policy Number */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#172B4D] text-[13px]">{doc.policy_number ?? '—'}</span>
                      </td>

                      {/* Policy Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={`${TYPE_COLORS[doc.policy_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {doc.policy_type_display ?? doc.policy_type?.replace(/_/g, ' ') ?? '—'}
                        </Badge>
                      </td>

                      {/* Expiry Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-gray-500 text-[12px]">
                          <Calendar size={12} className="text-gray-300" />
                          {fmtDate(doc.expiry_date)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={`${statusColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                          {statusLabel}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 text-right">
                          <button onClick={() => setModal(doc)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all">
                            <Pencil size={12} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {docs.length === 0 && (
                  <tr>
                    <td colSpan={!vehicleId ? 10 : 9} className="px-4 py-16 text-center text-gray-400">
                      <Shield size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No insurance records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Showing <span className="font-bold text-gray-600">{docs.length}</span>
              {data?.count && data.count !== docs.length &&
                <> of <span className="font-bold text-gray-600">{data.count}</span></>
              } policies
            </span>
            {!isTab && <span className="text-[11px]">Fleet Management System</span>}
          </div>
        )}
      </div>
    </div>
  );

  return content;
};

export default VehicleInsurance;
