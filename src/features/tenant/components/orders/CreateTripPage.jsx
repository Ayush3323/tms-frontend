import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Save, X, FileText, Truck, 
  MapPin, Gauge, DollarSign, CheckCircle2, AlertCircle, GripVertical
} from 'lucide-react';
import { useCreateTrip, useOrders } from '../../queries/orders/ordersQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';
import { useVehicleTypes } from '../../queries/vehicles/vehicletypeQuery';
import { tripsApi } from '../../api/orders/ordersEndpoint';

// --- Reusable UI Components (matching previous standardization) ---
const FieldGroup = ({ label, children, required }) => (
  <div className="flex flex-col">
    <label className="block text-gray-700 font-medium mb-1 text-sm">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputClass = "w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a6cf7] outline-none transition-all text-sm";

export default function CreateTripPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const createTripMutation = useCreateTrip();

  // Queries for lookups
  const { data: ordersData } = useOrders({ page_size: 100 });
  const ordersDataResults = ordersData?.results || [];
  const orders = useMemo(() => ordersDataResults.filter(o => 
    ['DRAFT', 'CONFIRMED'].includes(o.status)
  ), [ordersDataResults]);
  const { data: driversData } = useDrivers({ page_size: 100 });
  const drivers = driversData?.results || [];
  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const vehicles = vehiclesData?.results || [];
  const { data: vehicleTypesData } = useVehicleTypes({ page_size: 200 });
  const vehicleTypes = vehicleTypesData?.results || [];

  const [formData, setFormData] = useState({
    order_id: "", lr_number: "", reference_number: "", trip_type: "FTL", status: "CREATED",
    primary_vehicle_id: null, vehicle_number: "", vehicle_type_code: "", vehicle_owner_name: "",
    primary_driver_id: null, alternate_vehicle_id: null, alternate_driver_id: null,
    origin_address: "", destination_address: "",
    created_date: new Date().toISOString().split('T')[0],
    scheduled_pickup_date: null, scheduled_delivery_date: null,
    actual_pickup_date: null, actual_delivery_date: null,
    start_time: null, end_time: null,
    total_distance_km: null, start_odometer_km: null, end_odometer_km: null,
    estimated_fuel_liters: null, actual_fuel_liters: null, fuel_rate_per_liter: null,
    damage_count: 0, pod_turnaround_days: null,
    booked_price: null, total_freight_charge: "0.00", total_accessorial_charge: "0.00", total_tax: "0.00",
    tds_percentage: "0.00", tds_amount: "0.00", incentive_amount: "0.00", late_fee: "0.00",
    part_load_charge: "0.00", damage_amount: "0.00", broker_commission: "0.00",
    total_bill_amount: "0.00", payment_received_amount: "0.00", payment_received_date: null,
    pod_received_date: null, is_billed: false, is_paid: false,
    remarks: "", version: 1
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [stopErrors, setStopErrors] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [plannedStops, setPlannedStops] = useState([
    { stop_type: 'PICKUP', location_address: '', instructions: '', scheduled_arrival: '', scheduled_departure: '' },
    { stop_type: 'DELIVERY', location_address: '', instructions: '', scheduled_arrival: '', scheduled_departure: '' },
  ]);

  const steps = [
    { id: 1, name: 'General Info', icon: FileText },
    { id: 2, name: 'Fleet & Team', icon: Truck },
    { id: 3, name: 'Route & Schedule', icon: MapPin },
    { id: 4, name: 'Metrics', icon: Gauge },
    { id: 5, name: 'Financials', icon: DollarSign },
    { id: 6, name: 'Review', icon: CheckCircle2 }
  ];

  const validateField = (name, value, currentData) => {
    if (name === 'pod_turnaround_days') {
      if (value === '' || value === null) return '';
      const n = Number(value);
      if (Number.isNaN(n)) return 'Enter a valid number';
      if (n < 0) return 'Must be 0 or more';
    }
    if (name === 'damage_count') {
      if (value === '' || value === null) return '';
      const n = Number(value);
      if (Number.isNaN(n)) return 'Enter a valid number';
      if (n < 0) return 'Must be 0 or more';
    }
    if (name === 'end_time') {
      const start = currentData.start_time;
      if (start && value && value < start) return 'End time cannot be before start time';
    }
    if (name === 'start_time') {
      const end = currentData.end_time;
      if (end && value && end < value) return 'Start time cannot be after end time';
    }
    if (name === 'scheduled_pickup_date' || name === 'scheduled_delivery_date') {
      const pickup = currentData.scheduled_pickup_date;
      const delivery = currentData.scheduled_delivery_date;
      if (pickup && delivery && delivery < pickup) return 'Scheduled delivery cannot be before scheduled pickup';
    }
    if (name === 'actual_pickup_date' || name === 'actual_delivery_date') {
      const pickup = currentData.actual_pickup_date;
      const delivery = currentData.actual_delivery_date;
      if (pickup && delivery && delivery < pickup) return 'Actual delivery cannot be before actual pickup';
    }
    if (name === 'alternate_vehicle_id' || name === 'primary_vehicle_id') {
      if (
        currentData.primary_vehicle_id &&
        currentData.alternate_vehicle_id &&
        String(currentData.primary_vehicle_id) === String(currentData.alternate_vehicle_id)
      ) return 'Primary and alternate vehicle must be different';
    }
    if (name === 'alternate_driver_id' || name === 'primary_driver_id') {
      if (
        currentData.primary_driver_id &&
        currentData.alternate_driver_id &&
        String(currentData.primary_driver_id) === String(currentData.alternate_driver_id)
      ) return 'Primary and alternate driver must be different';
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      const err = validateField(name, next[name], next);
      const vehiclePairErr = validateField('alternate_vehicle_id', next.alternate_vehicle_id, next);
      const driverPairErr = validateField('alternate_driver_id', next.alternate_driver_id, next);
      const scheduledDateErr = validateField('scheduled_delivery_date', next.scheduled_delivery_date, next);
      const actualDateErr = validateField('actual_delivery_date', next.actual_delivery_date, next);
      setFieldErrors((p) => ({
        ...p,
        [name]: err,
        primary_vehicle_id: vehiclePairErr,
        alternate_vehicle_id: vehiclePairErr,
        primary_driver_id: driverPairErr,
        alternate_driver_id: driverPairErr,
        scheduled_delivery_date: scheduledDateErr,
        actual_delivery_date: actualDateErr,
      }));
      return next;
    });
  };

  const handleOrderChange = (id) => {
    const order = orders.find(o => String(o.id) === String(id));
    setFormData(prev => ({
      ...prev,
      order_id: id,
      lr_number: order ? order.lr_number : ""
    }));
  };

  const validateStops = (stops = plannedStops) => {
    const normalized = stops
      .map((s, idx) => ({ ...s, idx }))
      .filter((s) => (s.location_address || '').trim());
    const pickupIndices = normalized.filter((s) => s.stop_type === 'PICKUP').map((s) => s.idx);
    const deliveryIndices = normalized.filter((s) => s.stop_type === 'DELIVERY').map((s) => s.idx);
    const errors = [];
    if (pickupIndices.length === 0) errors.push('Add at least one pickup stop with location.');
    if (deliveryIndices.length === 0) errors.push('Add at least one delivery stop with location.');
    if (pickupIndices.length > 0 && deliveryIndices.length > 0) {
      const lastPickupIdx = Math.max(...pickupIndices);
      const invalidDelivery = deliveryIndices.some((i) => i <= lastPickupIdx);
      if (invalidDelivery) errors.push('All delivery stops must come after pickup stops.');
    }
    setStopErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (currentStep === 3 && !validateStops()) return;
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const vehiclePairErr = validateField('alternate_vehicle_id', formData.alternate_vehicle_id, formData);
    const driverPairErr = validateField('alternate_driver_id', formData.alternate_driver_id, formData);
    const scheduledDateErr = validateField('scheduled_delivery_date', formData.scheduled_delivery_date, formData);
    const actualDateErr = validateField('actual_delivery_date', formData.actual_delivery_date, formData);
    if (vehiclePairErr || driverPairErr || scheduledDateErr || actualDateErr) {
      setFieldErrors((p) => ({
        ...p,
        primary_vehicle_id: vehiclePairErr,
        alternate_vehicle_id: vehiclePairErr,
        primary_driver_id: driverPairErr,
        alternate_driver_id: driverPairErr,
        scheduled_delivery_date: scheduledDateErr,
        actual_delivery_date: actualDateErr,
      }));
      return;
    }
    if (!validateStops()) return;
    if (currentStep < steps.length) {
      handleNext();
      return;
    }
    const payload = {
      ...formData,
      scheduled_pickup_date: formData.scheduled_pickup_date || null,
      scheduled_delivery_date: formData.scheduled_delivery_date || null,
      actual_pickup_date: formData.actual_pickup_date || null,
      actual_delivery_date: formData.actual_delivery_date || null,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      pod_turnaround_days: formData.pod_turnaround_days === '' ? null : formData.pod_turnaround_days,
      total_distance_km: formData.total_distance_km === '' ? null : formData.total_distance_km,
      start_odometer_km: formData.start_odometer_km === '' ? null : formData.start_odometer_km,
      end_odometer_km: formData.end_odometer_km === '' ? null : formData.end_odometer_km,
      estimated_fuel_liters: formData.estimated_fuel_liters === '' ? null : formData.estimated_fuel_liters,
      actual_fuel_liters: formData.actual_fuel_liters === '' ? null : formData.actual_fuel_liters,
      fuel_rate_per_liter: formData.fuel_rate_per_liter === '' ? null : formData.fuel_rate_per_liter,
      booked_price: formData.booked_price === '' ? null : formData.booked_price,
      payment_received_date: formData.payment_received_date || null,
      pod_received_date: formData.pod_received_date || null,
    };
    try {
      const createdTrip = await createTripMutation.mutateAsync(payload);
      const tripId = createdTrip?.id;

      if (tripId && plannedStops.length > 0) {
        const stopPayloads = plannedStops
          .map((s, idx) => ({
            stop_sequence: idx + 1,
            stop_type: s.stop_type,
            location_address: s.location_address || '',
            instructions: s.instructions || '',
            scheduled_arrival: s.scheduled_arrival || null,
            scheduled_departure: s.scheduled_departure || null,
            stop_status: 'PENDING',
          }))
          .filter((s) => s.location_address);

        for (const stop of stopPayloads) {
          await tripsApi.createStop(tripId, stop);
        }
      }

      navigate(`/tenant/dashboard/orders/trips/${tripId}`);
    } catch (_) {
      // toast is already handled by query layer
    }
  };

  const addStopRow = () => {
    setPlannedStops((prev) => {
      const next = [
      ...prev,
      { stop_type: 'DELIVERY', location_address: '', instructions: '', scheduled_arrival: '', scheduled_departure: '' },
      ];
      validateStops(next);
      return next;
    });
  };

  const removeStopRow = (index) => {
    setPlannedStops((prev) => {
      const next = prev.filter((_, i) => i !== index);
      validateStops(next);
      return next;
    });
  };

  const updateStopRow = (index, key, value) => {
    setPlannedStops((prev) => {
      const next = prev.map((s, i) => (i === index ? { ...s, [key]: value } : s));
      validateStops(next);
      return next;
    });
  };

  const handleStopDragStart = (index) => setDragIdx(index);
  const handleStopDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIdx(index);
  };
  const handleStopDrop = (index) => {
    if (dragIdx === null || dragIdx === index) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    setPlannedStops((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(index, 0, moved);
      validateStops(next);
      return next;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] min-h-0 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">Plan New Trip</h1>
          </div>
          <button 
            onClick={() => navigate('/tenant/dashboard/orders/trips')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Horizontal Stepper */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 -z-0"></div>
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 ${
                      isActive ? 'bg-[#4a6cf7] border-[#4a6cf7] text-white shadow-lg shadow-blue-100 scale-110' : 
                      isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                      'bg-white border-gray-200 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-[#4a6cf7]' : 'text-gray-400'}`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-8 flex-1">
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
                    <div className="p-2 bg-blue-50 text-[#4a6cf7] rounded-lg"><FileText size={20} /></div>
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">General Information</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <FieldGroup label="order">
                      <select name="order_id" className={inputClass} value={formData.order_id} onChange={e => handleOrderChange(e.target.value)}>
                        <option value="">Standalone Trip (No Order)</option>
                        {orders.map(o => <option key={o.id} value={o.id}>{o.lr_number} — {o.status}</option>)}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="trip_number">
                      <input type="text" readOnly className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`} value="Auto-generated by backend (unique)" />
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-8">
                    <FieldGroup label="lr_number">
                      <input type="text" name="lr_number" className={inputClass} value={formData.lr_number} onChange={handleInputChange} placeholder="Auto-filled from order" />
                    </FieldGroup>
                    <FieldGroup label="reference_number">
                      <input type="text" name="reference_number" className={inputClass} value={formData.reference_number} onChange={handleInputChange} placeholder="PO-12345" />
                    </FieldGroup>
                    <FieldGroup label="trip_type">
                      <select name="trip_type" className={inputClass} value={formData.trip_type} onChange={handleInputChange}>
                        <option value="FTL">Full Truck Load (FTL)</option>
                        <option value="LTL">Less than Truck Load (LTL)</option>
                        <option value="CONTAINER">Container</option>
                        <option value="COURIER">Courier</option>
                      </select>
                    </FieldGroup>
                  </div>
                  <FieldGroup label="status">
                    <select name="status" className={inputClass} value={formData.status} onChange={handleInputChange}>
                      <option value="CREATED">CREATED</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                                <option value="DISPATCHED">DISPATCHED</option>
                      <option value="IN_TRANSIT">IN_TRANSIT</option>
                                <option value="DELAYED">DELAYED</option>
                                <option value="ARRIVED">ARRIVED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </FieldGroup>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Truck size={20} /></div>
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Fleet & Team Allocation</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <FieldGroup label="primary_vehicle_id">
                      <select name="primary_vehicle_id" className={inputClass} value={formData.primary_vehicle_id || ""} onChange={handleInputChange}>
                        <option value="">Select Vehicle</option>
                        {vehicles.map(v => <option key={v.id} value={v.id} disabled={String(formData.alternate_vehicle_id) === String(v.id)}>{v.registration_number}</option>)}
                      </select>
                      {fieldErrors.primary_vehicle_id && <p className="mt-1 text-xs text-red-600">{fieldErrors.primary_vehicle_id}</p>}
                    </FieldGroup>
                    <FieldGroup label="primary_driver_id">
                      <select name="primary_driver_id" className={inputClass} value={formData.primary_driver_id || ""} onChange={handleInputChange}>
                        <option value="">Select Driver</option>
                        {drivers.map(d => <option key={d.id} value={d.id} disabled={String(formData.alternate_driver_id) === String(d.id)}>{d.user?.first_name} {d.user?.last_name}</option>)}
                      </select>
                      {fieldErrors.primary_driver_id && <p className="mt-1 text-xs text-red-600">{fieldErrors.primary_driver_id}</p>}
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-2 gap-8 border-t border-gray-50 pt-8 mt-8">
                    <FieldGroup label="alternate_vehicle_id">
                      <select name="alternate_vehicle_id" className={inputClass} value={formData.alternate_vehicle_id || ""} onChange={handleInputChange}>
                        <option value="">None</option>
                        {vehicles.map(v => <option key={v.id} value={v.id} disabled={String(formData.primary_vehicle_id) === String(v.id)}>{v.registration_number}</option>)}
                      </select>
                      {fieldErrors.alternate_vehicle_id && <p className="mt-1 text-xs text-red-600">{fieldErrors.alternate_vehicle_id}</p>}
                    </FieldGroup>
                    <FieldGroup label="alternate_driver_id">
                      <select name="alternate_driver_id" className={inputClass} value={formData.alternate_driver_id || ""} onChange={handleInputChange}>
                        <option value="">None</option>
                        {drivers.map(d => <option key={d.id} value={d.id} disabled={String(formData.primary_driver_id) === String(d.id)}>{d.user?.first_name} {d.user?.last_name}</option>)}
                      </select>
                      {fieldErrors.alternate_driver_id && <p className="mt-1 text-xs text-red-600">{fieldErrors.alternate_driver_id}</p>}
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-8 mt-4">
                     <FieldGroup label="vehicle_number"><input type="text" name="vehicle_number" className={inputClass} value={formData.vehicle_number} onChange={handleInputChange} /></FieldGroup>
                     <FieldGroup label="vehicle_type_code">
                      <select name="vehicle_type_code" className={inputClass} value={formData.vehicle_type_code || ""} onChange={handleInputChange}>
                        <option value="">Select Vehicle Type</option>
                        {vehicleTypes.map((vt) => (
                          <option key={vt.id} value={vt.type_code}>
                            {vt.type_code} - {vt.type_name}
                          </option>
                        ))}
                      </select>
                     </FieldGroup>
                     <FieldGroup label="vehicle_owner_name"><input type="text" name="vehicle_owner_name" className={inputClass} value={formData.vehicle_owner_name} onChange={handleInputChange} /></FieldGroup>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><MapPin size={20} /></div>
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Route & Schedule</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <FieldGroup label="origin_address">
                      <textarea name="origin_address" rows="3" className={inputClass} value={formData.origin_address} onChange={handleInputChange} placeholder="Complete origin location..." />
                    </FieldGroup>
                    <FieldGroup label="destination_address">
                      <textarea name="destination_address" rows="3" className={inputClass} value={formData.destination_address} onChange={handleInputChange} placeholder="Complete destination location..." />
                    </FieldGroup>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/40">
                    <div className={`mb-4 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                      stopErrors.length
                        ? 'border-red-200 bg-red-50 text-red-700 animate-pulse'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}>
                      {stopErrors.length
                        ? stopErrors.join(' ')
                        : 'Stop sequence valid: at least one pickup and one delivery in the correct order.'}
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-700">Multi-stop Planner</h3>
                      <button type="button" onClick={addStopRow} className="text-xs font-bold text-[#4a6cf7]">+ Add Stop</button>
                    </div>
                    <div className="space-y-3">
                      {plannedStops.map((stop, idx) => (
                        <div
                          key={`stop-${idx}`}
                          className={`grid grid-cols-12 gap-2 items-end bg-white border rounded-lg p-3 transition-all duration-200 ${
                            dragOverIdx === idx ? 'border-blue-300 shadow-md' : 'border-gray-200'
                          }`}
                          onDragOver={(e) => handleStopDragOver(e, idx)}
                          onDrop={() => handleStopDrop(idx)}
                        >
                          <div
                            className="col-span-1 flex items-center justify-center cursor-grab text-gray-400"
                            draggable
                            onDragStart={() => handleStopDragStart(idx)}
                            onDragEnd={() => {
                              setDragIdx(null);
                              setDragOverIdx(null);
                            }}
                          >
                            <GripVertical size={16} />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Type</label>
                            <select className={inputClass} value={stop.stop_type} onChange={(e) => updateStopRow(idx, 'stop_type', e.target.value)}>
                              <option value="PICKUP">PICKUP</option>
                              <option value="DELIVERY">DELIVERY</option>
                                      <option value="TRANSIT">TRANSIT</option>
                                      <option value="BREAK">BREAK</option>
                                      <option value="FUEL">FUEL</option>
                              <option value="OTHER">OTHER</option>
                            </select>
                          </div>
                          <div className="col-span-3">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Location Address</label>
                            <input className={inputClass} value={stop.location_address} onChange={(e) => updateStopRow(idx, 'location_address', e.target.value)} placeholder="Stop address" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">ETA</label>
                            <input type="datetime-local" className={inputClass} value={stop.scheduled_arrival} onChange={(e) => updateStopRow(idx, 'scheduled_arrival', e.target.value)} />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">ETD</label>
                            <input type="datetime-local" className={inputClass} value={stop.scheduled_departure} onChange={(e) => updateStopRow(idx, 'scheduled_departure', e.target.value)} />
                          </div>
                          <div className="col-span-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">#</label>
                            <input className={`${inputClass} bg-gray-50`} value={idx + 1} readOnly />
                          </div>
                          <div className="col-span-1">
                            <button type="button" onClick={() => removeStopRow(idx)} className="w-full text-xs font-bold text-red-600 border border-red-200 rounded-lg py-2">Del</button>
                          </div>
                          <div className="col-span-12">
                            <input className={inputClass} value={stop.instructions} onChange={(e) => updateStopRow(idx, 'instructions', e.target.value)} placeholder="Instructions (optional)" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 border-t border-gray-50 pt-8 mt-8">
                    <div className="grid grid-cols-2 gap-4">
                      <FieldGroup label="scheduled_pickup_date">
                        <input type="date" name="scheduled_pickup_date" className={inputClass} value={formData.scheduled_pickup_date || ""} onChange={handleInputChange} />
                      </FieldGroup>
                      <FieldGroup label="scheduled_delivery_date">
                        <input type="date" name="scheduled_delivery_date" className={inputClass} value={formData.scheduled_delivery_date || ""} onChange={handleInputChange} />
                        {fieldErrors.scheduled_delivery_date && <p className="mt-1 text-xs text-red-600">{fieldErrors.scheduled_delivery_date}</p>}
                      </FieldGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FieldGroup label="actual_pickup_date">
                        <input type="date" name="actual_pickup_date" className={inputClass} value={formData.actual_pickup_date || ""} onChange={handleInputChange} />
                      </FieldGroup>
                      <FieldGroup label="actual_delivery_date">
                        <input type="date" name="actual_delivery_date" className={inputClass} value={formData.actual_delivery_date || ""} onChange={handleInputChange} />
                        {fieldErrors.actual_delivery_date && <p className="mt-1 text-xs text-red-600">{fieldErrors.actual_delivery_date}</p>}
                      </FieldGroup>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                      <FieldGroup label="start_time"><input type="datetime-local" name="start_time" className={inputClass} value={formData.start_time || ""} onChange={handleInputChange} /></FieldGroup>
                      <FieldGroup label="end_time">
                        <input type="datetime-local" name="end_time" className={inputClass} value={formData.end_time || ""} onChange={handleInputChange} />
                        {fieldErrors.end_time && <p className="mt-1 text-xs text-red-600">{fieldErrors.end_time}</p>}
                      </FieldGroup>
                  </div>
                  <FieldGroup label="created_date"><input type="date" name="created_date" className={inputClass} value={formData.created_date} onChange={handleInputChange} /></FieldGroup>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Gauge size={20} /></div>
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Metrics & Performance</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-8">
                    <FieldGroup label="total_distance_km"><input type="number" name="total_distance_km" className={inputClass} value={formData.total_distance_km || ""} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="start_odometer_km"><input type="number" name="start_odometer_km" className={inputClass} value={formData.start_odometer_km || ""} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="end_odometer_km"><input type="number" name="end_odometer_km" className={inputClass} value={formData.end_odometer_km || ""} onChange={handleInputChange} /></FieldGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-8 border-t border-gray-50 pt-8 mt-8">
                    <FieldGroup label="estimated_fuel_liters"><input type="number" name="estimated_fuel_liters" className={inputClass} value={formData.estimated_fuel_liters || ""} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="actual_fuel_liters"><input type="number" name="actual_fuel_liters" className={inputClass} value={formData.actual_fuel_liters || ""} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="fuel_rate_per_liter"><input type="number" name="fuel_rate_per_liter" className={inputClass} value={formData.fuel_rate_per_liter || ""} onChange={handleInputChange} /></FieldGroup>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <FieldGroup label="damage_count">
                      <input type="number" min="0" name="damage_count" className={inputClass} value={formData.damage_count} onChange={handleInputChange} />
                      {fieldErrors.damage_count && <p className="mt-1 text-xs text-red-600">{fieldErrors.damage_count}</p>}
                    </FieldGroup>
                    <FieldGroup label="pod_turnaround_days">
                      <input type="number" min="0" name="pod_turnaround_days" className={inputClass} value={formData.pod_turnaround_days || ""} onChange={handleInputChange} />
                      {fieldErrors.pod_turnaround_days && <p className="mt-1 text-xs text-red-600">{fieldErrors.pod_turnaround_days}</p>}
                    </FieldGroup>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><DollarSign size={20} /></div>
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Financials & Audits</h2>
                  </div>
                  <div className="grid grid-cols-4 gap-6">
                    <FieldGroup label="booked_price"><input type="number" name="booked_price" className={inputClass} value={formData.booked_price || ""} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="total_freight_charge"><input type="number" name="total_freight_charge" className={inputClass} value={formData.total_freight_charge} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="total_accessorial_charge"><input type="number" name="total_accessorial_charge" className={inputClass} value={formData.total_accessorial_charge} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="total_tax"><input type="number" name="total_tax" className={inputClass} value={formData.total_tax} onChange={handleInputChange} /></FieldGroup>
                  </div>
                  <div className="grid grid-cols-4 gap-6">
                    <FieldGroup label="tds_percentage"><input type="number" name="tds_percentage" className={inputClass} value={formData.tds_percentage} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="tds_amount"><input type="number" name="tds_amount" className={inputClass} value={formData.tds_amount} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="incentive_amount"><input type="number" name="incentive_amount" className={inputClass} value={formData.incentive_amount} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="late_fee"><input type="number" name="late_fee" className={inputClass} value={formData.late_fee} onChange={handleInputChange} /></FieldGroup>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <FieldGroup label="part_load_charge"><input type="number" name="part_load_charge" className={inputClass} value={formData.part_load_charge} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="damage_amount"><input type="number" name="damage_amount" className={inputClass} value={formData.damage_amount} onChange={handleInputChange} /></FieldGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-6 border-t border-gray-50 pt-6">
                    <FieldGroup label="broker_commission"><input type="number" name="broker_commission" className={inputClass} value={formData.broker_commission} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="total_bill_amount"><input type="number" name="total_bill_amount" className={inputClass} value={formData.total_bill_amount} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="payment_received_amount"><input type="number" name="payment_received_amount" className={inputClass} value={formData.payment_received_amount} onChange={handleInputChange} /></FieldGroup>
                  </div>
                  <div className="grid grid-cols-2 gap-6 mt-4">
                    <FieldGroup label="pod_received_date"><input type="date" name="pod_received_date" className={inputClass} value={formData.pod_received_date || ""} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="payment_received_date"><input type="date" name="payment_received_date" className={inputClass} value={formData.payment_received_date || ""} onChange={handleInputChange} /></FieldGroup>
                  </div>
                  <div className="flex gap-8 items-center bg-gray-50 p-4 rounded-xl mt-4">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-gray-600 uppercase">
                      <input type="checkbox" name="is_billed" checked={formData.is_billed} onChange={handleInputChange} className="w-4 h-4 rounded text-[#4a6cf7]" />
                      is_billed
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-gray-600 uppercase">
                      <input type="checkbox" name="is_paid" checked={formData.is_paid} onChange={handleInputChange} className="w-4 h-4 rounded text-[#4a6cf7]" />
                      is_paid
                    </label>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-sm">
                   <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><CheckCircle2 size={20} /></div>
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Review & Finalize</h2>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Save size={16} /> Summary</h3>
                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                      <div className="flex flex-col"><span className="text-gray-400 text-xs font-bold uppercase">trip_number</span><span className="font-bold text-gray-700">Auto-generated on create</span></div>
                      <div className="flex flex-col"><span className="text-gray-400 text-xs font-bold uppercase">Route</span><span className="font-bold text-gray-700">{formData.origin_address && formData.destination_address ? `${formData.origin_address} → ${formData.destination_address}` : 'Not fully specified'}</span></div>
                      <div className="flex flex-col"><span className="text-gray-400 text-xs font-bold uppercase">trip_type</span><span className="font-bold text-gray-700">{formData.trip_type}</span></div>
                      <div className="flex flex-col"><span className="text-gray-400 text-xs font-bold uppercase">status</span><span className="font-bold text-blue-600">{formData.status}</span></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <FieldGroup label="version"><input type="number" name="version" className={inputClass} value={formData.version} onChange={handleInputChange} /></FieldGroup>
                  </div>
                  <FieldGroup label="remarks">
                    <textarea name="remarks" rows="4" className={inputClass} value={formData.remarks} onChange={handleInputChange} placeholder="Any final details for the execution team..." />
                  </FieldGroup>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <AlertCircle className="text-[#4a6cf7] shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                      By submitting this form, you are initializing a new journey lifecycle in the TMS Command Center. Resources will be tentatively locked for this shipment.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
              <button 
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 py-2.5 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-xl transition-all disabled:opacity-0"
              >
                <ChevronLeft size={18} /> Previous Step
              </button>
              
              <div className="flex gap-4">
                {currentStep < steps.length ? (
                  <button 
                    key="next-btn"
                    type="button"
                    onClick={handleNext}
                    disabled={currentStep === 3 && stopErrors.length > 0}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#4a6cf7] text-white font-bold text-sm rounded-xl hover:bg-[#3b59d9] shadow-lg shadow-blue-100 transition-all hover:scale-105 active:scale-95"
                  >
                    Next Step <ChevronRight size={18} />
                  </button>
                ) : (
                  <button 
                    key="submit-btn"
                    type="submit"
                    disabled={createTripMutation.isPending}
                    className="flex items-center gap-2 px-10 py-2.5 bg-green-600 text-white font-bold text-sm rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {createTripMutation.isPending ? 'Syncing...' : 'Create Trip'} <CheckCircle2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
