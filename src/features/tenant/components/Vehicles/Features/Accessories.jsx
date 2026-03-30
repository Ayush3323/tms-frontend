import React, { useState, useMemo } from 'react';
import {
  Package, Plus, Edit2, Trash2, Search,
  RotateCcw, Loader2, CheckCircle, Clock, XCircle, ChevronDown,
  Calendar, Hash, FileText, Download, Upload, X
} from 'lucide-react';
import {
  useVehicleAccessories,
  useCreateVehicleAccessory,
  useUpdateVehicleAccessory,
  useDeleteVehicleAccessory,
} from '../../../queries/vehicles/vehicleInfoQuery';
import {
  Badge, InfoCard, SectionHeader, EmptyState, Modal, DeleteConfirm, ItemActions,
  Label, Input, Sel, Field, StatCard, Textarea, VehicleSelect,
  fmtDate, fmtINR, fmtKm
} from '../Common/VehicleCommon';
import { TabContentShimmer, ErrorState } from '../Common/StateFeedback';

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_OPTIONS = [
  { value: 'GPS', label: 'GPS Tracker' },
  { value: 'DASHCAM', label: 'Dashcam' },
  { value: 'TOOLBOX', label: 'Toolbox' },
  { value: 'SPARE_TIRE', label: 'Spare Tire' },
  { value: 'FIRST_AID', label: 'First Aid Kit' },
  { value: 'FIRE_EXTINGUISHER', label: 'Fire Extinguisher' },
];

const TYPE_COLORS = {
  GPS: 'bg-teal-50 text-teal-700 border-teal-200',
  DASHCAM: 'bg-blue-50 text-blue-700 border-blue-200',
  TOOLBOX: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  SPARE_TIRE: 'bg-gray-100 text-gray-700 border-gray-200',
  FIRST_AID: 'bg-purple-50 text-purple-700 border-purple-200',
  FIRE_EXTINGUISHER: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_CONFIG = {
  INSTALLED: { label: 'Installed', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  REMOVED: { label: 'Removed', dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-100' },
  FAULTY: { label: 'Faulty', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
};

const EMPTY_FORM = {
  vehicle: '', accessory_type: '', accessory_name: '',
  serial_number: '', installation_date: '',
  warranty_expiry: '', status: 'INSTALLED', notes: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const warrantyStatus = (expiry) => {
  if (!expiry) return null;
  const diff = new Date(expiry) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: 'Expired', cls: 'text-red-600', icon: XCircle };
  if (days <= 90) return { label: `${days}d left`, cls: 'text-orange-500', icon: Clock };
  return { label: fmtDate(expiry), cls: 'text-emerald-600', icon: CheckCircle };
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
      <InfoCard label="Type" value={data.accessory_type_display ?? data.accessory_type} />
      <InfoCard label="Status" value={data.status_display ?? data.status} />
      <div className="col-span-2">
        <InfoCard label="Accessory Name" value={data.accessory_name || '—'} />
      </div>
      <InfoCard label="Serial Number" value={data.serial_number || '—'} />
      <InfoCard label="Installation Date" value={fmtDate(data.installation_date)} icon={Calendar} />
      <InfoCard label="Warranty Expiry" value={fmtDate(data.warranty_expiry)} icon={Calendar} />
    </div>

    {data.notes && (
      <div className="pt-4 border-t border-gray-100">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 italic">Notes</p>
        <p className="text-xs text-gray-600 leading-relaxed font-medium">{data.notes}</p>
      </div>
    )}
  </div>
);

const AccessoryModal = ({ initial, onClose, isView, vehicleId, onDeleteRequest }) => {
  // Force browser reload comment: v2
  const isEdit = !!initial?.id && !isView;
  console.log('AccessoryModal Debug:', { initial, vehicleId, isEdit });

  const resolveVehicleId = () => {
    if (vehicleId) return vehicleId;
    if (typeof initial?.vehicle === 'object') return initial.vehicle?.id ?? '';
    return initial?.vehicle_id ?? initial?.vehicle ?? '';
  };

  const [form, setForm] = useState(
    initial ? {
      vehicle: resolveVehicleId(),
      accessory_type: initial.accessory_type ?? '',
      accessory_name: initial.accessory_name ?? '',
      serial_number: initial.serial_number ?? '',
      installation_date: initial.installation_date ?? '',
      warranty_expiry: initial.warranty_expiry ?? '',
      status: initial.status ?? 'INSTALLED',
      notes: initial.notes ?? '',
    } : { ...EMPTY_FORM, vehicle: vehicleId ?? '' }
  );

  const create = useCreateVehicleAccessory();
  const update = useUpdateVehicleAccessory();
  const isPending = create.isPending || update.isPending;
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const errs = {};
    if (form.installation_date && form.warranty_expiry && new Date(form.warranty_expiry) <= new Date(form.installation_date)) {
      errs.warranty_expiry = 'Must be after installation date';
    }
    if (Object.keys(errs).length > 0) return setErrors(errs);
    setErrors({});

    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    if (isEdit) update.mutate({ id: initial.id, data: clean }, { onSuccess: onClose });
    else create.mutate(clean, { onSuccess: onClose });
  };

  return (
    <Modal
      title={isView ? 'Accessory Details' : isEdit ? 'Edit Accessory' : 'Add Accessory'}
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
            <FormSec title="Vehicle & Accessory Info" />
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
              <Field label="Accessory Name" required>
                <Input placeholder="e.g. Garmin Dashcam" value={form.accessory_name} onChange={set('accessory_name')} />
              </Field>
              <Field label="Accessory Type" required>
                <Sel value={form.accessory_type} onChange={set('accessory_type')}>
                  <option value="">Select type</option>
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Sel>
              </Field>
              <Field label="Serial Number">
                <Input placeholder="e.g. SN-123456" value={form.serial_number} onChange={set('serial_number')} />
              </Field>
              <Field label="Status">
                <Sel value={form.status} onChange={set('status')}>
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </Sel>
              </Field>
            </div>

            <FormSec title="Installation & Warranty" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Installation Date">
                <Input type="date" value={form.installation_date} onChange={set('installation_date')} />
              </Field>
              <Field label="Warranty Expiry" error={errors.warranty_expiry}>
                <Input type="date" value={form.warranty_expiry} onChange={set('warranty_expiry')} />
              </Field>
            </div>

            <Field label="Notes">
              <Textarea value={form.notes} onChange={set('notes')} placeholder="Additional notes..." />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
};

const VehicleAccessories = ({ vehicleId, isTab }) => {
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading, isError, error, refetch } = useVehicleAccessories({
    ...(search && { search }),
    ...(typeFilter && { accessory_type: typeFilter }),
    ...(vehicleId && { vehicle: vehicleId }),
    page: currentPage,
  });
  const del = useDeleteVehicleAccessory();

  const accessories = data?.results ?? data ?? [];

  const stats = useMemo(() => {
    const total = accessories.length;
    const active = accessories.filter(a => a.status === 'INSTALLED').length;
    return { total, active };
  }, [accessories]);

  return (
    <div className={`flex flex-col h-full ${isTab ? '' : 'p-6 bg-[#f8fafc] flex-1 min-h-0 overflow-hidden relative font-sans text-slate-900'}`}>
      {!isTab && (
        <div className="flex items-center mb-8">
          <div className="w-1/4">
            <h2 className="text-2xl font-bold text-[#172B4D]">Accessories</h2>
            <p className="text-gray-500 text-sm tracking-tight">Manage on-board devices & equipment</p>
          </div>

          <div className="flex-1 max-w-2xl px-8">
            <div className="relative group/search">
              <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
              <input
                type="text"
                placeholder="Search equipment..."
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
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Assets:</span>
            <span className="text-[18px] font-black text-[#172B4D]">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Active Units:</span>
            <span className="text-[18px] font-black text-emerald-600">{stats.active}</span>
          </div>
          <div className="ml-auto w-1/4 flex justify-end">
            <button
              onClick={() => setModal({ mode: 'add' })}
              className="mr-0 bg-[#0052CC] text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-lg hover:shadow-blue-200 active:scale-95 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Accessory</span>
            </button>
          </div>
        </div>

        <div>
          {/* Filters & Pagination Row */}
          <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-50 h-[60px]">
            <div className="flex items-center gap-6">
              {isTab && (
                <div className="relative w-64 text-gray-400">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search equipment..."
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
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          {isLoading ? (
            <TabContentShimmer />
          ) : isError ? (
            <ErrorState message="Failed to load accessories" error={error?.message} onRetry={() => refetch()} />
          ) : !accessories.length ? (
            <EmptyState icon={Package} text="No equipment found" onAdd={() => setModal({ mode: 'add' })} />
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 bg-gray-50/80 backdrop-blur-md z-10">
                <tr className="border-b border-gray-100">
                  {!vehicleId && <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Vehicle</th>}
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Asset</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Warranty</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {accessories.map(a => (
                  <tr key={a.id} className="hover:bg-blue-50/30 transition-colors group">
                    {!vehicleId && (
                      <td className="px-5 py-4 text-sm font-medium text-gray-600 truncate max-w-[150px]">
                        <button onClick={() => setViewing(a)}
                          className="font-bold text-[#172B4D] font-mono text-[13px] hover:text-[#0052CC] transition-all text-left uppercase hover:underline decoration-blue-400/30 underline-offset-4">
                          {a.vehicle_registration_number ?? a.vehicle_registration ?? a.vehicle_display ?? a.vehicle ?? '—'}
                        </button>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-[#172B4D]">{a.accessory_name || 'Unnamed Asset'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge className={TYPE_COLORS[a.accessory_type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}>
                        {a.accessory_type_display ?? a.accessory_type}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {(() => {
                        const s = warrantyStatus(a.warranty_expiry);
                        if (!s) return <span className="text-gray-300 text-sm">—</span>;
                        const Icon = s.icon;
                        return (
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${s.cls}`}>
                            <Icon size={12} /> {s.label}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4">
                      {(() => {
                        const cfg = STATUS_CONFIG[a.status];
                        if (!cfg) return <span className="text-gray-400 text-xs">—</span>;
                        return (
                          <Badge className={`${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </Badge>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setModal({ mode: 'edit', data: a })} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all">
                          <Edit2 size={12} /> Edit
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
        <AccessoryModal
          initial={modal.data}
          onClose={() => setModal(null)}
          vehicleId={vehicleId}
          onDeleteRequest={() => { setModal(null); setDeleting(modal.data); }}
        />
      )}
      {viewing && (
        <AccessoryModal
          initial={viewing}
          onClose={() => setViewing(null)}
          isView
          vehicleId={vehicleId}
        />
      )}
      {deleting && (
        <DeleteConfirm
          label="Accessory"
          onClose={() => setDeleting(null)}
          onConfirm={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          deleting={del.isPending}
        />
      )}
    </div>
  );
};

export default VehicleAccessories;

