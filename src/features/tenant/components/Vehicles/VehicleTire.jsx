import React, { useState, useMemo } from 'react';
import {
  CircleDot, Plus, Edit2, Trash2, X, Save,
  RefreshCw, Search, ChevronDown, Loader2, AlertCircle,
  Calendar, Gauge, Hash, AlertTriangle,
} from 'lucide-react';
import {
  useVehicleTires,
  useCreateVehicleTire,
  useUpdateVehicleTire,
  useDeleteVehicleTire,
} from '../../queries/vehicles/vehicleInfoQuery';

// ─── Constants ────────────────────────────────────────────────────────────────
const POSITION_OPTIONS = [
  { value: '',            label: 'All Positions' },
  { value: 'FRONT_LEFT',  label: 'Front Left' },
  { value: 'FRONT_RIGHT', label: 'Front Right' },
  { value: 'REAR_LEFT',   label: 'Rear Left' },
  { value: 'REAR_RIGHT',  label: 'Rear Right' },
  { value: 'SPARE',       label: 'Spare' },
];

const POSITION_COLORS = {
  FRONT_LEFT:  'bg-blue-50 text-blue-700 border-blue-200',
  FRONT_RIGHT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  REAR_LEFT:   'bg-purple-50 text-purple-700 border-purple-200',
  REAR_RIGHT:  'bg-violet-50 text-violet-700 border-violet-200',
  SPARE:       'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_CONFIG = {
  INSTALLED: { label: 'Installed', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  REMOVED:   { label: 'Removed',   dot: 'bg-gray-400',    text: 'text-gray-600',    bg: 'bg-gray-100' },
  WORN:      { label: 'Worn',      dot: 'bg-orange-400',  text: 'text-orange-700',  bg: 'bg-orange-50' },
  REPLACED:  { label: 'Replaced',  dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50' },
};

const EMPTY_FORM = {
  vehicle: '', tire_serial_number: '', tire_brand: '',
  tire_position: '', status: '', tread_depth: '',
  installation_date: '', installation_odometer: '',
  removal_date: '', removal_odometer: '', removal_reason: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};
const fmtKm = (n) => n ? `${Number(n).toLocaleString('en-IN')} km` : '—';

// tread depth colour
const treadColor = (mm) => {
  const v = Number(mm);
  if (!v) return 'text-gray-400';
  if (v >= 6) return 'text-emerald-600';
  if (v >= 3) return 'text-orange-500';
  return 'text-red-600';
};

const inputCls = "w-full px-3 py-2.5 text-sm font-medium text-[#172B4D] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10 transition-all placeholder:text-gray-300";

// ─── Small Components ─────────────────────────────────────────────────────────
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

const StatusBadge = ({ status, display }) => {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {display ?? cfg.label}
    </span>
  );
};

const PositionBadge = ({ position, display }) => {
  const label = display ?? POSITION_OPTIONS.find(p => p.value === position)?.label ?? position;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${POSITION_COLORS[position] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
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

// ─── Modal ────────────────────────────────────────────────────────────────────
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
        <h2 className="text-base font-black text-[#172B4D]">Delete Tire?</h2>
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

// ─── Form ─────────────────────────────────────────────────────────────────────
const TireForm = ({ form, onChange }) => (
  <>
    {/* Brand + Serial */}
    <div className="grid grid-cols-2 gap-4">
      <Field label="Tire Brand" required>
        <input type="text" className={inputCls} placeholder="e.g. Apollo, MRF, CEAT"
          value={form.tire_brand} onChange={onChange('tire_brand')} />
      </Field>
      <Field label="Serial Number">
        <input type="text" className={inputCls} placeholder="e.g. APL987654321"
          value={form.tire_serial_number} onChange={onChange('tire_serial_number')} />
      </Field>
    </div>

    {/* Position + Status */}
    <div className="grid grid-cols-2 gap-4">
      <Field label="Tire Position" required>
        <select className={inputCls} value={form.tire_position} onChange={onChange('tire_position')}>
          <option value="">Select position</option>
          {POSITION_OPTIONS.filter(p => p.value).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Status">
        <select className={inputCls} value={form.status} onChange={onChange('status')}>
          <option value="">Select status</option>
          <option value="INSTALLED">Installed</option>
          <option value="REMOVED">Removed</option>
          <option value="WORN">Worn</option>
          <option value="REPLACED">Replaced</option>
        </select>
      </Field>
    </div>

    {/* Tread Depth */}
    <Field label="Tread Depth (mm)">
      <input type="number" step="0.01" className={inputCls} placeholder="e.g. 10.00"
        value={form.tread_depth} onChange={onChange('tread_depth')} />
    </Field>

    {/* Installation */}
    <div className="pt-2 pb-1">
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Installation</p>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Installation Date">
        <input type="date" className={inputCls}
          value={form.installation_date} onChange={onChange('installation_date')} />
      </Field>
      <Field label="Installation Odometer (km)">
        <input type="number" step="0.01" className={inputCls} placeholder="e.g. 16000"
          value={form.installation_odometer} onChange={onChange('installation_odometer')} />
      </Field>
    </div>

    {/* Removal */}
    <div className="pt-2 pb-1">
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Removal (if applicable)</p>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Removal Date">
        <input type="date" className={inputCls}
          value={form.removal_date} onChange={onChange('removal_date')} />
      </Field>
      <Field label="Removal Odometer (km)">
        <input type="number" step="0.01" className={inputCls} placeholder="e.g. 50000"
          value={form.removal_odometer} onChange={onChange('removal_odometer')} />
      </Field>
    </div>
    <Field label="Removal Reason">
      <input type="text" className={inputCls} placeholder="e.g. Worn out, Puncture"
        value={form.removal_reason} onChange={onChange('removal_reason')} />
    </Field>
  </>
);

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═════════════════════════════════════════════════════════════════════════════
const TiresDashboard = ({ vehicleId }) => {
  const [modal,      setModal]      = useState(null);
  const [deleting,   setDeleting]   = useState(null);
  const [posFilter,  setPosFilter]  = useState('');
  const [search,     setSearch]     = useState('');
  const [form,       setForm]       = useState(EMPTY_FORM);

  const { data: response, isLoading, isError, error, refetch } =
    useVehicleTires(vehicleId ? { vehicle: vehicleId } : undefined);

  const create = useCreateVehicleTire();
  const update = useUpdateVehicleTire();
  const del    = useDeleteVehicleTire();

  const tires = response?.results ?? response ?? [];

  const filtered = useMemo(() => tires.filter(t => {
    const matchPos = !posFilter || t.tire_position === posFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || t.tire_brand?.toLowerCase().includes(q)
      || t.tire_serial_number?.toLowerCase().includes(q)
      || t.tire_position_display?.toLowerCase().includes(q)
      || t.status_display?.toLowerCase().includes(q);
    return matchPos && matchSearch;
  }), [tires, posFilter, search]);

  const stats = useMemo(() => ({
    total:     tires.length,
    installed: tires.filter(t => t.status === 'INSTALLED').length,
    worn:      tires.filter(t => t.status === 'WORN').length,
    removed:   tires.filter(t => t.status === 'REMOVED' || t.status === 'REPLACED').length,
  }), [tires]);

  const onChange = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, ...(vehicleId ? { vehicle: vehicleId } : {}) });
    setModal({ mode: 'add' });
  };

  const openEdit = (t) => {
    setForm({
      vehicle:               vehicleId ?? '',
      tire_serial_number:    t.tire_serial_number    ?? '',
      tire_brand:            t.tire_brand            ?? '',
      tire_position:         t.tire_position         ?? '',
      status:                t.status                ?? '',
      tread_depth:           t.tread_depth           ?? '',
      installation_date:     t.installation_date     ?? '',
      installation_odometer: t.installation_odometer ?? '',
      removal_date:          t.removal_date          ?? '',
      removal_odometer:      t.removal_odometer      ?? '',
      removal_reason:        t.removal_reason        ?? '',
    });
    setModal({ mode: 'edit', data: t });
  };

  const buildPayload = () => ({
    ...form,
    tread_depth:           form.tread_depth           ? Number(form.tread_depth)           : null,
    installation_odometer: form.installation_odometer ? Number(form.installation_odometer) : null,
    removal_odometer:      form.removal_odometer      ? Number(form.removal_odometer)      : null,
    removal_date:          form.removal_date          || null,
    removal_odometer_val:  undefined,
    removal_reason:        form.removal_reason        || null,
  });

  const handleSubmit = () => {
    if (!form.tire_brand || !form.tire_position) { alert('Brand and position are required.'); return; }
    const payload = buildPayload();
    if (modal.mode === 'add') create.mutate(payload, { onSuccess: () => setModal(null) });
    else update.mutate({ id: modal.data.id, data: payload }, { onSuccess: () => setModal(null) });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-32 gap-3">
      <Loader2 size={24} className="animate-spin text-[#0052CC]" />
      <span className="text-sm text-gray-400 font-medium">Loading tires...</span>
    </div>
  );
  if (isError) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-red-400">
      <AlertCircle size={32} />
      <p className="text-sm font-semibold">{error?.message ?? 'Failed to load tires'}</p>
      <button onClick={() => refetch()} className="px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl">Retry</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Vehicle Tires</h1>
          <p className="text-sm text-gray-400 mt-0.5">Tire installation, tracking & replacement records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-all">
            <RefreshCw size={15} className="text-gray-400" />
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm shadow-blue-200">
            <Plus size={15} /> Add Tire
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total"     value={stats.total}     icon={CircleDot}     iconBg="bg-blue-50"    iconColor="text-[#0052CC]" />
        <StatCard label="Installed" value={stats.installed} icon={CircleDot}     iconBg="bg-emerald-50" iconColor="text-emerald-600" valueColor="text-emerald-600" />
        <StatCard label="Worn"      value={stats.worn}      icon={AlertTriangle} iconBg="bg-orange-50"  iconColor="text-orange-500" valueColor="text-orange-500" />
        <StatCard label="Removed"   value={stats.removed}   icon={CircleDot}     iconBg="bg-red-50"     iconColor="text-red-500"    valueColor="text-red-500" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {/* Card Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <CircleDot size={18} className="text-[#0052CC]" />
            <div>
              <p className="text-sm font-black text-[#172B4D]">Tire Registry</p>
              <p className="text-xs text-gray-400">All vehicle tire records</p>
            </div>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all">
            <Plus size={13} /> Add Tire
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50/40">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search brand, serial, position..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10 transition-all placeholder:text-gray-300" />
          </div>
          <div className="relative">
            <select value={posFilter} onChange={e => setPosFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#0052CC] text-gray-600 cursor-pointer font-medium">
              {POSITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={() => { setSearch(''); setPosFilter(''); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all">
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30">
                {['Vehicle','Brand','Serial No.','Position','Tread Depth','Installed On','Install Odo','Removed On','Status','Actions'].map(col => (
                  <th key={col} className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!filtered.length ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                        <CircleDot size={22} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-400">
                        {search || posFilter ? 'No results found' : 'No tires added yet'}
                      </p>
                      {!search && !posFilter && (
                        <button onClick={openAdd}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
                          <Plus size={12} /> Add Tire
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-blue-50/20 transition-colors">

                  {/* Vehicle */}
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-400">—</td>

                  {/* Brand */}
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-black text-[#172B4D]">{t.tire_brand || '—'}</span>
                  </td>

                  {/* Serial */}
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-gray-600">
                      <Hash size={11} className="text-gray-400 shrink-0" />
                      {t.tire_serial_number || '—'}
                    </span>
                  </td>

                  {/* Position */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <PositionBadge position={t.tire_position} display={t.tire_position_display} />
                  </td>

                  {/* Tread Depth */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {t.tread_depth ? (
                      <span className={`text-sm font-black ${treadColor(t.tread_depth)}`}>
                        {Number(t.tread_depth).toFixed(1)} mm
                      </span>
                    ) : <span className="text-gray-300 text-sm">—</span>}
                  </td>

                  {/* Installed On */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Calendar size={12} className="text-gray-400 shrink-0" />
                      {fmtDate(t.installation_date)}
                    </span>
                  </td>

                  {/* Install Odo */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Gauge size={12} className="text-gray-400 shrink-0" />
                      {fmtKm(t.installation_odometer)}
                    </span>
                  </td>

                  {/* Removed On */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm">
                    {t.removal_date ? (
                      <span className="text-xs font-semibold text-gray-600">
                        {fmtDate(t.removal_date)}
                        {t.removal_reason && (
                          <span className="block text-[10px] text-gray-400 mt-0.5">{t.removal_reason}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <StatusBadge status={t.status} display={t.status_display} />
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(t)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#0052CC] bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all">
                        <Edit2 size={11} /> Edit
                      </button>
                      <button onClick={() => setDeleting(t)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-all">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
        <Modal title={modal.mode === 'add' ? 'Add Tire' : 'Edit Tire'}
          onClose={() => setModal(null)} onSubmit={handleSubmit}
          submitting={create.isPending || update.isPending}>
          <TireForm form={form} onChange={onChange} />
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

export default TiresDashboard;
