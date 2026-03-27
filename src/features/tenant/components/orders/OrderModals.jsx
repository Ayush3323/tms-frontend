import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { 
  useCreateOrder, 
  useUpdateOrder,
  useAssignTrip
} from '../../queries/orders/ordersQuery';
import { useCustomers } from '../../queries/customers/customersQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';

// --- Base Modal Component ---
export const Modal = ({ isOpen, onClose, title, children }) => {
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

export function CreateOrderModal({ isOpen, onClose }) {
  const createOrderMutation = useCreateOrder();
  
  const { data: customersData } = useCustomers({ page_size: 100 });
  const customers = customersData?.results || (Array.isArray(customersData) ? customersData : []);

  const [formData, setFormData] = useState({
    billing_customer_id: "",
    consigner_id: "",
    consignee_id: "",
    order_type: "FTL",
    reference_number: "",
    pickup_date: "",
    delivery_date: "",
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.consigner_id) payload.consigner_id = null;
    if (!payload.consignee_id) payload.consignee_id = null;

    createOrderMutation.mutate(payload, {
      onSuccess: () => {
        setFormData({
          billing_customer_id: "", consigner_id: "", consignee_id: "",
          order_type: "FTL", reference_number: "", pickup_date: "", delivery_date: "", notes: ""
        });
        onClose();
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Order (LR)">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Billing Customer *</label>
            <select
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.billing_customer_id}
              onChange={e => setFormData({ ...formData, billing_customer_id: e.target.value })}
            >
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.legal_name || c.trading_name || c.customer_code || c.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Order Type</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.order_type}
              onChange={e => setFormData({ ...formData, order_type: e.target.value })}
            >
              <option value="FTL">FTL</option>
              <option value="LTL">LTL</option>
              <option value="CONTAINER">CONTAINER</option>
              <option value="COURIER">COURIER</option>
              <option value="MULTI_DROP">MULTI_DROP</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-gray-700 font-medium mb-1">Consigner (Optional)</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.consigner_id}
              onChange={e => setFormData({ ...formData, consigner_id: e.target.value })}
            >
              <option value="">Select Consigner</option>
              {customers.map(c => (
                 <option key={c.id} value={c.id}>{c.legal_name || c.trading_name || c.customer_code || c.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Consignee (Optional)</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.consignee_id}
              onChange={e => setFormData({ ...formData, consignee_id: e.target.value })}
            >
              <option value="">Select Consignee</option>
              {customers.map(c => (
                 <option key={c.id} value={c.id}>{c.legal_name || c.trading_name || c.customer_code || c.id}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Reference Number</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              placeholder="PO-001..."
              value={formData.reference_number}
              onChange={e => setFormData({ ...formData, reference_number: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Pickup Date</label>
              <input 
                type="date" 
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.pickup_date}
                onChange={e => setFormData({ ...formData, pickup_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Delivery Date</label>
              <input 
                type="date" 
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
                value={formData.delivery_date}
                onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Notes</label>
          <textarea 
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
            rows="3"
            placeholder="Additional instructions..."
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button 
            type="submit" 
            disabled={createOrderMutation.isPending}
            className="px-4 py-2 text-white bg-[#4a6cf7] rounded-lg hover:bg-[#3b59d9] disabled:opacity-50"
          >
            {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function EditOrderModal({ isOpen, onClose, order }) {
  const updateOrderMutation = useUpdateOrder();
  const { data: customersData } = useCustomers({ page_size: 100 });
  const customers = customersData?.results || (Array.isArray(customersData) ? customersData : []);

  const [formData, setFormData] = useState({
    billing_customer_id: order?.billing_customer_id || "",
    order_type: order?.order_type || "FTL",
    status: order?.status || 'DRAFT',
    consigner_id: order?.consigner_id || "",
    consignee_id: order?.consignee_id || "",
    reference_number: order?.reference_number || "",
    pickup_date: order?.pickup_date || "",
    delivery_date: order?.delivery_date || "",
    notes: order?.notes || ""
  });

  useEffect(() => {
    if (order && isOpen) {
      setFormData({
        billing_customer_id: order.billing_customer_id || "",
        order_type: order.order_type || "FTL",
        status: order.status,
        consigner_id: order.consigner_id || "",
        consignee_id: order.consignee_id || "",
        reference_number: order.reference_number || "",
        pickup_date: order.pickup_date || "",
        delivery_date: order.delivery_date || "",
        notes: order.notes || ""
      });
    }
  }, [order, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.consigner_id) payload.consigner_id = null;
    if (!payload.consignee_id) payload.consignee_id = null;

    updateOrderMutation.mutate({ id: order.id, data: payload, fullReplace: true }, {
      onSuccess: () => onClose()
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Order: ${order?.lr_number}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Billing Customer *</label>
            <select
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.billing_customer_id}
              onChange={e => setFormData({ ...formData, billing_customer_id: e.target.value })}
            >
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.legal_name || c.trading_name || c.customer_code || c.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Order Type</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.order_type}
              onChange={e => setFormData({ ...formData, order_type: e.target.value })}
            >
              <option value="FTL">FTL</option>
              <option value="LTL">LTL</option>
              <option value="CONTAINER">CONTAINER</option>
              <option value="COURIER">COURIER</option>
              <option value="MULTI_DROP">MULTI_DROP</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Status</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="DELIVERED">DELIVERED</option>
            </select>
          </div>
          <div>
             <label className="block text-gray-700 font-medium mb-1">Reference Number</label>
             <input 
               type="text" 
               className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
               value={formData.reference_number}
               onChange={e => setFormData({ ...formData, reference_number: e.target.value })}
             />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-gray-700 font-medium mb-1">Consigner (Optional)</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.consigner_id}
              onChange={e => setFormData({ ...formData, conssigner_id: e.target.value })}
            >
              <option value="">Select Consigner</option>
              {customers.map(c => (
                 <option key={c.id} value={c.id}>{c.legal_name || c.trading_name || c.customer_code || c.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Consignee (Optional)</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.consignee_id}
              onChange={e => setFormData({ ...formData, consignee_id: e.target.value })}
            >
              <option value="">Select Consignee</option>
              {customers.map(c => (
                 <option key={c.id} value={c.id}>{c.legal_name || c.trading_name || c.customer_code || c.id}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-gray-700 font-medium mb-1">Pickup Date</label>
             <input 
               type="date" 
               className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
               value={formData.pickup_date}
               onChange={e => setFormData({ ...formData, pickup_date: e.target.value })}
             />
           </div>
           <div>
             <label className="block text-gray-700 font-medium mb-1">Delivery Date</label>
             <input 
               type="date" 
               className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
               value={formData.delivery_date}
               onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
             />
           </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Notes</label>
          <textarea 
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
            rows="3"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button 
            type="submit" 
            disabled={updateOrderMutation.isPending}
            className="px-4 py-2 text-white bg-[#4a6cf7] rounded-lg hover:bg-[#3b59d9] disabled:opacity-50"
          >
            {updateOrderMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AssignTripModal({ isOpen, onClose, order }) {
  const assignTripMutation = useAssignTrip();
  
  const { data: driversData } = useDrivers({ page_size: 100 });
  const drivers = driversData?.results || [];

  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const vehicles = vehiclesData?.results || [];

  const [formData, setFormData] = useState({
    driver_id: "",
    vehicle_id: "",
    trip_number: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    assignTripMutation.mutate({ id: order.id, data: formData }, {
      onSuccess: () => onClose()
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Trip for: ${order?.lr_number}`}>
      <div className="mb-4 p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-sm">
        Assigning a trip will change order status to <strong>ASSIGNED</strong> and create a Trip record.
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Driver *</label>
          <select
            required
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
            value={formData.driver_id}
            onChange={e => setFormData({ ...formData, driver_id: e.target.value })}
          >
            <option value="">Select Driver</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>
                {d.user?.first_name || 'Driver'} {d.user?.last_name || ''} ({d.employee_id || d.id})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-1">Vehicle *</label>
          <select
            required
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
            value={formData.vehicle_id}
            onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}
          >
            <option value="">Select Vehicle</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.registration_number || v.registration || v.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Trip Number (Optional)</label>
          <input 
            type="text" 
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
            placeholder="Auto-generated if left blank"
            value={formData.trip_number}
            onChange={e => setFormData({ ...formData, trip_number: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button 
            type="submit" 
            disabled={assignTripMutation.isPending}
            className="px-4 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {assignTripMutation.isPending ? 'Assigning...' : 'Assign Trip'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
