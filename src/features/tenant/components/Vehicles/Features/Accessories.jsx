import React, { useState, useMemo } from 'react';
import {
  Package, Plus, Edit2, Trash2, Search,
  RefreshCw, Loader2, CheckCircle, Clock, XCircle, ChevronDown,
  Calendar, Hash, FileText
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
                  <VehicleSelect value={form.vehicle} onChange={(id) => setForm(p => ({ ...p, vehicle: id }))} />
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

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading, isError, error, refetch } = useVehicleAccessories({
    ...(search && { search }),
    ...(typeFilter && { accessory_type: typeFilter }),
    ...(vehicleId && { vehicle: vehicleId }),
  });
  const del = useDeleteVehicleAccessory();

  const accessories = data?.results ?? data ?? [];

  const stats = useMemo(() => {
    const total = accessories.length;
    const active = accessories.filter(a => a.status === 'INSTALLED').length;
    return { total, active };
  }, [accessories]);

  return (
    <div className={`flex flex-col h-full bg-[#F4F5F7] ${isTab ? '' : 'p-6'}`}>
      {!isTab && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Accessories</h1>
            <p className="text-sm text-gray-400 font-medium">Manage on-board devices and equipment</p>
          </div>

        </div>
      )}

      {!isTab && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <StatCard icon={Package} label="Total Assets" value={stats.total} color="blue" />
          <StatCard icon={CheckCircle} label="Active Units" value={stats.active} color="emerald" />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
        <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Search equipment..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-[#0052CC]/10"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Sel className="w-40" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Sel>
          </div>
          {isTab && (
            <button
              onClick={() => setModal({ mode: 'add' })}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] shadow-sm">
              <Plus size={14} /> Add Accessory
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto">
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
