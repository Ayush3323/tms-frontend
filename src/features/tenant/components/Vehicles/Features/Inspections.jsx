import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck, Plus, Pencil, Trash2, X, Search,
  RotateCcw, Loader2, AlertCircle, CheckCircle,
  XCircle, AlertTriangle, Calendar, Gauge, ChevronDown,
  Download, Upload
} from 'lucide-react';
import {
  useVehicleInspections,
  useCreateVehicleInspection,
  useUpdateVehicleInspection,
  useDeleteVehicleInspection,
} from '../../../queries/vehicles/vehicleInfoQuery';
import {
  Badge, InfoCard, SectionHeader, EmptyState, Modal, DeleteConfirm, ItemActions,
  Label, Input, Sel, Field, StatCard, Textarea, VehicleSelect, DriverSelect,
  fmtDate, fmtKm, driverName
} from '../Common/VehicleCommon';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';
import { TabContentShimmer, ErrorState } from '../Common/StateFeedback';

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
  const lookup = useDriverLookup();
  const defects = Array.isArray(data.defects_found) ? data.defects_found : [];

  const resolveDriver = (d) => {
    if (!d) return '—';
    if (typeof d === 'object') return driverName(d);
    return lookup[d]?.name ?? d;
  };

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
        <InfoCard label="Driver" value={resolveDriver(data.driver)} />
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
    if (typeof initial?.vehicle === 'object') return initial.vehicle?.id ?? '';
    return initial?.vehicle_id ?? initial?.vehicle ?? '';
  };

  // Resolve driver: always store UUID. If the API returns an object, extract its id.
  const resolveDriverId = (d) => {
    if (!d) return '';
    if (typeof d === 'object') return d.id ?? '';
    return d;
  };

  const [form, setForm] = useState(
    initial ? {
      vehicle: resolveVehicleId(),
      driver: resolveDriverId(initial.driver),
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
                  <VehicleSelect
                    value={form.vehicle}
                    placeholder={initial?.vehicle_registration_number || initial?.vehicle_registration || initial?.vehicle_display}
                    onChange={(id, v) => {
                      setForm(p => ({
                        ...p,
                        vehicle: id,
                        driver: v ? (v.assigned_driver_name ?? resolveDriverId(v.assigned_driver)) : p.driver
                      }));
                    }}
                  />
                </div>
              )}
              <Field label="Inspector Name" required>
                <Input placeholder="e.g. John Doe" value={form.inspector_signature} onChange={set('inspector_signature')} />
              </Field>
              <Field label="Driver">
                <DriverSelect
                  value={form.driver}
                  onChange={(id) => setForm(p => ({ ...p, driver: id ?? '' }))}
                />
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
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useVehicleInspections({
    ...(search && { search }),
    ...(typeFilter && { inspection_type: typeFilter }),
    ...(vehicleId && { vehicle: vehicleId }),
    page: currentPage,
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
    <div className={`flex flex-col h-full ${isTab ? '' : 'p-6 bg-[#f8fafc] flex-1 min-h-0 overflow-hidden relative font-sans text-slate-900'}`}>
      {!isTab && (
        <div className="flex items-center mb-8">
          <div className="w-1/4">
            <h2 className="text-2xl font-bold text-[#172B4D]">Inspections</h2>
            <p className="text-gray-500 text-sm tracking-tight">Vehicle condition checks and reports</p>
          </div>
          <div className="flex-1 max-w-2xl px-8">
            <div className="relative group/search">
              <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
              <input
                type="text"
                placeholder="Search inspections..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm hover:shadow-md hover:border-gray-300"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-2 text-gray-400 hover:text-red-500 transition-all duration-500 hover:rotate-180 p-1.5 rounded-full hover:bg-red-50 flex items-center justify-center group/reset"
                  title="Clear search"
                >
                  <RotateCcw size={18} className="animate-in fade-in zoom-in spin-in-180 duration-500 group-hover/reset:scale-110" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 ml-auto">
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 group"
              >
                <RotateCcw size={14} className={isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                <span>Refresh</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95">
                <Download size={14} />
                <span>Export</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95">
                <Upload size={14} />
                <span>Import</span>
              </button>
            </div>
            <div className="w-px h-8 bg-gray-200 mx-1" />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 mt-2 overflow-hidden">
        {/* Compact Stats Row */}
          <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Inspections:</span>
              <span className="text-[18px] font-black text-[#172B4D]">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Passed:</span>
              <span className="text-[18px] font-black text-emerald-600">{stats.passed}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Failed:</span>
              <span className="text-[18px] font-black text-red-600">{stats.failed}</span>
            </div>
            <div className="ml-auto w-1/4 flex justify-end">
              <button
                onClick={() => setModal({ mode: 'add' })}
                className="mr-0 bg-[#0052CC] text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-lg hover:shadow-blue-200 active:scale-95 group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                <span>Add Inspection</span>
              </button>
            </div>
          </div>

        {/* Filters & Pagination Row */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-50 h-[60px]">
          <div className="flex items-center gap-6">
            {isTab && (
              <div className="relative w-64 text-gray-400">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search inspections..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-[#0052CC]/10 text-[#172B4D] font-medium"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:border-gray-200 cursor-pointer shadow-sm"
              >
                <option value="">All Types</option>
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {typeFilter && (
              <button
                onClick={() => setTypeFilter('')}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Clear Filters"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          {!isTab && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-4 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Previous
              </button>

              <div className="flex items-center justify-center min-w-8 h-8 bg-[#0052CC] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
                {currentPage}
              </div>

              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!data?.next || isLoading}
                className="px-4 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Next
              </button>
            </div>
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
                  {!vehicleId && <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Vehicle</th>}
                  {['Inspection Info', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inspections.map(i => (
                  <tr key={i.id} className="hover:bg-blue-50/30 transition-colors">
                    {!vehicleId && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button onClick={() => setViewing(i)}
                          className="font-bold text-[#172B4D] font-mono text-[13px] hover:text-[#0052CC] transition-all text-left uppercase hover:underline decoration-blue-400/30 underline-offset-4">
                          {i.vehicle_registration_number ?? i.vehicle_registration ?? i.vehicle_display ?? i.vehicle ?? '—'}
                        </button>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={TYPE_COLORS[i.inspection_type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}>
                        {i.inspection_type_display ?? i.inspection_type}
                      </Badge>
                      <p className="text-[10px] font-mono font-medium text-gray-400 mt-1">{fmtKm(i.odometer_reading)}</p>
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
