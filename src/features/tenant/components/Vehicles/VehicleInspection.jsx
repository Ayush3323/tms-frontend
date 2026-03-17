import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck, Plus, Edit2, Trash2, X, Save,
  RefreshCw, Search, ChevronDown, Loader2, AlertCircle,
  CheckCircle, XCircle, AlertTriangle, Calendar,
  Gauge,
} from 'lucide-react';
import {
  useVehicleInspections,
  useCreateVehicleInspection,
  useUpdateVehicleInspection,
  useDeleteVehicleInspection,
} from '../../queries/vehicles/vehicleInfoQuery';

const TYPE_OPTIONS = [
  { value: '',          label: 'All Types' },
  { value: 'PRE_TRIP',  label: 'Pre-Trip' },
  { value: 'POST_TRIP', label: 'Post-Trip' },
  { value: 'ROUTINE',   label: 'Routine' },
  { value: 'SAFETY',    label: 'Safety' },
  { value: 'EMISSION',  label: 'Emission' },
  { value: 'ANNUAL',    label: 'Annual' },
];

const STATUS_CONFIG = {
  PASS:    { label: 'Pass',    dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  FAIL:    { label: 'Fail',    dot: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50' },
  PARTIAL: { label: 'Partial', dot: 'bg-orange-400',  text: 'text-orange-700',  bg: 'bg-orange-50' },
};

const TYPE_COLORS = {
  PRE_TRIP:  'bg-blue-50 text-blue-700 border-blue-200',
  POST_TRIP: 'bg-purple-50 text-purple-700 border-purple-200',
  ROUTINE:   'bg-gray-100 text-gray-700 border-gray-200',
  SAFETY:    'bg-orange-50 text-orange-700 border-orange-200',
  EMISSION:  'bg-teal-50 text-teal-700 border-teal-200',
  ANNUAL:    'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const EMPTY_FORM = {
  vehicle: '', driver: '', inspection_type: '', inspection_date: '',
  odometer_reading: '', overall_status: '', inspector_signature: '',
  resolved_date: '', resolved_by: '', defects_found: '',
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};
const fmtKm = (n) => n ? `${Number(n).toLocaleString('en-IN')} km` : '—';

const inputCls = "w-full px-3 py-2.5 text-sm font-medium text-[#172B4D] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10 transition-all placeholder:text-gray-300";

const StatCard = ({ label, value, icon: Icon, iconBg, iconColor, valueColor }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-start justify-between hover:shadow-sm transition-all">
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
      <p className={`text-4xl font-black ${valueColor ?? 'text-[#172B4D]'}`}>{value}</p>
    </div>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
      <Icon size={20} className={iconColor} />
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const TypeBadge = ({ type, display }) => {
  const label = display ?? TYPE_OPTIONS.find(t => t.value === type)?.label ?? type;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {label}
    </span>
  );
};

const Field = ({ label, required, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
  </div>
);

const Modal = ({ title, onClose, onSubmit, submitting, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-black text-[#172B4D]">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
          <X size={15} className="text-gray-500" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">{children}</div>
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
          Cancel
        </button>
        <button onClick={onSubmit} disabled={submitting}
          className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all disabled:opacity-50 shadow-sm shadow-blue-200">
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </button>
      </div>
    </div>
  </div>
);

const DeleteConfirm = ({ onClose, onConfirm, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
      <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
        <Trash2 size={20} className="text-red-500" />
      </div>
      <div>
        <h2 className="text-base font-black text-[#172B4D]">Delete Inspection?</h2>
        <p className="text-sm text-gray-400 mt-1">This action cannot be undone.</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={onConfirm} disabled={deleting}
          className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Delete
        </button>
      </div>
    </div>
  </div>
);

const InspectionForm = ({ form, onChange }) => (
  <>
    <Field label="Inspection Type" required>
      <select className={inputCls} value={form.inspection_type} onChange={onChange('inspection_type')}>
        <option value="">Select type</option>
        {TYPE_OPTIONS.filter(t => t.value).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Inspection Date" required>
        <input type="datetime-local" className={inputCls} value={form.inspection_date} onChange={onChange('inspection_date')} />
      </Field>
      <Field label="Overall Status">
        <select className={inputCls} value={form.overall_status} onChange={onChange('overall_status')}>
          <option value="">Select status</option>
          <option value="PASS">Pass</option>
          <option value="FAIL">Fail</option>
          <option value="PARTIAL">Partial</option>
        </select>
      </Field>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Odometer (km)">
        <input type="number" step="0.01" className={inputCls} placeholder="e.g. 15200" value={form.odometer_reading} onChange={onChange('odometer_reading')} />
      </Field>
      <Field label="Inspector Name">
        <input type="text" className={inputCls} placeholder="Inspector's full name" value={form.inspector_signature} onChange={onChange('inspector_signature')} />
      </Field>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Resolved Date">
        <input type="date" className={inputCls} value={form.resolved_date} onChange={onChange('resolved_date')} />
      </Field>
      <Field label="Resolved By">
        <input type="text" className={inputCls} placeholder="Name or ID" value={form.resolved_by} onChange={onChange('resolved_by')} />
      </Field>
    </div>
    <Field label="Defects Found" hint="Separate multiple defects with commas">
      <textarea rows={3} className={inputCls} placeholder="e.g. Brake pad wear, Wiper replacement needed" value={form.defects_found} onChange={onChange('defects_found')} />
    </Field>
  </>
);

const VehicleInspections= ({ vehicleId }) => {
  const [modal,      setModal]     = useState(null);
  const [deleting,   setDeleting]  = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [search,     setSearch]    = useState('');
  const [form,       setForm]      = useState(EMPTY_FORM);

  const { data: response, isLoading, isError, error, refetch } =
    useVehicleInspections(vehicleId ? { vehicle: vehicleId } : undefined);

  const create = useCreateVehicleInspection();
  const update = useUpdateVehicleInspection();
  const del    = useDeleteVehicleInspection();

  const inspections = response?.results ?? response ?? [];

  const filtered = useMemo(() => inspections.filter(item => {
    const matchType = !typeFilter || item.inspection_type === typeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || item.inspection_type_display?.toLowerCase().includes(q)
      || item.inspector_signature?.toLowerCase().includes(q)
      || item.overall_status?.toLowerCase().includes(q)
      || (Array.isArray(item.defects_found) && item.defects_found.some(d => d.toLowerCase().includes(q)));
    return matchType && matchSearch;
  }), [inspections, typeFilter, search]);

  const stats = useMemo(() => ({
    total:   inspections.length,
    pass:    inspections.filter(i => i.overall_status === 'PASS').length,
    fail:    inspections.filter(i => i.overall_status === 'FAIL').length,
    partial: inspections.filter(i => i.overall_status === 'PARTIAL').length,
  }), [inspections]);

  const onChange = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, ...(vehicleId ? { vehicle: vehicleId } : {}) });
    setModal({ mode: 'add' });
  };

  const openEdit = (item) => {
    const toLocal = (iso) => iso ? iso.slice(0, 16) : '';
    setForm({
      vehicle: vehicleId ?? '', driver: item.driver ?? '',
      inspection_type: item.inspection_type ?? '',
      inspection_date: toLocal(item.inspection_date),
      odometer_reading: item.odometer_reading ?? '',
      overall_status: item.overall_status ?? '',
      inspector_signature: item.inspector_signature ?? '',
      resolved_date: item.resolved_date ?? '',
      resolved_by: item.resolved_by ?? '',
      defects_found: Array.isArray(item.defects_found) ? item.defects_found.join(', ') : (item.defects_found ?? ''),
    });
    setModal({ mode: 'edit', data: item });
  };

  const buildPayload = () => ({
    ...form,
    odometer_reading: form.odometer_reading ? Number(form.odometer_reading) : null,
    defects_found: form.defects_found ? form.defects_found.split(',').map(s => s.trim()).filter(Boolean) : [],
    resolved_date: form.resolved_date || null,
    resolved_by: form.resolved_by || null,
    overall_status: form.overall_status || null,
    inspection_date: form.inspection_date ? new Date(form.inspection_date).toISOString() : null,
  });

  const handleSubmit = () => {
    if (!form.inspection_type || !form.inspection_date) { alert('Type and date required.'); return; }
    const payload = buildPayload();
    if (modal.mode === 'add') create.mutate(payload, { onSuccess: () => setModal(null) });
    else update.mutate({ id: modal.data.id, data: payload }, { onSuccess: () => setModal(null) });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-32 gap-3">
      <Loader2 size={24} className="animate-spin text-[#0052CC]" />
      <span className="text-sm text-gray-400 font-medium">Loading inspections...</span>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-red-400">
      <AlertCircle size={32} />
      <p className="text-sm font-semibold">{error?.message ?? 'Failed to load'}</p>
      <button onClick={() => refetch()} className="px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl">Retry</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Vehicle Inspections</h1>
          <p className="text-sm text-gray-400 mt-0.5">Pre-trip, Post-trip, Safety & Routine inspections</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-all">
            <RefreshCw size={15} className="text-gray-400" />
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm shadow-blue-200">
            <Plus size={15} /> Add Inspection
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total"   value={stats.total}   icon={ClipboardCheck} iconBg="bg-blue-50"    iconColor="text-[#0052CC]"    />
        <StatCard label="Pass"    value={stats.pass}    icon={CheckCircle}    iconBg="bg-emerald-50" iconColor="text-emerald-600"  valueColor="text-emerald-600" />
        <StatCard label="Fail"    value={stats.fail}    icon={XCircle}        iconBg="bg-orange-50"  iconColor="text-orange-500"   valueColor="text-orange-500" />
        <StatCard label="Partial" value={stats.partial} icon={AlertTriangle}  iconBg="bg-red-50"     iconColor="text-red-500"      valueColor="text-red-500" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {/* Table Card Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <ClipboardCheck size={18} className="text-[#0052CC]" />
            <div>
              <p className="text-sm font-black text-[#172B4D]">Inspection Registry</p>
              <p className="text-xs text-gray-400">All vehicle inspection records</p>
            </div>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all">
            <Plus size={13} /> Add Inspection
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50/40">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search type, inspector, defects..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10 transition-all placeholder:text-gray-300" />
          </div>
          <div className="relative">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#0052CC] text-gray-600 cursor-pointer font-medium">
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={() => { setSearch(''); setTypeFilter(''); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all">
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30">
                {['Vehicle','Type','Inspector','Date','Odometer','Defects','Resolved','Status','Actions'].map(col => (
                  <th key={col} className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!filtered.length ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                        <ClipboardCheck size={22} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-400">
                        {search || typeFilter ? 'No results found' : 'No inspections yet'}
                      </p>
                      {!search && !typeFilter && (
                        <button onClick={openAdd}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
                          <Plus size={12} /> Add Inspection
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filtered.map(item => {
                const defects = Array.isArray(item.defects_found) ? item.defects_found : [];
                return (
                  <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-400">—</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <TypeBadge type={item.inspection_type} display={item.inspection_type_display} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#172B4D] font-semibold whitespace-nowrap">
                      {item.inspector_signature || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar size={12} className="text-gray-400 shrink-0" />
                        {fmtDate(item.inspection_date)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Gauge size={12} className="text-gray-400 shrink-0" />
                        {fmtKm(item.odometer_reading)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {defects.length === 0 ? (
                        <span className="text-xs text-emerald-600 font-bold">None</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-100">
                          <AlertCircle size={10} /> {defects.length}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm">
                      {item.resolved_date ? (
                        <span className="text-xs font-semibold text-emerald-600">{fmtDate(item.resolved_date)}</span>
                      ) : item.overall_status !== 'PASS' ? (
                        <span className="text-xs font-semibold text-orange-500">Pending</span>
                      ) : (
                        <span className="text-xs text-gray-300">N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={item.overall_status} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(item)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#0052CC] bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all">
                          <Edit2 size={11} /> Edit
                        </button>
                        <button onClick={() => setDeleting(item)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-all">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-400 font-semibold">
              Showing <span className="text-[#172B4D] font-black">{filtered.length}</span> record{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Inspection' : 'Edit Inspection'}
          onClose={() => setModal(null)} onSubmit={handleSubmit}
          submitting={create.isPending || update.isPending}>
          <InspectionForm form={form} onChange={onChange} />
        </Modal>
      )}

      {/* Delete */}
      {deleting && (
        <DeleteConfirm onClose={() => setDeleting(null)}
          onConfirm={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          deleting={del.isPending} />
      )}
    </div>
  );
};

export default VehicleInspections;
