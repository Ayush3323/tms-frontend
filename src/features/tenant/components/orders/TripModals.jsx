import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  useCreateTrip,
  useUpdateTrip,
  useTripDetail
} from '../../queries/orders/ordersQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';

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

// Helper for status badge in view modal
const StatusBadge = ({ status }) => {
  const configs = {
    CREATED: 'bg-blue-50 text-blue-700 border-blue-100',
    STARTED: 'bg-amber-50 text-amber-700 border-amber-100',
    IN_TRANSIT: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    COMPLETED: 'bg-green-50 text-green-700 border-green-100',
  };
  const config = configs[status] || 'bg-gray-50 text-gray-700 border-gray-100';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${config}`}>
      {status}
    </span>
  );
};

export function CreateTripModal({ isOpen, onClose }) {
  const createTripMutation = useCreateTrip();
  const { data: driversData } = useDrivers({ page_size: 100 });
  const drivers = driversData?.results || [];
  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const vehicles = vehiclesData?.results || [];

  const [formData, setFormData] = useState({
    primary_driver_id: "",
    primary_vehicle_id: "",
    trip_number: "",
    trip_type: "FTL",
    order_id: "", // Optional link to an order
    status: "CREATED",
    lr_number: "",
    reference_number: "",
    origin_address: "",
    destination_address: "",
    scheduled_pickup_date: "",
    scheduled_delivery_date: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.order_id) delete payload.order_id;

    createTripMutation.mutate(payload, {
      onSuccess: () => {
        setFormData({
          primary_driver_id: "", primary_vehicle_id: "", trip_number: "",
          trip_type: "FTL", order_id: "", status: "CREATED",
          lr_number: "", reference_number: "", origin_address: "",
          destination_address: "", scheduled_pickup_date: "",
          scheduled_delivery_date: ""
        });
        onClose();
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Plan New Trip">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Primary Driver *</label>
            <select
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.primary_driver_id}
              onChange={e => setFormData({ ...formData, primary_driver_id: e.target.value })}
            >
              <option value="">Select Driver</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.user?.first_name || 'Driver'} {d.user?.last_name || ''} ({d.employee_id || d.id.slice(-6)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Vehicle *</label>
            <select
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.primary_vehicle_id}
              onChange={e => setFormData({ ...formData, primary_vehicle_id: e.target.value })}
            >
              <option value="">Select Vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.registration_number || v.registration || v.id.slice(-6)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Trip Number</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              placeholder="Auto-generated if empty"
              value={formData.trip_number}
              onChange={e => setFormData({ ...formData, trip_number: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Trip Type</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.trip_type}
              onChange={e => setFormData({ ...formData, trip_type: e.target.value })}
            >
              <option value="FTL">FTL</option>
              <option value="LTL">LTL</option>
              <option value="CONTAINER">CONTAINER</option>
              <option value="COURIER">COURIER</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Order ID (Linked)</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              placeholder="Optional Order UUID"
              value={formData.order_id}
              onChange={e => setFormData({ ...formData, order_id: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Status</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="CREATED">CREATED</option>
              <option value="STARTED">STARTED</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Origin Address</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              placeholder="Mumbai Warehouse"
              value={formData.origin_address}
              onChange={e => setFormData({ ...formData, origin_address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Destination Address</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              placeholder="Delhi DC"
              value={formData.destination_address}
              onChange={e => setFormData({ ...formData, destination_address: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Scheduled Pickup</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.scheduled_pickup_date}
              onChange={e => setFormData({ ...formData, scheduled_pickup_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Scheduled Delivery</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.scheduled_delivery_date}
              onChange={e => setFormData({ ...formData, scheduled_delivery_date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button
            type="submit"
            disabled={createTripMutation.isPending}
            className="px-4 py-2 text-white bg-[#0052CC] rounded-lg hover:bg-[#0747A6] shadow-sm disabled:opacity-50"
          >
            {createTripMutation.isPending ? 'Planning...' : 'Create Trip'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function EditTripModal({ isOpen, onClose, trip }) {
  const updateTripMutation = useUpdateTrip();
  const { data: driversData } = useDrivers({ page_size: 100 });
  const drivers = driversData?.results || [];
  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const vehicles = vehiclesData?.results || [];

  const [formData, setFormData] = useState({
    primary_driver_id: trip?.primary_driver_id || "",
    primary_vehicle_id: trip?.primary_vehicle_id || "",
    trip_number: trip?.trip_number || "",
    trip_type: trip?.trip_type || "FTL",
    status: trip?.status || "CREATED",
    origin_address: trip?.origin_address || "",
    destination_address: trip?.destination_address || "",
    scheduled_pickup_date: trip?.scheduled_pickup_date || "",
    scheduled_delivery_date: trip?.scheduled_delivery_date || ""
  });

  useEffect(() => {
    if (trip && isOpen) {
      setFormData({
        primary_driver_id: trip.primary_driver_id || "",
        primary_vehicle_id: trip.primary_vehicle_id || "",
        trip_number: trip.trip_number || "",
        trip_type: trip.trip_type || "FTL",
        status: trip.status || "CREATED",
        origin_address: trip.origin_address || "",
        destination_address: trip.destination_address || "",
        scheduled_pickup_date: trip.scheduled_pickup_date || "",
        scheduled_delivery_date: trip.scheduled_delivery_date || ""
      });
    }
  }, [trip, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateTripMutation.mutate({ id: trip.id, data: formData }, {
      onSuccess: () => onClose()
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Trip: ${trip?.trip_number}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Primary Driver *</label>
            <select
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.primary_driver_id}
              onChange={e => setFormData({ ...formData, primary_driver_id: e.target.value })}
            >
              <option value="">Select Driver</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.user?.first_name || 'Driver'} {d.user?.last_name || ''} ({d.employee_id || d.id.slice(-6)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Vehicle *</label>
            <select
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.primary_vehicle_id}
              onChange={e => setFormData({ ...formData, primary_vehicle_id: e.target.value })}
            >
              <option value="">Select Vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.registration_number || v.registration || v.id.slice(-6)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Status</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="CREATED">CREATED</option>
              <option value="STARTED">STARTED</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Trip Type</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.trip_type}
              onChange={e => setFormData({ ...formData, trip_type: e.target.value })}
            >
              <option value="FTL">FTL</option>
              <option value="LTL">LTL</option>
              <option value="CONTAINER">CONTAINER</option>
              <option value="COURIER">COURIER</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Origin Address</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.origin_address}
              onChange={e => setFormData({ ...formData, origin_address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Destination Address</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.destination_address}
              onChange={e => setFormData({ ...formData, destination_address: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Scheduled Pickup</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.scheduled_pickup_date}
              onChange={e => setFormData({ ...formData, scheduled_pickup_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Scheduled Delivery</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.scheduled_delivery_date}
              onChange={e => setFormData({ ...formData, scheduled_delivery_date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button
            type="submit"
            disabled={updateTripMutation.isPending}
            className="px-4 py-2 text-white bg-[#0052CC] rounded-lg hover:bg-[#0747A6] shadow-sm disabled:opacity-50"
          >
            {updateTripMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ViewTripModal({ isOpen, onClose, tripId }) {
  const { data: trip, isLoading } = useTripDetail(tripId);
  const { data: driversData } = useDrivers({ page_size: 100 });
  const drivers = driversData?.results || [];
  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const vehicles = vehiclesData?.results || [];

  const getDriverDisplay = (id) => {
    if (!id) return 'Unassigned';
    const d = drivers.find(dr => dr.id === id);
    if (!d) return id.slice(-6);
    return `${d.user?.first_name || 'Driver'} ${d.user?.last_name || ''}`.trim() || d.employee_id || id.slice(-6);
  };

  const getVehicleDisplay = (id) => {
    if (!id) return 'Unassigned';
    const v = vehicles.find(vh => vh.id === id);
    if (!v) return id.slice(-6);
    return v.registration_number || v.registration || id.slice(-6);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trip Details">
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]"></div>
        </div>
      ) : trip ? (
        <div className="space-y-6 text-sm">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Trip Number</p>
                <p className="font-semibold text-gray-800">{trip.trip_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                <StatusBadge status={trip.status} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Start Time</p>
                <p className="font-semibold text-gray-800">{trip.start_time ? new Date(trip.start_time).toLocaleString() : '-'}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">End Time</p>
                <p className="font-semibold text-gray-800">{trip.end_time ? new Date(trip.end_time).toLocaleString() : '-'}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Origin</p>
                <p className="font-semibold text-gray-800">{trip.origin || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Destination</p>
                <p className="font-semibold text-gray-800">{trip.destination || '-'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Fleet Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Primary Driver</p>
                  <p className="font-medium text-gray-700">{getDriverDisplay(trip.primary_driver_id || trip.driver_id)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Vehicle</p>
                  <p className="font-medium text-gray-700">{getVehicleDisplay(trip.primary_vehicle_id || trip.vehicle_id)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
              <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">System Details</h3>
              <div className="space-y-3 flex-1">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Trip ID</p>
                  <p className="font-mono text-xs text-gray-600 truncate" title={trip.id}>{trip.id}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Created By</p>
                  <p className="font-mono text-xs text-gray-600 truncate">{trip.created_by || 'System'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Created At</p>
                  <p className="font-medium text-gray-700">{trip.created_at ? new Date(trip.created_at).toLocaleString() : '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Last Updated</p>
                  <p className="font-medium text-gray-700">{trip.updated_at ? new Date(trip.updated_at).toLocaleString() : '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">Failed to load trip details</div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-white bg-[#0052CC] rounded-lg hover:bg-[#0747A6] shadow-sm font-medium transition-colors">
          Close
        </button>
      </div>
    </Modal>
  );
}
