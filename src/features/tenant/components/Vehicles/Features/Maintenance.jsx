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
} from '../../../queries/vehicles/vehicleInfoQuery';
import {
  Badge, InfoCard, SectionHeader, EmptyState, Modal, DeleteConfirm, ItemActions,
  Label, Input, Sel, Section, Field, StatCard, Textarea, VehicleSelect,
  fmtDate, fmtKm, fmtINR
} from '../Common/VehicleCommon';
import { TabContentShimmer, ErrorState } from '../Common/StateFeedback';

// ── Constants ─────────────────────────────────────────────────────────
const MAINTENANCE_TYPES = [
  'SERVICE', 'INSPECTION', 'REPAIR', 'REPLACEMENT',
];

const STATUS_OPTIONS = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'];

const STATUS_STYLES = {
  SCHEDULED: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', dot: 'bg-blue-500' },
  IN_PROGRESS: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', dot: 'bg-purple-500' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  OVERDUE: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' },
  CANCELLED: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-400' },
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
const FormSec = ({ title }) => (
  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pt-1">{title}</p>
);

const vehicleDisplay = (v, item) => {
  if (!v) return '—';
  if (typeof v === 'object') return v.registration_number ?? '—';
  return item?.vehicle_registration_number ?? item?.vehicle_registration ?? item?.vehicle_display ?? v;
};

const daysUntil = (date) => {
  if (!date) return null;
  return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
};


// ─── Detail Views ─────────────────────────────────────────────────────────────
const ScheduleDetailView = ({ data, onClose }) => {
  const st = STATUS_STYLES[data.status] ?? STATUS_STYLES.SCHEDULED;
  const days = daysUntil(data.next_due_date);

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Maintenance Type</p>
          <span className="text-[14px] font-bold text-[#172B4D]">{data.maintenance_type_display ?? data.maintenance_type?.replace(/_/g, ' ') ?? '—'}</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
          <Badge className={`${st.bg} ${st.text} ${st.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {data.status_display ?? data.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vehicle</p>
          <p className="text-sm font-bold text-[#172B4D] font-mono uppercase">{vehicleDisplay(data.vehicle, data)}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Description</p>
          <p className="text-sm text-gray-600">{data.description || 'No description provided.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Scheduled Date</p>
          <span className="flex items-center gap-1.5 text-sm text-gray-700 font-semibold">
            <Calendar size={13} className="text-gray-400" />
            {fmtDate(data.scheduled_date)}
          </span>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Completed Date</p>
          <span className="text-sm text-emerald-600 font-bold">{fmtDate(data.completed_date) || 'Not completed'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Odometer Reading</p>
          <span className="flex items-center gap-1.5 text-sm text-gray-700 font-bold font-mono">
            <Gauge size={13} className="text-gray-400" />
            {fmtKm(data.odometer_reading)}
          </span>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Next Due Date</p>
          <div>
            <span className="flex items-center gap-1.5 text-sm text-gray-700 font-bold">
              <Calendar size={13} className="text-gray-400" />
              {fmtDate(data.next_due_date)}
            </span>
            {days !== null && data.status === 'SCHEDULED' && (
              <span className={`text-[10px] font-black mt-1 block uppercase ${days < 0 ? 'text-red-500' : days <= 7 ? 'text-orange-500' : 'text-gray-400'}`}>
                {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-[#0052CC] bg-blue-50 rounded-xl hover:bg-blue-100 transition-all">
          Close
        </button>
      </div>
    </div>
  );
};

const RecordDetailView = ({ data, onClose }) => {
  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Service Type</p>
          <p className="text-[14px] font-bold text-[#172B4D]">{data.service_type || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Service Provider</p>
          <p className="text-sm text-gray-600 font-semibold">{data.service_provider || '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vehicle</p>
          <p className="text-sm font-bold text-[#172B4D] font-mono uppercase">{vehicleDisplay(data.vehicle, data)}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Service Date</p>
          <span className="flex items-center gap-1.5 text-sm text-gray-700 font-bold">
            <Calendar size={13} className="text-gray-400" />
            {fmtDate(data.service_date)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <span className="flex items-center gap-1.5 text-sm text-gray-700 font-bold font-mono">
            <Gauge size={13} className="text-gray-400" />
            {fmtKm(data.odometer_reading)}
          </span>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Labor Hours</p>
          <span className="flex items-center gap-1.5 text-sm text-gray-600 font-bold">
            <Clock size={13} className="text-gray-400" />
            {data.labor_hours ? `${data.labor_hours} hrs` : '—'}
          </span>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Cost</p>
          <span className="flex items-center gap-0.5 text-emerald-600 font-black text-sm">
            {fmtINR(data.total_cost)}
          </span>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Parts Replaced</p>
        <div className="space-y-2 max-h-[150px] overflow-y-auto">
          {data.parts_replaced?.length > 0 ? data.parts_replaced.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2">
                <Package size={14} className="text-gray-400" />
                <span className="text-sm font-bold text-[#172B4D]">{p.part_name}</span>
                <span className="text-xs text-gray-400 font-semibold">× {p.quantity}</span>
              </div>
              <span className="text-xs text-emerald-600 font-black">{fmtINR(p.cost)}</span>
            </div>
          )) : (
            <div className="p-3 rounded-lg bg-gray-50 border border-dashed border-gray-200 text-center">
              <p className="text-xs text-gray-400 font-bold">No parts recorded.</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Notes</p>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 min-h-[60px]">
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.notes || 'No extra notes provided.'}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-[#0052CC] bg-blue-50 rounded-xl hover:bg-blue-100 transition-all">
          Close
        </button>
      </div>
    </div>
  );
};

const ScheduleModal = ({ initial, onClose, isView, vehicleId, onDeleteRequest }) => {
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
      maintenance_type: initial.maintenance_type ?? '',
      description: initial.description ?? '',
      scheduled_date: initial.scheduled_date ?? '',
      completed_date: initial.completed_date ?? '',
      odometer_reading: initial.odometer_reading ?? '',
      next_due_date: initial.next_due_date ?? '',
      next_due_odometer: initial.next_due_odometer ?? '',
      service_interval_km: initial.service_interval_km ?? '',
      status: initial.status ?? 'SCHEDULED',
    } : { ...EMPTY_SCHEDULE, vehicle: vehicleId ?? '' }
  );

  const create = useCreateMaintenanceSchedule();
  const update = useUpdateMaintenanceSchedule();
  const isPending = create.isPending || update.isPending;
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const errs = {};
    if (form.scheduled_date && form.completed_date && new Date(form.completed_date) < new Date(form.scheduled_date)) {
      errs.completed_date = 'Cannot be earlier than scheduled date';
    }
    if (Object.keys(errs).length > 0) return setErrors(errs);
    setErrors({});

    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    if (isEdit) update.mutate({ id: initial.id, data: clean }, { onSuccess: onClose });
    else create.mutate(clean, { onSuccess: onClose });
  };

  return (
    <Modal
      title={isView ? 'Schedule Details' : isEdit ? 'Edit Schedule' : 'Add Schedule'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={isPending}
      isView={isView}
      onDelete={isEdit ? onDeleteRequest : null}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {isView ? (
          <ScheduleDetailView data={initial} onClose={onClose} />
        ) : (
          <>
            <FormSec title="Vehicle & Type" />
            <div className="grid grid-cols-2 gap-4">
              {!vehicleId && (
                <div className="col-span-2">
                  <Label required={!isEdit}>Vehicle</Label>
                  <VehicleSelect value={form.vehicle} onChange={(id) => setForm(p => ({ ...p, vehicle: id }))} />
                </div>
              )}
              <Field label="Maintenance Type" required>
                <Sel value={form.maintenance_type} onChange={set('maintenance_type')}>
                  <option value="">Select type</option>
                  {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </Sel>
              </Field>
              <Field label="Status">
                <Sel value={form.status} onChange={set('status')}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </Sel>
              </Field>
            </div>

            <Field label="Description">
              <Textarea value={form.description} onChange={set('description')} placeholder="Brief description of work..." />
            </Field>

            <FormSec title="Schedule Dates" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Scheduled Date" required>
                <Input type="date" value={form.scheduled_date} onChange={set('scheduled_date')} />
              </Field>
              <Field label="Completed Date" error={errors.completed_date}>
                <Input type="date" value={form.completed_date} onChange={set('completed_date')} />
              </Field>
              <Field label="Next Due Date">
                <Input type="date" value={form.next_due_date} onChange={set('next_due_date')} />
              </Field>
              <Field label="Service Interval (km)">
                <Input type="number" placeholder="e.g. 10000" value={form.service_interval_km} onChange={set('service_interval_km')} />
              </Field>
            </div>

            <FormSec title="Odometer" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Current Odometer (km)">
                <Input type="number" placeholder="e.g. 45000" value={form.odometer_reading} onChange={set('odometer_reading')} />
              </Field>
              <Field label="Next Due Odometer (km)">
                <Input type="number" placeholder="e.g. 55000" value={form.next_due_odometer} onChange={set('next_due_odometer')} />
              </Field>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

const RecordModal = ({ initial, onClose, isView, vehicleId, onDeleteRequest }) => {
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
      schedule: initial.schedule?.id ?? initial.schedule ?? '',
      service_type: initial.service_type ?? '',
      service_provider: initial.service_provider ?? '',
      odometer_reading: initial.odometer_reading ?? '',
      labor_hours: initial.labor_hours ?? '',
      total_cost: initial.total_cost ?? '',
      service_date: initial.service_date ?? '',
      next_service_due: initial.next_service_due ?? '',
      notes: initial.notes ?? '',
      parts_replaced: initial.parts_replaced ?? [],
    } : { ...EMPTY_RECORD, vehicle: vehicleId ?? '' }
  );

  const create = useCreateMaintenanceRecord();
  const update = useUpdateMaintenanceRecord();
  const isPending = create.isPending || update.isPending;
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const [errors, setErrors] = useState({});

  const [newPart, setNewPart] = useState({ part_name: '', quantity: '', cost: '' });
  const addPart = () => {
    if (!newPart.part_name) return;
    setForm(p => ({ ...p, parts_replaced: [...p.parts_replaced, { ...newPart, quantity: Number(newPart.quantity) || 1, cost: Number(newPart.cost) || 0 }] }));
    setNewPart({ part_name: '', quantity: '', cost: '' });
  };
  const removePart = (i) => setForm(p => ({ ...p, parts_replaced: p.parts_replaced.filter((_, idx) => idx !== i) }));

  const handleSubmit = () => {
    const errs = {};
    if (form.service_date && form.next_service_due && new Date(form.next_service_due) <= new Date(form.service_date)) {
      errs.next_service_due = 'Must be after service date';
    }
    if (Object.keys(errs).length > 0) return setErrors(errs);
    setErrors({});

    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    if (isEdit) update.mutate({ id: initial.id, data: clean }, { onSuccess: onClose });
    else create.mutate(clean, { onSuccess: onClose });
  };

  return (
    <Modal
      title={isView ? 'Record Details' : isEdit ? 'Edit Record' : 'Add Record'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={isPending}
      isView={isView}
      onDelete={isEdit ? onDeleteRequest : null}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {isView ? (
          <RecordDetailView data={initial} onClose={onClose} />
        ) : (
          <>
            <FormSec title="Vehicle & Service" />
            <div className="grid grid-cols-2 gap-4">
              {!vehicleId && (
                <div className="col-span-2">
                  <Label required={!isEdit}>Vehicle</Label>
                  <VehicleSelect value={form.vehicle} onChange={(id) => setForm(p => ({ ...p, vehicle: id }))} />
                </div>
              )}
              <Field label="Service Type" required>
                <Sel value={form.service_type} onChange={set('service_type')}>
                  <option value="">Select type</option>
                  {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </Sel>
              </Field>
              <Field label="Service Provider">
                <Input placeholder="e.g. Authorized Center" value={form.service_provider} onChange={set('service_provider')} />
              </Field>
            </div>

            <FormSec title="Dates & Cost" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Service Date" required>
                <Input type="date" value={form.service_date} onChange={set('service_date')} />
              </Field>
              <Field label="Next Service Due" error={errors.next_service_due}>
                <Input type="date" value={form.next_service_due} onChange={set('next_service_due')} />
              </Field>
              <Field label="Odometer (km)">
                <Input type="number" placeholder="e.g. 18000" value={form.odometer_reading} onChange={set('odometer_reading')} />
              </Field>
              <Field label="Labor Hours">
                <Input type="number" placeholder="e.g. 3" value={form.labor_hours} onChange={set('labor_hours')} />
              </Field>
              <Field label="Total Cost (₹)">
                <Input type="number" placeholder="e.g. 8000" value={form.total_cost} onChange={set('total_cost')} />
              </Field>
            </div>

            <FormSec title="Parts Replaced" />
            <div className="space-y-3">
              {form.parts_replaced.length > 0 && (
                <div className="space-y-2">
                  {form.parts_replaced.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      <span className="flex-1 text-sm font-semibold text-[#172B4D]">{p.part_name}</span>
                      <span className="text-xs text-gray-400">× {p.quantity}</span>
                      {p.cost > 0 && <span className="text-xs text-emerald-600 font-semibold">{fmtINR(p.cost)}</span>}
                      <button onClick={() => removePart(i)} className="text-red-400 hover:text-red-600 transition-colors"><X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
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

            <Field label="Notes">
              <Textarea value={form.notes} onChange={set('notes')} placeholder="Any additional notes..." />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
};

// ── Delete Modal ──────────────────────────────────────────────────────

// ── Schedules Table ───────────────────────────────────────────────────
const SchedulesTab = ({ onEdit, onDelete, onView, vehicleId }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [typeFilter, setType] = useState('');

  const { data, isLoading, isError, error, refetch } = useMaintenanceSchedules({
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { maintenance_type: typeFilter }),
    ...(search && { search }),
    ...(vehicleId && { vehicle: vehicleId }),
  });

  const schedules = data?.results ?? data ?? [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Filters */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search vehicle, type..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50" />
        </div>
        {[
          { val: statusFilter, set: setStatus, opts: STATUS_OPTIONS, ph: 'All Status' },
          { val: typeFilter, set: setType, opts: MAINTENANCE_TYPES, ph: 'All Types' },
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

      {isLoading && <TabContentShimmer />}
      {isError && (
        <ErrorState
          message="Failed to load schedules"
          error={error?.response?.data?.detail || error?.message}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-sm relative">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                {!vehicleId && <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Vehicle</th>}
                {['Maintenance Type', 'Next Due', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {schedules.map(row => {
                const st = STATUS_STYLES[row.status] ?? STATUS_STYLES.SCHEDULED;
                const days = daysUntil(row.next_due_date);
                const urgency = days !== null && days <= 7 && row.status === 'SCHEDULED';
                return (
                  <tr key={row.id} className={`hover:bg-blue-50/30 transition-colors ${urgency ? 'bg-orange-50/30' : ''}`}>
                    {!vehicleId && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button onClick={() => onView(row)}
                          className="font-bold text-[#172B4D] font-mono text-[13px] hover:text-[#0052CC] transition-all text-left uppercase hover:underline decoration-blue-400/30 underline-offset-4">
                          {vehicleDisplay(row.vehicle, row)}
                        </button>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-left">
                      <button onClick={() => onView(row)} className="flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all text-left">
                        <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <Wrench size={11} className="text-[#0052CC]" />
                        </div>
                        <span className="text-[12px] font-bold text-[#172B4D] hover:text-[#0052CC]">{row.maintenance_type_display ?? row.maintenance_type?.replace(/_/g, ' ') ?? '—'}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.next_due_date ? (
                        <div>
                          <span className="flex items-center gap-1 text-gray-600 text-[12px]"><Calendar size={11} className="text-gray-300" />{fmtDate(row.next_due_date)}</span>
                          {days !== null && row.status === 'SCHEDULED' && (
                            <span className={`text-[10px] font-bold mt-0.5 block ${days < 0 ? 'text-red-500' : days <= 7 ? 'text-orange-500' : 'text-gray-400'}`}>
                              {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                            </span>
                          )}
                        </div>
                      ) : <span className="text-gray-300 text-[12px]">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={`${st.bg} ${st.text} ${st.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {row.status_display ?? row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(row)} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                          <Pencil size={12} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {schedules.length === 0 && (
                <tr><td colSpan={vehicleId ? 7 : 8} className="px-4 py-16 text-center text-gray-400">
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

        </div>
      )}
    </div>
  );
};

// ── Records Table ─────────────────────────────────────────────────────
const RecordsTab = ({ onEdit, onDelete, onView, vehicleId }) => {
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useMaintenanceRecords({
    ...(search && { search }),
    ...(vehicleId && { vehicle: vehicleId }),
  });

  const records = data?.results ?? data ?? [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
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

      {isLoading && <TabContentShimmer />}
      {isError && (
        <ErrorState
          message="Failed to load records"
          error={error?.response?.data?.detail || error?.message}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-sm relative">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                {!vehicleId && <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Vehicle</th>}
                {['Service Type', 'Date', 'Total Cost', 'Next Service', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                  {!vehicleId && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button onClick={() => onView(r)}
                        className="font-bold text-[#172B4D] font-mono text-[13px] hover:text-[#0052CC] transition-all text-left uppercase hover:underline decoration-blue-400/30 underline-offset-4">
                        {vehicleDisplay(r.vehicle, r)}
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-left">
                    <button onClick={() => onView(r)} className="flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all text-left">
                      <div className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <ClipboardList size={11} className="text-emerald-600" />
                      </div>
                      <span className="text-[12px] font-bold text-[#172B4D] hover:text-[#0052CC]">{r.service_type}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-gray-600 text-[12px]"><Calendar size={11} className="text-gray-300" />{fmtDate(r.service_date)}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.total_cost
                      ? <span className="flex items-center gap-0.5 text-emerald-600 font-bold text-[12px]">{fmtINR(r.total_cost)}</span>
                      : <span className="text-gray-300 text-[12px]">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-gray-600 text-[12px]"><Calendar size={11} className="text-gray-300" />{fmtDate(r.next_service_due)}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onEdit(r)} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                        <Pencil size={12} /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={vehicleId ? 9 : 10} className="px-4 py-16 text-center text-gray-400">
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
const MaintenanceSchedules = ({ vehicleId, tab: initialTab = 'schedules', isTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { type, mode, data }
  const [viewTarget, setView] = useState(null); // { type, data }
  const [deleteTarget, setDelete] = useState(null); // { type, data }

  const delSched = useDeleteMaintenanceSchedule();
  const delRecord = useDeleteMaintenanceRecord();

  const schedulesQ = useMaintenanceSchedules({
    ...(vehicleId && { vehicle: vehicleId }),
    ...(search && { search }),
  });
  const recordsQ = useMaintenanceRecords({
    ...(vehicleId && { vehicle: vehicleId }),
    ...(search && { search }),
  });

  const isLoading = activeTab === 'schedules' ? schedulesQ.isLoading : recordsQ.isLoading;
  const isError = activeTab === 'schedules' ? schedulesQ.isError : recordsQ.isError;
  const refetch = () => { schedulesQ.refetch(); recordsQ.refetch(); };

  const schedules = schedulesQ.data?.results ?? schedulesQ.data ?? [];
  const records = recordsQ.data?.results ?? recordsQ.data ?? [];

  // Stats logic
  const schedCount = schedules.length;
  const overdue = schedules.filter(s => s.status === 'OVERDUE').length;
  const upcoming = schedules.filter(s => s.status === 'SCHEDULED' && daysUntil(s.next_due_date) <= 7).length;
  const totalCost = records.reduce((acc, r) => acc + parseFloat(r.total_cost || 0), 0);

  const content = (
    <div className={!isTab ? "p-6 flex flex-col gap-6 bg-[#F8FAFC] flex-1 min-h-0 overflow-hidden relative" : "flex flex-col gap-4 flex-1 min-h-0 overflow-hidden relative"}>

      {modal && modal.type === 'schedule' && (
        <ScheduleModal vehicleId={vehicleId} initial={modal.mode === 'add' ? null : modal.data} onClose={() => setModal(null)} onDeleteRequest={() => { setModal(null); setDelete({ type: 'schedule', data: modal.data }); }} />
      )}
      {modal && modal.type === 'record' && (
        <RecordModal vehicleId={vehicleId} initial={modal.mode === 'add' ? null : modal.data} onClose={() => setModal(null)} onDeleteRequest={() => { setModal(null); setDelete({ type: 'record', data: modal.data }); }} />
      )}

      {viewTarget && viewTarget.type === 'schedule' && (
        <ScheduleModal vehicleId={vehicleId} initial={viewTarget.data} isView onClose={() => setView(null)} />
      )}
      {viewTarget && viewTarget.type === 'record' && (
        <RecordModal vehicleId={vehicleId} initial={viewTarget.data} isView onClose={() => setView(null)} />
      )}

      {deleteTarget && (
        <DeleteConfirm
          label={deleteTarget.type === 'schedule' ? 'Schedule' : 'Record'}
          onClose={() => setDelete(null)}
          onConfirm={() => {
            if (deleteTarget.type === 'schedule') delSched.mutate(deleteTarget.data.id, { onSuccess: () => setDelete(null) });
            else delRecord.mutate(deleteTarget.data.id, { onSuccess: () => setDelete(null) });
          }}
          deleting={delSched.isPending || delRecord.isPending}
        />
      )}

      {/* Header — hidden in tab mode */}
      {!isTab && (
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#172B4D]">Maintenance</h1>
            <p className="text-sm text-gray-400 mt-0.5">Schedules and history logs</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <RefreshCw size={14} />
            </button>

          </div>
        </div>
      )}

      {/* Stat Cards — hidden in tab mode */}
      {/* Main Container */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0 mt-4">
        {/* Compact Stats Row */}
        {!isTab && (
          <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            {isLoading ? (
              <div className="flex gap-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-24"></div>
                <div className="h-5 bg-gray-200 rounded w-24"></div>
                <div className="h-5 bg-gray-200 rounded w-24"></div>
                <div className="h-5 bg-gray-200 rounded w-24"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Schedules:</span>
                  <span className="text-[18px] font-black text-[#172B4D]">{schedCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Overdue:</span>
                  <span className="text-[18px] font-black text-red-500">{overdue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Upcoming:</span>
                  <span className="text-[18px] font-black text-orange-500">{upcoming}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Cost:</span>
                  <span className="text-[18px] font-black text-green-600">{fmtINR(totalCost)}</span>
                </div>
              </>
            )}
          </div>
        )}
        {/* Tabs Bar */}
        <div className="px-5 pt-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex gap-6">
            <button onClick={() => setActiveTab('schedules')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all
                ${activeTab === 'schedules' ? 'bg-white text-[#0052CC] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <Wrench size={14} /> Schedules
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full
                ${activeTab === 'schedules' ? 'bg-[#0052CC] text-white' : 'bg-gray-200 text-gray-500'}`}>
                {schedules.length}
              </span>
            </button>
            <button onClick={() => setActiveTab('records')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all
                ${activeTab === 'records' ? 'bg-white text-[#0052CC] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <ClipboardList size={14} /> Service Records
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full
                ${activeTab === 'records' ? 'bg-[#0052CC] text-white' : 'bg-gray-200 text-gray-500'}`}>
                {records.length}
              </span>
            </button>
          </div>
          <button
            onClick={() => setModal({ type: activeTab === 'schedules' ? 'schedule' : 'record', mode: 'add' })}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
            <Plus size={14} /> Add {activeTab === 'schedules' ? 'Schedule' : 'Record'}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'schedules' && (
          <SchedulesTab
            onEdit={(s) => setModal({ type: 'schedule', mode: 'edit', data: s })}
            onDelete={(s) => setDelete({ type: 'schedule', data: s })}
            onView={(s) => setView({ type: 'schedule', data: s })}
            vehicleId={vehicleId}
          />
        )}
        {activeTab === 'records' && (
          <RecordsTab
            onEdit={(r) => setModal({ type: 'record', mode: 'edit', data: r })}
            onDelete={(r) => setDelete({ type: 'record', data: r })}
            onView={(r) => setView({ type: 'record', data: r })}
            vehicleId={vehicleId}
          />
        )}
      </div>
    </div>
  );

  return content;
};

export default MaintenanceSchedules;
