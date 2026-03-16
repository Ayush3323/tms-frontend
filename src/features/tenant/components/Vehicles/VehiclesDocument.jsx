import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, RefreshCw, Loader2, AlertCircle, X,
  ChevronDown, FileText, Search, Pencil, Trash2,
  CheckCircle, Clock, AlertTriangle, Calendar
} from 'lucide-react';
import {
  useVehicleDocuments,
  useCreateVehicleDocument,
  useUpdateVehicleDocument,
  useDeleteVehicleDocument,
} from '../../queries/vehicles/vehicleInfoQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';

// ── Constants ─────────────────────────────────────────────────────────
const DOC_TYPES = ['RC', 'INSURANCE', 'PUC', 'FITNESS', 'PERMIT', 'TAX'];

const DOC_TYPE_COLORS = {
  RC:        'bg-blue-50 text-blue-600 border-blue-200',
  INSURANCE: 'bg-purple-50 text-purple-600 border-purple-200',
  PUC:       'bg-green-50 text-green-600 border-green-200',
  FITNESS:   'bg-orange-50 text-orange-600 border-orange-200',
  PERMIT:    'bg-teal-50 text-teal-600 border-teal-200',
  TAX:       'bg-pink-50 text-pink-600 border-pink-200',
};

// API returns status: VALID | EXPIRED | EXPIRING_SOON
const STATUS_STYLES = {
  VALID:         { label: 'Valid',    color: 'bg-green-50 text-green-600 border-green-200',   dot: 'bg-green-500' },
  EXPIRED:       { label: 'Expired',  color: 'bg-red-50 text-red-600 border-red-200',         dot: 'bg-red-500' },
  EXPIRING_SOON: { label: 'Expiring', color: 'bg-orange-50 text-orange-600 border-orange-200', dot: 'bg-orange-500' },
};

const EMPTY_FORM = {
  vehicle:           '',
  document_type:     '',
  document_number:   '',
  issue_date:        '',
  expiry_date:       '',
  issuing_authority: '',
  notes:             '',
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
        v.make?.toLowerCase().includes(query.toLowerCase()))
    : allVehicles;

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Find selected vehicle by id (works even if value is just a UUID string)
  const selected = allVehicles.find(v => v.id === value);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
          cursor-pointer flex items-center justify-between gap-2 hover:border-[#0052CC]/40 transition-all">
        <span className={`font-mono truncate ${selected ? 'text-[#172B4D] font-bold' : 'text-gray-300'}`}>
          {selected ? `${selected.registration_number} — ${selected.make ?? ''} ${selected.model ?? ''}`.trim() : 'Select vehicle...'}
        </span>
        <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search reg number..."
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none" />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
            {isLoading && <li className="px-4 py-3 text-xs text-gray-400 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Loading...</li>}
            {!isLoading && vehicles.length === 0 && <li className="px-4 py-3 text-xs text-gray-400 text-center">No vehicles found</li>}
            {vehicles.map(v => (
              <li key={v.id} onClick={() => { onChange(v.id); setOpen(false); setQuery(''); }}
                className={`px-4 py-2.5 cursor-pointer hover:bg-blue-50 flex items-center justify-between gap-2 ${v.id === value ? 'bg-blue-50' : ''}`}>
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
const DocModal = ({ initial, onClose }) => {
  const isEdit = !!initial?.id;

  // Fetch vehicles to resolve UUID → registration_number for pre-fill
  const { data: vData } = useVehicles();
  const allVehicles = vData?.results ?? vData ?? [];

  // Resolve vehicle id from initial — could be UUID string or object
  const resolveVehicleId = () => {
    if (!initial?.vehicle) return '';
    if (typeof initial.vehicle === 'object') return initial.vehicle?.id ?? '';
    // It's a UUID string — return as-is
    return initial.vehicle;
  };

  const [form, setForm] = useState(
    initial ? {
      vehicle:           resolveVehicleId(),
      document_type:     initial.document_type     ?? '',
      document_number:   initial.document_number   ?? '',
      issue_date:        initial.issue_date        ?? '',
      expiry_date:       initial.expiry_date       ?? '',
      issuing_authority: initial.issuing_authority ?? '',
      notes:             initial.notes             ?? '',
    } : EMPTY_FORM
  );

  const create    = useCreateVehicleDocument();
  const update    = useUpdateVehicleDocument();
  const isPending = create.isPending || update.isPending;
  const set       = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    if (isEdit) update.mutate({ id: initial.id, data: clean }, { onSuccess: onClose });
    else        create.mutate(clean, { onSuccess: onClose });
  };

  const canSubmit = form.document_type && form.document_number && !isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">{isEdit ? 'Edit Document' : 'Add Document'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? 'Update document details' : 'Fill in the document details'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div>
            <Label required={!isEdit}>Vehicle</Label>
            <VehicleSelect value={form.vehicle} onChange={(id) => setForm(p => ({ ...p, vehicle: id }))} />
            {isEdit && !form.vehicle && (
              <p className="text-[11px] text-orange-500 mt-1">⚠ Vehicle info not available in API — will be preserved on update</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Document Type</Label>
              <Sel value={form.document_type} onChange={set('document_type')}>
                <option value="">Select type</option>
                {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </Sel>
            </div>
            <div><Label required>Document Number</Label><Input placeholder="e.g. RCMH12AB1234" value={form.document_number} onChange={set('document_number')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Issue Date</Label><Input type="date" value={form.issue_date} onChange={set('issue_date')} /></div>
            <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={set('expiry_date')} /></div>
          </div>
          <div><Label>Issuing Authority</Label><Input placeholder="e.g. RTO Mumbai" value={form.issuing_authority} onChange={set('issuing_authority')} /></div>
          <div>
            <Label>Notes</Label>
            <textarea value={form.notes ?? ''} onChange={set('notes')} rows={3} placeholder="Any additional notes..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> {isEdit ? 'Update' : 'Add Document'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Modal ──────────────────────────────────────────────────────
const DeleteModal = ({ doc, onClose }) => {
  const del = useDeleteVehicleDocument();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto"><Trash2 size={22} className="text-red-500" /></div>
        <div className="text-center">
          <h2 className="text-base font-black text-[#172B4D]">Delete Document?</h2>
          <p className="text-sm text-gray-400 mt-1">
            <span className="font-semibold text-gray-700">{doc.document_type_display ?? doc.document_type}</span> — {doc.document_number} will be permanently deleted.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => del.mutate(doc.id, { onSuccess: onClose })} disabled={del.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50">
            {del.isPending ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : <><Trash2 size={14} /> Delete</>}
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
    {loading ? <div className="h-9 w-12 bg-gray-100 rounded animate-pulse" /> : <span className={`text-3xl font-black ${color.value}`}>{value}</span>}
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────
const VehicleDocuments = () => {
  const [search, setSearch]       = useState('');
  const [typeFilter, setType]     = useState('');
  const [modal, setModal]         = useState(null);
  const [deleteTarget, setDelete] = useState(null);

  const { data, isLoading, isError, error, refetch } = useVehicleDocuments({
    ...(typeFilter && { document_type: typeFilter }),
    ...(search     && { search }),
  });

  const docs     = data?.results ?? data ?? [];
  const total    = data?.count   ?? docs.length;
  // Use API status field directly
  const valid    = docs.filter(d => d.status === 'VALID').length;
  const expiring = docs.filter(d => d.status === 'EXPIRING_SOON').length;
  const expired  = docs.filter(d => d.status === 'EXPIRED').length;

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-screen">

      {(modal === 'add' || (modal && modal !== 'add')) && (
        <DocModal initial={modal === 'add' ? null : modal} onClose={() => setModal(null)} />
      )}
      {deleteTarget && <DeleteModal doc={deleteTarget} onClose={() => setDelete(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Vehicle Documents</h1>
          <p className="text-sm text-gray-400 mt-0.5">RC, Insurance, PUC, Fitness, Permit, Tax records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] shadow-sm">
            <Plus size={15} /> Add Document
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard loading={isLoading} label="Total"    value={total}    icon={FileText}      color={{ value: 'text-[#172B4D]', iconBg: 'bg-blue-50',   iconText: 'text-blue-500' }} />
        <StatCard loading={isLoading} label="Valid"    value={valid}    icon={CheckCircle}   color={{ value: 'text-green-600',  iconBg: 'bg-green-50',  iconText: 'text-green-500' }} />
        <StatCard loading={isLoading} label="Expiring" value={expiring} icon={Clock}         color={{ value: 'text-orange-500', iconBg: 'bg-orange-50', iconText: 'text-orange-500' }} />
        <StatCard loading={isLoading} label="Expired"  value={expired}  icon={AlertTriangle} color={{ value: 'text-red-500',    iconBg: 'bg-red-50',    iconText: 'text-red-400' }} />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#172B4D]">📄 Document Registry</h2>
            <p className="text-xs text-gray-400 mt-0.5">All vehicle compliance documents</p>
          </div>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8]">
            <Plus size={14} /> Add Document
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search document number..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50" />
          </div>
          <div className="relative">
            <select value={typeFilter} onChange={e => setType(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer">
              <option value="">All Types</option>
              {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={() => { setSearch(''); setType(''); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100">
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        {isLoading && <div className="flex items-center justify-center py-16 gap-3 text-gray-400"><Loader2 size={20} className="animate-spin text-[#0052CC]" /><span className="text-sm">Loading documents...</span></div>}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
            <AlertCircle size={32} />
            <p className="text-sm font-medium">Failed to load documents</p>
            <p className="text-xs text-gray-400">{error?.response?.data?.detail || error?.message}</p>
            <button onClick={() => refetch()} className="px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg">Try Again</button>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Vehicle', 'Doc Type', 'Doc Number', 'Issue Date', 'Expiry Date', 'Issuing Authority', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docs.map(doc => {
                  const st = STATUS_STYLES[doc.status] ?? STATUS_STYLES.VALID;
                  return (
                    <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors">

                      {/* Vehicle */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-[#172B4D] font-mono text-[13px]">
                          {doc.vehicle_registration ?? doc.vehicle?.registration_number ?? '—'}
                        </span>
                      </td>

                      {/* Doc Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${DOC_TYPE_COLORS[doc.document_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {doc.document_type}
                          </span>
                          {doc.document_type_display && (
                            <div className="text-[11px] text-gray-400 mt-0.5">{doc.document_type_display}</div>
                          )}
                        </div>
                      </td>

                      {/* Doc Number */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#172B4D] text-[13px]">{doc.document_number ?? '—'}</span>
                      </td>

                      {/* Issue Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-gray-500 text-[12px]">
                          <Calendar size={11} className="text-gray-300" />{doc.issue_date ?? '—'}
                        </span>
                      </td>

                      {/* Expiry Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-gray-500 text-[12px]">
                          <Calendar size={11} className="text-gray-300" />{doc.expiry_date ?? '—'}
                        </span>
                      </td>

                      {/* Issuing Authority */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-600 text-[12px] font-medium">{doc.issuing_authority ?? '—'}</span>
                      </td>

                      {/* Status — from API directly */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit border ${st.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setModal(doc)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                            <Pencil size={12} /> Edit
                          </button>
                          <button onClick={() => setDelete(doc)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {docs.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No documents found</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Showing <span className="font-bold text-gray-600">{docs.length}</span>{data?.count && data.count !== docs.length && <> of <span className="font-bold text-gray-600">{data.count}</span></>} documents</span>
            <span className="text-[11px]">Fleet Management System</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleDocuments;
