import React, { useState, useMemo } from 'react';
import {
  CircleDot, Plus, Pencil, Trash2, X, Search,
  RotateCcw, Loader2, AlertTriangle, Calendar,
  Gauge, Hash, ChevronDown, Download, Upload
} from 'lucide-react';
import {
  useVehicleTires,
  useCreateVehicleTire,
  useUpdateVehicleTire,
  useDeleteVehicleTire,
} from '../../../queries/vehicles/vehicleInfoQuery';
import {
  Badge, InfoCard, SectionHeader, EmptyState, Modal, DeleteConfirm, ItemActions,
  Label, Input, Sel, Field, StatCard, Textarea, VehicleSelect,
  fmtDate, fmtKm
} from '../Common/VehicleCommon';
import { TabContentShimmer, ErrorState } from '../Common/StateFeedback';

// ─── Constants ────────────────────────────────────────────────────────────────
const POSITION_OPTIONS = [
  { value: 'FRONT_LEFT', label: 'Front Left' },
  { value: 'FRONT_RIGHT', label: 'Front Right' },
  { value: 'REAR_LEFT', label: 'Rear Left' },
  { value: 'REAR_RIGHT', label: 'Rear Right' },
  { value: 'SPARE', label: 'Spare' },
];

const POSITION_COLORS = {
  FRONT_LEFT: 'bg-blue-50 text-blue-700 border-blue-200',
  FRONT_RIGHT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  REAR_LEFT: 'bg-purple-50 text-purple-700 border-purple-200',
  REAR_RIGHT: 'bg-violet-50 text-violet-700 border-violet-200',
  SPARE: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_CONFIG = {
  INSTALLED: { label: 'Installed', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  REMOVED: { label: 'Removed', dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-100' },
  REPLACED: { label: 'Replaced', dot: 'bg-red-400', text: 'text-red-700', bg: 'bg-red-50' },
};

const EMPTY_FORM = {
  vehicle: '', tire_serial_number: '', tire_brand: '',
  tire_position: '', status: 'INSTALLED', tread_depth: '',
  installation_date: '', installation_odometer: '',
  removal_date: '', removal_odometer: '', removal_reason: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const treadColor = (mm) => {
  const v = Number(mm);
  if (!v) return 'text-gray-400';
  if (v >= 6) return 'text-emerald-600';
  if (v >= 3) return 'text-orange-500';
  return 'text-red-600';
};

const FormSec = ({ title }) => (
  <p className="text-[10px] font-black text-[#0052CC] uppercase tracking-widest pt-2 pb-1 border-b border-blue-50 mb-2">
    {title}
  </p>
);


// ─── Components ───────────────────────────────────────────────────────────────
const ViewDetail = ({ data, onClose }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-6">
      <InfoCard label="Position" value={data.tire_position_display ?? data.tire_position} />
      <InfoCard label="Status" value={data.status_display ?? data.status} />
      <InfoCard label="Brand" value={data.tire_brand || '—'} />
      <InfoCard label="Serial Number" value={data.tire_serial_number || '—'} />
      <InfoCard label="Tread Depth" value={data.tread_depth ? `${data.tread_depth} mm` : '—'} />
    </div>

    <div className="pt-4 border-t border-gray-100">
      <SectionHeader title="Installation" />
      <div className="grid grid-cols-2 gap-4 mt-2">
        <InfoCard label="Date" value={fmtDate(data.installation_date)} icon={Calendar} />
        <InfoCard label="Odometer" value={fmtKm(data.installation_odometer)} icon={Gauge} />
      </div>
    </div>

    {data.removal_date && (
      <div className="pt-4 border-t border-gray-100">
        <SectionHeader title="Removal" />
        <div className="grid grid-cols-2 gap-4 mt-2">
          <InfoCard label="Date" value={fmtDate(data.removal_date)} icon={Calendar} />
          <InfoCard label="Odometer" value={fmtKm(data.removal_odometer)} icon={Gauge} />
          <div className="col-span-2">
            <InfoCard label="Reason" value={data.removal_reason} />
          </div>
        </div>
      </div>
    )}
  </div>
);

const TireModal = ({ initial, onClose, isView, vehicleId, onDeleteRequest }) => {
  // Force browser reload comment: v2
  const isEdit = !!initial?.id && !isView;
  console.log('TireModal Debug:', { initial, vehicleId, isEdit });

  const resolveVehicleId = () => {
    if (vehicleId) return vehicleId;
    if (typeof initial?.vehicle === 'object') return initial.vehicle?.id ?? '';
    return initial?.vehicle_id ?? initial?.vehicle ?? '';
  };

  const [form, setForm] = useState(
    initial ? {
      vehicle: resolveVehicleId(),
      tire_serial_number: initial.tire_serial_number ?? '',
      tire_brand: initial.tire_brand ?? '',
      tire_position: initial.tire_position ?? '',
      status: initial.status ?? 'INSTALLED',
      tread_depth: initial.tread_depth ?? '',
      installation_date: initial.installation_date ?? '',
      installation_odometer: initial.installation_odometer ?? '',
      removal_date: initial.removal_date ?? '',
      removal_odometer: initial.removal_odometer ?? '',
      removal_reason: initial.removal_reason ?? '',
    } : { ...EMPTY_FORM, vehicle: vehicleId ?? '' }
  );

  const create = useCreateVehicleTire();
  const update = useUpdateVehicleTire();
  const isPending = create.isPending || update.isPending;
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const errs = {};
    if (form.installation_date && form.removal_date && new Date(form.removal_date) <= new Date(form.installation_date)) {
      errs.removal_date = 'Must be after installation date';
    }
    if (Object.keys(errs).length > 0) return setErrors(errs);
    setErrors({});

    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    if (isEdit) update.mutate({ id: initial.id, data: clean }, { onSuccess: onClose });
    else create.mutate(clean, { onSuccess: onClose });
  };

  return (
    <Modal
      title={isView ? 'Tire Details' : isEdit ? 'Edit Tire' : 'Add Tire'}
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
            <FormSec title="Vehicle & Tire Info" />
            <div className="grid grid-cols-2 gap-4">
              {!vehicleId && (
                <div className="col-span-2">
                  <Label required={!isEdit}>Vehicle</Label>
                  <VehicleSelect
                    value={form.vehicle}
                    placeholder={initial?.vehicle_registration_number || initial?.vehicle_registration || initial?.vehicle_display}
                    onChange={(id) => setForm(p => ({ ...p, vehicle: id }))}
                  />
                </div>
              )}
              <Field label="Serial Number" required>
                <Input placeholder="e.g. TR-992211" value={form.tire_serial_number} onChange={set('tire_serial_number')} />
              </Field>
              <Field label="Brand">
                <Input placeholder="e.g. Michelin" value={form.tire_brand} onChange={set('tire_brand')} />
              </Field>
              <Field label="Position" required>
                <Sel value={form.tire_position} onChange={set('tire_position')}>
                  <option value="">Select position</option>
                  {POSITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Sel>
              </Field>
              <Field label="Status">
                <Sel value={form.status} onChange={set('status')}>
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </Sel>
              </Field>
            </div>

            <FormSec title="Status & Tread" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tread Depth (mm)">
                <Input type="number" placeholder="e.g. 8" value={form.tread_depth} onChange={set('tread_depth')} />
              </Field>
            </div>

            <FormSec title="Installation" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Installation Date">
                <Input type="date" value={form.installation_date} onChange={set('installation_date')} />
              </Field>
              <Field label="Installation Odometer (km)">
                <Input type="number" placeholder="e.g. 0" value={form.installation_odometer} onChange={set('installation_odometer')} />
              </Field>
            </div>

            {form.status !== 'INSTALLED' && (
              <>
                <FormSec title="Removal Info" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Removal Date">
                    <Input type="date" value={form.removal_date} onChange={set('removal_date')} />
                  </Field>
                  <Field label="Removal Odometer (km)">
                    <Input type="number" value={form.removal_odometer} onChange={set('removal_odometer')} />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Removal Reason">
                      <Textarea value={form.removal_reason} onChange={set('removal_reason')} placeholder="Why was it removed?" />
                    </Field>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

const VehicleTires = ({ vehicleId, isTab }) => {
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isError, error, refetch } = useVehicleTires({
    ...(search && { search }),
    ...(posFilter && { tire_position: posFilter }),
    ...(statusFilter && { status: statusFilter }),
    ...(vehicleId && { vehicle: vehicleId }),
    page: currentPage,
  });
  const del = useDeleteVehicleTire();

  const tires = data?.results ?? data ?? [];

  const stats = useMemo(() => {
    const t = tires.length;
    const i = tires.filter(x => x.status === 'INSTALLED').length;
    const w = tires.filter(x => x.status === 'WORN').length;
    const r = tires.filter(x => x.status === 'REMOVED' || x.status === 'REPLACED').length;
    return { total: t, installed: i, worn: w, removed: r };
  }, [tires]);

  return (
    <div className={`flex flex-col h-full ${isTab ? '' : 'p-6 bg-[#f8fafc] flex-1 min-h-0 overflow-hidden relative font-sans text-slate-900'}`}>
      {!isTab && (
        <div className="flex items-center mb-8">
          <div className="w-1/4">
            <h2 className="text-2xl font-bold text-[#172B4D]">Tires</h2>
            <p className="text-gray-500 text-sm tracking-tight">Manage tire inventory and fleet status</p>
          </div>
          <div className="flex-1 max-w-2xl px-8">
            <div className="relative group/search">
              <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
              <input
                type="text"
                placeholder="Search tires..."
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
        {/* Compact Stats Row */}
          <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Tires:</span>
              <span className="text-[18px] font-black text-[#172B4D]">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Installed:</span>
              <span className="text-[18px] font-black text-emerald-600">{stats.installed}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Worn Out:</span>
              <span className="text-[18px] font-black text-orange-500">{stats.worn}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Removed:</span>
              <span className="text-[18px] font-black text-red-600">{stats.removed}</span>
            </div>
            <div className="ml-auto w-1/4 flex justify-end">
              <button
                onClick={() => setModal({ mode: 'add' })}
                className="mr-0 bg-[#0052CC] text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-lg hover:shadow-blue-200 active:scale-95 group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                <span>Add Tire</span>
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
                  placeholder="Search tires..."
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
                value={posFilter}
                onChange={e => setPosFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:border-gray-200 cursor-pointer shadow-sm"
              >
                <option value="">All Positions</option>
                {POSITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:border-gray-200 cursor-pointer shadow-sm"
              >
                <option value="">All Status</option>
                {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {(posFilter || statusFilter) && (
              <button
                onClick={() => { setPosFilter(''); setStatusFilter(''); }}
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

        <div className="flex-1 overflow-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0052CC]" /></div>
          ) : !tires.length ? (
            <EmptyState icon={CircleDot} text="No tires found" onAdd={() => setModal({ mode: 'add' })} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {!vehicleId && <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Vehicle</th>}
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Tire Info</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Position</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Tread Depth</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tires.map(t => (
                  <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                    {!vehicleId && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button onClick={() => setViewing(t)}
                          className="font-bold text-[#172B4D] font-mono text-[13px] hover:text-[#0052CC] transition-all text-left uppercase hover:underline decoration-blue-400/30 underline-offset-4">
                          {t.vehicle_registration_number ?? t.vehicle_registration ?? t.vehicle_display ?? t.vehicle ?? '—'}
                        </button>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm font-bold text-[#172B4D]">{t.tire_brand || 'Unknown'}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={POSITION_COLORS[t.tire_position] ?? 'bg-gray-100 text-gray-600 border-gray-200'}>
                        {t.tire_position_display ?? t.tire_position}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${Number(t.tread_depth) >= 6 ? 'bg-emerald-500' : Number(t.tread_depth) >= 3 ? 'bg-orange-400' : 'bg-red-500'}`}
                            style={{ width: `${Math.min((Number(t.tread_depth) / 10) * 100, 100)}%` }} />
                        </div>
                        <span className={`text-xs font-black ${treadColor(t.tread_depth)}`}>{t.tread_depth}mm</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {(() => {
                        const cfg = STATUS_CONFIG[t.status];
                        if (!cfg) return <span className="text-gray-400 text-xs">—</span>;
                        return (
                          <Badge className={`${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {t.status_display ?? cfg.label}
                          </Badge>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal({ mode: 'edit', data: t })}
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

        {!isTab && !isLoading && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Showing <span className="font-bold text-gray-600">{tires.length}</span>{data?.count && data.count !== tires.length && <> of <span className="font-bold text-gray-600">{data.count}</span></>} tires</span>

          </div>
        )}
      </div>

      {modal && (
        <TireModal
          initial={modal.data}
          onClose={() => setModal(null)}
          vehicleId={vehicleId}
          onDeleteRequest={() => { setModal(null); setDeleting(modal.data); }}
        />
      )}
      {viewing && (
        <TireModal
          initial={viewing}
          onClose={() => setViewing(null)}
          isView
          vehicleId={vehicleId}
        />
      )}
      {deleting && (
        <DeleteConfirm
          label="Tire"
          onClose={() => setDeleting(null)}
          onConfirm={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          deleting={del.isPending}
        />
      )}
    </div>
  );
};



export default VehicleTires;
