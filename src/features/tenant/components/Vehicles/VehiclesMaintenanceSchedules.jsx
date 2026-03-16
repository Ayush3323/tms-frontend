import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, RefreshCw, Loader2, AlertCircle, X,
  ChevronDown, Search, Pencil, Trash2,
  Wrench, Calendar, Gauge, Clock, CheckCircle,
  AlertTriangle, XCircle, ClipboardList, IndianRupee,
  Package
} from 'lucide-react';
import {
  useMaintenanceSchedules,
  useCreateMaintenanceSchedule,
  useUpdateMaintenanceSchedule,
  useDeleteMaintenanceSchedule,
  useMaintenanceRecords,
  useCreateMaintenanceRecord,
  useUpdateMaintenanceRecord,
  useDeleteMaintenanceRecord,
} from '../../queries/vehicles/vehicleInfoQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';

// ── Constants ─────────────────────────────────────────────────────────
const MAINTENANCE_TYPES = [
  'OIL_CHANGE', 'TIRE_ROTATION', 'BRAKE_SERVICE', 'ENGINE_SERVICE',
  'TRANSMISSION', 'BATTERY', 'INSPECTION', 'GENERAL',
];

const STATUS_OPTIONS = ['SCHEDULED', 'COMPLETED', 'OVERDUE', 'CANCELLED'];

const STATUS_STYLES = {
  SCHEDULED: { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200',    dot: 'bg-blue-500' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  OVERDUE:   { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     dot: 'bg-red-500' },
  CANCELLED: { bg: 'bg-gray-50',    text: 'text-gray-500',    border: 'border-gray-200',    dot: 'bg-gray-400' },
};

const EMPTY_SCHEDULE = {
  vehicle: '', maintenance_type: '', description: '', scheduled_date: '',
  completed_date: '', odometer_reading: '', next_due_date: '',
  next_due_odometer: '', service_interval_km: '', status: 'SCHEDULED',
};

const EMPTY_RECORD = {
  vehicle: '', schedule: '', service_type: '', service_provider: '',
  odometer_reading: '', labor_hours: '', total_cost: '',
  service_date: '', next_service_due: '', notes: '',
  parts_replaced: [],
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

const FormSec = ({ title }) => (
  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pt-1">{title}</p>
);

// ── Helpers ───────────────────────────────────────────────────────────
const vehicleDisplay = (v) => {
  if (!v) return '—';
  if (typeof v === 'object') return v.registration_number ?? '—';
  return v;
};

const daysUntil = (date) => {
  if (!date) return null;
  return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
};

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

// ── Schedule Modal ────────────────────────────────────────────────────
const ScheduleModal = ({ initial, onClose }) => {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(initial ? {
    vehicle:             typeof initial.vehicle === 'object' ? (initial.vehicle?.id ?? '') : (initial.vehicle ?? ''),
    maintenance_type:    initial.maintenance_type    ?? '',
    description:         initial.description         ?? '',
    scheduled_date:      initial.scheduled_date      ?? '',
    completed_date:      initial.completed_date      ?? '',
    odometer_reading:    initial.odometer_reading    ?? '',
    next_due_date:       initial.next_due_date       ?? '',
    next_due_odometer:   initial.next_due_odometer   ?? '',
    service_interval_km: initial.service_interval_km ?? '',
    status:              initial.status              ?? 'SCHEDULED',
  } : EMPTY_SCHEDULE);

  const create = useCreateMaintenanceSchedule();
  const update = useUpdateMaintenanceSchedule();
  const isPending = create.isPending || update.isPending;
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    if (isEdit) update.mutate({ id: initial.id, data: clean }, { onSuccess: onClose });
    else create.mutate(clean, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">{isEdit ? 'Edit Schedule' : 'Add Schedule'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? 'Update schedule details' : 'Create a new maintenance schedule'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <FormSec title="Vehicle & Type" />
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Vehicle</Label><VehicleSelect value={form.vehicle} onChange={(id) => setForm(p => ({ ...p, vehicle: id }))} /></div>
            <div>
              <Label required>Maintenance Type</Label>
              <Sel value={form.maintenance_type} onChange={set('maintenance_type')}>
                <option value="">Select type</option>
                {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </Sel>
            </div>
            <div>
              <Label>Status</Label>
              <Sel value={form.status} onChange={set('status')}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </Sel>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <textarea value={form.description ?? ''} onChange={set('description')} rows={2} placeholder="Brief description..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
          </div>

          <FormSec title="Schedule Dates" />
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>Scheduled Date</Label><Input type="date" value={form.scheduled_date} onChange={set('scheduled_date')} /></div>
            <div><Label>Completed Date</Label><Input type="date" value={form.completed_date ?? ''} onChange={set('completed_date')} /></div>
            <div><Label>Next Due Date</Label><Input type="date" value={form.next_due_date ?? ''} onChange={set('next_due_date')} /></div>
            <div><Label>Service Interval (km)</Label><Input type="number" placeholder="e.g. 10000" value={form.service_interval_km ?? ''} onChange={set('service_interval_km')} /></div>
          </div>

          <FormSec title="Odometer" />
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Current Odometer (km)</Label><Input type="number" placeholder="e.g. 45000" value={form.odometer_reading ?? ''} onChange={set('odometer_reading')} /></div>
            <div><Label>Next Due Odometer (km)</Label><Input type="number" placeholder="e.g. 55000" value={form.next_due_odometer ?? ''} onChange={set('next_due_odometer')} /></div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.maintenance_type || !form.scheduled_date || isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> {isEdit ? 'Update Schedule' : 'Add Schedule'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Record Modal ──────────────────────────────────────────────────────
const RecordModal = ({ initial, onClose }) => {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(initial ? {
    vehicle:          typeof initial.vehicle === 'object' ? (initial.vehicle?.id ?? '') : (initial.vehicle ?? ''),
    schedule:         initial.schedule ?? '',
    service_type:     initial.service_type     ?? '',
    service_provider: initial.service_provider ?? '',
    odometer_reading: initial.odometer_reading ?? '',
    labor_hours:      initial.labor_hours      ?? '',
    total_cost:       initial.total_cost       ?? '',
    service_date:     initial.service_date     ?? '',
    next_service_due: initial.next_service_due ?? '',
    notes:            initial.notes            ?? '',
    parts_replaced:   initial.parts_replaced   ?? [],
  } : EMPTY_RECORD);

  // Parts state
  const [newPart, setNewPart] = useState({ part_name: '', quantity: '', cost: '' });

  const create = useCreateMaintenanceRecord();
  const update = useUpdateMaintenanceRecord();
  const isPending = create.isPending || update.isPending;
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const addPart = () => {
    if (!newPart.part_name) return;
    setForm(p => ({ ...p, parts_replaced: [...p.parts_replaced, { ...newPart, quantity: Number(newPart.quantity) || 1, cost: Number(newPart.cost) || 0 }] }));
    setNewPart({ part_name: '', quantity: '', cost: '' });
  };

  const removePart = (i) => setForm(p => ({ ...p, parts_replaced: p.parts_replaced.filter((_, idx) => idx !== i) }));

  const handleSubmit = () => {
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    if (isEdit) update.mutate({ id: initial.id, data: clean }, { onSuccess: onClose });
    else create.mutate(clean, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">{isEdit ? 'Edit Record' : 'Add Service Record'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? 'Update service record' : 'Log a completed maintenance'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <FormSec title="Vehicle & Service" />
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Vehicle</Label><VehicleSelect value={form.vehicle} onChange={(id) => setForm(p => ({ ...p, vehicle: id }))} /></div>
            <div><Label required>Service Type</Label><Input placeholder="e.g. Brake Service" value={form.service_type} onChange={set('service_type')} /></div>
            <div><Label>Service Provider</Label><Input placeholder="e.g. Local Garage" value={form.service_provider} onChange={set('service_provider')} /></div>
          </div>

          <FormSec title="Dates & Cost" />
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>Service Date</Label><Input type="date" value={form.service_date} onChange={set('service_date')} /></div>
            <div><Label>Next Service Due</Label><Input type="date" value={form.next_service_due ?? ''} onChange={set('next_service_due')} /></div>
            <div><Label>Odometer (km)</Label><Input type="number" placeholder="e.g. 18000" value={form.odometer_reading ?? ''} onChange={set('odometer_reading')} /></div>
            <div><Label>Labor Hours</Label><Input type="number" placeholder="e.g. 3" value={form.labor_hours ?? ''} onChange={set('labor_hours')} /></div>
            <div><Label>Total Cost (₹)</Label><Input type="number" placeholder="e.g. 8000" value={form.total_cost ?? ''} onChange={set('total_cost')} /></div>
          </div>

          <FormSec title="Parts Replaced" />
          <div className="space-y-3">
            {/* Parts list */}
            {form.parts_replaced.length > 0 && (
              <div className="space-y-2">
                {form.parts_replaced.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <span className="flex-1 text-sm font-semibold text-[#172B4D]">{p.part_name}</span>
                    <span className="text-xs text-gray-400">× {p.quantity}</span>
                    {p.cost > 0 && <span className="text-xs text-emerald-600 font-semibold">₹{Number(p.cost).toLocaleString('en-IN')}</span>}
                    <button onClick={() => removePart(i)} className="text-red-400 hover:text-red-600 transition-colors"><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}
            {/* Add part row */}
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <Input placeholder="Part name" value={newPart.part_name} onChange={e => setNewPart(p => ({ ...p, part_name: e.target.value }))} />
              </div>
              <Input placeholder="Qty" type="number" value={newPart.quantity} onChange={e => setNewPart(p => ({ ...p, quantity: e.target.value }))} />
              <Input placeholder="Cost ₹" type="number" value={newPart.cost} onChange={e => setNewPart(p => ({ ...p, cost: e.target.value }))} />
            </div>
            <button onClick={addPart} disabled={!newPart.part_name}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-40 transition-all">
              <Plus size={12} /> Add Part
            </button>
          </div>

          <FormSec title="Notes" />
          <textarea value={form.notes ?? ''} onChange={set('notes')} rows={2} placeholder="Any additional notes..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.service_type || !form.service_date || isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> {isEdit ? 'Update Record' : 'Add Record'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Modal ──────────────────────────────────────────────────────
const DeleteModal = ({ item, label, onDelete, onClose, isPending }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
      <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto">
        <Trash2 size={22} className="text-red-500" />
      </div>
      <div className="text-center">
        <h2 className="text-base font-black text-[#172B4D]">Delete {label}?</h2>
        <p className="text-sm text-gray-400 mt-1">This will be <span className="font-semibold text-gray-700">permanently deleted</span>.</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
        <button onClick={onDelete} disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50">
          {isPending ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : <><Trash2 size={14} /> Delete</>}
        </button>
      </div>
    </div>
  </div>
);

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

// ── Schedules Table ───────────────────────────────────────────────────
const SchedulesTab = ({ onEdit, onDelete }) => {
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [typeFilter, setType]     = useState('');

  const { data, isLoading, isError, error, refetch } = useMaintenanceSchedules({
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter   && { maintenance_type: typeFilter }),
    ...(search       && { search }),
  });

  const schedules = data?.results ?? data ?? [];

  return (
    <div>
      {/* Filters */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search vehicle, type..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50" />
        </div>
        {[
          { val: statusFilter, set: setStatus, opts: STATUS_OPTIONS,    ph: 'All Status' },
          { val: typeFilter,   set: setType,   opts: MAINTENANCE_TYPES, ph: 'All Types' },
        ].map(({ val, set, opts, ph }) => (
          <div key={ph} className="relative">
            <select value={val} onChange={e => set(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer">
              <option value="">{ph}</option>
              {opts.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        ))}
        <button onClick={() => { setSearch(''); setStatus(''); setType(''); }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100">
          <RefreshCw size={13} /> Reset
        </button>
      </div>

      {isLoading && <div className="flex items-center justify-center py-16 gap-3 text-gray-400"><Loader2 size={20} className="animate-spin text-[#0052CC]" /><span className="text-sm">Loading...</span></div>}
      {isError && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
          <AlertCircle size={32} /><p className="text-sm font-medium">Failed to load schedules</p>
          <p className="text-xs text-gray-400">{error?.response?.data?.detail || error?.message}</p>
          <button onClick={() => refetch()} className="px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg">Try Again</button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Vehicle', 'Type', 'Scheduled', 'Next Due', 'Odometer', 'Interval', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {schedules.map(s => {
                const st      = STATUS_STYLES[s.status] ?? STATUS_STYLES.SCHEDULED;
                const days    = daysUntil(s.next_due_date);
                const urgency = days !== null && days <= 7 && s.status === 'SCHEDULED';
                return (
                  <tr key={s.id} className={`hover:bg-blue-50/30 transition-colors ${urgency ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-[#172B4D] font-mono text-[13px]">{vehicleDisplay(s.vehicle)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center">
                          <Wrench size={11} className="text-[#0052CC]" />
                        </div>
                        <span className="text-[12px] font-semibold text-gray-700">{s.maintenance_type_display ?? s.maintenance_type?.replace(/_/g, ' ') ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="flex items-center gap-1 text-gray-600 text-[12px]"><Calendar size={11} className="text-gray-300" />{s.scheduled_date ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {s.next_due_date ? (
                        <div>
                          <span className="flex items-center gap-1 text-gray-600 text-[12px]"><Calendar size={11} className="text-gray-300" />{s.next_due_date}</span>
                          {days !== null && s.status === 'SCHEDULED' && (
                            <span className={`text-[10px] font-bold mt-0.5 block ${days < 0 ? 'text-red-500' : days <= 7 ? 'text-orange-500' : 'text-gray-400'}`}>
                              {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                            </span>
                          )}
                        </div>
                      ) : <span className="text-gray-300 text-[12px]">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {s.odometer_reading
                        ? <span className="flex items-center gap-1 text-gray-600 font-mono text-[12px]"><Gauge size={11} className="text-gray-300" />{Number(s.odometer_reading).toLocaleString('en-IN')} km</span>
                        : <span className="text-gray-300 text-[12px]">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {s.service_interval_km
                        ? <span className="text-[12px] text-gray-600 font-mono">{Number(s.service_interval_km).toLocaleString('en-IN')} km</span>
                        : <span className="text-gray-300 text-[12px]">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit border ${st.bg} ${st.text} ${st.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{s.status_display ?? s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(s)} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => onDelete(s)} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {schedules.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-400">
                  <Wrench size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No schedules found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Showing <span className="font-bold text-gray-600">{schedules.length}</span>{data?.count && data.count !== schedules.length && <> of <span className="font-bold text-gray-600">{data.count}</span></>} schedules</span>
          <span className="text-[11px]">Fleet Management System</span>
        </div>
      )}
    </div>
  );
};

// ── Records Table ─────────────────────────────────────────────────────
const RecordsTab = ({ onEdit, onDelete }) => {
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useMaintenanceRecords({
    ...(search && { search }),
  });

  const records = data?.results ?? data ?? [];

  return (
    <div>
      {/* Filters */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search service type, provider..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50" />
        </div>
        <button onClick={() => setSearch('')}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100">
          <RefreshCw size={13} /> Reset
        </button>
      </div>

      {isLoading && <div className="flex items-center justify-center py-16 gap-3 text-gray-400"><Loader2 size={20} className="animate-spin text-[#0052CC]" /><span className="text-sm">Loading...</span></div>}
      {isError && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
          <AlertCircle size={32} /><p className="text-sm font-medium">Failed to load records</p>
          <p className="text-xs text-gray-400">{error?.response?.data?.detail || error?.message}</p>
          <button onClick={() => refetch()} className="px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg">Try Again</button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Vehicle', 'Service Type', 'Provider', 'Date', 'Odometer', 'Labor Hrs', 'Total Cost', 'Next Service', 'Parts', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-bold text-[#172B4D] font-mono text-[13px]">{vehicleDisplay(r.vehicle)}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                        <ClipboardList size={11} className="text-emerald-600" />
                      </div>
                      <span className="text-[12px] font-semibold text-gray-700">{r.service_type ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="text-[12px] text-gray-600">{r.service_provider ?? '—'}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-gray-600 text-[12px]"><Calendar size={11} className="text-gray-300" />{r.service_date ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.odometer_reading
                      ? <span className="flex items-center gap-1 text-gray-600 font-mono text-[12px]"><Gauge size={11} className="text-gray-300" />{Number(r.odometer_reading).toLocaleString('en-IN')} km</span>
                      : <span className="text-gray-300 text-[12px]">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[12px] text-gray-600">{r.labor_hours ? `${r.labor_hours} hrs` : '—'}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.total_cost
                      ? <span className="flex items-center gap-0.5 text-emerald-600 font-bold text-[12px]"><IndianRupee size={11} />{Number(r.total_cost).toLocaleString('en-IN')}</span>
                      : <span className="text-gray-300 text-[12px]">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-gray-600 text-[12px]"><Calendar size={11} className="text-gray-300" />{r.next_service_due ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.parts_replaced?.length > 0
                      ? <span className="flex items-center gap-1 text-[12px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full w-fit">
                          <Package size={11} /> {r.parts_replaced.length}
                        </span>
                      : <span className="text-gray-300 text-[12px]">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onEdit(r)} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => onDelete(r)} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-16 text-center text-gray-400">
                  <ClipboardList size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No service records found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Showing <span className="font-bold text-gray-600">{records.length}</span>{data?.count && data.count !== records.length && <> of <span className="font-bold text-gray-600">{data.count}</span></>} records</span>
          <span className="text-[11px]">Fleet Management System</span>
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────
const MaintenanceSchedules = () => {
  const [activeTab, setActiveTab]       = useState('schedules');
  const [scheduleModal, setSchedModal]  = useState(null);
  const [recordModal, setRecordModal]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'schedule'|'record', item }

  // For stat cards
  const { data: schedData, isLoading: schedLoading } = useMaintenanceSchedules();
  const { data: recData,   isLoading: recLoading   } = useMaintenanceRecords();

  const schedules = schedData?.results ?? schedData ?? [];
  const records   = recData?.results   ?? recData   ?? [];

  const totalSched    = schedData?.count ?? schedules.length;
  const totalRec      = recData?.count   ?? records.length;
  const scheduled     = schedules.filter(s => s.status === 'SCHEDULED').length;
  const completed     = schedules.filter(s => s.status === 'COMPLETED').length;
  const overdue       = schedules.filter(s => s.status === 'OVERDUE').length;

  const delSchedule = useDeleteMaintenanceSchedule();
  const delRecord   = useDeleteMaintenanceRecord();

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'schedule') {
      delSchedule.mutate(deleteTarget.item.id, { onSuccess: () => setDeleteTarget(null) });
    } else {
      delRecord.mutate(deleteTarget.item.id, { onSuccess: () => setDeleteTarget(null) });
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-screen">

      {/* Modals */}
      {(scheduleModal === 'add' || (scheduleModal && scheduleModal !== 'add')) && (
        <ScheduleModal initial={scheduleModal === 'add' ? null : scheduleModal} onClose={() => setSchedModal(null)} />
      )}
      {(recordModal === 'add' || (recordModal && recordModal !== 'add')) && (
        <RecordModal initial={recordModal === 'add' ? null : recordModal} onClose={() => setRecordModal(null)} />
      )}
      {deleteTarget && (
        <DeleteModal
          item={deleteTarget.item}
          label={deleteTarget.type === 'schedule' ? 'Schedule' : 'Record'}
          onDelete={handleDelete}
          onClose={() => setDeleteTarget(null)}
          isPending={delSchedule.isPending || delRecord.isPending}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Maintenance</h1>
          <p className="text-sm text-gray-400 mt-0.5">Schedules & service records for all vehicles</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSchedModal('add')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all shadow-sm">
            <Plus size={15} /> Add Schedule
          </button>
          <button onClick={() => setRecordModal('add')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all">
            <Plus size={15} /> Add Record
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard loading={schedLoading} label="Schedules"  value={totalSched} icon={Wrench}        color={{ value: 'text-[#172B4D]',  iconBg: 'bg-blue-50',    iconText: 'text-blue-500' }} />
        <StatCard loading={schedLoading} label="Scheduled"  value={scheduled}  icon={Clock}         color={{ value: 'text-blue-600',   iconBg: 'bg-blue-50',    iconText: 'text-blue-500' }} />
        <StatCard loading={schedLoading} label="Completed"  value={completed}  icon={CheckCircle}   color={{ value: 'text-emerald-600',iconBg: 'bg-emerald-50', iconText: 'text-emerald-500' }} />
        <StatCard loading={schedLoading} label="Overdue"    value={overdue}    icon={AlertTriangle} color={{ value: 'text-red-500',    iconBg: 'bg-red-50',     iconText: 'text-red-400' }} />
        <StatCard loading={recLoading}   label="Records"    value={totalRec}   icon={ClipboardList} color={{ value: 'text-purple-600', iconBg: 'bg-purple-50',  iconText: 'text-purple-500' }} />
      </div>

      {/* Tabs Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* Tab header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setActiveTab('schedules')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all
                ${activeTab === 'schedules' ? 'bg-white text-[#0052CC] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <Wrench size={14} /> Schedules
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full
                ${activeTab === 'schedules' ? 'bg-[#0052CC] text-white' : 'bg-gray-200 text-gray-500'}`}>
                {totalSched}
              </span>
            </button>
            <button onClick={() => setActiveTab('records')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all
                ${activeTab === 'records' ? 'bg-white text-[#0052CC] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <ClipboardList size={14} /> Service Records
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full
                ${activeTab === 'records' ? 'bg-[#0052CC] text-white' : 'bg-gray-200 text-gray-500'}`}>
                {totalRec}
              </span>
            </button>
          </div>
          <button
            onClick={() => activeTab === 'schedules' ? setSchedModal('add') : setRecordModal('add')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
            <Plus size={14} /> {activeTab === 'schedules' ? 'Add Schedule' : 'Add Record'}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'schedules' && (
          <SchedulesTab
            onEdit={(s) => setSchedModal(s)}
            onDelete={(s) => setDeleteTarget({ type: 'schedule', item: s })}
          />
        )}
        {activeTab === 'records' && (
          <RecordsTab
            onEdit={(r) => setRecordModal(r)}
            onDelete={(r) => setDeleteTarget({ type: 'record', item: r })}
          />
        )}
      </div>
    </div>
  );
};

export default MaintenanceSchedules;
