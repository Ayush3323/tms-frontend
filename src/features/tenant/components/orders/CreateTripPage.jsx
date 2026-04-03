import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Save, X, FileText, Truck, 
  MapPin, Gauge, DollarSign, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useCreateTrip, useOrders } from '../../queries/orders/ordersQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';

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

  const [formData, setFormData] = useState({
    order_id: "", trip_number: "", lr_number: "", reference_number: "", trip_type: "FTL", status: "CREATED",
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

  const steps = [
    { id: 1, name: 'General Info', icon: FileText },
    { id: 2, name: 'Fleet & Team', icon: Truck },
    { id: 3, name: 'Route & Schedule', icon: MapPin },
    { id: 4, name: 'Metrics', icon: Gauge },
    { id: 5, name: 'Financials', icon: DollarSign },
    { id: 6, name: 'Review', icon: CheckCircle2 }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOrderChange = (id) => {
    const order = orders.find(o => String(o.id) === String(id));
    setFormData(prev => ({
      ...prev,
      order_id: id,
      lr_number: order ? order.lr_number : ""
    }));
  };

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentStep < steps.length) {
      handleNext();
      return;
    }
    createTripMutation.mutate(formData, {
      onSuccess: () => navigate('/tenant/dashboard/orders/trips')
    });
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
                    <FieldGroup label="trip_number" required>
                      <input type="text" name="trip_number" required className={inputClass} value={formData.trip_number} onChange={handleInputChange} placeholder="TRP-8001" />
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
                      <option value="IN_TRANSIT">IN_TRANSIT</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="COMPLETED">COMPLETED</option>
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
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="primary_driver_id">
                      <select name="primary_driver_id" className={inputClass} value={formData.primary_driver_id || ""} onChange={handleInputChange}>
                        <option value="">Select Driver</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.user?.first_name} {d.user?.last_name}</option>)}
                      </select>
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-2 gap-8 border-t border-gray-50 pt-8 mt-8">
                    <FieldGroup label="alternate_vehicle_id">
                      <select name="alternate_vehicle_id" className={inputClass} value={formData.alternate_vehicle_id || ""} onChange={handleInputChange}>
                        <option value="">None</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="alternate_driver_id">
                      <select name="alternate_driver_id" className={inputClass} value={formData.alternate_driver_id || ""} onChange={handleInputChange}>
                        <option value="">None</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.user?.first_name} {d.user?.last_name}</option>)}
                      </select>
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-8 mt-4">
                     <FieldGroup label="vehicle_number"><input type="text" name="vehicle_number" className={inputClass} value={formData.vehicle_number} onChange={handleInputChange} /></FieldGroup>
                     <FieldGroup label="vehicle_type_code"><input type="text" name="vehicle_type_code" className={inputClass} value={formData.vehicle_type_code} onChange={handleInputChange} /></FieldGroup>
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
                  <div className="grid grid-cols-2 gap-8 border-t border-gray-50 pt-8 mt-8">
                    <div className="grid grid-cols-2 gap-4">
                      <FieldGroup label="scheduled_pickup_date"><input type="date" name="scheduled_pickup_date" className={inputClass} value={formData.scheduled_pickup_date || ""} onChange={handleInputChange} /></FieldGroup>
                      <FieldGroup label="scheduled_delivery_date"><input type="date" name="scheduled_delivery_date" className={inputClass} value={formData.scheduled_delivery_date || ""} onChange={handleInputChange} /></FieldGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FieldGroup label="actual_pickup_date"><input type="date" name="actual_pickup_date" className={inputClass} value={formData.actual_pickup_date || ""} onChange={handleInputChange} /></FieldGroup>
                      <FieldGroup label="actual_delivery_date"><input type="date" name="actual_delivery_date" className={inputClass} value={formData.actual_delivery_date || ""} onChange={handleInputChange} /></FieldGroup>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                      <FieldGroup label="start_time"><input type="time" name="start_time" className={inputClass} value={formData.start_time || ""} onChange={handleInputChange} /></FieldGroup>
                      <FieldGroup label="end_time"><input type="time" name="end_time" className={inputClass} value={formData.end_time || ""} onChange={handleInputChange} /></FieldGroup>
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
                    <FieldGroup label="damage_count"><input type="number" name="damage_count" className={inputClass} value={formData.damage_count} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="pod_turnaround_days"><input type="number" name="pod_turnaround_days" className={inputClass} value={formData.pod_turnaround_days || ""} onChange={handleInputChange} /></FieldGroup>
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
                      <div className="flex flex-col"><span className="text-gray-400 text-xs font-bold uppercase">trip_number</span><span className="font-bold text-gray-700">{formData.trip_number || 'STILL PENDING'}</span></div>
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
