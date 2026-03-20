import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck, Plus, Pencil, Trash2, X, Search,
  RefreshCw, Loader2, AlertCircle, CheckCircle,
  XCircle, AlertTriangle, Calendar, Gauge, ChevronDown
} from 'lucide-react';
import {
  useVehicleInspections,
  useCreateVehicleInspection,
  useUpdateVehicleInspection,
  useDeleteVehicleInspection,
} from '../../../queries/vehicles/vehicleInfoQuery';
import {
  Badge, InfoCard, SectionHeader, EmptyState, Modal, DeleteConfirm, ItemActions,
  Label, Input, Sel, Field, StatCard, Textarea, VehicleSelect,
  fmtDate, fmtKm
} from '../Common/VehicleCommon';

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_OPTIONS = [
  { value: 'PRE_TRIP', label: 'Pre-Trip' },
  { value: 'POST_TRIP', label: 'Post-Trip' },
  { value: 'PERIODIC', label: 'Periodic' },
  { value: 'RANDOM', label: 'Random' },
];

const STATUS_CONFIG = {
  PASS: { label: 'Pass', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  FAIL: { label: 'Fail', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
  CONDITIONAL: { label: 'Conditional', dot: 'bg-orange-400', text: 'text-orange-700', bg: 'bg-orange-50' },
};

const TYPE_COLORS = {
  PRE_TRIP: 'bg-blue-50 text-blue-700 border-blue-200',
  POST_TRIP: 'bg-purple-50 text-purple-700 border-purple-200',
  PERIODIC: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RANDOM: 'bg-gray-100 text-gray-700 border-gray-200',
};

const EMPTY_FORM = {
  vehicle: '', driver: '', inspection_type: '', inspection_date: '',
  odometer_reading: '', overall_status: 'PASS', inspector_signature: '',
  resolved_date: '', resolved_by: '', defects_found: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FormSec = ({ title }) => (
  <p className="text-[10px] font-black text-[#0052CC] uppercase tracking-widest pt-2 pb-1 border-b border-blue-50 mb-2">
    {title}
  </p>
);


// ─── Components ───────────────────────────────────────────────────────────────
const ViewDetail = ({ data, onClose }) => {
  const defects = Array.isArray(data.defects_found) ? data.defects_found : [];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <InfoCard label="Type" value={data.inspection_type_display ?? data.inspection_type} />
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
          {(() => {
            const cfg = STATUS_CONFIG[data.overall_status];
            if (!cfg) return <span className="text-gray-400 text-xs">—</span>;
            return (
              <Badge className={`${cfg.bg} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </Badge>
            );
          })()}
        </div>
        <InfoCard label="Inspector" value={data.inspector_signature || '—'} />
        <InfoCard label="Driver" value={data.driver || '—'} />
        <InfoCard label="Date" value={fmtDate(data.inspection_date)} icon={Calendar} />
        <InfoCard label="Odometer" value={fmtKm(data.odometer_reading)} icon={Gauge} />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">Defects & Issues</p>
        {defects.length > 0 ? (
          <ul className="space-y-2">
            {defects.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs font-medium text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {d}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400 italic font-medium">No defects reported.</p>
        )}
      </div>

      {data.resolved_date && (
        <div className="pt-4 border-t border-gray-100">
          <SectionHeader icon={CheckCircle} title="Resolution Info" />
          <div className="grid grid-cols-2 gap-4 mt-2">
            <InfoCard label="Resolved By" value={data.resolved_by || '—'} />
            <InfoCard label="Resolved Date" value={fmtDate(data.resolved_date)} icon={Calendar} />
          </div>
        </div>
      )}
    </div>
  );
};

const InspectionModal = ({ initial, onClose, isView, vehicleId, onDeleteRequest }) => {
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
      driver: initial.driver ?? '',
      inspection_type: initial.inspection_type ?? '',
      inspection_date: initial.inspection_date ? initial.inspection_date.slice(0, 16) : '',
      odometer_reading: initial.odometer_reading ?? '',
      overall_status: initial.overall_status ?? 'PASS',
      inspector_signature: initial.inspector_signature ?? '',
      resolved_date: initial.resolved_date ? initial.resolved_date.slice(0, 10) : '',
      resolved_by: initial.resolved_by ?? '',
      defects_found: Array.isArray(initial.defects_found) ? initial.defects_found.join(', ') : (initial.defects_found ?? ''),
    } : { ...EMPTY_FORM, vehicle: vehicleId ?? '' }
  );

  const create = useCreateVehicleInspection();
  const update = useUpdateVehicleInspection();
  const isPending = create.isPending || update.isPending;
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const errs = {};
    if (form.inspection_date && form.resolved_date && new Date(form.resolved_date) < new Date(form.inspection_date)) {
      errs.resolved_date = 'Cannot be earlier than inspection date';
    }
    if (Object.keys(errs).length > 0) return setErrors(errs);
    setErrors({});

    const clean = {
      ...form,
      defects_found: form.defects_found ? form.defects_found.split(',').map(d => d.trim()).filter(Boolean) : [],
    };
    const final = Object.fromEntries(Object.entries(clean).map(([k, v]) => [k, v === '' ? null : v]));

    if (isEdit) update.mutate({ id: initial.id, data: final }, { onSuccess: onClose });
    else create.mutate(final, { onSuccess: onClose });
  };

  return (
    <Modal
      title={isView ? 'Inspection Details' : isEdit ? 'Edit Inspection' : 'Add Inspection'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={isPending}
      isView={isView}
      onDelete={isEdit ? onDeleteRequest : null}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {isView ? (
          <ViewDetail data={initial} onClose={onClose} />
        ) : (
          <>
            <FormSec title="Vehicle & Inspection Info" />
            <div className="grid grid-cols-2 gap-4">
              {!vehicleId && (
                <div className="col-span-2">
                  <Label required={!isEdit}>Vehicle</Label>
                  <VehicleSelect value={form.vehicle} onChange={(id) => setForm(p => ({ ...p, vehicle: id }))} />
                </div>
              )}
              <Field label="Inspector Name" required>
                <Input placeholder="e.g. John Doe" value={form.inspector_signature} onChange={set('inspector_signature')} />
              </Field>
              <Field label="Driver">
                <Input placeholder="e.g. Mike Smith" value={form.driver} onChange={set('driver')} />
              </Field>
              <Field label="Type" required>
                <Sel value={form.inspection_type} onChange={set('inspection_type')}>
                  <option value="">Select type</option>
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Sel>
              </Field>
              <Field label="Status" required>
                <Sel value={form.overall_status} onChange={set('overall_status')}>
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </Sel>
              </Field>
            </div>

            <FormSec title="Reading & Timeline" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Odometer (km)">
                <Input type="number" placeholder="e.g. 15000" value={form.odometer_reading} onChange={set('odometer_reading')} />
              </Field>
              <Field label="Inspection Date" required>
                <Input type="datetime-local" value={form.inspection_date} onChange={set('inspection_date')} />
              </Field>
            </div>

            <FormSec title="Defects & Resolution" />
            <div className="space-y-4">
              <Field label="Defects Found (comma separated)">
                <Textarea value={form.defects_found} onChange={set('defects_found')} placeholder="e.g. Wiper blade, Brake light" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Resolved By">
                  <Input value={form.resolved_by} onChange={set('resolved_by')} />
                </Field>
                <Field label="Resolved Date" error={errors.resolved_date}>
                  <Input type="date" value={form.resolved_date} onChange={set('resolved_date')} />
                </Field>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

const VehicleInspections = ({ vehicleId, isTab }) => {
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useVehicleInspections({
    ...(search && { search }),
    ...(typeFilter && { inspection_type: typeFilter }),
    ...(vehicleId && { vehicle: vehicleId }),
  });
  const del = useDeleteVehicleInspection();

  const inspections = data?.results ?? data ?? [];

  const stats = useMemo(() => {
    const total = inspections.length;
    const passed = inspections.filter(i => i.overall_status === 'PASS').length;
    const failed = inspections.filter(i => i.overall_status === 'FAIL').length;
    return { total, passed, failed };
  }, [inspections]);

  return (
    <div className={`flex flex-col h-full bg-[#F4F5F7] ${isTab ? '' : 'p-6'}`}>
      {!isTab && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Inspections</h1>
            <p className="text-sm text-gray-400 font-medium">Record and track vehicle condition checks</p>
          </div>
          <button
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm shadow-blue-200">
            <Plus size={16} /> Add Inspection
          </button>
        </div>
      )}

      {!isTab && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard icon={ClipboardCheck} label="Total Inspections" value={stats.total} color="blue" />
          <StatCard icon={CheckCircle} label="Passed" value={stats.passed} color="emerald" />
          <StatCard icon={XCircle} label="Failed" value={stats.failed} color="red" />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
        {isTab ? (
          <SectionHeader icon={ClipboardCheck} title="Inspections" count={inspections.length} onAdd={() => setModal({ mode: 'add' })} addLabel="Add Inspection" />
        ) : (
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#172B4D]">📄 Inspection Registry</h2>
              <p className="text-xs text-gray-400 mt-0.5">Record and track vehicle condition checks</p>
            </div>
            <button onClick={() => setModal({ mode: 'add' })}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8]">
              <Plus size={14} /> Add Inspection
            </button>
          </div>
        )}

        {/* Filters */}
        <div className={`px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap ${isTab ? 'bg-gray-50/30' : ''}`}>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search inspections..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50" />
          </div>
          <div className="relative">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer">
              <option value="">All Types</option>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {!isTab && (
            <button onClick={() => { setSearch(''); setTypeFilter(''); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100">
              <RefreshCw size={13} /> Reset
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0052CC]" /></div>
          ) : !inspections.length ? (
            <EmptyState icon={ClipboardCheck} text="No inspections found" onAdd={() => setModal({ mode: 'add' })} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Inspection Info</th>
                  {!vehicleId && <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Vehicle</th>}
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Inspector</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Date</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inspections.map(i => (
                  <tr key={i.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={TYPE_COLORS[i.inspection_type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}>
                        {i.inspection_type_display ?? i.inspection_type}
                      </Badge>
                      <p className="text-[10px] font-mono font-medium text-gray-400 mt-1">{fmtKm(i.odometer_reading)}</p>
                    </td>
                    {!vehicleId && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-[#172B4D] font-mono text-[13px] uppercase">
                          {i.vehicle_registration_number ?? i.vehicle_registration ?? i.vehicle_display ?? i.vehicle ?? '—'}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-[#172B4D]">
                      {i.inspector_signature || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500">
                        <Calendar size={11} className="text-gray-300" />
                        {fmtDate(i.inspection_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {(() => {
                        const cfg = STATUS_CONFIG[i.overall_status];
                        if (!cfg) return <span className="text-gray-400 text-xs">—</span>;
                        return (
                          <Badge className={cfg.bg + ' ' + cfg.text}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </Badge>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal({ mode: 'edit', data: i })}
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all">
                          <Pencil size={12} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <InspectionModal
          initial={modal.data}
          onClose={() => setModal(null)}
          vehicleId={vehicleId}
          onDeleteRequest={() => { setModal(null); setDeleting(modal.data); }}
        />
      )}
      {viewing && (
        <InspectionModal
          initial={viewing}
          onClose={() => setViewing(null)}
          isView
          vehicleId={vehicleId}
        />
      )}
      {deleting && (
        <DeleteConfirm
          label="Inspection"
          onClose={() => setDeleting(null)}
          onConfirm={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          deleting={del.isPending}
        />
      )}
    </div>
  );
};

export default VehicleInspections;
