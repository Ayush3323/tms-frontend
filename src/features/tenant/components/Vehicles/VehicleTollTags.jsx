import React, { useState, useMemo } from 'react';
import {
  Tag, Plus, Edit2, Trash2, X, Save,
  RefreshCw, Search, ChevronDown, Loader2, AlertCircle,
  Calendar, Hash, FileText, CheckCircle, XCircle,
  IndianRupee, CreditCard, Building2
} from 'lucide-react';
import {
  useVehicleTollTags,
  useCreateVehicleTollTag,
  useUpdateVehicleTollTag,
  useDeleteVehicleTollTag,
} from '../../queries/vehicles/vehicleInfoQuery';

// ─── Constants ────────────────────────────────────────────────────────────────
const PROVIDER_OPTIONS = [
  { value: '',          label: 'All Providers' },
  { value: 'HDFC',      label: 'HDFC Bank' },
  { value: 'ICICI',     label: 'ICICI Bank' },
  { value: 'SBI',       label: 'SBI' },
  { value: 'AXIS',      label: 'Axis Bank' },
  { value: 'PAYTM',     label: 'Paytm' },
  { value: 'KOTAK',     label: 'Kotak Bank' },
  { value: 'IDFC',      label: 'IDFC First' },
  { value: 'OTHER',     label: 'Other' },
];

const EMPTY_FORM = {
  vehicle: '', tag_number: '', tag_provider: '',
  recharge_balance: '', issue_date: '',
  expiry_date: '', is_active: true, linked_bank_account: '',
  notes: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const fmtINR = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

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

const StatusBadge = ({ active }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
    {active ? 'Active' : 'Inactive'}
  </span>
);

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
        <h2 className="text-base font-black text-[#172B4D]">Delete Toll Tag?</h2>
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
const TollTagForm = ({ form, onChange }) => (
  <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Tag Number" required>
        <input type="text" className={inputCls} placeholder="e.g. TAG12345678"
          value={form.tag_number} onChange={onChange('tag_number')} />
      </Field>
      <Field label="Tag Provider" required>
        <input type="text" className={inputCls} placeholder="e.g. ICICI Bank"
          value={form.tag_provider} onChange={onChange('tag_provider')} />
      </Field>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <Field label="Recharge Balance (₹)">
        <input type="number" step="0.01" className={inputCls} placeholder="0.00"
          value={form.recharge_balance} onChange={onChange('recharge_balance')} />
      </Field>
      <Field label="Status">
        <select className={inputCls} value={String(form.is_active)} onChange={e => onChange('is_active')({ target: { value: e.target.value === 'true' } })}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </Field>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <Field label="Issue Date">
        <input type="date" className={inputCls}
          value={form.issue_date} onChange={onChange('issue_date')} />
      </Field>
      <Field label="Expiry Date">
        <input type="date" className={inputCls}
          value={form.expiry_date} onChange={onChange('expiry_date')} />
      </Field>
    </div>

    <Field label="Linked Bank Account">
      <input type="text" className={inputCls} placeholder="Bank account number"
        value={form.linked_bank_account} onChange={onChange('linked_bank_account')} />
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
const VehicleTollTagsDashboard = ({ vehicleId }) => {
  const [modal,     setModal]    = useState(null);
  const [deleting,  setDeleting] = useState(null);
  const [search,    setSearch]   = useState('');
  const [form,      setForm]     = useState(EMPTY_FORM);

  const { data: response, isLoading, isError, error, refetch } =
    useVehicleTollTags(vehicleId ? { vehicle: vehicleId } : undefined);

  const create = useCreateVehicleTollTag();
  const update = useUpdateVehicleTollTag();
  const del    = useDeleteVehicleTollTag();

  const tollTags = response?.results ?? response ?? [];

  const filtered = useMemo(() => tollTags.filter(t => {
    const q = search.toLowerCase();
    return !q
      || t.tag_number?.toLowerCase().includes(q)
      || t.tag_provider?.toLowerCase().includes(q)
      || t.linked_bank_account?.toLowerCase().includes(q)
      || t.notes?.toLowerCase().includes(q);
  }), [tollTags, search]);

  const stats = useMemo(() => ({
    total:        tollTags.length,
    active:       tollTags.filter(t => t.is_active).length,
    totalBalance: tollTags.reduce((acc, t) => acc + (Number(t.recharge_balance) || 0), 0),
  }), [tollTags]);

  const onChange = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, ...(vehicleId ? { vehicle: vehicleId } : {}) });
    setModal({ mode: 'add' });
  };

  const openEdit = (t) => {
    setForm({
      vehicle:             vehicleId ?? '',
      tag_number:          t.tag_number          ?? '',
      tag_provider:        t.tag_provider        ?? '',
      recharge_balance:    t.recharge_balance    ?? '',
      issue_date:          t.issue_date          ?? '',
      expiry_date:         t.expiry_date         ?? '',
      is_active:           t.is_active           ?? true,
      linked_bank_account: t.linked_bank_account ?? '',
      notes:               t.notes               ?? '',
    });
    setModal({ mode: 'edit', data: t });
  };

  const buildPayload = () => ({
    ...form,
    recharge_balance: form.recharge_balance || 0,
    issue_date:       form.issue_date       || null,
    expiry_date:      form.expiry_date      || null,
    notes:            form.notes            || null,
  });

  const handleSubmit = () => {
    if (!form.tag_number || !form.tag_provider) {
      alert('Tag number and provider are required.');
      return;
    }
    const payload = buildPayload();
    if (modal.mode === 'add') create.mutate(payload, { onSuccess: () => setModal(null) });
    else update.mutate({ id: modal.data.id, data: payload }, { onSuccess: () => setModal(null) });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-32 gap-3">
      <Loader2 size={24} className="animate-spin text-[#0052CC]" />
      <span className="text-sm text-gray-400 font-medium">Loading toll tags...</span>
    </div>
  );
  if (isError) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-red-400">
      <AlertCircle size={32} />
      <p className="text-sm font-semibold">{error?.message ?? 'Failed to load toll tags'}</p>
      <button onClick={() => refetch()} className="px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl">Retry</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6 text-left">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Vehicle Toll Tags</h1>
          <p className="text-sm text-gray-400 mt-0.5">FASTag and toll management for your fleet</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-all">
            <RefreshCw size={15} className="text-gray-400" />
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm shadow-blue-200">
            <Plus size={15} /> Add Toll Tag
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Tags" value={stats.total}  icon={Tag}          iconBg="bg-blue-50"    iconColor="text-[#0052CC]" />
        <StatCard label="Active"     value={stats.active} icon={CheckCircle}  iconBg="bg-emerald-50" iconColor="text-emerald-600" valueColor="text-emerald-600" />
        <StatCard label="Total Balance" value={fmtINR(stats.totalBalance)} icon={IndianRupee} iconBg="bg-blue-50" iconColor="text-[#0052CC]" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {/* Card Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Tag size={18} className="text-[#0052CC]" />
            <div>
              <p className="text-sm font-black text-[#172B4D]">Toll Tag Registry</p>
              <p className="text-xs text-gray-400">All FASTag records</p>
            </div>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all">
            <Plus size={13} /> Add Tag
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50/40">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search tag number, bank, account..."
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
                {['Tag Number','Provider','Balance','Bank Account','Issued','Expiry','Status','Actions'].map(col => (
                  <th key={col} className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!filtered.length ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                        <Tag size={22} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-400">
                        {search ? 'No results found' : 'No toll tags added yet'}
                      </p>
                      {!search && (
                        <button onClick={openAdd}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
                          <Plus size={12} /> Add Tag
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="flex items-center gap-1.5 text-sm font-black text-[#172B4D] font-mono tracking-wider">
                      <Hash size={13} className="text-gray-300" />
                      {t.tag_number || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-gray-600">
                      <Building2 size={13} className="text-gray-400" />
                      {t.tag_provider || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-sm font-black text-[#0052CC]">{fmtINR(t.recharge_balance)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-gray-500">
                      <CreditCard size={12} className="text-gray-400" />
                      {t.linked_bank_account || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{fmtDate(t.issue_date)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{fmtDate(t.expiry_date)}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <StatusBadge active={t.is_active} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
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
        <Modal title={modal.mode === 'add' ? 'Add Toll Tag' : 'Edit Toll Tag'}
          onClose={() => setModal(null)} onSubmit={handleSubmit}
          submitting={create.isPending || update.isPending}>
          <TollTagForm form={form} onChange={onChange} />
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

export default VehicleTollTagsDashboard;
