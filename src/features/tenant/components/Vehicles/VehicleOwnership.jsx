import React, { useState, useMemo } from 'react';
import {
  Users, Plus, Edit2, Trash2, X, Save,
  RefreshCw, Search, Loader2, AlertCircle,
  Calendar, FileText, UserPlus, FileCheck, ArrowRightLeft,
  Link as LinkIcon
} from 'lucide-react';
import {
  useVehicleOwnership,
  useCreateVehicleOwnership,
  useUpdateVehicleOwnership,
  useDeleteVehicleOwnership,
} from '../../queries/vehicles/vehicleInfoQuery';

// ─── Constants ────────────────────────────────────────────────────────────────
const TRANSFER_TYPE_OPTIONS = [
  { value: '',             label: 'All Types' },
  { value: 'LEASE_START',  label: 'Lease Start' },
  { value: 'LEASE_END',    label: 'Lease End' },
  { value: 'PURCHASE',     label: 'Purchase' },
  { value: 'SALE',         label: 'Sale' },
  { value: 'INTERNAL',     label: 'Internal Transfer' },
  { value: 'OTHER',        label: 'Other' },
];

const EMPTY_FORM = {
  vehicle: '', previous_owner: '', new_owner: '',
  transfer_date: '', transfer_type: '',
  transfer_document_url: '', notes: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const inputCls = "w-full px-3 py-2.5 text-sm font-medium text-[#172B4D] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10 transition-all placeholder:text-gray-300";

// ─── Small Components ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, iconBg, iconColor, valueColor }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-start justify-between hover:shadow-sm transition-all text-left">
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
      <p className={`text-4xl font-black ${valueColor ?? 'text-[#172B4D]'}`}>{value}</p>
    </div>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
      <Icon size={20} className={iconColor} />
    </div>
  </div>
);

const TypeBadge = ({ type, display }) => {
  const label = display ?? TRANSFER_TYPE_OPTIONS.find(o => o.value === type)?.label ?? type;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-[#0052CC] border border-blue-100">
      {label}
    </span>
  );
};

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, onSubmit, submitting, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 text-left">
        <h2 className="text-base font-black text-[#172B4D]">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
          <X size={15} className="text-gray-500" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4 text-left">{children}</div>
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
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4 text-left">
      <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
        <Trash2 size={20} className="text-red-500" />
      </div>
      <div>
        <h2 className="text-base font-black text-[#172B4D]">Delete Ownership Record?</h2>
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
const OwnershipForm = ({ form, onChange }) => (
  <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Previous Owner">
        <input type="text" className={inputCls} placeholder="e.g. ABC Transport"
          value={form.previous_owner} onChange={onChange('previous_owner')} />
      </Field>
      <Field label="New Owner" required>
        <input type="text" className={inputCls} placeholder="e.g. ABC Logistics"
          value={form.new_owner} onChange={onChange('new_owner')} />
      </Field>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <Field label="Transfer Date" required>
        <input type="date" className={inputCls}
          value={form.transfer_date} onChange={onChange('transfer_date')} />
      </Field>
      <Field label="Transfer Type" required>
        <select className={inputCls} value={form.transfer_type} onChange={onChange('transfer_type')}>
          <option value="">Select type</option>
          {TRANSFER_TYPE_OPTIONS.filter(o => o.value).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>
    </div>

    <Field label="Document URL">
      <div className="relative">
        <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="url" className={`${inputCls} pl-9`} placeholder="https://example.com/doc.pdf"
          value={form.transfer_document_url} onChange={onChange('transfer_document_url')} />
      </div>
    </Field>

    <Field label="Notes">
      <textarea rows={3} className={inputCls} placeholder="Additional details..."
        value={form.notes} onChange={onChange('notes')} />
    </Field>
  </>
);

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═════════════════════════════════════════════════════════════════════════════
const VehicleOwnershipDashboard = ({ vehicleId }) => {
  const [modal,     setModal]    = useState(null);
  const [deleting,  setDeleting] = useState(null);
  const [search,    setSearch]   = useState('');
  const [form,      setForm]     = useState(EMPTY_FORM);

  const { data: response, isLoading, isError, error, refetch } =
    useVehicleOwnership(vehicleId ? { vehicle: vehicleId } : undefined);

  const create = useCreateVehicleOwnership();
  const update = useUpdateVehicleOwnership();
  const del    = useDeleteVehicleOwnership();

  const records = response?.results ?? response ?? [];

  const filtered = useMemo(() => records.filter(r => {
    const q = search.toLowerCase();
    return !q
      || r.previous_owner?.toLowerCase().includes(q)
      || r.new_owner?.toLowerCase().includes(q)
      || r.transfer_type_display?.toLowerCase().includes(q)
      || r.notes?.toLowerCase().includes(q);
  }), [records, search]);

  const stats = useMemo(() => ({
    total:     records.length,
    recent:    records.slice(0, 5).length,
    leaseRecords: records.filter(r => r.transfer_type?.includes('LEASE')).length,
  }), [records]);

  const onChange = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, ...(vehicleId ? { vehicle: vehicleId } : {}) });
    setModal({ mode: 'add' });
  };

  const openEdit = (r) => {
    setForm({
      vehicle:               vehicleId ?? '',
      previous_owner:        r.previous_owner        ?? '',
      new_owner:             r.new_owner             ?? '',
      transfer_date:         r.transfer_date         ?? '',
      transfer_type:         r.transfer_type         ?? '',
      transfer_document_url: r.transfer_document_url ?? '',
      notes:                 r.notes                 ?? '',
    });
    setModal({ mode: 'edit', data: r });
  };

  const buildPayload = () => ({
    ...form,
    transfer_date: form.transfer_date || null,
    notes:         form.notes         || null,
  });

  const handleSubmit = () => {
    if (!form.new_owner || !form.transfer_date || !form.transfer_type) {
      alert('New owner, transfer date, and type are required.');
      return;
    }
    const payload = buildPayload();
    if (modal.mode === 'add') create.mutate(payload, { onSuccess: () => setModal(null) });
    else update.mutate({ id: modal.data.id, data: payload }, { onSuccess: () => setModal(null) });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-32 gap-3">
      <Loader2 size={24} className="animate-spin text-[#0052CC]" />
      <span className="text-sm text-gray-400 font-medium">Loading records...</span>
    </div>
  );
  if (isError) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-red-400">
      <AlertCircle size={32} />
      <p className="text-sm font-semibold">{error?.message ?? 'Failed to load records'}</p>
      <button onClick={() => refetch()} className="px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl">Retry</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6 text-left">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Vehicle Ownership History</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track ownership transfers, leases, and purchases</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-all">
            <RefreshCw size={15} className="text-gray-400" />
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm shadow-blue-200">
            <Plus size={15} /> Add Record
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Transfers" value={stats.total} icon={ArrowRightLeft} iconBg="bg-blue-50"    iconColor="text-[#0052CC]" />
        <StatCard label="Lease Related"   value={stats.leaseRecords} icon={FileCheck} iconBg="bg-emerald-50" iconColor="text-emerald-600" valueColor="text-emerald-600" />
        <StatCard label="Recent Updates"  value={stats.recent} icon={UserPlus} iconBg="bg-blue-50" iconColor="text-[#0052CC]" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {/* Card Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Users size={18} className="text-[#0052CC]" />
            <div>
              <p className="text-sm font-black text-[#172B4D]">Ownership Registry</p>
              <p className="text-xs text-gray-400">Chronological history</p>
            </div>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all">
            <Plus size={13} /> Add Record
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50/40">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search owners, types, notes..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10 transition-all placeholder:text-gray-300" />
          </div>
          <button onClick={() => setSearch('')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all">
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30">
                {['Previous Owner','New Owner','Date','Type','Doc','Notes','Actions'].map(col => (
                  <th key={col} className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!filtered.length ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                        <Users size={22} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-400">
                        {search ? 'No results found' : 'No records added yet'}
                      </p>
                      {!search && (
                        <button onClick={openAdd}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
                          <Plus size={12} /> Add Record
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-400">{r.previous_owner || 'Initial Registration'}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm font-black text-[#172B4D]">{r.new_owner || '—'}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="flex items-center gap-1.5 text-sm text-gray-600 font-semibold">
                      <Calendar size={13} className="text-gray-400" />
                      {fmtDate(r.transfer_date)}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <TypeBadge type={r.transfer_type} display={r.transfer_type_display} />
                  </td>
                  <td className="px-5 py-4">
                    {r.transfer_document_url ? (
                      <a href={r.transfer_document_url} target="_blank" rel="noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-[#0052CC] hover:bg-blue-100 transition-all">
                        <FileText size={15} />
                      </a>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-4 max-w-[200px]">
                    <span className="text-xs text-gray-500 line-clamp-1">{r.notes || '—'}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(r)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#0052CC] bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all">
                          <Edit2 size={11} /> Edit
                        </button>
                        <button onClick={() => setDeleting(r)}
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
        <Modal title={modal.mode === 'add' ? 'Add Ownership Record' : 'Edit Ownership Record'}
          onClose={() => setModal(null)} onSubmit={handleSubmit}
          submitting={create.isPending || update.isPending}>
          <OwnershipForm form={form} onChange={onChange} />
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

export default VehicleOwnershipDashboard;
