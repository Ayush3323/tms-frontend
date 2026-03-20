import React, { useState, useRef, useEffect } from 'react';
import {
  X, Plus, Loader2, Search, ChevronDown,
  Truck, CheckCircle, Wrench, ArchiveX,
  Fuel, Zap, Palette, Calendar, IndianRupee, Hash,
  ToggleRight, ToggleLeft
} from 'lucide-react';
import { useVehicle, useUpdateVehicle, useCreateVehicle } from '../../../queries/vehicles/vehicleQuery';
import { useVehicleTypes } from '../../../queries/vehicles/vehicletypeQuery';
import DriverSelect from '../../Drivers/common/DriverSelect';

import {
  Label, Input, Sel, Section, Modal, VehicleTypeSelect, Field,
  FUEL_COLORS, STATUS_STYLES, OWNERSHIP_COLORS, driverName
} from './VehicleCommon';


export const EMPTY_FORM = {
  registration_number: '',
  vehicle_identification_number: '',
  make: '',
  model: '',
  year: '',
  vehicle_type: '',
  capacity_tonnage: '',
  capacity_volume: '',
  fuel_type: '',
  transmission_type: '',
  color: '',
  purchase_date: '',
  purchase_price: '',
  ownership_type: '',
  current_odometer: '0',
  status: 'ACTIVE',
  assigned_driver: '',
};


// ──────────────────────────────────────────────────────────────────────

// ─── Detail View ─────────────────────────────────────────────────────────────
export const VehicleDetailView = ({ data, onClose }) => {
  const st = STATUS_STYLES[data.status] ?? STATUS_STYLES.RETIRED;

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Registration</p>
          <p className="text-lg font-bold text-[#172B4D] font-mono">{data.registration_number}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit ${st.bg} ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {data.status_display ?? data.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Make / Model</p>
          <p className="text-sm font-bold text-[#172B4D]">{data.make} {data.model}</p>
          {data.year && <p className="text-xs text-gray-400">Year: {data.year}</p>}
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vehicle Type</p>
          <p className="text-sm font-bold text-[#172B4D]">{data.vehicle_type_name ?? data.vehicle_type?.type_name ?? '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fuel & Transmission</p>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${FUEL_COLORS[data.fuel_type] ?? 'bg-gray-100 text-gray-600'}`}>
              {data.fuel_type}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 uppercase">
              {data.transmission_type ?? '—'}
            </span>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ownership</p>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${OWNERSHIP_COLORS[data.ownership_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {data.ownership_type_display ?? data.ownership_type}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Odometer</p>
          <p className="text-sm font-bold text-gray-700 font-mono">
            {data.current_odometer != null ? `${Number(data.current_odometer).toLocaleString()} km` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">VIN Number</p>
          <p className="text-[12px] font-bold text-[#172B4D] font-mono truncate">{data.vehicle_identification_number ?? '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Assigned Driver</p>
          <p className="text-sm font-bold text-[#172B4D]">{driverName(data.assigned_driver)}</p>
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

// ── Vehicle Form Modal (Add + Edit) ───────────────────────────────────
export const VehicleFormModal = ({ initial, onClose, isView }) => {
  const isEdit = !!initial?.id && !isView;
  const [form, setForm] = useState(
    initial ? {
      registration_number: initial.registration_number ?? '',
      vehicle_identification_number: initial.vehicle_identification_number ?? '',
      make: initial.make ?? '',
      model: initial.model ?? '',
      year: initial.year != null ? String(initial.year) : '',
      vehicle_type: initial.vehicle_type?.id ?? initial.vehicle_type ?? '',
      capacity_tonnage: initial.capacity_tonnage != null ? String(parseFloat(initial.capacity_tonnage)) : '',
      capacity_volume: initial.capacity_volume != null ? String(parseFloat(initial.capacity_volume)) : '',
      fuel_type: initial.fuel_type ?? '',
      transmission_type: initial.transmission_type ?? '',
      color: initial.color ?? '',
      purchase_date: initial.purchase_date ?? '',
      purchase_price: initial.purchase_price != null ? String(parseFloat(initial.purchase_price)) : '',
      ownership_type:                initial.ownership_type                               ?? '',
      current_odometer:              initial.current_odometer != null ? String(parseFloat(initial.current_odometer)) : '0',
      status:                        initial.status                                       ?? 'ACTIVE',
      assigned_driver:               initial.assigned_driver?.id ?? initial.assigned_driver ?? '',
    } : EMPTY_FORM
  );

  const [errors, setErrors] = useState({});
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const isPending = createVehicle.isPending || updateVehicle.isPending;
  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    if (errors[f]) setErrors(p => ({ ...p, [f]: null }));
  };

  const handleSubmit = () => {
    const clean = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
    );

    const onSuccess = () => {
      setErrors({});
      onClose();
    };

    const onError = (error) => {
      if (error.response?.status === 400 && typeof error.response.data === 'object') {
        setErrors(error.response.data);
      }
    };

    if (isEdit) {
      updateVehicle.mutate({ id: initial.id, data: clean }, { onSuccess, onError });
    } else {
      createVehicle.mutate(clean, { onSuccess, onError });
    }
  };

  const canSubmit = form.registration_number && form.make && form.model && form.fuel_type && form.ownership_type && !isPending;

  return (
    <Modal
      title={isView ? 'Vehicle Registry Details' : isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={isPending}
      isView={isView}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {isView ? (
          <VehicleDetailView data={initial} onClose={onClose} />
        ) : (
          <>
            <Section title="Vehicle Identity" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Registration Number" required error={errors.registration_number}>
                <Input placeholder="e.g. MH12CD5678" value={form.registration_number} onChange={set('registration_number')} />
              </Field>
              <Field label="VIN (Chassis / VIN)" error={errors.vehicle_identification_number}>
                <Input placeholder="e.g. 1HGBH41JXMN109187" value={form.vehicle_identification_number} onChange={set('vehicle_identification_number')} />
              </Field>
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
                  {['DIESEL', 'PETROL', 'CNG', 'LPG', 'ELECTRIC', 'HYBRID'].map(f => <option key={f}>{f}</option>)}
                </Sel>
              </div>
              <div>
                <Label>Transmission</Label>
                <Sel value={form.transmission_type} onChange={set('transmission_type')}>
                  <option value="">Select transmission</option>
                  {['MANUAL', 'AUTOMATIC'].map(t => <option key={t}>{t}</option>)}
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
                  {['OWNED', 'LEASED'].map(o => <option key={o}>{o}</option>)}
                </Sel>
              </div>
              <div>
                <Label>Status</Label>
                <Sel value={form.status} onChange={set('status')}>
                  {['ACTIVE', 'MAINTENANCE', 'RETIRED', 'SOLD', 'SCRAPPED'].map(s => <option key={s}>{s}</option>)}
                </Sel>
              </div>
              <div><Label>Purchase Date</Label><Input type="date" value={form.purchase_date} onChange={set('purchase_date')} /></div>
              <div><Label>Purchase Price (₹)</Label><Input type="number" placeholder="e.g. 1800000" value={form.purchase_price} onChange={set('purchase_price')} /></div>
              <div className="col-span-2">
                <Label>Assigned Driver</Label>
                <DriverSelect 
                  value={form.assigned_driver} 
                  onChange={(val) => {
                    setForm(p => ({ ...p, assigned_driver: val }));
                    if (errors.assigned_driver) setErrors(p => ({ ...p, assigned_driver: null }));
                  }} 
                  currentVehicleId={initial?.id}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
