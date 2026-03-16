import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, RefreshCw, Loader2, AlertCircle, X,
  ChevronDown, Search, Pencil, Trash2,
  Calendar, Shield, ShieldCheck, ShieldAlert, ShieldOff, IndianRupee
} from 'lucide-react';
import {
  useVehicleInsurances,
  useCreateVehicleInsurance,
  useUpdateVehicleInsurance,
  useDeleteVehicleInsurance,
} from '../../queries/vehicles/vehicleInfoQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';

// ── Constants ─────────────────────────────────────────────────────────
const POLICY_TYPES = ['COMPREHENSIVE', 'THIRD_PARTY', 'FIRE_THEFT'];
const STATUS_OPTIONS = ['ACTIVE','EXPIRED', 'CANCELLED'];

const TYPE_COLORS = {
  COMPREHENSIVE: 'bg-blue-50 text-blue-600 border-blue-200',
  THIRD_PARTY:   'bg-purple-50 text-purple-600 border-purple-200',
  FIRE_THEFT:    'bg-orange-50 text-orange-600 border-orange-200',
};

const STATUS_COLORS = {
  ACTIVE:    'bg-green-50 text-green-600 border-green-200',
  INACTIVE:  'bg-gray-50 text-gray-500 border-gray-200',
  EXPIRED:   'bg-red-50 text-red-600 border-red-200',
  CANCELLED: 'bg-yellow-50 text-yellow-600 border-yellow-200',
};

const EMPTY_FORM = {
  vehicle:           '',
  policy_number:     '',
  policy_type:       '',
  insurance_company: '',
  premium_amount:    '',
  coverage_amount:   '',
  issue_date:        '',
  expiry_date:       '',
  status:            'ACTIVE',
  notes:             '',
};

// ── Expiry status helper ──────────────────────────────────────────────
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return null;
  const today    = new Date();
  const expiry   = new Date(expiryDate);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)   return { label: 'Expired',      color: 'bg-red-50 text-red-600 border-red-200',           dot: 'bg-red-500' };
  if (diffDays <= 30) return { label: `${diffDays}d`, color: 'bg-orange-50 text-orange-600 border-orange-200',  dot: 'bg-orange-500' };
  return               { label: 'Active',              color: 'bg-green-50 text-green-600 border-green-200',    dot: 'bg-green-500' };
};

// ── Field components ──────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <label className="block text-xs font-bold text-gray-600 mb-1">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const Input = (props) => (
  <input {...props}
    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
      focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]
      placeholder:text-gray-300 transition-all" />
);

const Sel = ({ children, ...props }) => (
  <div className="relative">
    <select {...props}
      className="w-full appearance-none px-3 pr-8 py-2 text-sm border border-gray-200
        rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20
        focus:border-[#0052CC] cursor-pointer transition-all">
      {children}
    </select>
    <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);

// ── Vehicle Searchable Dropdown ───────────────────────────────────────
const VehicleSelect = ({ value, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);

  const { data: vData, isLoading } = useVehicles();
  const allVehicles = vData?.results ?? vData ?? [];
  const vehicles = query
    ? allVehicles.filter(v =>
        v.registration_number?.toLowerCase().includes(query.toLowerCase()) ||
        v.make?.toLowerCase().includes(query.toLowerCase())
      )
    : allVehicles;

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const selected = allVehicles.find(v => v.id === value);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
          cursor-pointer flex items-center justify-between gap-2 transition-all hover:border-[#0052CC]/40">
        <span className={`font-mono truncate ${selected ? 'text-[#172B4D] font-bold' : 'text-gray-300'}`}>
          {selected ? `${selected.registration_number} — ${selected.make ?? ''} ${selected.model ?? ''}`.trim() : 'Select vehicle...'}
        </span>
        <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search reg number..."
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]" />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
            {isLoading && (
              <li className="px-4 py-3 flex items-center gap-2 text-xs text-gray-400">
                <Loader2 size={12} className="animate-spin text-[#0052CC]" /> Loading...
              </li>
            )}
            {!isLoading && vehicles.length === 0 && (
              <li className="px-4 py-3 text-xs text-gray-400 text-center">No vehicles found</li>
            )}
            {vehicles.map(v => (
              <li key={v.id}
                onClick={() => { onChange(v.id); setOpen(false); setQuery(''); }}
                className={`px-4 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors
                  flex items-center justify-between gap-2 ${v.id === value ? 'bg-blue-50' : ''}`}>
                <span className="font-mono font-bold text-[#172B4D] text-sm">{v.registration_number}</span>
                <span className="text-xs text-gray-400">{v.make} {v.model}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ── Add / Edit Modal ──────────────────────────────────────────────────
const InsuranceModal = ({ initial, onClose }) => {
  const isEdit = !!initial?.id;

  const [form, setForm] = useState(
    initial
      ? {
          vehicle:           typeof initial.vehicle === 'object' ? (initial.vehicle?.id ?? '') : (initial.vehicle ?? ''),
          policy_number:     initial.policy_number     ?? '',
          policy_type:       initial.policy_type       ?? '',
          insurance_company: initial.insurance_company ?? '',
          premium_amount:    initial.premium_amount    ?? '',
          coverage_amount:   initial.coverage_amount   ?? '',
          issue_date:        initial.issue_date        ?? '',
          expiry_date:       initial.expiry_date       ?? '',
          status:            initial.status            ?? 'ACTIVE',
          notes:             initial.notes             ?? '',
        }
      : EMPTY_FORM
  );

  const create    = useCreateVehicleInsurance();
  const update    = useUpdateVehicleInsurance();
  const isPending = create.isPending || update.isPending;
  const set       = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    const clean = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
    );
    if (isEdit) {
      update.mutate({ id: initial.id, data: clean }, { onSuccess: onClose });
    } else {
      create.mutate(clean, { onSuccess: onClose });
    }
  };

  const canSubmit = form.policy_number && form.policy_type && form.insurance_company && !isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">{isEdit ? 'Edit Insurance' : 'Add Insurance'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? `Editing ${initial.policy_number}` : 'Fill in the insurance details'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          <div>
            <Label>Vehicle</Label>
            <VehicleSelect value={form.vehicle} onChange={(id) => setForm(p => ({ ...p, vehicle: id }))} />
          </div>

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
            <div>
              <Label>Expiry Date</Label>
              <Input type="date" value={form.expiry_date} onChange={set('expiry_date')} />
            </div>
          </div>

          {/* ── Status field ── */}
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
            <textarea value={form.notes ?? ''} onChange={set('notes')} rows={3}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]
                placeholder:text-gray-300 resize-none transition-all" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {isPending
              ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
              : <><Plus size={14} /> {isEdit ? 'Update' : 'Add Insurance'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────────────────
const DeleteModal = ({ insurance, onClose }) => {
  const del = useDeleteVehicleInsurance();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="text-base font-black text-[#172B4D]">Delete Insurance?</h2>
          <p className="text-sm text-gray-400 mt-1">
            Policy <span className="font-semibold text-gray-700">{insurance.policy_number}</span> will be permanently deleted.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={() => del.mutate(insurance.id, { onSuccess: onClose })} disabled={del.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50">
            {del.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Deleting...</>
              : <><Trash2 size={14} /> Delete</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, loading }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.iconBg}`}>
        <Icon size={15} className={color.iconText} />
      </span>
    </div>
    {loading
      ? <div className="h-9 w-12 bg-gray-100 rounded animate-pulse" />
      : <span className={`text-3xl font-black ${color.value}`}>{value}</span>
    }
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────
const VehicleInsurance = () => {
  const [search, setSearch]       = useState('');
  const [typeFilter, setType]     = useState('');
  const [modal, setModal]         = useState(null);
  const [deleteTarget, setDelete] = useState(null);

  const { data, isLoading, isError, error, refetch } = useVehicleInsurances({
    ...(typeFilter && { policy_type: typeFilter }),
    ...(search     && { search }),
  });

  const insurances = data?.results ?? data ?? [];
  const total      = data?.count   ?? insurances.length;
  const active     = insurances.filter(i => i.status === 'ACTIVE').length;
  const cancelled = insurances.filter(i => i.status === 'CANCELLED').length;
  const expired    = insurances.filter(i => i.status === 'EXPIRED').length;

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-screen">

      {(modal === 'add' || (modal && modal !== 'add')) && (
        <InsuranceModal initial={modal === 'add' ? null : modal} onClose={() => setModal(null)} />
      )}
      {deleteTarget && (
        <DeleteModal insurance={deleteTarget} onClose={() => setDelete(null)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Vehicle Insurance</h1>
          <p className="text-sm text-gray-400 mt-0.5">Comprehensive, Third Party, Fire & Theft policies</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all shadow-sm">
            <Plus size={15} /> Add Insurance
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard loading={isLoading} label="Total"    value={total}    icon={Shield}      color={{ value: 'text-[#172B4D]', iconBg: 'bg-blue-50',   iconText: 'text-blue-500' }} />
        <StatCard loading={isLoading} label="Active"   value={active}   icon={ShieldCheck} color={{ value: 'text-green-600',  iconBg: 'bg-green-50',  iconText: 'text-green-500' }} />
        <StatCard loading={isLoading} label="Cancelled" value={cancelled} icon={ShieldAlert} color={{ value: 'text-orange-500', iconBg: 'bg-orange-50', iconText: 'text-orange-500' }} />
        <StatCard loading={isLoading} label="Expired"  value={expired}  icon={ShieldOff}   color={{ value: 'text-red-500',    iconBg: 'bg-red-50',    iconText: 'text-red-400' }} />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#172B4D]">🛡️ Insurance Registry</h2>
            <p className="text-xs text-gray-400 mt-0.5">All vehicle insurance policies</p>
          </div>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
            <Plus size={14} /> Add Insurance
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search policy number, company..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50" />
          </div>
          <div className="relative">
            <select value={typeFilter} onChange={e => setType(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer">
              <option value="">All Types</option>
              {POLICY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={() => { setSearch(''); setType(''); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all">
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin text-[#0052CC]" />
            <span className="text-sm">Loading insurances...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
            <AlertCircle size={32} />
            <p className="text-sm font-medium">Failed to load insurances</p>
            <p className="text-xs text-gray-400">{error?.response?.data?.detail || error?.message}</p>
            <button onClick={() => refetch()}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8]">
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Vehicle','Policy Number','Policy Type','Insurance Company','Premium','Coverage','Issue Date','Expiry Date','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {insurances.map(ins => {
                  const expiryStatus = getExpiryStatus(ins.expiry_date);
                  // Use API status first, fallback to expiry calculation
                  const statusColor = STATUS_COLORS[ins.status] ?? expiryStatus?.color ?? 'bg-green-50 text-green-600 border-green-200';
                  const statusDot   = ins.status === 'ACTIVE'   ? 'bg-green-500'
                                    : ins.status === 'EXPIRED'  ? 'bg-red-500'
                                    : ins.status === 'INACTIVE' ? 'bg-gray-400'
                                    : ins.status === 'CANCELLED'? 'bg-yellow-500'
                                    : (expiryStatus?.dot ?? 'bg-green-500');
                  const statusLabel = ins.status_display ?? ins.status ?? expiryStatus?.label ?? '—';

                  return (
                    <tr key={ins.id} className="hover:bg-blue-50/30 transition-colors">

                      {/* Vehicle */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-[#172B4D] font-mono text-[13px]">
                          {typeof ins.vehicle === 'object'
                            ? (ins.vehicle?.registration_number ?? '—')
                            : (ins.vehicle_registration ?? ins.vehicle ?? '—')}
                        </span>
                      </td>

                      {/* Policy Number */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#172B4D] text-[13px]">{ins.policy_number ?? '—'}</span>
                      </td>

                      {/* Policy Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${TYPE_COLORS[ins.policy_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {ins.policy_type_display ?? ins.policy_type?.replace(/_/g, ' ') ?? '—'}
                        </span>
                      </td>

                      {/* Insurance Company */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-700 text-[13px] font-medium">{ins.insurance_company ?? '—'}</span>
                      </td>

                      {/* Premium */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {ins.premium_amount
                          ? <span className="flex items-center gap-0.5 text-gray-700 font-semibold text-[13px]">
                              <IndianRupee size={12} className="text-gray-400" />
                              {Number(ins.premium_amount).toLocaleString('en-IN')}
                            </span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>

                      {/* Coverage */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {ins.coverage_amount
                          ? <span className="flex items-center gap-0.5 text-green-600 font-semibold text-[13px]">
                              <IndianRupee size={12} className="text-green-400" />
                              {Number(ins.coverage_amount).toLocaleString('en-IN')}
                            </span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>

                      {/* Issue Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-gray-500 text-[12px]">
                          <Calendar size={12} className="text-gray-300" />
                          {ins.issue_date ?? '—'}
                        </span>
                      </td>

                      {/* Expiry Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-gray-500 text-[12px]">
                          <Calendar size={12} className="text-gray-300" />
                          {ins.expiry_date ?? '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit border ${statusColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                          {statusLabel}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setModal(ins)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all">
                            <Pencil size={12} /> Edit
                          </button>
                          <button onClick={() => setDelete(ins)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {insurances.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center text-gray-400">
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
            <span>Showing <span className="font-bold text-gray-600">{insurances.length}</span>
              {data?.count && data.count !== insurances.length &&
                <> of <span className="font-bold text-gray-600">{data.count}</span></>
              } records
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleInsurance;
