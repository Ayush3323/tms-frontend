import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Pause, Play,
  Truck, FileText, Shield, Wrench, ClipboardCheck,
  Fuel, CircleDot, Package, Tag, History,
  Gauge, Calendar, User, IndianRupee,
  ChevronRight, Loader2, AlertCircle,
  Hash, Palette, Zap, BarChart3,
  Plus, Trash2, X, Save,
} from 'lucide-react';
import { useVehicle, useUpdateVehicle } from '../../queries/vehicles/vehicleQuery';
import {
  useCreateVehicleDocument, useUpdateVehicleDocument, useDeleteVehicleDocument,
  useCreateVehicleInsurance, useUpdateVehicleInsurance, useDeleteVehicleInsurance,
  useCreateMaintenanceSchedule, useUpdateMaintenanceSchedule, useDeleteMaintenanceSchedule,
  useCreateMaintenanceRecord, useUpdateMaintenanceRecord, useDeleteMaintenanceRecord,
  useCreateVehicleInspection, useUpdateVehicleInspection, useDeleteVehicleInspection,
  useCreateFuelLog, useUpdateFuelLog, useDeleteFuelLog,
  useCreateVehicleTire, useUpdateVehicleTire, useDeleteVehicleTire,
  useCreateVehicleAccessory, useUpdateVehicleAccessory, useDeleteVehicleAccessory,
  useCreateVehicleTollTag, useUpdateVehicleTollTag, useDeleteVehicleTollTag,
  useCreateVehicleOwnership, useUpdateVehicleOwnership, useDeleteVehicleOwnership,
} from '../../queries/vehicles/vehicleInfoQuery';

// ─── Style Maps ───────────────────────────────────────────────────────────────
const FUEL_COLORS = {
  DIESEL:   'bg-orange-100 text-orange-700 border-orange-200',
  PETROL:   'bg-sky-100 text-sky-700 border-sky-200',
  CNG:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  LPG:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  ELECTRIC: 'bg-teal-100 text-teal-700 border-teal-200',
  HYBRID:   'bg-purple-100 text-purple-700 border-purple-200',
};
const STATUS_MAP = {
  ACTIVE:      { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  MAINTENANCE: { color: 'text-orange-700',  bg: 'bg-orange-100',  border: 'border-orange-300',  dot: 'bg-orange-500' },
  RETIRED:     { color: 'text-red-600',     bg: 'bg-red-100',     border: 'border-red-300',     dot: 'bg-red-500' },
  SOLD:        { color: 'text-gray-600',    bg: 'bg-gray-100',    border: 'border-gray-300',    dot: 'bg-gray-400' },
  SCRAPPED:    { color: 'text-gray-600',    bg: 'bg-gray-100',    border: 'border-gray-300',    dot: 'bg-gray-500' },
};
const INSP_STATUS = {
  PASS:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  FAIL:    'bg-red-50 text-red-700 border border-red-200',
  PARTIAL: 'bg-orange-50 text-orange-700 border border-orange-200',
};
const TABS = [
  { id: 'overview',    label: 'Overview',    icon: BarChart3 },
  { id: 'documents',   label: 'Documents',   icon: FileText,       key: 'documents' },
  { id: 'insurance',   label: 'Insurance',   icon: Shield,         key: 'insurance_policies' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench,         key: 'maintenance_schedules' },
  { id: 'inspections', label: 'Inspections', icon: ClipboardCheck, key: 'inspections' },
  { id: 'fuel',        label: 'Fuel Logs',   icon: Fuel,           key: 'fuel_logs' },
  { id: 'tires',       label: 'Tires',       icon: CircleDot,      key: 'tires' },
  { id: 'accessories', label: 'Accessories', icon: Package,        key: 'accessories' },
  { id: 'tolltags',    label: 'Toll Tags',   icon: Tag,            key: 'toll_tags' },
  { id: 'ownership',   label: 'Ownership',   icon: History,        key: 'ownership_history' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const driverName = (d) => {
  if (!d) return null;
  if (typeof d === 'object') return d?.name ?? d?.user_id ?? 'Driver Assigned';
  return d;
};
const fmtINR = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : null;
const fmtKm  = (n) => n != null ? `${Number(n).toLocaleString('en-IN')} km` : null;

// ─── Reusable UI ─────────────────────────────────────────────────────────────
const Badge = ({ children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${className}`}>
    {children}
  </span>
);

const InfoCard = ({ label, value, icon: Icon, accent }) => (
  <div className={`rounded-xl border p-4 flex flex-col gap-1.5 transition-all hover:shadow-sm
    ${accent ? 'bg-[#0052CC]/5 border-[#0052CC]/20' : 'bg-white border-gray-100 hover:border-[#0052CC]/20'}`}>
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      {Icon && <Icon size={13} className={accent ? 'text-[#0052CC]/40' : 'text-gray-200'} />}
    </div>
    <span className={`text-sm font-bold truncate ${accent ? 'text-[#0052CC]' : 'text-[#172B4D]'}`}>
      {value ?? <span className="text-gray-300 font-normal">—</span>}
    </span>
  </div>
);

const SectionHeader = ({ icon: Icon, title, count, onAdd, addLabel = 'Add' }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
      <Icon size={14} className="text-gray-500" />
    </div>
    <h3 className="text-sm font-black text-[#172B4D] uppercase tracking-wide">{title}</h3>
    {count != null && (
      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{count}</span>
    )}
    {onAdd && (
      <button onClick={onAdd}
        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all shadow-sm">
        <Plus size={12} /> {addLabel}
      </button>
    )}
  </div>
);

const EmptyState = ({ icon: Icon, text, onAdd, addLabel }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
      <Icon size={24} className="text-gray-300" />
    </div>
    <p className="text-sm font-semibold text-gray-400">{text}</p>
    {onAdd && (
      <button onClick={onAdd}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all mt-1">
        <Plus size={14} /> {addLabel ?? 'Add New'}
      </button>
    )}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, onSubmit, submitting, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-black text-[#172B4D]">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
          <X size={16} className="text-gray-500" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">{children}</div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
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

// ─── Delete Confirm ───────────────────────────────────────────────────────────
const DeleteConfirm = ({ label, onClose, onConfirm, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
      <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
        <Trash2 size={20} className="text-red-500" />
      </div>
      <div>
        <h2 className="text-base font-black text-[#172B4D]">Delete {label}?</h2>
        <p className="text-sm text-gray-400 mt-1">This action cannot be undone.</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={onConfirm} disabled={deleting}
          className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Form Field ───────────────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2.5 text-sm font-medium text-[#172B4D] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10 transition-all placeholder:text-gray-300";
const Input = (props) => <input className={inputCls} {...props} />;
const Select = ({ children, ...props }) => (
  <select className={inputCls} {...props}>{children}</select>
);
const Textarea = (props) => <textarea rows={3} className={inputCls} {...props} />;

// ─── Action Row ────────────────────────────────────────────────────────────────
const ItemActions = ({ onEdit, onDelete }) => (
  <div className="flex items-center gap-1 shrink-0">
    <button onClick={onEdit}
      className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-100 flex items-center justify-center transition-all" title="Edit">
      <Edit2 size={13} className="text-[#0052CC]" />
    </button>
    <button onClick={onDelete}
      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center transition-all" title="Delete">
      <Trash2 size={13} className="text-red-500" />
    </button>
  </div>
);

// ─── useForm helper ───────────────────────────────────────────────────────────
const useForm = (initial = {}) => {
  const [form, setForm] = useState(initial);
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const reset = (data = {}) => setForm(data);
  return { form, set, reset, setForm };
};

// ═════════════════════════════════════════════════════════════════════════════
//  DOCUMENTS TAB
// ═════════════════════════════════════════════════════════════════════════════
const DocumentsTab = ({ v }) => {
  const vehicleId = v.id;
  const docs = v.documents ?? [];

  const [modal, setModal] = useState(null); // null | { mode:'add'|'edit', data? }
  const [deleting, setDeleting] = useState(null);

  const create = useCreateVehicleDocument();
  const update = useUpdateVehicleDocument();
  const del    = useDeleteVehicleDocument();

  const { form, set, reset } = useForm({});

  const openAdd  = () => { reset({ vehicle: vehicleId }); setModal({ mode: 'add' }); };
  const openEdit = (d) => { reset({ ...d, vehicle: vehicleId }); setModal({ mode: 'edit', data: d }); };

  const handleSubmit = () => {
    if (modal.mode === 'add') {
      create.mutate(form, { onSuccess: () => setModal(null) });
    } else {
      update.mutate({ id: modal.data.id, data: form }, { onSuccess: () => setModal(null) });
    }
  };

  const handleDelete = () => {
    del.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  };

  return (
    <div className="space-y-3">
      <SectionHeader icon={FileText} title="Documents" count={docs.length} onAdd={openAdd} addLabel="Add Document" />
      {!docs.length
        ? <EmptyState icon={FileText} text="No documents found" onAdd={openAdd} addLabel="Add Document" />
        : docs.map(d => (
          <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:border-[#0052CC]/30 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-[#0052CC]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#172B4D] truncate">{d.document_type_display ?? d.document_type}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {d.document_number && `#${d.document_number}`}{d.expiry_date && ` · Expires ${d.expiry_date}`}
              </p>
            </div>
            {d.status && (
              <Badge className={d.status === 'VALID' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}>
                {d.status_display ?? d.status}
              </Badge>
            )}
            <ItemActions onEdit={() => openEdit(d)} onDelete={() => setDeleting(d)} />
          </div>
        ))
      }

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Document' : 'Edit Document'}
          onClose={() => setModal(null)} onSubmit={handleSubmit}
          submitting={create.isPending || update.isPending}>
          <Field label="Document Type" required>
            <Select value={form.document_type ?? ''} onChange={set('document_type')}>
              <option value="">Select type</option>
              <option value="RC">Registration Certificate</option>
              <option value="PUC">PUC Certificate</option>
              <option value="FITNESS">Fitness Certificate</option>
              <option value="PERMIT">Permit</option>
              <option value="OTHER">Other</option>
            </Select>
          </Field>
          <Field label="Document Number">
            <Input placeholder="Enter document number" value={form.document_number ?? ''} onChange={set('document_number')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Issue Date">
              <Input type="date" value={form.issue_date ?? ''} onChange={set('issue_date')} />
            </Field>
            <Field label="Expiry Date">
              <Input type="date" value={form.expiry_date ?? ''} onChange={set('expiry_date')} />
            </Field>
          </div>
          <Field label="Status">
            <Select value={form.status ?? ''} onChange={set('status')}>
              <option value="">Select status</option>
              <option value="VALID">Valid</option>
              <option value="EXPIRED">Expired</option>
              <option value="PENDING">Pending</option>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea placeholder="Additional notes..." value={form.notes ?? ''} onChange={set('notes')} />
          </Field>
        </Modal>
      )}

      {deleting && (
        <DeleteConfirm label="Document" onClose={() => setDeleting(null)}
          onConfirm={handleDelete} deleting={del.isPending} />
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  INSURANCE TAB
// ═════════════════════════════════════════════════════════════════════════════
const InsuranceTab = ({ v }) => {
  const vehicleId = v.id;
  const policies = v.insurance_policies ?? [];

  const [modal, setModal]     = useState(null);
  const [deleting, setDeleting] = useState(null);

  const create = useCreateVehicleInsurance();
  const update = useUpdateVehicleInsurance();
  const del    = useDeleteVehicleInsurance();

  const { form, set, reset } = useForm({});

  const openAdd  = () => { reset({ vehicle: vehicleId }); setModal({ mode: 'add' }); };
  const openEdit = (p) => { reset({ ...p, vehicle: vehicleId }); setModal({ mode: 'edit', data: p }); };

  const handleSubmit = () => {
    if (modal.mode === 'add') create.mutate(form, { onSuccess: () => setModal(null) });
    else update.mutate({ id: modal.data.id, data: form }, { onSuccess: () => setModal(null) });
  };

  return (
    <div className="space-y-4">
      <SectionHeader icon={Shield} title="Insurance Policies" count={policies.length} onAdd={openAdd} addLabel="Add Policy" />
      {!policies.length
        ? <EmptyState icon={Shield} text="No insurance policies found" onAdd={openAdd} addLabel="Add Policy" />
        : policies.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#0052CC]/20 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-50">
              <div>
                <p className="font-black text-[#172B4D] text-lg font-mono">{p.policy_number}</p>
                <p className="text-sm text-gray-400 mt-0.5 font-medium">{p.insurance_company}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'}>
                  <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  {p.status_display ?? p.status}
                </Badge>
                <ItemActions onEdit={() => openEdit(p)} onDelete={() => setDeleting(p)} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <InfoCard label="Policy Type" value={p.policy_type_display} />
              <InfoCard label="Premium"     value={fmtINR(p.premium_amount)}  icon={IndianRupee} />
              <InfoCard label="Coverage"    value={fmtINR(p.coverage_amount)} icon={IndianRupee} accent />
              <InfoCard label="Issue Date"  value={p.issue_date}  icon={Calendar} />
              <InfoCard label="Expiry Date" value={p.expiry_date} icon={Calendar} />
            </div>
          </div>
        ))
      }

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Insurance Policy' : 'Edit Insurance Policy'}
          onClose={() => setModal(null)} onSubmit={handleSubmit}
          submitting={create.isPending || update.isPending}>
          <Field label="Policy Number" required>
            <Input placeholder="e.g. POL-2024-001" value={form.policy_number ?? ''} onChange={set('policy_number')} />
          </Field>
          <Field label="Insurance Company" required>
            <Input placeholder="Company name" value={form.insurance_company ?? ''} onChange={set('insurance_company')} />
          </Field>
          <Field label="Policy Type">
            <Select value={form.policy_type ?? ''} onChange={set('policy_type')}>
              <option value="">Select type</option>
              <option value="COMPREHENSIVE">Comprehensive</option>
              <option value="THIRD_PARTY">Third Party</option>
              <option value="FIRE_THEFT">Fire & Theft</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Premium Amount">
              <Input type="number" placeholder="₹" value={form.premium_amount ?? ''} onChange={set('premium_amount')} />
            </Field>
            <Field label="Coverage Amount">
              <Input type="number" placeholder="₹" value={form.coverage_amount ?? ''} onChange={set('coverage_amount')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Issue Date">
              <Input type="date" value={form.issue_date ?? ''} onChange={set('issue_date')} />
            </Field>
            <Field label="Expiry Date">
              <Input type="date" value={form.expiry_date ?? ''} onChange={set('expiry_date')} />
            </Field>
          </div>
          <Field label="Status">
            <Select value={form.status ?? ''} onChange={set('status')}>
              <option value="">Select status</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea placeholder="Additional notes..." value={form.notes ?? ''} onChange={set('notes')} />
          </Field>
        </Modal>
      )}

      {deleting && (
        <DeleteConfirm label="Insurance Policy" onClose={() => setDeleting(null)}
          onConfirm={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          deleting={del.isPending} />
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  MAINTENANCE TAB
// ═════════════════════════════════════════════════════════════════════════════
const MaintenanceTab = ({ v }) => {
  const vehicleId = v.id;
  const schedules = v.maintenance_schedules ?? [];
  const records   = v.maintenance_records   ?? [];

  const [schedModal, setSchedModal]   = useState(null);
  const [recModal, setRecModal]       = useState(null);
  const [deletingSched, setDeletingSched] = useState(null);
  const [deletingRec, setDeletingRec]   = useState(null);

  const createSched = useCreateMaintenanceSchedule();
  const updateSched = useUpdateMaintenanceSchedule();
  const delSched    = useDeleteMaintenanceSchedule();

  const createRec = useCreateMaintenanceRecord();
  const updateRec = useUpdateMaintenanceRecord();
  const delRec    = useDeleteMaintenanceRecord();

  const { form: schedForm, set: setS, reset: resetS } = useForm({});
  const { form: recForm,   set: setR, reset: resetR } = useForm({});

  const SCHED_COLORS = {
    SCHEDULED: 'bg-blue-50 text-blue-600 border-blue-200',
    COMPLETED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    OVERDUE:   'bg-red-50 text-red-600 border-red-200',
    CANCELLED: 'bg-gray-50 text-gray-500 border-gray-200',
  };

  return (
    <div className="space-y-8">
      {/* SCHEDULES */}
      <div>
        <SectionHeader icon={Wrench} title="Schedules" count={schedules.length}
          onAdd={() => { resetS({ vehicle: vehicleId }); setSchedModal({ mode: 'add' }); }} addLabel="Add Schedule" />
        {!schedules.length
          ? <EmptyState icon={Wrench} text="No maintenance schedules"
              onAdd={() => { resetS({ vehicle: vehicleId }); setSchedModal({ mode: 'add' }); }} addLabel="Add Schedule" />
          : <div className="space-y-3">
              {schedules.map(m => (
                <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#0052CC]/20 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-[#172B4D]">{m.maintenance_type_display ?? m.maintenance_type}</p>
                      {m.description && <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={SCHED_COLORS[m.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}>{m.status_display ?? m.status}</Badge>
                      <ItemActions
                        onEdit={() => { resetS({ ...m, vehicle: vehicleId }); setSchedModal({ mode: 'edit', data: m }); }}
                        onDelete={() => setDeletingSched(m)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <InfoCard label="Scheduled" value={m.scheduled_date} icon={Calendar} />
                    <InfoCard label="Next Due"  value={m.next_due_date}  icon={Calendar} />
                    <InfoCard label="Interval"  value={m.service_interval_km ? `${m.service_interval_km} km` : null} icon={Gauge} />
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {/* SERVICE RECORDS */}
      <div>
        <SectionHeader icon={ClipboardCheck} title="Service Records" count={records.length}
          onAdd={() => { resetR({ vehicle: vehicleId }); setRecModal({ mode: 'add' }); }} addLabel="Add Record" />
        {!records.length
          ? <EmptyState icon={ClipboardCheck} text="No service records"
              onAdd={() => { resetR({ vehicle: vehicleId }); setRecModal({ mode: 'add' }); }} addLabel="Add Record" />
          : <div className="space-y-3">
              {records.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#0052CC]/20 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-[#172B4D]">{r.service_type}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.service_provider}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {r.total_cost && (
                        <span className="font-black text-emerald-600 text-sm flex items-center gap-0.5">
                          <IndianRupee size={13} />{Number(r.total_cost).toLocaleString('en-IN')}
                        </span>
                      )}
                      <ItemActions
                        onEdit={() => { resetR({ ...r, vehicle: vehicleId }); setRecModal({ mode: 'edit', data: r }); }}
                        onDelete={() => setDeletingRec(r)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <InfoCard label="Service Date" value={r.service_date} icon={Calendar} />
                    <InfoCard label="Labor Hours"  value={r.labor_hours ? `${r.labor_hours} hrs` : null} />
                    <InfoCard label="Next Service" value={r.next_service_due} icon={Calendar} />
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Schedule Modal */}
      {schedModal && (
        <Modal title={schedModal.mode === 'add' ? 'Add Maintenance Schedule' : 'Edit Schedule'}
          onClose={() => setSchedModal(null)}
          onSubmit={() => {
            if (schedModal.mode === 'add') createSched.mutate(schedForm, { onSuccess: () => setSchedModal(null) });
            else updateSched.mutate({ id: schedModal.data.id, data: schedForm }, { onSuccess: () => setSchedModal(null) });
          }}
          submitting={createSched.isPending || updateSched.isPending}>
          <Field label="Maintenance Type" required>
            <Select value={schedForm.maintenance_type ?? ''} onChange={setS('maintenance_type')}>
              <option value="">Select type</option>
              <option value="OIL_CHANGE">Oil Change</option>
              <option value="TIRE_ROTATION">Tire Rotation</option>
              <option value="BRAKE_SERVICE">Brake Service</option>
              <option value="ENGINE_SERVICE">Engine Service</option>
              <option value="GENERAL">General</option>
            </Select>
          </Field>
          <Field label="Description">
            <Textarea placeholder="Describe the maintenance..." value={schedForm.description ?? ''} onChange={setS('description')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Scheduled Date">
              <Input type="date" value={schedForm.scheduled_date ?? ''} onChange={setS('scheduled_date')} />
            </Field>
            <Field label="Next Due Date">
              <Input type="date" value={schedForm.next_due_date ?? ''} onChange={setS('next_due_date')} />
            </Field>
          </div>
          <Field label="Service Interval (km)">
            <Input type="number" placeholder="e.g. 5000" value={schedForm.service_interval_km ?? ''} onChange={setS('service_interval_km')} />
          </Field>
          <Field label="Status">
            <Select value={schedForm.status ?? ''} onChange={setS('status')}>
              <option value="">Select status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </Field>
        </Modal>
      )}

      {/* Record Modal */}
      {recModal && (
        <Modal title={recModal.mode === 'add' ? 'Add Service Record' : 'Edit Service Record'}
          onClose={() => setRecModal(null)}
          onSubmit={() => {
            if (recModal.mode === 'add') createRec.mutate(recForm, { onSuccess: () => setRecModal(null) });
            else updateRec.mutate({ id: recModal.data.id, data: recForm }, { onSuccess: () => setRecModal(null) });
          }}
          submitting={createRec.isPending || updateRec.isPending}>
          <Field label="Service Type" required>
            <Input placeholder="e.g. Oil Change, Full Service" value={recForm.service_type ?? ''} onChange={setR('service_type')} />
          </Field>
          <Field label="Service Provider">
            <Input placeholder="Workshop or mechanic name" value={recForm.service_provider ?? ''} onChange={setR('service_provider')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Service Date">
              <Input type="date" value={recForm.service_date ?? ''} onChange={setR('service_date')} />
            </Field>
            <Field label="Next Service Due">
              <Input type="date" value={recForm.next_service_due ?? ''} onChange={setR('next_service_due')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Labor Hours">
              <Input type="number" placeholder="hrs" value={recForm.labor_hours ?? ''} onChange={setR('labor_hours')} />
            </Field>
            <Field label="Total Cost (₹)">
              <Input type="number" placeholder="₹" value={recForm.total_cost ?? ''} onChange={setR('total_cost')} />
            </Field>
          </div>
        </Modal>
      )}

      {deletingSched && (
        <DeleteConfirm label="Schedule" onClose={() => setDeletingSched(null)}
          onConfirm={() => delSched.mutate(deletingSched.id, { onSuccess: () => setDeletingSched(null) })}
          deleting={delSched.isPending} />
      )}
      {deletingRec && (
        <DeleteConfirm label="Service Record" onClose={() => setDeletingRec(null)}
          onConfirm={() => delRec.mutate(deletingRec.id, { onSuccess: () => setDeletingRec(null) })}
          deleting={delRec.isPending} />
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  INSPECTIONS TAB
// ═════════════════════════════════════════════════════════════════════════════
const InspectionsTab = ({ v }) => {
  const vehicleId = v.id;
  const items = v.inspections ?? [];

  const [modal, setModal]       = useState(null);
  const [deleting, setDeleting] = useState(null);

  const create = useCreateVehicleInspection();
  const update = useUpdateVehicleInspection();
  const del    = useDeleteVehicleInspection();

  const { form, set, reset } = useForm({});

  return (
    <div className="space-y-3">
      <SectionHeader icon={ClipboardCheck} title="Inspections" count={items.length}
        onAdd={() => { reset({ vehicle: vehicleId }); setModal({ mode: 'add' }); }} addLabel="Add Inspection" />
      {!items.length
        ? <EmptyState icon={ClipboardCheck} text="No inspections found"
            onAdd={() => { reset({ vehicle: vehicleId }); setModal({ mode: 'add' }); }} addLabel="Add Inspection" />
        : items.map(i => (
          <div key={i.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#0052CC]/20 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-[#172B4D]">{i.inspection_type_display ?? i.inspection_type}</p>
                {i.inspector_signature && <p className="text-xs text-gray-400 mt-0.5">Inspector: {i.inspector_signature}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={INSP_STATUS[i.overall_status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}>{i.overall_status}</Badge>
                <ItemActions
                  onEdit={() => { reset({ ...i, vehicle: vehicleId }); setModal({ mode: 'edit', data: i }); }}
                  onDelete={() => setDeleting(i)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <InfoCard label="Date"     value={i.inspection_date ? new Date(i.inspection_date).toLocaleDateString('en-IN') : null} icon={Calendar} />
              <InfoCard label="Odometer" value={fmtKm(i.odometer_reading)} icon={Gauge} />
              <InfoCard label="Resolved" value={i.resolved_date ?? (i.overall_status === 'PASS' ? 'N/A' : 'Pending')} />
            </div>
          </div>
        ))
      }

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Inspection' : 'Edit Inspection'}
          onClose={() => setModal(null)}
          onSubmit={() => {
            if (modal.mode === 'add') create.mutate(form, { onSuccess: () => setModal(null) });
            else update.mutate({ id: modal.data.id, data: form }, { onSuccess: () => setModal(null) });
          }}
          submitting={create.isPending || update.isPending}>
          <Field label="Inspection Type" required>
            <Select value={form.inspection_type ?? ''} onChange={set('inspection_type')}>
              <option value="">Select type</option>
              <option value="ROUTINE">Routine</option>
              <option value="SAFETY">Safety</option>
              <option value="EMISSION">Emission</option>
              <option value="ANNUAL">Annual</option>
            </Select>
          </Field>
          <Field label="Inspection Date" required>
            <Input type="date" value={form.inspection_date ?? ''} onChange={set('inspection_date')} />
          </Field>
          <Field label="Overall Status">
            <Select value={form.overall_status ?? ''} onChange={set('overall_status')}>
              <option value="">Select status</option>
              <option value="PASS">Pass</option>
              <option value="FAIL">Fail</option>
              <option value="PARTIAL">Partial</option>
            </Select>
          </Field>
          <Field label="Odometer Reading (km)">
            <Input type="number" placeholder="e.g. 75000" value={form.odometer_reading ?? ''} onChange={set('odometer_reading')} />
          </Field>
          <Field label="Inspector Signature">
            <Input placeholder="Inspector name" value={form.inspector_signature ?? ''} onChange={set('inspector_signature')} />
          </Field>
          <Field label="Resolved Date">
            <Input type="date" value={form.resolved_date ?? ''} onChange={set('resolved_date')} />
          </Field>
        </Modal>
      )}

      {deleting && (
        <DeleteConfirm label="Inspection" onClose={() => setDeleting(null)}
          onConfirm={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          deleting={del.isPending} />
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  FUEL LOGS TAB
// ═════════════════════════════════════════════════════════════════════════════
const FuelLogsTab = ({ v }) => {
  const vehicleId = v.id;
  const logs = v.fuel_logs ?? [];

  const [modal, setModal]       = useState(null);
  const [deleting, setDeleting] = useState(null);

  const create = useCreateFuelLog();
  const update = useUpdateFuelLog();
  const del    = useDeleteFuelLog();

  const { form, set, reset } = useForm({});

  const totalCost = logs.reduce((s, l) => s + (Number(l.total_cost) || 0), 0);

  return (
    <div className="space-y-4">
      <SectionHeader icon={Fuel} title="Fuel Logs" count={logs.length}
        onAdd={() => { reset({ vehicle: vehicleId }); setModal({ mode: 'add' }); }} addLabel="Add Fuel Log" />

      {logs.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-[#0052CC] to-[#0043A8] p-5 flex items-center justify-between shadow-lg shadow-blue-200">
          <div>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Total Fuel Spend</p>
            <p className="text-white text-2xl font-black mt-0.5 flex items-center gap-1"><IndianRupee size={18} />{totalCost.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center"><Fuel size={22} className="text-white" /></div>
        </div>
      )}

      {!logs.length
        ? <EmptyState icon={Fuel} text="No fuel logs found"
            onAdd={() => { reset({ vehicle: vehicleId }); setModal({ mode: 'add' }); }} addLabel="Add Fuel Log" />
        : <div className="space-y-3">
            {logs.map(l => (
              <div key={l.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#0052CC]/20 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-[#172B4D] text-sm">{l.fuel_date}</p>
                  <ItemActions
                    onEdit={() => { reset({ ...l, vehicle: vehicleId }); setModal({ mode: 'edit', data: l }); }}
                    onDelete={() => setDeleting(l)} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <InfoCard label="Date"       value={l.fuel_date}  icon={Calendar} />
                  <InfoCard label="Quantity"   value={l.quantity ? `${l.quantity} L` : null} icon={Fuel} />
                  <InfoCard label="Per Litre"  value={l.cost_per_litre ? `₹${l.cost_per_litre}` : null} icon={IndianRupee} />
                  <InfoCard label="Total Cost" value={fmtINR(l.total_cost)} icon={IndianRupee} accent />
                </div>
              </div>
            ))}
          </div>
      }

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Fuel Log' : 'Edit Fuel Log'}
          onClose={() => setModal(null)}
          onSubmit={() => {
            if (modal.mode === 'add') create.mutate(form, { onSuccess: () => setModal(null) });
            else update.mutate({ id: modal.data.id, data: form }, { onSuccess: () => setModal(null) });
          }}
          submitting={create.isPending || update.isPending}>
          <Field label="Fuel Date" required>
            <Input type="date" value={form.fuel_date ?? ''} onChange={set('fuel_date')} />
          </Field>
          <Field label="Fuel Type">
            <Select value={form.fuel_type ?? ''} onChange={set('fuel_type')}>
              <option value="">Select type</option>
              <option value="DIESEL">Diesel</option>
              <option value="PETROL">Petrol</option>
              <option value="CNG">CNG</option>
              <option value="LPG">LPG</option>
              <option value="ELECTRIC">Electric</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantity (L)" required>
              <Input type="number" step="0.01" placeholder="Litres" value={form.quantity ?? ''} onChange={set('quantity')} />
            </Field>
            <Field label="Cost per Litre (₹)">
              <Input type="number" step="0.01" placeholder="₹/L" value={form.cost_per_litre ?? ''} onChange={set('cost_per_litre')} />
            </Field>
          </div>
          <Field label="Total Cost (₹)">
            <Input type="number" placeholder="₹" value={form.total_cost ?? ''} onChange={set('total_cost')} />
          </Field>
          <Field label="Odometer at Fill (km)">
            <Input type="number" placeholder="km" value={form.odometer_reading ?? ''} onChange={set('odometer_reading')} />
          </Field>
          <Field label="Fuel Station">
            <Input placeholder="Station name/location" value={form.fuel_station ?? ''} onChange={set('fuel_station')} />
          </Field>
        </Modal>
      )}

      {deleting && (
        <DeleteConfirm label="Fuel Log" onClose={() => setDeleting(null)}
          onConfirm={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          deleting={del.isPending} />
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  TIRES TAB
// ═════════════════════════════════════════════════════════════════════════════
const TiresTab = ({ v }) => {
  const vehicleId = v.id;
  const tires = v.tires ?? [];

  const [modal, setModal]       = useState(null);
  const [deleting, setDeleting] = useState(null);

  const create = useCreateVehicleTire();
  const update = useUpdateVehicleTire();
  const del    = useDeleteVehicleTire();

  const { form, set, reset } = useForm({});

  return (
    <div>
      <SectionHeader icon={CircleDot} title="Tires" count={tires.length}
        onAdd={() => { reset({ vehicle: vehicleId }); setModal({ mode: 'add' }); }} addLabel="Add Tire" />
      {!tires.length
        ? <EmptyState icon={CircleDot} text="No tires found"
            onAdd={() => { reset({ vehicle: vehicleId }); setModal({ mode: 'add' }); }} addLabel="Add Tire" />
        : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tires.map(t => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#0052CC]/20 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
                  <div>
                    <p className="font-black text-[#172B4D]">{t.tire_brand}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">{t.tire_position_display ?? t.tire_position}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={t.status === 'INSTALLED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}>
                      {t.status_display ?? t.status}
                    </Badge>
                    <ItemActions
                      onEdit={() => { reset({ ...t, vehicle: vehicleId }); setModal({ mode: 'edit', data: t }); }}
                      onDelete={() => setDeleting(t)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard label="Serial No."  value={t.tire_serial_number} icon={Hash} />
                  <InfoCard label="Tread Depth" value={t.tread_depth ? `${t.tread_depth} mm` : null} />
                  <InfoCard label="Installed"   value={t.installation_date} icon={Calendar} />
                  <InfoCard label="Install Odo" value={fmtKm(t.installation_odometer)} icon={Gauge} />
                </div>
              </div>
            ))}
          </div>
      }

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Tire' : 'Edit Tire'}
          onClose={() => setModal(null)}
          onSubmit={() => {
            if (modal.mode === 'add') create.mutate(form, { onSuccess: () => setModal(null) });
            else update.mutate({ id: modal.data.id, data: form }, { onSuccess: () => setModal(null) });
          }}
          submitting={create.isPending || update.isPending}>
          <Field label="Tire Brand" required>
            <Input placeholder="e.g. MRF, CEAT, Apollo" value={form.tire_brand ?? ''} onChange={set('tire_brand')} />
          </Field>
          <Field label="Tire Position" required>
            <Select value={form.tire_position ?? ''} onChange={set('tire_position')}>
              <option value="">Select position</option>
              <option value="FRONT_LEFT">Front Left</option>
              <option value="FRONT_RIGHT">Front Right</option>
              <option value="REAR_LEFT">Rear Left</option>
              <option value="REAR_RIGHT">Rear Right</option>
              <option value="SPARE">Spare</option>
            </Select>
          </Field>
          <Field label="Serial Number">
            <Input placeholder="Tire serial number" value={form.tire_serial_number ?? ''} onChange={set('tire_serial_number')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tread Depth (mm)">
              <Input type="number" step="0.1" placeholder="mm" value={form.tread_depth ?? ''} onChange={set('tread_depth')} />
            </Field>
            <Field label="Status">
              <Select value={form.status ?? ''} onChange={set('status')}>
                <option value="">Select status</option>
                <option value="INSTALLED">Installed</option>
                <option value="SPARE">Spare</option>
                <option value="WORN">Worn</option>
                <option value="REPLACED">Replaced</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Installation Date">
              <Input type="date" value={form.installation_date ?? ''} onChange={set('installation_date')} />
            </Field>
            <Field label="Installation Odometer (km)">
              <Input type="number" placeholder="km" value={form.installation_odometer ?? ''} onChange={set('installation_odometer')} />
            </Field>
          </div>
        </Modal>
      )}

      {deleting && (
        <DeleteConfirm label="Tire" onClose={() => setDeleting(null)}
          onConfirm={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          deleting={del.isPending} />
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  ACCESSORIES TAB
// ═════════════════════════════════════════════════════════════════════════════
const AccessoriesTab = ({ v }) => {
  const vehicleId = v.id;
  const items = v.accessories ?? [];

  const [modal, setModal]       = useState(null);
  const [deleting, setDeleting] = useState(null);

  const create = useCreateVehicleAccessory();
  const update = useUpdateVehicleAccessory();
  const del    = useDeleteVehicleAccessory();

  const { form, set, reset } = useForm({});

  return (
    <div>
      <SectionHeader icon={Package} title="Accessories" count={items.length}
        onAdd={() => { reset({ vehicle: vehicleId }); setModal({ mode: 'add' }); }} addLabel="Add Accessory" />
      {!items.length
        ? <EmptyState icon={Package} text="No accessories found"
            onAdd={() => { reset({ vehicle: vehicleId }); setModal({ mode: 'add' }); }} addLabel="Add Accessory" />
        : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(a => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#0052CC]/20 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
                  <div>
                    <p className="font-black text-[#172B4D]">{a.accessory_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.accessory_type_display ?? a.accessory_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={a.status === 'INSTALLED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}>
                      {a.status}
                    </Badge>
                    <ItemActions
                      onEdit={() => { reset({ ...a, vehicle: vehicleId }); setModal({ mode: 'edit', data: a }); }}
                      onDelete={() => setDeleting(a)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard label="Serial No." value={a.serial_number}     icon={Hash} />
                  <InfoCard label="Installed"  value={a.installation_date} icon={Calendar} />
                  <InfoCard label="Warranty"   value={a.warranty_expiry}   icon={Calendar} />
                  {a.notes && <InfoCard label="Notes" value={a.notes} />}
                </div>
              </div>
            ))}
          </div>
      }

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Accessory' : 'Edit Accessory'}
          onClose={() => setModal(null)}
          onSubmit={() => {
            if (modal.mode === 'add') create.mutate(form, { onSuccess: () => setModal(null) });
            else update.mutate({ id: modal.data.id, data: form }, { onSuccess: () => setModal(null) });
          }}
          submitting={create.isPending || update.isPending}>
          <Field label="Accessory Name" required>
            <Input placeholder="e.g. GPS Tracker, Dashcam" value={form.accessory_name ?? ''} onChange={set('accessory_name')} />
          </Field>
          <Field label="Accessory Type">
            <Select value={form.accessory_type ?? ''} onChange={set('accessory_type')}>
              <option value="">Select type</option>
              <option value="GPS">GPS</option>
              <option value="CAMERA">Camera</option>
              <option value="SAFETY">Safety Equipment</option>
              <option value="COMFORT">Comfort</option>
              <option value="OTHER">Other</option>
            </Select>
          </Field>
          <Field label="Serial Number">
            <Input placeholder="Serial number" value={form.serial_number ?? ''} onChange={set('serial_number')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Installation Date">
              <Input type="date" value={form.installation_date ?? ''} onChange={set('installation_date')} />
            </Field>
            <Field label="Warranty Expiry">
              <Input type="date" value={form.warranty_expiry ?? ''} onChange={set('warranty_expiry')} />
            </Field>
          </div>
          <Field label="Status">
            <Select value={form.status ?? ''} onChange={set('status')}>
              <option value="">Select status</option>
              <option value="INSTALLED">Installed</option>
              <option value="REMOVED">Removed</option>
              <option value="FAULTY">Faulty</option>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea placeholder="Additional notes..." value={form.notes ?? ''} onChange={set('notes')} />
          </Field>
        </Modal>
      )}

      {deleting && (
        <DeleteConfirm label="Accessory" onClose={() => setDeleting(null)}
          onConfirm={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          deleting={del.isPending} />
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  TOLL TAGS TAB
// ═════════════════════════════════════════════════════════════════════════════
const TollTagsTab = ({ v }) => {
  const vehicleId = v.id;
  const tags = v.toll_tags ?? [];

  const [modal, setModal]       = useState(null);
  const [deleting, setDeleting] = useState(null);

  const create = useCreateVehicleTollTag();
  const update = useUpdateVehicleTollTag();
  const del    = useDeleteVehicleTollTag();

  const { form, set, reset } = useForm({});

  return (
    <div className="space-y-4">
      <SectionHeader icon={Tag} title="Toll Tags" count={tags.length}
        onAdd={() => { reset({ vehicle: vehicleId }); setModal({ mode: 'add' }); }} addLabel="Add Toll Tag" />
      {!tags.length
        ? <EmptyState icon={Tag} text="No toll tags found"
            onAdd={() => { reset({ vehicle: vehicleId }); setModal({ mode: 'add' }); }} addLabel="Add Toll Tag" />
        : tags.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#0052CC]/20 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
              <div>
                <p className="font-black text-[#172B4D] font-mono text-lg">{t.tag_number}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">{t.tag_provider}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={t.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'}>
                  <span className={`w-1.5 h-1.5 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  {t.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <ItemActions
                  onEdit={() => { reset({ ...t, vehicle: vehicleId }); setModal({ mode: 'edit', data: t }); }}
                  onDelete={() => setDeleting(t)} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <InfoCard label="Balance"  value={fmtINR(t.recharge_balance)} icon={IndianRupee} accent />
              <InfoCard label="Issued"   value={t.issue_date}  icon={Calendar} />
              <InfoCard label="Expiry"   value={t.expiry_date} icon={Calendar} />
              <InfoCard label="Bank A/C" value={t.linked_bank_account} icon={Hash} />
            </div>
          </div>
        ))
      }

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Toll Tag' : 'Edit Toll Tag'}
          onClose={() => setModal(null)}
          onSubmit={() => {
            if (modal.mode === 'add') create.mutate(form, { onSuccess: () => setModal(null) });
            else update.mutate({ id: modal.data.id, data: form }, { onSuccess: () => setModal(null) });
          }}
          submitting={create.isPending || update.isPending}>
          <Field label="Tag Number" required>
            <Input placeholder="FASTag/Toll tag number" value={form.tag_number ?? ''} onChange={set('tag_number')} />
          </Field>
          <Field label="Tag Provider">
            <Input placeholder="e.g. HDFC, SBI, ICICI" value={form.tag_provider ?? ''} onChange={set('tag_provider')} />
          </Field>
          <Field label="Recharge Balance (₹)">
            <Input type="number" placeholder="₹" value={form.recharge_balance ?? ''} onChange={set('recharge_balance')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Issue Date">
              <Input type="date" value={form.issue_date ?? ''} onChange={set('issue_date')} />
            </Field>
            <Field label="Expiry Date">
              <Input type="date" value={form.expiry_date ?? ''} onChange={set('expiry_date')} />
            </Field>
          </div>
          <Field label="Linked Bank Account">
            <Input placeholder="Account number" value={form.linked_bank_account ?? ''} onChange={set('linked_bank_account')} />
          </Field>
          <Field label="Active">
            <Select value={form.is_active !== undefined ? String(form.is_active) : ''} onChange={e => set('is_active')({ target: { value: e.target.value === 'true' } })}>
              <option value="">Select</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea placeholder="Additional notes..." value={form.notes ?? ''} onChange={set('notes')} />
          </Field>
        </Modal>
      )}

      {deleting && (
        <DeleteConfirm label="Toll Tag" onClose={() => setDeleting(null)}
          onConfirm={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          deleting={del.isPending} />
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  OWNERSHIP TAB
// ═════════════════════════════════════════════════════════════════════════════
const OwnershipTab = ({ v }) => {
  const vehicleId = v.id;
  const history = v.ownership_history ?? [];

  const [modal, setModal]       = useState(null);
  const [deleting, setDeleting] = useState(null);

  const create = useCreateVehicleOwnership();
  const update = useUpdateVehicleOwnership();
  const del    = useDeleteVehicleOwnership();

  const { form, set, reset } = useForm({});

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-[#0052CC]/5 to-white border border-[#0052CC]/15 rounded-2xl p-5">
        <SectionHeader icon={User} title="Current Ownership" />
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="Type"            value={v.ownership_type_display ?? v.ownership_type} />
          <InfoCard label="Purchase Date"   value={v.purchase_date} icon={Calendar} />
          <InfoCard label="Purchase Price"  value={fmtINR(v.purchase_price)} icon={IndianRupee} accent />
          <InfoCard label="Assigned Driver" value={driverName(v.assigned_driver) ?? 'Unassigned'} icon={User} />
        </div>
      </div>

      <div>
        <SectionHeader icon={History} title="Ownership History" count={history.length}
          onAdd={() => { reset({ vehicle: vehicleId }); setModal({ mode: 'add' }); }} addLabel="Add Record" />
        {!history.length
          ? <EmptyState icon={History} text="No ownership history"
              onAdd={() => { reset({ vehicle: vehicleId }); setModal({ mode: 'add' }); }} addLabel="Add Record" />
          : <div className="space-y-3">
              {history.map(h => (
                <div key={h.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#0052CC]/20 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-bold text-[#172B4D]">{h.owner_name}</p>
                    <ItemActions
                      onEdit={() => { reset({ ...h, vehicle: vehicleId }); setModal({ mode: 'edit', data: h }); }}
                      onDelete={() => setDeleting(h)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <InfoCard label="Owner" value={h.owner_name}             icon={User} />
                    <InfoCard label="From"  value={h.start_date}             icon={Calendar} />
                    <InfoCard label="To"    value={h.end_date ?? 'Present'}  icon={Calendar} />
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Ownership Record' : 'Edit Ownership Record'}
          onClose={() => setModal(null)}
          onSubmit={() => {
            if (modal.mode === 'add') create.mutate(form, { onSuccess: () => setModal(null) });
            else update.mutate({ id: modal.data.id, data: form }, { onSuccess: () => setModal(null) });
          }}
          submitting={create.isPending || update.isPending}>
          <Field label="Owner Name" required>
            <Input placeholder="Full name" value={form.owner_name ?? ''} onChange={set('owner_name')} />
          </Field>
          <Field label="Ownership Type">
            <Select value={form.ownership_type ?? ''} onChange={set('ownership_type')}>
              <option value="">Select type</option>
              <option value="OWNED">Owned</option>
              <option value="LEASED">Leased</option>
              <option value="RENTED">Rented</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" required>
              <Input type="date" value={form.start_date ?? ''} onChange={set('start_date')} />
            </Field>
            <Field label="End Date">
              <Input type="date" value={form.end_date ?? ''} onChange={set('end_date')} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea placeholder="Transfer details, etc." value={form.notes ?? ''} onChange={set('notes')} />
          </Field>
        </Modal>
      )}

      {deleting && (
        <DeleteConfirm label="Ownership Record" onClose={() => setDeleting(null)}
          onConfirm={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          deleting={del.isPending} />
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  OVERVIEW TAB  (unchanged)
// ═════════════════════════════════════════════════════════════════════════════
const OverviewTab = ({ v }) => {
  const st = STATUS_MAP[v.status] ?? STATUS_MAP.RETIRED;
  const activeInsurance = v.insurance_policies?.find(p => p.status === 'ACTIVE') ?? null;
  const nextMaint       = v.maintenance_schedules?.find(m => m.status === 'SCHEDULED') ?? null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Status',       value: v.status_display ?? v.status, color: st.color },
          { label: 'Odometer',     value: fmtKm(v.current_odometer) ?? '—', color: 'text-[#172B4D]' },
          { label: 'Insurance',    value: activeInsurance ? 'Active' : (v.insurance_policies?.length ? 'Expired' : 'None'),
            color: activeInsurance ? 'text-emerald-600' : 'text-red-500' },
          { label: 'Next Service', value: nextMaint?.scheduled_date ?? 'Not scheduled', color: 'text-[#172B4D]' },
        ].map(s => (
          <div key={s.label} className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-4">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{s.label}</p>
            <p className={`text-base font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
          <SectionHeader icon={Truck} title="Vehicle Details" />
          <div className="grid grid-cols-2 gap-2.5">
            <InfoCard label="Registration" value={v.registration_number} icon={Hash} accent />
            <InfoCard label="Make"         value={v.make}    icon={Truck} />
            <InfoCard label="Model"        value={v.model} />
            <InfoCard label="Year"         value={v.year}    icon={Calendar} />
            <InfoCard label="Type"         value={v.vehicle_type?.type_name} icon={Truck} />
            <InfoCard label="Fuel"         value={v.fuel_type_display ?? v.fuel_type} icon={Fuel} />
            <InfoCard label="Transmission" value={v.transmission_type_display ?? v.transmission_type} icon={Zap} />
            <InfoCard label="Color"        value={v.color}   icon={Palette} />
            <InfoCard label="VIN"          value={v.vehicle_identification_number} icon={Hash} />
            <InfoCard label="Odometer"     value={fmtKm(v.current_odometer)} icon={Gauge} />
            <InfoCard label="Status"       value={v.status_display ?? v.status} />
            <InfoCard label="Ownership"    value={v.ownership_type_display ?? v.ownership_type} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
            <SectionHeader icon={IndianRupee} title="Purchase Details" />
            <div className="grid grid-cols-2 gap-2.5">
              <InfoCard label="Purchase Date"  value={v.purchase_date} icon={Calendar} />
              <InfoCard label="Purchase Price" value={fmtINR(v.purchase_price)} icon={IndianRupee} accent />
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
            <SectionHeader icon={Gauge} title="Capacity" />
            <div className="grid grid-cols-2 gap-2.5">
              <InfoCard label="Tonnage" value={v.capacity_tonnage ? `${v.capacity_tonnage} T` : null} />
              <InfoCard label="Volume"  value={v.capacity_volume  ? `${v.capacity_volume} m³` : null} />
            </div>
          </div>
          {activeInsurance && (
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
              <SectionHeader icon={Shield} title="Active Insurance" />
              <p className="font-black text-[#172B4D] text-base font-mono">{activeInsurance.policy_number}</p>
              <p className="text-sm text-gray-500 mt-0.5">{activeInsurance.insurance_company} · {activeInsurance.policy_type_display}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-emerald-100">
                <span className="text-xs text-gray-400">Expires</span>
                <span className="text-xs font-bold text-emerald-600">{activeInsurance.expiry_date}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  VEHICLE HEADER
// ═════════════════════════════════════════════════════════════════════════════
const VehicleHeader = ({ v, onEdit, onToggle, updating }) => {
  const st   = STATUS_MAP[v.status] ?? STATUS_MAP.RETIRED;
  const fuel = FUEL_COLORS[v.fuel_type] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-6 flex flex-col md:flex-row gap-6">
        <div className="shrink-0">
          <div className="w-52 h-36 rounded-2xl bg-gradient-to-br from-[#0052CC] via-[#0043A8] to-[#172B4D]
            flex flex-col items-center justify-center gap-1.5 shadow-xl shadow-blue-200/60 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            <span className="text-[9px] font-black text-blue-300 tracking-[0.25em] uppercase z-10">
              {v.vehicle_type?.category ?? 'Fleet Vehicle'}
            </span>
            <span className="text-3xl font-black text-white tracking-widest font-mono z-10 drop-shadow">
              {v.registration_number}
            </span>
            <div className="flex items-center gap-2 z-10">
              {v.capacity_tonnage && <span className="text-[10px] text-blue-300 font-bold">{v.capacity_tonnage}T</span>}
              {v.vehicle_type?.type_name && <span className="text-[10px] text-blue-400 font-semibold">· {v.vehicle_type.type_name}</span>}
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-[#172B4D] leading-tight">
                  {v.make} <span className="text-[#0052CC]">{v.model}</span>
                </h1>
                <p className="text-sm text-gray-400 mt-0.5 font-medium">
                  {v.year && `Year ${v.year}`}
                  {v.vehicle_identification_number && ` · VIN: ${v.vehicle_identification_number}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={onEdit}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm shadow-blue-200">
                  <Edit2 size={14} /> Edit
                </button>
                {v.status === 'ACTIVE' && (
                  <button onClick={onToggle} disabled={updating}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all disabled:opacity-50">
                    <Pause size={14} /> Suspend
                  </button>
                )}
                {v.status === 'MAINTENANCE' && (
                  <button onClick={onToggle} disabled={updating}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all disabled:opacity-50">
                    <Play size={14} /> Activate
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge className={`${st.bg} ${st.color} ${st.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {v.status_display ?? v.status}
              </Badge>
              {v.ownership_type && <Badge className="bg-blue-50 text-blue-600 border-blue-200">{v.ownership_type_display ?? v.ownership_type}</Badge>}
              {v.fuel_type && <Badge className={`border ${fuel}`}><Fuel size={10} /> {v.fuel_type_display ?? v.fuel_type}</Badge>}
              {v.transmission_type && <Badge className="bg-gray-100 text-gray-600 border-gray-200"><Zap size={10} /> {v.transmission_type_display ?? v.transmission_type}</Badge>}
              {v.color && <Badge className="bg-gray-100 text-gray-600 border-gray-200"><Palette size={10} /> {v.color}</Badge>}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Odometer', value: fmtKm(v.current_odometer), icon: Gauge },
              { label: 'Tonnage',  value: v.capacity_tonnage ? `${v.capacity_tonnage} T` : null, icon: Truck },
              { label: 'Driver',   value: driverName(v.assigned_driver), icon: User },
              { label: 'Purchase', value: fmtINR(v.purchase_price), icon: IndianRupee },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-2.5 border border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-[#0052CC]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                  <p className="text-xs font-bold text-[#172B4D] truncate">{value ?? '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  TAB CONTENT ROUTER
// ═════════════════════════════════════════════════════════════════════════════
const TabContent = ({ tab, v }) => {
  const map = {
    overview:    OverviewTab,
    documents:   DocumentsTab,
    insurance:   InsuranceTab,
    maintenance: MaintenanceTab,
    inspections: InspectionsTab,
    fuel:        FuelLogsTab,
    tires:       TiresTab,
    accessories: AccessoriesTab,
    tolltags:    TollTagsTab,
    ownership:   OwnershipTab,
  };
  const C = map[tab];
  return C ? <C v={v} /> : null;
};

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const VehicleDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: v, isLoading, isError, error, refetch } = useVehicle(id);
  const updateVehicle = useUpdateVehicle();

  const handleToggle = () => {
    if (!v) return;
    updateVehicle.mutate({ id: v.id, data: { status: v.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE' } });
  };
  const handleEdit = () => navigate(`/tenant/dashboard/vehicles/${id}/edit`);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Loader2 size={32} className="animate-spin text-[#0052CC]" />
        <span className="text-sm font-medium">Loading vehicle details...</span>
      </div>
    </div>
  );

  if (isError) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3 text-red-400">
        <AlertCircle size={36} />
        <p className="text-sm font-semibold">Failed to load vehicle</p>
        <p className="text-xs text-gray-400">{error?.message}</p>
        <button onClick={() => refetch()} className="px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl mt-1">Retry</button>
      </div>
    </div>
  );

  if (!v) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <Loader2 size={32} className="animate-spin text-[#0052CC]" />
    </div>
  );

  const countFor = (key) => {
    if (!key) return null;
    const val = v[key];
    return Array.isArray(val) ? val.length : null;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto p-6 space-y-5">

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={() => navigate('/tenant/dashboard/vehicles')}
            className="flex items-center gap-1.5 font-bold text-[#0052CC] hover:underline">
            <ArrowLeft size={14} /> Vehicles
          </button>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-[#172B4D]">{v.registration_number}</span>
        </div>

        <VehicleHeader v={v} onEdit={handleEdit} onToggle={handleToggle} updating={updateVehicle.isPending} />

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
            {TABS.map(tab => {
              const count    = countFor(tab.key);
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 text-[12px] font-bold whitespace-nowrap border-b-2 transition-all shrink-0
                    ${isActive
                      ? 'border-[#0052CC] text-[#0052CC] bg-blue-50/60'
                      : 'border-transparent text-gray-400 hover:text-[#172B4D] hover:bg-gray-50'}`}>
                  <tab.icon size={14} />
                  {tab.label}
                  {count != null && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none
                      ${isActive ? 'bg-[#0052CC] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="p-6 bg-gray-50/30">
            <TabContent tab={activeTab} v={v} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default VehicleDetail;
