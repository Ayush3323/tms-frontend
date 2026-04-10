import React, { useState, useEffect } from 'react';
import { X, Package, Hash, Layers, Scale, Maximize, Move } from 'lucide-react';
import { 
  useCreateCargo, 
  useUpdateCargo,
  useCargoItems,
  useTrips,
  useTripStops,
  useTripDetail,
  useOrderDetail 
} from '../../queries/orders/ordersQuery';
import { useCustomers } from '../../queries/customers/customersQuery';

// --- Configuration & Helpers ---
const CARGO_TYPE_COLORS = {
  HAZARDOUS: 'bg-red-100 text-red-700 border-red-200',
  PERISHABLE: 'bg-teal-100 text-teal-700 border-teal-200',
  FRAGILE: 'bg-amber-100 text-amber-700 border-amber-200',
  HIGH_VALUE: 'bg-purple-100 text-purple-700 border-purple-200',
  OTHER: 'bg-slate-100 text-slate-700 border-slate-200',
  GENERAL: 'bg-blue-100 text-blue-700 border-blue-200',
};

const COMMODITY_OPTIONS = ['GENERAL', 'HAZARDOUS', 'PERISHABLE', 'FRAGILE', 'HIGH_VALUE', 'OTHER'];
const CARGO_TRANSITIONS = {
  PENDING: ['LOADED'],
  LOADED: ['UNLOADED', 'DAMAGED', 'SHORT'],
  UNLOADED: ['DAMAGED'],
  DAMAGED: [],
  SHORT: [],
};

// --- Base Modal Component ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export function CreateCargoModal({ isOpen, onClose, presetTripId }) {
  const createCargoMutation = useCreateCargo();
  const { data: tripsData } = useTrips({ page_size: 100 });
  const { data: allCargoData } = useCargoItems({ page_size: 200 });
  const trips = tripsData?.results || [];
  const assignedTripIds = new Set((allCargoData?.results || []).map(c => String(c.trip)));

  const [formData, setFormData] = useState({
    trip: presetTripId || "",
    trip_stop: "",
    item_code: "",
    description: "",
    commodity_type: "GENERAL",
    hazardous_class: "",
    quantity: "1",
    package_type: "",
    weight_kg: "",
    volume_cbm: "",
    length_cm: "",
    width_cm: "",
    height_cm: "",
    declared_value: "",
    insurance_required: false,
    is_fragile: false,
    is_perishable: false,
    temperature_range: "",
    stackable: true,
    orientation: "NA",
    status: "PENDING"
  });
  const { data: tripStopsData } = useTripStops(formData.trip || null);
  const tripStops = Array.isArray(tripStopsData?.results) ? tripStopsData.results : (Array.isArray(tripStopsData) ? tripStopsData : []);
  useEffect(() => {
    if (isOpen && presetTripId) {
      setFormData((prev) => ({ ...prev, trip: presetTripId }));
    }
  }, [isOpen, presetTripId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (payload.quantity) payload.quantity = parseInt(payload.quantity, 10);
    if (payload.length_cm) payload.length_cm = parseInt(payload.length_cm, 10);
    if (payload.width_cm) payload.width_cm = parseInt(payload.width_cm, 10);
    if (payload.height_cm) payload.height_cm = parseInt(payload.height_cm, 10);

    Object.keys(payload).forEach(key => {
      if (payload[key] === "" || payload[key] === null) {
        delete payload[key];
      }
    });

    createCargoMutation.mutate(payload, {
      onSuccess: () => {
        setFormData({
          trip: presetTripId || "", trip_stop: "", item_code: "", description: "", commodity_type: "GENERAL",
          hazardous_class: "", quantity: "1", package_type: "", weight_kg: "", volume_cbm: "",
          length_cm: "", width_cm: "", height_cm: "", declared_value: "", insurance_required: false,
          is_fragile: false, is_perishable: false, temperature_range: "", stackable: true,
          orientation: "NA", status: "PENDING"
        });
        onClose();
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Cargo Item">
      <form onSubmit={handleSubmit} className="space-y-6 text-sm">
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest border-b pb-1">Essential Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Trip (Required) *</label>
              <select
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.trip}
                onChange={e => setFormData({ ...formData, trip: e.target.value })}
              >
                <option value="">Select a trip</option>
                {trips.map(trip => {
                  const isAssigned = assignedTripIds.has(String(trip.id));
                  return (
                    <option 
                      key={trip.id} 
                      value={trip.id} 
                      disabled={isAssigned && String(trip.id) !== String(presetTripId)}
                    >
                      {trip.trip_number || trip.id?.slice(-8)} {isAssigned ? '(Cargo Assigned)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Trip Stop</label>
              <select
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.trip_stop}
                onChange={e => setFormData({ ...formData, trip_stop: e.target.value })}
                disabled={!formData.trip}
              >
                <option value="">Select stop (optional)</option>
                {tripStops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    #{stop.stop_sequence} {stop.stop_type} - {stop.location_address || 'No location'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Description *</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Cotton bales"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Quantity *</label>
              <input 
                type="number" 
                required
                min="1"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Item Code</label>
              <input 
                type="text" 
                placeholder="ITEM-001"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.item_code}
                onChange={e => setFormData({ ...formData, item_code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Status</label>
              <select
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="PENDING">PENDING</option>
                <option value="LOADED">LOADED</option>
                <option value="UNLOADED">UNLOADED</option>
                <option value="DAMAGED">DAMAGED</option>
                <option value="SHORT">SHORT</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest border-b pb-1">Specifications & Classification</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Commodity Type</label>
              <select
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.commodity_type}
                onChange={e => setFormData({ ...formData, commodity_type: e.target.value })}
              >
                <option value="GENERAL">GENERAL</option>
                <option value="HAZARDOUS">HAZARDOUS</option>
                <option value="PERISHABLE">PERISHABLE</option>
                <option value="FRAGILE">FRAGILE</option>
                <option value="HIGH_VALUE">HIGH_VALUE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Package Type</label>
              <input 
                type="text" 
                placeholder="e.g. Bales, Boxes, Crate"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.package_type}
                onChange={e => setFormData({ ...formData, package_type: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
             <div>
               <label className="block text-gray-700 font-[11px] mb-1 uppercase tracking-tight">Weight (kg)</label>
               <input type="number" step="0.01" className="w-full p-2 border border-gray-300 rounded text-xs" value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: e.target.value})} />
             </div>
             <div>
               <label className="block text-gray-700 font-[11px] mb-1 uppercase tracking-tight">Volume (cbm)</label>
               <input type="number" step="0.001" className="w-full p-2 border border-gray-300 rounded text-xs" value={formData.volume_cbm} onChange={e => setFormData({...formData, volume_cbm: e.target.value})} />
             </div>
             <div>
               <label className="block text-gray-700 font-[11px] mb-1 uppercase tracking-tight">Length (cm)</label>
               <input type="number" className="w-full p-2 border border-gray-300 rounded text-xs" value={formData.length_cm} onChange={e => setFormData({...formData, length_cm: e.target.value})} />
             </div>
             <div>
               <label className="block text-gray-700 font-[11px] mb-1 uppercase tracking-tight">Width (cm)</label>
               <input type="number" className="w-full p-2 border border-gray-300 rounded text-xs" value={formData.width_cm} onChange={e => setFormData({...formData, width_cm: e.target.value})} />
             </div>
             <div>
               <label className="block text-gray-700 font-[11px] mb-1 uppercase tracking-tight">Height (cm)</label>
               <input type="number" className="w-full p-2 border border-gray-300 rounded text-xs" value={formData.height_cm} onChange={e => setFormData({...formData, height_cm: e.target.value})} />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-gray-700 font-medium mb-1">Declared Value (INR/USD)</label>
               <input type="number" step="0.01" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none" value={formData.declared_value} onChange={e => setFormData({...formData, declared_value: e.target.value})} />
             </div>
             <div>
               <label className="block text-gray-700 font-medium mb-1">Placement Orientation</label>
               <select className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none" value={formData.orientation} onChange={e => setFormData({...formData, orientation: e.target.value})}>
                 <option value="NA">NA (No Specific Direction)</option>
                 <option value="UP">UP (Upright/Vertical)</option>
                 <option value="DOWN">DOWN (Lying Flat)</option>
                 <option value="SIDE">SIDE (On its Side)</option>
               </select>
             </div>
          </div>
          {formData.commodity_type === 'HAZARDOUS' && (
            <div>
              <label className="block text-gray-700 font-medium mb-1">Hazardous Class *</label>
              <input
                type="text"
                required
                placeholder="e.g. Class-3"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.hazardous_class}
                onChange={e => setFormData({ ...formData, hazardous_class: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest border-b pb-1">Handling & Care</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
             <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-[#4a6cf7] focus:ring-[#4a6cf7]" checked={formData.is_fragile} onChange={e => setFormData({...formData, is_fragile: e.target.checked})} />
                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">Is Fragile</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-[#4a6cf7] focus:ring-[#4a6cf7]" checked={formData.is_perishable} onChange={e => setFormData({...formData, is_perishable: e.target.checked})} />
                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">Is Perishable</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-[#4a6cf7] focus:ring-[#4a6cf7]" checked={formData.stackable} onChange={e => setFormData({...formData, stackable: e.target.checked})} />
                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">Stackable</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-[#4a6cf7] focus:ring-[#4a6cf7]" checked={formData.insurance_required} onChange={e => setFormData({...formData, insurance_required: e.target.checked})} />
                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">Insurance Required</span>
             </label>
          </div>
          {formData.is_perishable && (
            <div>
              <label className="block text-gray-700 font-medium mb-1">Temperature Range *</label>
              <input
                type="text"
                required
                placeholder="e.g. 2-8 C"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.temperature_range}
                onChange={e => setFormData({ ...formData, temperature_range: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold transition-all">Cancel</button>
          <button 
            type="submit" 
            disabled={createCargoMutation.isPending}
            className="px-6 py-2.5 text-white bg-[#4a6cf7] rounded-lg hover:bg-[#3b59d9] shadow-md shadow-blue-200 disabled:opacity-50 font-bold transition-all"
          >
            {createCargoMutation.isPending ? 'Logging Item...' : 'Log Cargo Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function EditCargoModal({ isOpen, onClose, item }) {
  const updateCargoMutation = useUpdateCargo();
  const { data: tripsData } = useTrips({ page_size: 100 });
  const trips = tripsData?.results || [];

  const [formData, setFormData] = useState({
    trip: item?.trip || "",
    trip_stop: item?.trip_stop || "",
    description: item?.description || "",
    item_code: item?.item_code || "",
    quantity: item?.quantity || "1",
    commodity_type: item?.commodity_type || "GENERAL",
    hazardous_class: item?.hazardous_class || "",
    package_type: item?.package_type || "",
    status: item?.status || "PENDING",
    weight_kg: item?.weight_kg || "",
    volume_cbm: item?.volume_cbm || "",
    length_cm: item?.length_cm || "",
    width_cm: item?.width_cm || "",
    height_cm: item?.height_cm || "",
    declared_value: item?.declared_value || "",
    temperature_range: item?.temperature_range || "",
    orientation: item?.orientation || "NA",
    is_fragile: item?.is_fragile || false,
    is_perishable: item?.is_perishable || false,
    stackable: item?.stackable ?? true,
    insurance_required: item?.insurance_required || false
  });
  const { data: tripStopsData } = useTripStops(formData.trip || null);
  const tripStops = Array.isArray(tripStopsData?.results) ? tripStopsData.results : (Array.isArray(tripStopsData) ? tripStopsData : []);
  const currentStatus = item?.status || 'PENDING';
  const nextStatuses = CARGO_TRANSITIONS[currentStatus] || [];
  const statusOptions = [currentStatus, ...nextStatuses];

  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        trip: item.trip || "",
        trip_stop: item.trip_stop || "",
        description: item.description || "",
        item_code: item.item_code || "",
        quantity: item.quantity || "1",
        commodity_type: item.commodity_type || "GENERAL",
        hazardous_class: item.hazardous_class || "",
        package_type: item.package_type || "",
        status: item.status || "PENDING",
        weight_kg: item.weight_kg || "",
        volume_cbm: item.volume_cbm || "",
        length_cm: item.length_cm || "",
        width_cm: item.width_cm || "",
        height_cm: item.height_cm || "",
        declared_value: item.declared_value || "",
        temperature_range: item.temperature_range || "",
        orientation: item.orientation || "NA",
        is_fragile: item.is_fragile || false,
        is_perishable: item.is_perishable || false,
        stackable: item.stackable ?? true,
        insurance_required: item.insurance_required || false
      });
    }
  }, [item, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (payload.quantity) payload.quantity = parseInt(payload.quantity, 10);
    if (payload.length_cm) payload.length_cm = parseInt(payload.length_cm, 10);
    if (payload.width_cm) payload.width_cm = parseInt(payload.width_cm, 10);
    if (payload.height_cm) payload.height_cm = parseInt(payload.height_cm, 10);
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '' || payload[k] === null) delete payload[k];
    });
    
    updateCargoMutation.mutate({ id: item.id, data: payload }, {
      onSuccess: () => onClose()
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Cargo: ${item?.item_code || item?.id?.slice(-8)}`}>
      <form onSubmit={handleSubmit} className="space-y-6 text-sm">
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest border-b pb-1">Essential Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1 truncate">Trip (Locked for Tracking)</label>
              <select
                required
                disabled
                className="w-full p-2 border border-gray-200 bg-gray-50 rounded text-gray-500 cursor-not-allowed outline-none"
                value={formData.trip}
                onChange={e => setFormData({ ...formData, trip: e.target.value })}
              >
                <option value="">Select a trip</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>{t.trip_number || t.id?.slice(-8)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Trip Stop</label>
              <select
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.trip_stop}
                onChange={e => setFormData({ ...formData, trip_stop: e.target.value })}
                disabled={!formData.trip}
              >
                <option value="">Select stop (optional)</option>
                {tripStops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    #{stop.stop_sequence} {stop.stop_type} - {stop.location_address || 'No location'}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-gray-700 font-medium mb-1">Description *</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Steel Coils"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Quantity *</label>
              <input 
                type="number" 
                required
                min="1"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Item Code</label>
              <input 
                type="text" 
                placeholder="ITEM-001"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.item_code}
                onChange={e => setFormData({ ...formData, item_code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Status</label>
              <select
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                {statusOptions.map((status, idx) => (
                  <option key={status} value={status} disabled={idx === 0}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest border-b pb-1">Specifications & Classification</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Commodity Type</label>
              <select
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.commodity_type}
                onChange={e => setFormData({ ...formData, commodity_type: e.target.value })}
              >
                {COMMODITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Package Type</label>
              <input 
                type="text" 
                placeholder="e.g. Bales, Boxes"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.package_type}
                onChange={e => setFormData({ ...formData, package_type: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
             <div>
               <label className="block text-gray-700 font-[11px] mb-1 uppercase tracking-tight">Weight (kg)</label>
               <input type="number" step="0.01" className="w-full p-2 border border-gray-300 rounded text-xs" value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: e.target.value})} />
             </div>
             <div>
               <label className="block text-gray-700 font-[11px] mb-1 uppercase tracking-tight">Volume (cbm)</label>
               <input type="number" step="0.001" className="w-full p-2 border border-gray-300 rounded text-xs" value={formData.volume_cbm} onChange={e => setFormData({...formData, volume_cbm: e.target.value})} />
             </div>
             <div>
               <label className="block text-gray-700 font-[11px] mb-1 uppercase tracking-tight">Length (cm)</label>
               <input type="number" className="w-full p-2 border border-gray-300 rounded text-xs" value={formData.length_cm} onChange={e => setFormData({...formData, length_cm: e.target.value})} />
             </div>
             <div>
               <label className="block text-gray-700 font-[11px] mb-1 uppercase tracking-tight">Width (cm)</label>
               <input type="number" className="w-full p-2 border border-gray-300 rounded text-xs" value={formData.width_cm} onChange={e => setFormData({...formData, width_cm: e.target.value})} />
             </div>
             <div>
               <label className="block text-gray-700 font-[11px] mb-1 uppercase tracking-tight">Height (cm)</label>
               <input type="number" className="w-full p-2 border border-gray-300 rounded text-xs" value={formData.height_cm} onChange={e => setFormData({...formData, height_cm: e.target.value})} />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-gray-700 font-medium mb-1">Declared Value (INR/USD)</label>
               <input type="number" step="0.01" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none" value={formData.declared_value} onChange={e => setFormData({...formData, declared_value: e.target.value})} />
             </div>
             <div>
               <label className="block text-gray-700 font-medium mb-1">Placement Orientation</label>
               <select className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none" value={formData.orientation} onChange={e => setFormData({...formData, orientation: e.target.value})}>
                 <option value="NA">NA (No Specific Direction)</option>
                 <option value="UP">UP (Upright/Vertical)</option>
                 <option value="DOWN">DOWN (Lying Flat)</option>
                 <option value="SIDE">SIDE (On its Side)</option>
               </select>
             </div>
          </div>
          {formData.commodity_type === 'HAZARDOUS' && (
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-xs">Hazardous Class *</label>
              <input type="text" className="w-full p-2 border border-gray-300 rounded text-xs" value={formData.hazardous_class} onChange={e => setFormData({...formData, hazardous_class: e.target.value})} />
            </div>
          )}
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest border-b pb-1">Handling & Care</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
             <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-[#4a6cf7] focus:ring-[#4a6cf7]" checked={formData.is_fragile} onChange={e => setFormData({...formData, is_fragile: e.target.checked})} />
                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">Is Fragile</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-[#4a6cf7] focus:ring-[#4a6cf7]" checked={formData.is_perishable} onChange={e => setFormData({...formData, is_perishable: e.target.checked})} />
                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">Is Perishable</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-[#4a6cf7] focus:ring-[#4a6cf7]" checked={formData.stackable} onChange={e => setFormData({...formData, stackable: e.target.checked})} />
                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">Stackable</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-[#4a6cf7] focus:ring-[#4a6cf7]" checked={formData.insurance_required} onChange={e => setFormData({...formData, insurance_required: e.target.checked})} />
                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">Insurance Required</span>
             </label>
          </div>
          {formData.is_perishable && (
            <div>
              <label className="block text-gray-700 font-medium mb-1">Temperature Range *</label>
              <input type="text" className="w-full p-2 border border-gray-300 rounded" value={formData.temperature_range} onChange={e => setFormData({ ...formData, temperature_range: e.target.value })} />
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Created At</p>
              <p className="text-[11px] text-gray-500 italic">{item?.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Last Updated</p>
              <p className="text-[11px] text-gray-500 italic">{item?.updated_at ? new Date(item.updated_at).toLocaleString() : 'N/A'}</p>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold transition-all">Cancel</button>
          <button 
            type="submit" 
            disabled={updateCargoMutation.isPending}
            className="px-6 py-2.5 text-white bg-[#4a6cf7] rounded-lg hover:bg-[#3b59d9] shadow-md shadow-blue-200 disabled:opacity-50 font-bold transition-all"
          >
            {updateCargoMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ViewCargoModal({ isOpen, onClose, item }) {
  const tripId = item?.trip || item?.trip_id;
  const { data: trip } = useTripDetail(tripId);
  const orderId = trip?.order || trip?.order_id;
  const { data: order, isLoading: isOrderLoading } = useOrderDetail(orderId);
  const { data: customersData } = useCustomers({ page_size: 100 });
  const customers = customersData?.results || [];

  const getCustomerName = (id) => {
    if (!id) return '-';
    const c = customers.find(cust => cust.id === id);
    if (!c) return id.slice(-6);
    return c.legal_name || c.trading_name || c.customer_code || id.slice(-6);
  };

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cargo & Order Details`}>
      <div className="space-y-6">
        {orderId && (
          <div className="bg-[#4a6cf7]/5 border border-[#4a6cf7]/10 p-4 rounded-xl">
             <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-bold text-[#4a6cf7] uppercase tracking-widest flex items-center gap-1.5">
                   <Layers size={12} /> Parent Order (LR) Context
                </h4>
             </div>
             {order ? (
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-500 font-medium uppercase">LR Number</p>
                    <p className="text-sm font-bold text-gray-800">{order.lr_number}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-medium uppercase">Billing Customer</p>
                    <p className="text-sm font-bold text-gray-800 truncate" title={getCustomerName(order.billing_customer_id)}>
                       {getCustomerName(order.billing_customer_id)}
                    </p>
                  </div>
               </div>
             ) : (
                <p className="text-xs text-gray-400">Fetching order details...</p>
             )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div>
            <p className="text-gray-400 font-bold mb-1 text-[10px] uppercase tracking-wider">Item Code</p>
            <p className="font-semibold text-gray-800">{item.item_code || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400 font-bold mb-1 text-[10px] uppercase tracking-wider">Status</p>
            <p className="text-xs font-black text-gray-600 uppercase italic underline decoration-blue-200">{item.status || 'PENDING'}</p>
          </div>
          <div>
            <p className="text-gray-400 font-bold mb-1 text-[10px] uppercase tracking-wider">Commodity</p>
            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${CARGO_TYPE_COLORS[item.commodity_type] || CARGO_TYPE_COLORS['GENERAL']}`}>
              {item.commodity_type || 'GENERAL'}
            </span>
          </div>
          <div className="col-span-2 md:col-span-3 pb-2 border-b border-gray-200">
            <p className="text-gray-400 font-bold mb-1 text-[10px] uppercase tracking-wider">Description</p>
            <p className="font-semibold text-gray-800">{item.description || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-bold mb-1 text-[10px] uppercase tracking-wider">Weight (kg)</p>
            <p className="font-semibold text-gray-900">{item.weight_kg ? `${item.weight_kg} kg` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-bold mb-1 text-[10px] uppercase tracking-wider">Volume (cbm)</p>
            <p className="font-semibold text-gray-900">{item.volume_cbm ? `${item.volume_cbm} m³` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-bold mb-1 text-[10px] uppercase tracking-wider">Dimensions</p>
            <p className="font-semibold text-gray-900">{item.length_cm ? `${item.length_cm}x${item.width_cm}x${item.height_cm} cm` : 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
            {item.is_fragile && <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-100 uppercase">FRAGILE ⚠️</span>}
            {item.is_perishable && <span className="px-2 py-1 bg-teal-50 text-teal-700 text-[10px] font-bold rounded border border-teal-100 uppercase">PERISHABLE 🧊</span>}
            {item.stackable && <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100 uppercase">STACKABLE ↕</span>}
            {item.insurance_required && <span className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded border border-purple-100 uppercase">INSURED 🛡️</span>}
        </div>

        <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Created At</p>
              <p className="text-[11px] text-gray-600 italic">{item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Last Updated</p>
              <p className="text-[11px] text-gray-600 italic">{item.updated_at ? new Date(item.updated_at).toLocaleString() : 'N/A'}</p>
            </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2 text-white bg-[#4a6cf7] rounded-lg hover:bg-[#3b59d9] text-sm font-bold shadow-md shadow-blue-100 transition-all">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
