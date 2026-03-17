import React, { useState, useMemo } from 'react';
import {
  Package, Plus, Edit2, Trash2, X, Save,
  RefreshCw, Search, ChevronDown, Loader2, AlertCircle,
  Calendar, Hash, FileText, CheckCircle, Clock, XCircle,
} from 'lucide-react';
import {
  useVehicleAccessories,
  useCreateVehicleAccessory,
  useUpdateVehicleAccessory,
  useDeleteVehicleAccessory,
} from '../../queries/vehicles/vehicleInfoQuery';

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_OPTIONS = [
  { value: '',          label: 'All Types' },
  { value: 'DASHCAM',   label: 'Dashcam' },
  { value: 'GPS',       label: 'GPS Tracker' },
  { value: 'CAMERA',    label: 'Camera' },
  { value: 'SAFETY',    label: 'Safety Equipment' },
  { value: 'COMFORT',   label: 'Comfort' },
  { value: 'TOOLBOX',   label: 'Toolbox' },
  { value: 'FIRE_EXT',  label: 'Fire Extinguisher' },
  { value: 'OTHER',     label: 'Other' },
];

const TYPE_COLORS = {
  DASHCAM:  'bg-blue-50 text-blue-700 border-blue-200',
  GPS:      'bg-teal-50 text-teal-700 border-teal-200',
  CAMERA:   'bg-indigo-50 text-indigo-700 border-indigo-200',
  SAFETY:   'bg-orange-50 text-orange-700 border-orange-200',
  COMFORT:  'bg-purple-50 text-purple-700 border-purple-200',
  TOOLBOX:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  FIRE_EXT: 'bg-red-50 text-red-700 border-red-200',
  OTHER:    'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_CONFIG = {
  INSTALLED: { label: 'Installed', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  REMOVED:   { label: 'Removed',   dot: 'bg-gray-400',    text: 'text-gray-600',    bg: 'bg-gray-100'  },
  FAULTY:    { label: 'Faulty',    dot: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50'    },
};

const EMPTY_FORM = {
  vehicle: '', accessory_type: '', accessory_name: '',
  serial_number: '', installation_date: '',
  warranty_expiry: '', status: '', notes: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const warrantyStatus = (expiry) => {
  if (!expiry) return null;
  const diff = new Date(expiry) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0)   return { label: 'Expired',    cls: 'text-red-600',    icon: XCircle };
  if (days <= 90) return { label: `${days}d left`, cls: 'text-orange-500', icon: Clock };
  return { label: fmtDate(expiry), cls: 'text-emerald-600', icon: CheckCircle };
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
        <h2 className="text-base font-black text-[#172B4D]">Delete Accessory?</h2>
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
const AccessoryForm = ({ form, onChange }) => (
  <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Accessory Type" required>
        <select className={inputCls} value={form.accessory_type} onChange={onChange('accessory_type')}>
          <option value="">Select type</option>
          {TYPE_OPTIONS.filter(t => t.value).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Status">
        <select className={inputCls} value={form.status} onChange={onChange('status')}>
          <option value="">Select status</option>
          <option value="INSTALLED">Installed</option>
          <option value="REMOVED">Removed</option>
          <option value="FAULTY">Faulty</option>
        </select>
      </Field>
    </div>

    <Field label="Accessory Name" required>
      <input type="text" className={inputCls} placeholder="e.g. BlackVue DR900X"
        value={form.accessory_name} onChange={onChange('accessory_name')} />
    </Field>

    <Field label="Serial Number">
      <input type="text" className={inputCls} placeholder="e.g. DASH987654321"
        value={form.serial_number} onChange={onChange('serial_number')} />
    </Field>

    <div className="grid grid-cols-2 gap-4">
      <Field label="Installation Date">
        <input type="date" className={inputCls}
          value={form.installation_date} onChange={onChange('installation_date')} />
      </Field>
      <Field label="Warranty Expiry">
        <input type="date" className={inputCls}
          value={form.warranty_expiry} onChange={onChange('warranty_expiry')} />
      </Field>
    </div>

    <Field label="Notes">
      <textarea rows={3} className={inputCls} placeholder="Additional details..."
        value={form.notes} onChange={onChange('notes')} />
    </Field>
  </>
);

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═════════════════════════════════════════════════════════════════════════════
const AccessoriesDashboard = ({ vehicleId }) => {
  const [modal,     setModal]    = useState(null);
  const [deleting,  setDeleting] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [search,    setSearch]   = useState('');
  const [form,      setForm]     = useState(EMPTY_FORM);

  const { data: response, isLoading, isError, error, refetch } =
    useVehicleAccessories(vehicleId ? { vehicle: vehicleId } : undefined);

  const create = useCreateVehicleAccessory();
  const update = useUpdateVehicleAccessory();
  const del    = useDeleteVehicleAccessory();

  const accessories = response?.results ?? response ?? [];

  const filtered = useMemo(() => accessories.filter(a => {
    const matchType = !typeFilter || a.accessory_type === typeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || a.accessory_name?.toLowerCase().includes(q)
      || a.accessory_type_display?.toLowerCase().includes(q)
      || a.serial_number?.toLowerCase().includes(q)
      || a.notes?.toLowerCase().includes(q);
    return matchType && matchSearch;
  }), [accessories, typeFilter, search]);

  const stats = useMemo(() => ({
    total:     accessories.length,
    installed: accessories.filter(a => a.status === 'INSTALLED').length,
    faulty:    accessories.filter(a => a.status === 'FAULTY').length,
    removed:   accessories.filter(a => a.status === 'REMOVED').length,
  }), [accessories]);

  const onChange = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, ...(vehicleId ? { vehicle: vehicleId } : {}) });
    setModal({ mode: 'add' });
  };

  const openEdit = (a) => {
    setForm({
      vehicle:           vehicleId ?? '',
      accessory_type:    a.accessory_type    ?? '',
      accessory_name:    a.accessory_name    ?? '',
      serial_number:     a.serial_number     ?? '',
      installation_date: a.installation_date ?? '',
      warranty_expiry:   a.warranty_expiry   ?? '',
      status:            a.status            ?? '',
      notes:             a.notes             ?? '',
    });
    setModal({ mode: 'edit', data: a });
  };

  const buildPayload = () => ({
    ...form,
    installation_date: form.installation_date || null,
    warranty_expiry:   form.warranty_expiry   || null,
    notes:             form.notes             || null,
    status:            form.status            || null,
  });

  const handleSubmit = () => {
    if (!form.accessory_name || !form.accessory_type) {
      alert('Accessory name and type are required.');
      return;
    }
    const payload = buildPayload();
    if (modal.mode === 'add') create.mutate(payload, { onSuccess: () => setModal(null) });
    else update.mutate({ id: modal.data.id, data: payload }, { onSuccess: () => setModal(null) });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-32 gap-3">
      <Loader2 size={24} className="animate-spin text-[#0052CC]" />
      <span className="text-sm text-gray-400 font-medium">Loading accessories...</span>
    </div>
  );
  if (isError) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-red-400">
      <AlertCircle size={32} />
      <p className="text-sm font-semibold">{error?.message ?? 'Failed to load accessories'}</p>
      <button onClick={() => refetch()} className="px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl">Retry</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Vehicle Accessories</h1>
          <p className="text-sm text-gray-400 mt-0.5">Dashcams, GPS trackers, safety equipment & more</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-all">
            <RefreshCw size={15} className="text-gray-400" />
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm shadow-blue-200">
            <Plus size={15} /> Add Accessory
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total"     value={stats.total}     icon={Package}      iconBg="bg-blue-50"    iconColor="text-[#0052CC]" />
        <StatCard label="Installed" value={stats.installed} icon={CheckCircle}  iconBg="bg-emerald-50" iconColor="text-emerald-600" valueColor="text-emerald-600" />
        <StatCard label="Faulty"    value={stats.faulty}    icon={AlertCircle}  iconBg="bg-orange-50"  iconColor="text-orange-500" valueColor="text-orange-500" />
        <StatCard label="Removed"   value={stats.removed}   icon={XCircle}      iconBg="bg-red-50"     iconColor="text-red-500"    valueColor="text-red-500" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {/* Card Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Package size={18} className="text-[#0052CC]" />
            <div>
              <p className="text-sm font-black text-[#172B4D]">Accessory Registry</p>
              <p className="text-xs text-gray-400">All vehicle accessory records</p>
            </div>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all">
            <Plus size={13} /> Add Accessory
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50/40">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search name, serial, type..."
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
                {['Vehicle','Name','Type','Serial No.','Installed On','Warranty Expiry','Notes','Status','Actions'].map(col => (
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
                        <Package size={22} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-400">
                        {search || typeFilter ? 'No results found' : 'No accessories added yet'}
                      </p>
                      {!search && !typeFilter && (
                        <button onClick={openAdd}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
                          <Plus size={12} /> Add Accessory
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filtered.map(a => {
                const wStatus = warrantyStatus(a.warranty_expiry);
                return (
                  <tr key={a.id} className="hover:bg-blue-50/20 transition-colors">

                    {/* Vehicle */}
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-400">—</td>

                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-black text-[#172B4D]">{a.accessory_name || '—'}</span>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <TypeBadge type={a.accessory_type} display={a.accessory_type_display} />
                    </td>

                    {/* Serial */}
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-gray-600">
                        <Hash size={11} className="text-gray-400 shrink-0" />
                        {a.serial_number || '—'}
                      </span>
                    </td>

                    {/* Installed On */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar size={12} className="text-gray-400 shrink-0" />
                        {fmtDate(a.installation_date)}
                      </span>
                    </td>

                    {/* Warranty */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {wStatus ? (
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${wStatus.cls}`}>
                          <wStatus.icon size={11} />
                          {wStatus.label}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    {/* Notes */}
                    <td className="px-5 py-3.5 max-w-[180px]">
                      {a.notes ? (
                        <span className="flex items-start gap-1.5 text-xs text-gray-500">
                          <FileText size={11} className="text-gray-400 shrink-0 mt-0.5" />
                          <span className="truncate">{a.notes}</span>
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={a.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(a)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#0052CC] bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all">
                          <Edit2 size={11} /> Edit
                        </button>
                        <button onClick={() => setDeleting(a)}
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
        <Modal title={modal.mode === 'add' ? 'Add Accessory' : 'Edit Accessory'}
          onClose={() => setModal(null)} onSubmit={handleSubmit}
          submitting={create.isPending || update.isPending}>
          <AccessoryForm form={form} onChange={onChange} />
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

export default AccessoriesDashboard;
