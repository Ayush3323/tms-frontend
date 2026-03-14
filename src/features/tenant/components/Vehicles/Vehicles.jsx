import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Download, RefreshCw, Eye, PauseCircle,
  PlayCircle, Truck, CheckCircle, Wrench, ArchiveX,
  ChevronDown, Loader2, AlertCircle, X, IndianRupee,
  Pencil, Shield, Calendar, Gauge, Package, Tag,
  FileText, Settings, ClipboardList, AlertTriangle
} from 'lucide-react';
import { useVehicles, useVehicle, useUpdateVehicle, useCreateVehicle } from '../../queries/vehicles/vehicleQuery';
import { useVehicleTypes } from '../../queries/vehicles/vehicletypeQuery';

// ── Style Maps ────────────────────────────────────────────────────────
const FUEL_COLORS = {
  DIESEL:   'bg-orange-50 text-orange-600 border border-orange-200',
  PETROL:   'bg-blue-50 text-blue-600 border border-blue-200',
  CNG:      'bg-green-50 text-green-600 border border-green-200',
  LPG:      'bg-yellow-50 text-yellow-600 border border-yellow-200',
  ELECTRIC: 'bg-teal-50 text-teal-600 border border-teal-200',
  HYBRID:   'bg-purple-50 text-purple-600 border border-purple-200',
};

const STATUS_STYLES = {
  ACTIVE:      { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border border-green-200' },
  MAINTENANCE: { dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200' },
  RETIRED:     { dot: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50 border border-red-200' },
  SOLD:        { dot: 'bg-gray-400',   text: 'text-gray-600',   bg: 'bg-gray-50 border border-gray-200' },
  SCRAPPED:    { dot: 'bg-gray-500',   text: 'text-gray-600',   bg: 'bg-gray-100 border border-gray-200' },
};

const OWNERSHIP_COLORS = {
  OWNED:  'bg-blue-50 text-blue-600 border border-blue-200',
  LEASED: 'bg-purple-50 text-purple-600 border border-purple-200',
};

const EMPTY_FORM = {
  registration_number:           '',
  vehicle_identification_number: '',
  make:                          '',
  model:                         '',
  year:                          '',
  vehicle_type:                  '',
  capacity_tonnage:              '',
  capacity_volume:               '',
  fuel_type:                     '',
  transmission_type:             '',
  color:                         '',
  purchase_date:                 '',
  purchase_price:                '',
  ownership_type:                '',
  current_odometer:              '0',
  status:                        'ACTIVE',
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

const Section = ({ title }) => (
  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pt-1">{title}</p>
);

// ── Vehicle Type Searchable Dropdown ──────────────────────────────────
const VehicleTypeSelect = ({ value, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);

  const { data: vtData, isLoading } = useVehicleTypes();
  const allTypes = vtData?.results ?? vtData ?? [];
  const types = query
    ? allTypes.filter(t => (t.type_name ?? t.name)?.toLowerCase().includes(query.toLowerCase()))
    : allTypes;

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const selected = allTypes.find(t => t.id === value);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
          cursor-pointer flex items-center justify-between gap-2 transition-all hover:border-[#0052CC]/40">
        <span className={`truncate ${selected ? 'text-[#172B4D] font-semibold' : 'text-gray-300'}`}>
          {selected ? (selected.type_name ?? selected.name) : 'Select vehicle type...'}
        </span>
        <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search type name..."
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]" />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
            {isLoading && <li className="px-4 py-3 flex items-center gap-2 text-xs text-gray-400"><Loader2 size={12} className="animate-spin text-[#0052CC]" /> Loading...</li>}
            {!isLoading && types.length === 0 && <li className="px-4 py-3 text-xs text-gray-400 text-center">No types found</li>}
            {value && <li onClick={() => { onChange(''); setOpen(false); setQuery(''); }} className="px-4 py-2 cursor-pointer hover:bg-red-50 text-xs text-red-400 transition-colors">✕ Clear selection</li>}
            {types.map(t => (
              <li key={t.id} onClick={() => { onChange(t.id); setOpen(false); setQuery(''); }}
                className={`px-4 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between gap-2 ${t.id === value ? 'bg-blue-50' : ''}`}>
                <span className="font-semibold text-[#172B4D] text-sm">{t.type_name ?? t.name}</span>
                {t.category && <span className="text-xs text-gray-400">{t.category}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ── Vehicle Form Modal (Add + Edit) ───────────────────────────────────
const VehicleFormModal = ({ initial, onClose }) => {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(
    initial ? {
      registration_number:           initial.registration_number           ?? '',
      vehicle_identification_number: initial.vehicle_identification_number ?? '',
      make:                          initial.make                          ?? '',
      model:                         initial.model                         ?? '',
      year:                          initial.year                          ?? '',
      vehicle_type:                  initial.vehicle_type?.id ?? initial.vehicle_type ?? '',
      capacity_tonnage:              initial.capacity_tonnage              ?? '',
      capacity_volume:               initial.capacity_volume               ?? '',
      fuel_type:                     initial.fuel_type                     ?? '',
      transmission_type:             initial.transmission_type             ?? '',
      color:                         initial.color                         ?? '',
      purchase_date:                 initial.purchase_date                 ?? '',
      purchase_price:                initial.purchase_price                ?? '',
      ownership_type:                initial.ownership_type                ?? '',
      current_odometer:              initial.current_odometer              ?? '0',
      status:                        initial.status                        ?? 'ACTIVE',
    } : EMPTY_FORM
  );

  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const isPending     = createVehicle.isPending || updateVehicle.isPending;
  const set           = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    // Clean empty strings → null for date/number fields so API doesn't reject them
    const clean = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
    );
    if (isEdit) {
      updateVehicle.mutate({ id: initial.id, data: clean }, { onSuccess: onClose });
    } else {
      createVehicle.mutate(clean, { onSuccess: onClose });
    }
  };

  const canSubmit = form.registration_number && form.make && form.model && form.fuel_type && form.ownership_type && !isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">{isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? `Editing ${initial.registration_number}` : 'Fill in the vehicle details below'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <Section title="Vehicle Identity" />
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>Registration Number</Label><Input placeholder="e.g. MH12CD5678" value={form.registration_number} onChange={set('registration_number')} /></div>
            <div><Label>VIN (Chassis / VIN)</Label><Input placeholder="e.g. 1HGBH41JXMN109187" value={form.vehicle_identification_number} onChange={set('vehicle_identification_number')} /></div>
          </div>

          <Section title="Make & Model" />
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>Make</Label><Input placeholder="e.g. Ashok Leyland" value={form.make} onChange={set('make')} /></div>
            <div><Label required>Model</Label><Input placeholder="e.g. Dost" value={form.model} onChange={set('model')} /></div>
            <div><Label>Year</Label><Input type="number" placeholder="e.g. 2024" value={form.year} onChange={set('year')} /></div>
            <div><Label>Color</Label><Input placeholder="e.g. Blue" value={form.color} onChange={set('color')} /></div>
          </div>

          <Section title="Technical Details" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Fuel Type</Label>
              <Sel value={form.fuel_type} onChange={set('fuel_type')}>
                <option value="">Select fuel</option>
                {['DIESEL','PETROL','CNG','LPG','ELECTRIC','HYBRID'].map(f => <option key={f}>{f}</option>)}
              </Sel>
            </div>
            <div>
              <Label>Transmission</Label>
              <Sel value={form.transmission_type} onChange={set('transmission_type')}>
                <option value="">Select transmission</option>
                {['MANUAL','AUTOMATIC'].map(t => <option key={t}>{t}</option>)}
              </Sel>
            </div>
            <div><Label>Capacity (Tonnage)</Label><Input type="number" placeholder="e.g. 15" value={form.capacity_tonnage} onChange={set('capacity_tonnage')} /></div>
            <div><Label>Capacity (Volume m³)</Label><Input type="number" placeholder="e.g. 30" value={form.capacity_volume} onChange={set('capacity_volume')} /></div>
            <div><Label>Current Odometer (km)</Label><Input type="number" placeholder="0" value={form.current_odometer} onChange={set('current_odometer')} /></div>
            <div><Label>Vehicle Type</Label><VehicleTypeSelect value={form.vehicle_type} onChange={(id) => setForm(p => ({ ...p, vehicle_type: id }))} /></div>
          </div>

          <Section title="Purchase & Ownership" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Ownership Type</Label>
              <Sel value={form.ownership_type} onChange={set('ownership_type')}>
                <option value="">Select ownership</option>
                {['OWNED','LEASED'].map(o => <option key={o}>{o}</option>)}
              </Sel>
            </div>
            <div>
              <Label>Status</Label>
              <Sel value={form.status} onChange={set('status')}>
                {['ACTIVE','MAINTENANCE','RETIRED','SOLD','SCRAPPED'].map(s => <option key={s}>{s}</option>)}
              </Sel>
            </div>
            <div><Label>Purchase Date</Label><Input type="date" value={form.purchase_date} onChange={set('purchase_date')} /></div>
            <div><Label>Purchase Price (₹)</Label><Input type="number" placeholder="e.g. 1800000" value={form.purchase_price} onChange={set('purchase_price')} /></div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> {isEdit ? 'Update Vehicle' : 'Add Vehicle'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Detail Row ────────────────────────────────────────────────────────
const DR = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-semibold text-[#172B4D]">{value ?? '—'}</span>
  </div>
);

// ── Section Header in Drawer ──────────────────────────────────────────
const DrawerSection = ({ icon: Icon, title, count }) => (
  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
    <Icon size={12} /> {title}{count != null ? ` (${count})` : ''}
  </p>
);

// ── Vehicle Detail Drawer ─────────────────────────────────────────────
const VehicleDrawer = ({ vehicleId, onClose, onEdit }) => {
  const { data: v, isLoading } = useVehicle(vehicleId);
  const st = v ? (STATUS_STYLES[v.status] ?? STATUS_STYLES.RETIRED) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">{v?.registration_number ?? 'Vehicle Details'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{v?.make} {v?.model}{v?.year ? ` · ${v.year}` : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {v && (
              <button onClick={() => { onClose(); onEdit(v); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all">
                <Pencil size={13} /> Edit
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[#0052CC]" />
          </div>
        )}

        {v && (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${st.bg} ${st.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{v.status_display ?? v.status}
              </span>
              <span className={`px-2 py-1 rounded-md text-xs font-bold border ${OWNERSHIP_COLORS[v.ownership_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {v.ownership_type_display ?? v.ownership_type}
              </span>
              {v.fuel_type && (
                <span className={`px-2 py-1 rounded-md text-xs font-bold ${FUEL_COLORS[v.fuel_type] ?? 'bg-gray-100 text-gray-600'}`}>
                  {v.fuel_type_display ?? v.fuel_type}
                </span>
              )}
              {v.vehicle_type?.type_name && (
                <span className="px-2 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                  {v.vehicle_type.type_name}
                </span>
              )}
            </div>

            {/* Identity */}
            <div>
              <DrawerSection icon={FileText} title="Identity" />
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                <DR label="Registration" value={v.registration_number} />
                <DR label="VIN / Chassis" value={v.vehicle_identification_number} />
                <DR label="Make" value={v.make} />
                <DR label="Model" value={v.model} />
                <DR label="Year" value={v.year} />
                <DR label="Color" value={v.color} />
                <DR label="Transmission" value={v.transmission_type_display ?? v.transmission_type} />
                <DR label="Assigned Driver" value={v.assigned_driver ?? null} />
              </div>
            </div>

            {/* Capacity & Odometer */}
            <div>
              <DrawerSection icon={Gauge} title="Capacity & Odometer" />
              <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
                <DR label="Tonnage" value={v.capacity_tonnage ? `${v.capacity_tonnage} T` : null} />
                <DR label="Volume" value={v.capacity_volume ? `${v.capacity_volume} m³` : null} />
                <DR label="Odometer" value={v.current_odometer ? `${Number(v.current_odometer).toLocaleString()} km` : null} />
              </div>
            </div>

            {/* Purchase */}
            <div>
              <DrawerSection icon={IndianRupee} title="Purchase" />
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                <DR label="Purchase Date" value={v.purchase_date} />
                <DR label="Purchase Price" value={v.purchase_price ? `₹${Number(v.purchase_price).toLocaleString('en-IN')}` : null} />
              </div>
            </div>

            {/* Insurance */}
            {v.insurance_policies?.length > 0 && (
              <div>
                <DrawerSection icon={Shield} title="Insurance" count={v.insurance_policies.length} />
                <div className="space-y-2">
                  {v.insurance_policies.map(p => (
                    <div key={p.id} className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3">
                      <DR label="Policy No." value={p.policy_number} />
                      <DR label="Company" value={p.insurance_company} />
                      <DR label="Type" value={p.policy_type_display} />
                      <DR label="Premium" value={p.premium_amount ? `₹${Number(p.premium_amount).toLocaleString('en-IN')}` : null} />
                      <DR label="Coverage" value={p.coverage_amount ? `₹${Number(p.coverage_amount).toLocaleString('en-IN')}` : null} />
                      <DR label="Expiry" value={p.expiry_date} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Maintenance Schedules */}
            {v.maintenance_schedules?.length > 0 && (
              <div>
                <DrawerSection icon={Wrench} title="Maintenance Schedules" count={v.maintenance_schedules.length} />
                <div className="space-y-2">
                  {v.maintenance_schedules.map(m => (
                    <div key={m.id} className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3">
                      <DR label="Type" value={m.maintenance_type_display} />
                      <DR label="Scheduled" value={m.scheduled_date} />
                      <DR label="Status" value={m.status_display} />
                      <DR label="Next Due" value={m.next_due_date} />
                      <DR label="Interval" value={m.service_interval_km ? `${m.service_interval_km} km` : null} />
                      <DR label="Description" value={m.description} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Maintenance Records */}
            {v.maintenance_records?.length > 0 && (
              <div>
                <DrawerSection icon={ClipboardList} title="Maintenance Records" count={v.maintenance_records.length} />
                <div className="space-y-2">
                  {v.maintenance_records.map(r => (
                    <div key={r.id} className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3">
                      <DR label="Service" value={r.service_type} />
                      <DR label="Provider" value={r.service_provider} />
                      <DR label="Date" value={r.service_date} />
                      <DR label="Total Cost" value={r.total_cost ? `₹${Number(r.total_cost).toLocaleString('en-IN')}` : null} />
                      <DR label="Labor Hrs" value={r.labor_hours ? `${r.labor_hours} hrs` : null} />
                      <DR label="Next Service" value={r.next_service_due} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inspections */}
            {v.inspections?.length > 0 && (
              <div>
                <DrawerSection icon={AlertTriangle} title="Inspections" count={v.inspections.length} />
                <div className="space-y-2">
                  {v.inspections.map(i => (
                    <div key={i.id} className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3">
                      <DR label="Type" value={i.inspection_type_display} />
                      <DR label="Date" value={i.inspection_date ? new Date(i.inspection_date).toLocaleDateString('en-IN') : null} />
                      <DR label="Result" value={i.overall_status} />
                      <DR label="Inspector" value={i.inspector_signature} />
                      <DR label="Odometer" value={i.odometer_reading ? `${Number(i.odometer_reading).toLocaleString()} km` : null} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tires */}
            {v.tires?.length > 0 && (
              <div>
                <DrawerSection icon={Settings} title="Tires" count={v.tires.length} />
                <div className="space-y-2">
                  {v.tires.map(t => (
                    <div key={t.id} className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3">
                      <DR label="Brand" value={t.tire_brand} />
                      <DR label="Position" value={t.tire_position_display} />
                      <DR label="Serial" value={t.tire_serial_number} />
                      <DR label="Status" value={t.status_display} />
                      <DR label="Tread Depth" value={t.tread_depth ? `${t.tread_depth} mm` : null} />
                      <DR label="Installed" value={t.installation_date} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accessories */}
            {v.accessories?.length > 0 && (
              <div>
                <DrawerSection icon={Package} title="Accessories" count={v.accessories.length} />
                <div className="space-y-2">
                  {v.accessories.map(a => (
                    <div key={a.id} className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3">
                      <DR label="Name" value={a.accessory_name} />
                      <DR label="Type" value={a.accessory_type_display} />
                      <DR label="Serial" value={a.serial_number} />
                      <DR label="Status" value={a.status} />
                      <DR label="Installed" value={a.installation_date} />
                      <DR label="Warranty" value={a.warranty_expiry} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Toll Tags */}
            {v.toll_tags?.length > 0 && (
              <div>
                <DrawerSection icon={Tag} title="Toll Tags" count={v.toll_tags.length} />
                <div className="space-y-2">
                  {v.toll_tags.map(t => (
                    <div key={t.id} className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3">
                      <DR label="Tag Number" value={t.tag_number} />
                      <DR label="Provider" value={t.tag_provider} />
                      <DR label="Balance" value={t.recharge_balance ? `₹${Number(t.recharge_balance).toLocaleString('en-IN')}` : null} />
                      <DR label="Expiry" value={t.expiry_date} />
                      <DR label="Active" value={t.is_active ? 'Yes' : 'No'} />
                      <DR label="Bank A/C" value={t.linked_bank_account} />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon: Icon, loading }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.iconBg}`}>
        <Icon size={15} className={color.iconText} />
      </span>
    </div>
    {loading
      ? <div className="h-9 w-12 bg-gray-100 rounded animate-pulse" />
      : <span className={`text-3xl font-black ${color.value}`}>{value}</span>
    }
  </div>
);

// ── Main Component ────────────────────────────────────────────────────
const Vehicles = () => {
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [fuelFilter, setFuel]     = useState('');
  const [ownerFilter, setOwner]   = useState('');
  const navigate      = useNavigate();
  const [formModal, setFormModal] = useState(null);  // null | 'add' | vehicleObj

  const { data, isLoading, isError, error, refetch } = useVehicles({
    ...(statusFilter && { status: statusFilter }),
    ...(fuelFilter   && { fuel_type: fuelFilter }),
    ...(ownerFilter  && { ownership_type: ownerFilter }),
    ...(search       && { search }),
  });

  const updateVehicle = useUpdateVehicle();
  const vehicles      = data?.results ?? data ?? [];
  const total         = data?.count ?? vehicles.length;
  const active        = vehicles.filter(v => v.status === 'ACTIVE').length;
  const maintenance   = vehicles.filter(v => v.status === 'MAINTENANCE').length;
  const retired       = vehicles.filter(v => ['RETIRED','SOLD','SCRAPPED'].includes(v.status)).length;

  const handleStatusToggle = (v) =>
    updateVehicle.mutate({ id: v.id, data: { status: v.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE' } });

  const resetFilters = () => { setSearch(''); setStatus(''); setFuel(''); setOwner(''); };

  const COLUMNS = [
    {
      header: 'Registration',
      render: v => (
        <div>
          <span className="font-bold text-[#172B4D] font-mono text-[13px]">{v.registration_number ?? '—'}</span>
          <div className="text-[11px] text-gray-400">{v.vehicle_identification_number ?? ''}</div>
        </div>
      ),
    },
    {
      header: 'Make / Model',
      render: v => (
        <div>
          <span className="font-semibold text-gray-800">{v.make ?? '—'}</span>
          <div className="text-[11px] text-gray-400">{v.model ?? ''}</div>
        </div>
      ),
    },
    { header: 'Year', render: v => <span className="text-gray-600">{v.year ?? '—'}</span> },
    {
      header: 'Fuel / Trans',
      render: v => (
        <div className="flex flex-col gap-1">
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold w-fit ${FUEL_COLORS[v.fuel_type] ?? 'bg-gray-100 text-gray-600'}`}>
            {v.fuel_type_display ?? v.fuel_type ?? '—'}
          </span>
          {v.transmission_type && <span className="text-[11px] text-gray-400">{v.transmission_type_display ?? v.transmission_type}</span>}
        </div>
      ),
    },
    {
      header: 'Capacity',
      render: v => (
        <div className="text-[12px] text-gray-600 space-y-0.5">
          {v.capacity_tonnage && <div>⚖️ {v.capacity_tonnage}T</div>}
          {v.capacity_volume  && <div>📦 {v.capacity_volume}m³</div>}
          {!v.capacity_tonnage && !v.capacity_volume && '—'}
        </div>
      ),
    },
    {
      header: 'Odometer',
      render: v => (
        <span className="text-gray-600 font-mono text-[12px]">
          {v.current_odometer != null ? `${Number(v.current_odometer).toLocaleString()} km` : '—'}
        </span>
      ),
    },
    {
      header: 'Ownership',
      render: v => (
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${OWNERSHIP_COLORS[v.ownership_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
          {v.ownership_type_display ?? v.ownership_type ?? '—'}
        </span>
      ),
    },
    {
      header: 'Purchase',
      render: v => (
        <div className="text-[12px] text-gray-600 space-y-0.5">
          {v.purchase_date && <div>{v.purchase_date}</div>}
          {v.purchase_price &&
            <div className="flex items-center gap-0.5 text-green-600 font-semibold">
              <IndianRupee size={11} />{Number(v.purchase_price).toLocaleString('en-IN')}
            </div>
          }
          {!v.purchase_date && !v.purchase_price && '—'}
        </div>
      ),
    },
    {
      header: 'Status',
      render: v => {
        const st = STATUS_STYLES[v.status] ?? STATUS_STYLES.RETIRED;
        return (
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit whitespace-nowrap ${st.bg} ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {v.status_display ?? v.status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: v => {
        const isActive = v.status === 'ACTIVE';
        const isMaint  = v.status === 'MAINTENANCE';
        return (
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/tenant/dashboard/vehicles/${v.id}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all">
              <Eye size={12} /> View
            </button>
            <button onClick={() => setFormModal(v)}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all">
              <Pencil size={12} /> Edit
            </button>
            {isActive && (
              <button onClick={() => handleStatusToggle(v)} disabled={updateVehicle.isPending}
                className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50">
                <PauseCircle size={12} /> Suspend
              </button>
            )}
            {isMaint && (
              <button onClick={() => handleStatusToggle(v)} disabled={updateVehicle.isPending}
                className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50">
                <PlayCircle size={12} /> Activate
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-screen">

      {formModal && (
        <VehicleFormModal
          initial={formModal === 'add' ? null : formModal}
          onClose={() => setFormModal(null)}
        />
      )}


      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Vehicles</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            All registered vehicles — click <span className="text-[#0052CC] font-semibold">View</span> for full details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <Download size={14} /> Export
          </button>
          <button onClick={() => setFormModal('add')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all shadow-sm">
            <Plus size={15} /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard loading={isLoading} label="Total"          value={total}       icon={Truck}       color={{ value: 'text-[#172B4D]', iconBg: 'bg-blue-50',   iconText: 'text-blue-500' }} />
        <StatCard loading={isLoading} label="Active"         value={active}      icon={CheckCircle} color={{ value: 'text-green-600',  iconBg: 'bg-green-50',  iconText: 'text-green-500' }} />
        <StatCard loading={isLoading} label="Maintenance"    value={maintenance} icon={Wrench}      color={{ value: 'text-orange-500', iconBg: 'bg-orange-50', iconText: 'text-orange-500' }} />
        <StatCard loading={isLoading} label="Retired / Sold" value={retired}     icon={ArchiveX}    color={{ value: 'text-red-500',    iconBg: 'bg-red-50',    iconText: 'text-red-400' }} />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#172B4D]">🚛 Vehicle Registry</h2>
            <p className="text-xs text-gray-400 mt-0.5">Click View to see complete vehicle profile</p>
          </div>
          <button onClick={() => setFormModal('add')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
            <Plus size={14} /> Add Vehicle
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search registration, make, model..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50" />
          </div>
          {[
            { val: statusFilter, set: setStatus, opts: ['ACTIVE','MAINTENANCE','RETIRED','SOLD','SCRAPPED'], ph: 'All Status' },
            { val: fuelFilter,   set: setFuel,   opts: ['DIESEL','PETROL','CNG','LPG','ELECTRIC','HYBRID'], ph: 'All Fuel' },
            { val: ownerFilter,  set: setOwner,  opts: ['OWNED','LEASED'],                                  ph: 'All Ownership' },
          ].map(({ val, set, opts, ph }) => (
            <div key={ph} className="relative">
              <select value={val} onChange={e => set(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer">
                <option value="">{ph}</option>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          ))}
          <button onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all">
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin text-[#0052CC]" />
            <span className="text-sm">Loading vehicles...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
            <AlertCircle size={32} />
            <p className="text-sm font-medium">Failed to load vehicles</p>
            <p className="text-xs text-gray-400">{error?.response?.data?.detail || error?.message}</p>
            <button onClick={() => refetch()} className="px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8]">Try Again</button>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {COLUMNS.map(c => (
                    <th key={c.header} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{c.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-blue-50/30 transition-colors">
                    {COLUMNS.map(c => (
                      <td key={c.header} className="px-4 py-3 whitespace-nowrap align-middle">{c.render(v)}</td>
                    ))}
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-gray-400">
                      <Truck size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No vehicles found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>
              Showing <span className="font-bold text-gray-600">{vehicles.length}</span>
              {data?.count && data.count !== vehicles.length &&
                <> of <span className="font-bold text-gray-600">{data.count}</span></>
              } vehicles
            </span>
            <span className="text-[11px]">Fleet Management System</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vehicles;
