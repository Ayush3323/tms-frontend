import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  useCreateOrder,
  useUpdateOrder,
  useAssignTrip
} from '../../queries/orders/ordersQuery';
import { 
  useCustomers, 
  useConsignors, 
  useConsignees, 
  useBrokers 
} from '../../queries/customers/customersQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';

const REFERENCE_REGEX = /^[A-Za-z0-9/_-]+$/;

const normalizeOrderPayload = (source) => {
  const payload = { ...source };
  const nullableFields = ['consignor_id', 'consignee_id', 'broker_id', 'pickup_date', 'delivery_date', 'lr_receiving_date'];
  nullableFields.forEach((field) => {
    if (!payload[field]) payload[field] = null;
  });
  if (typeof payload.reference_number === 'string') payload.reference_number = payload.reference_number.trim();
  if (typeof payload.billing_company_name === 'string') payload.billing_company_name = payload.billing_company_name.trim();
  if (typeof payload.notes === 'string') payload.notes = payload.notes.trim();
  return payload;
};

const validateOrderForm = (formData, { requireBillingCustomer = true } = {}) => {
  const errors = {};
  const reference = (formData.reference_number || '').trim();
  const billingName = (formData.billing_company_name || '').trim();
  const notes = (formData.notes || '').trim();
  const pickup = formData.pickup_date || '';
  const delivery = formData.delivery_date || '';
  const receiving = formData.lr_receiving_date || '';

  if (requireBillingCustomer && !formData.billing_customer_id) {
    errors.billing_customer_id = 'Billing customer is required.';
  }
  if (reference.length > 100) {
    errors.reference_number = 'Reference number cannot exceed 100 characters.';
  } else if (reference && !REFERENCE_REGEX.test(reference)) {
    errors.reference_number = 'Use only letters, numbers, slash (/), underscore (_), or hyphen (-).';
  }
  if (billingName.length > 255) {
    errors.billing_company_name = 'Billing company name cannot exceed 255 characters.';
  }
  if (notes.length > 1000) {
    errors.notes = 'Notes cannot exceed 1000 characters.';
  }
  if (pickup && delivery && delivery < pickup) {
    errors.delivery_date = 'Delivery date cannot be before pickup date.';
  }
  if (receiving && pickup && receiving > pickup) {
    errors.lr_receiving_date = 'LR receiving date cannot be after pickup date.';
  }

  return errors;
};

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

  // Separate APIs for different roles
  const { data: customersData } = useCustomers({ page_size: 100 });
  const customers = customersData?.results || (Array.isArray(customersData) ? customersData : []);

  const { data: consignorsData } = useConsignors({ page_size: 100 });
  const consignors = consignorsData?.results || [];

  const { data: consigneesData } = useConsignees({ page_size: 100 });
  const consignees = consigneesData?.results || [];

  const { data: brokersData } = useBrokers({ page_size: 100 });
  const brokers = brokersData?.results || [];

  const [formData, setFormData] = useState({
    billing_customer_id: "",
    consignor_id: "",
    consignee_id: "",
    broker_id: "",
    order_type: "FTL",
    status: "DRAFT",
    reference_number: "",
    pickup_date: "",
    delivery_date: "",
    notes: "",
    created_at: new Date().toISOString(),
    lr_receiving_date: "",
    billing_company_name: ""
  });
  const [formErrors, setFormErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateOrderForm(formData, { requireBillingCustomer: true });
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = normalizeOrderPayload(formData);

    createOrderMutation.mutate(payload, {
      onSuccess: () => {
        setFormData({
          billing_customer_id: "", consignor_id: "", consignee_id: "", broker_id: "",
          order_type: "FTL", status: "DRAFT", reference_number: "", pickup_date: "", delivery_date: "", notes: "",
          created_at: new Date().toISOString(),
          lr_receiving_date: "",
          billing_company_name: ""
        });
        setFormErrors({});
        onClose();
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Order (LR)">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="pt-1 pb-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a6cf7]">Billing</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Billing Customer <span className="text-red-500">*</span>
            </label>
            <select
              required
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none ${formErrors.billing_customer_id ? 'border-red-400' : 'border-gray-300'}`}
              value={formData.billing_customer_id}
              onChange={e => {
                setFormData({ ...formData, billing_customer_id: e.target.value });
                if (formErrors.billing_customer_id) setFormErrors((prev) => ({ ...prev, billing_customer_id: undefined }));
              }}
            >
              <option value="">Select Customer</option>
              {customers.map((c, idx) => (
                <option key={`${c.id}-${idx}`} value={c.id}>
                  {c.legal_name || c.trading_name} {c.customer_code ? `(${c.customer_code})` : ''} - {c.customer_type || 'N/A'}
                </option>
              ))}
            </select>
            {formErrors.billing_customer_id && <p className="mt-1 text-xs text-red-600">{formErrors.billing_customer_id}</p>}
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
            <label className="block text-gray-700 font-medium mb-1">Billing Company Name</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              placeholder="e.g. KCM PVT LTD"
              value={formData.billing_company_name}
              onChange={e => setFormData({ ...formData, billing_company_name: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-1 pb-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a6cf7]">Schedule</p>
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
              min={formData.pickup_date || undefined}
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none ${formErrors.delivery_date ? 'border-red-400' : 'border-gray-300'}`}
              value={formData.delivery_date}
              onChange={e => {
                setFormData({ ...formData, delivery_date: e.target.value });
                if (formErrors.delivery_date) setFormErrors((prev) => ({ ...prev, delivery_date: undefined }));
              }}
            />
            {formErrors.delivery_date && <p className="mt-1 text-xs text-red-600">{formErrors.delivery_date}</p>}
          </div>
        </div>

        <details className="rounded-lg border border-gray-200 bg-gray-50/70 p-3" open>
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-gray-700">Optional Details</summary>
          <div className="mt-3 space-y-4">
        <div className="pt-1 pb-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a6cf7]">Parties</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Consignor (Shipper)</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.consignor_id}
              onChange={e => setFormData({ ...formData, consignor_id: e.target.value })}
            >
              <option value="">Select Consignor</option>
              {consignors.map((c, idx) => (
                <option key={`${c.id}-${idx}`} value={c.customer?.id || c.id}>
                  {c.customer?.legal_name || c.customer?.trading_name || c.legal_name || c.trading_name || (c.id ? c.id.slice(-6) : 'N/A')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Consignee (Receiver)</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.consignee_id}
              onChange={e => setFormData({ ...formData, consignee_id: e.target.value })}
            >
              <option value="">Select Consignee</option>
              {consignees.map((c, idx) => (
                <option key={`${c.id}-${idx}`} value={c.customer?.id || c.id}>
                  {c.customer?.legal_name || c.customer?.trading_name || c.legal_name || c.trading_name || (c.id ? c.id.slice(-6) : 'N/A')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-1 pb-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a6cf7]">Optional Meta</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Broker (Optional)</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.broker_id}
              onChange={e => setFormData({ ...formData, broker_id: e.target.value })}
            >
              <option value="">Select Broker</option>
              {brokers.map((b, idx) => (
                <option key={`${b.id}-${idx}`} value={b.customer?.id || b.id}>
                  {b.customer?.legal_name || b.customer?.trading_name || b.legal_name || b.trading_name || (b.id ? b.id.slice(-6) : 'N/A')}
                </option>
              ))}
            </select>
          </div>
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
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Reference Number</label>
            <input
              type="text"
              maxLength={100}
              pattern="[A-Za-z0-9/_-]+"
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none ${formErrors.reference_number ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="PO-001..."
              value={formData.reference_number}
              onChange={e => {
                setFormData({ ...formData, reference_number: e.target.value });
                if (formErrors.reference_number) setFormErrors((prev) => ({ ...prev, reference_number: undefined }));
              }}
            />
            {formErrors.reference_number && <p className="mt-1 text-xs text-red-600">{formErrors.reference_number}</p>}
          </div>
          <div />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Created At</label>
            <input
              type="text"
              readOnly
              className="w-full p-2 border border-gray-200 bg-gray-50 rounded text-gray-500 cursor-not-allowed outline-none"
              value={new Date(formData.created_at).toLocaleString()}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">LR Receiving Date</label>
            <input
              type="date"
              max={formData.pickup_date || undefined}
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none ${formErrors.lr_receiving_date ? 'border-red-400' : 'border-gray-300'}`}
              value={formData.lr_receiving_date}
              onChange={e => {
                setFormData({ ...formData, lr_receiving_date: e.target.value });
                if (formErrors.lr_receiving_date) setFormErrors((prev) => ({ ...prev, lr_receiving_date: undefined }));
              }}
            />
            {formErrors.lr_receiving_date && <p className="mt-1 text-xs text-red-600">{formErrors.lr_receiving_date}</p>}
          </div>
        </div>

        <div className="pt-1 pb-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a6cf7]">Notes</p>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Notes</label>
          <textarea
            maxLength={1000}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none ${formErrors.notes ? 'border-red-400' : 'border-gray-300'}`}
            rows="3"
            placeholder="Additional instructions..."
            value={formData.notes}
            onChange={e => {
              setFormData({ ...formData, notes: e.target.value });
              if (formErrors.notes) setFormErrors((prev) => ({ ...prev, notes: undefined }));
            }}
          />
          {formErrors.notes && <p className="mt-1 text-xs text-red-600">{formErrors.notes}</p>}
        </div>
          </div>
        </details>

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

  const { data: consignorsData } = useConsignors({ page_size: 100 });
  const consignors = consignorsData?.results || [];

  const { data: consigneesData } = useConsignees({ page_size: 100 });
  const consignees = consigneesData?.results || [];

  const { data: brokersData } = useBrokers({ page_size: 100 });
  const brokers = brokersData?.results || [];

  const [formData, setFormData] = useState({
    billing_customer_id: order?.billing_customer_id || "",
    order_type: order?.order_type || "FTL",
    status: order?.status || 'DRAFT',
    consignor_id: order?.consignor_id || "",
    consignee_id: order?.consignee_id || "",
    broker_id: order?.broker_id || "",
    reference_number: order?.reference_number || "",
    pickup_date: order?.pickup_date || "",
    delivery_date: order?.delivery_date || "",
    notes: order?.notes || "",
    created_at: order?.created_at || "",
    lr_receiving_date: order?.lr_receiving_date || "",
    billing_company_name: order?.billing_company_name || ""
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (order && isOpen) {
      setFormData({
        billing_customer_id: order.billing_customer_id || "",
        order_type: order.order_type || "FTL",
        status: order.status,
        consignor_id: order.consignor_id || "",
        consignee_id: order.consignee_id || "",
        broker_id: order.broker_id || "",
        reference_number: order.reference_number || "",
        pickup_date: order.pickup_date || "",
        delivery_date: order.delivery_date || "",
        notes: order.notes || "",
        created_at: order.created_at || "",
        lr_receiving_date: order.lr_receiving_date || "",
        billing_company_name: order.billing_company_name || ""
      });
    }
  }, [order, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateOrderForm(formData, { requireBillingCustomer: false });
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const payload = normalizeOrderPayload(formData);

    updateOrderMutation.mutate({ id: order.id, data: payload, fullReplace: true }, {
      onSuccess: () => onClose()
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Order: ${order?.lr_number}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {Object.keys(formErrors).length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-xs">
            Please fix highlighted fields before saving.
          </div>
        )}
        <div className="pt-1 pb-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a6cf7]">Billing</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Billing Customer</label>
            <select
              disabled
              className="w-full p-2 border border-gray-200 bg-gray-50 rounded text-gray-500 cursor-not-allowed outline-none appearance-none"
              value={formData.billing_customer_id}
            >
              <option value="">Select Customer</option>
              {customers.map((c, idx) => (
                <option key={`${c.id}-${idx}`} value={c.id}>
                  {c.legal_name || c.trading_name} {c.customer_code ? `(${c.customer_code})` : ''} - {c.customer_type || 'N/A'}
                </option>
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
            <label className="block text-gray-700 font-medium mb-1">Billing Company Name</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              placeholder="e.g. KCM PVT LTD"
              value={formData.billing_company_name}
              onChange={e => setFormData({ ...formData, billing_company_name: e.target.value })}
            />
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
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Reference Number</label>
            <input
              type="text"
              maxLength={100}
              pattern="[A-Za-z0-9/_-]+"
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none ${formErrors.reference_number ? 'border-red-400' : 'border-gray-300'}`}
              value={formData.reference_number}
              onChange={e => {
                setFormData({ ...formData, reference_number: e.target.value });
                if (formErrors.reference_number) setFormErrors((prev) => ({ ...prev, reference_number: undefined }));
              }}
            />
            {formErrors.reference_number && <p className="mt-1 text-xs text-red-600">{formErrors.reference_number}</p>}
          </div>
        </div>

        <details className="rounded-lg border border-gray-200 bg-gray-50/70 p-3" open>
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-gray-700">Optional Details</summary>
          <div className="mt-3 space-y-4">
        <div className="pt-1 pb-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a6cf7]">Parties</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Consignor (Shipper)</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.consignor_id}
              onChange={e => setFormData({ ...formData, consignor_id: e.target.value })}
            >
              <option value="">Select Consignor</option>
              {consignors.map((c, idx) => (
                <option key={`${c.id}-${idx}`} value={c.customer?.id || c.id}>
                  {c.customer?.legal_name || c.customer?.trading_name || c.legal_name || c.trading_name || (c.id ? c.id.slice(-6) : 'N/A')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Consignee (Receiver)</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.consignee_id}
              onChange={e => setFormData({ ...formData, consignee_id: e.target.value })}
            >
              <option value="">Select Consignee</option>
              {consignees.map((c, idx) => (
                <option key={`${c.id}-${idx}`} value={c.customer?.id || c.id}>
                  {c.customer?.legal_name || c.customer?.trading_name || c.legal_name || c.trading_name || (c.id ? c.id.slice(-6) : 'N/A')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-1 pb-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a6cf7]">Schedule</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Broker (Optional)</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.broker_id}
              onChange={e => setFormData({ ...formData, broker_id: e.target.value })}
            >
              <option value="">Select Broker</option>
              {brokers.map((b, idx) => (
                <option key={`${b.id}-${idx}`} value={b.customer?.id || b.id}>
                  {b.customer?.legal_name || b.customer?.trading_name || b.legal_name || b.trading_name || (b.id ? b.id.slice(-6) : 'N/A')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Created At</label>
            <input
              type="text"
              readOnly
              className="w-full p-2 border border-gray-200 bg-gray-50 rounded text-gray-500 cursor-not-allowed outline-none"
              value={formData.created_at ? new Date(formData.created_at).toLocaleString() : 'N/A'}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">LR Receiving Date</label>
            <input
              type="date"
              max={formData.pickup_date || undefined}
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none ${formErrors.lr_receiving_date ? 'border-red-400' : 'border-gray-300'}`}
              value={formData.lr_receiving_date}
              onChange={e => {
                setFormData({ ...formData, lr_receiving_date: e.target.value });
                if (formErrors.lr_receiving_date) setFormErrors((prev) => ({ ...prev, lr_receiving_date: undefined }));
              }}
            />
            {formErrors.lr_receiving_date && <p className="mt-1 text-xs text-red-600">{formErrors.lr_receiving_date}</p>}
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
              min={formData.pickup_date || undefined}
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none ${formErrors.delivery_date ? 'border-red-400' : 'border-gray-300'}`}
              value={formData.delivery_date}
              onChange={e => {
                setFormData({ ...formData, delivery_date: e.target.value });
                if (formErrors.delivery_date) setFormErrors((prev) => ({ ...prev, delivery_date: undefined }));
              }}
            />
            {formErrors.delivery_date && <p className="mt-1 text-xs text-red-600">{formErrors.delivery_date}</p>}
          </div>
        </div>

        <div className="pt-1 pb-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a6cf7]">Notes</p>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Notes</label>
          <textarea
            maxLength={1000}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none ${formErrors.notes ? 'border-red-400' : 'border-gray-300'}`}
            rows="3"
            value={formData.notes}
            onChange={e => {
              setFormData({ ...formData, notes: e.target.value });
              if (formErrors.notes) setFormErrors((prev) => ({ ...prev, notes: undefined }));
            }}
          />
          {formErrors.notes && <p className="mt-1 text-xs text-red-600">{formErrors.notes}</p>}
        </div>
          </div>
        </details>

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

export function AssignTripModal({ isOpen, onClose, order, consignor, consignee }) {
  const assignTripMutation = useAssignTrip();

  const { data: driversData } = useDrivers({ page_size: 100 });
  const drivers = driversData?.results || [];

  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const vehicles = vehiclesData?.results || [];

  const [formData, setFormData] = useState({
    driver_id: "",
    vehicle_id: "",
    trip_type: "FTL",
    origin_address: "",
    destination_address: "",
    scheduled_pickup_date: "",
    scheduled_delivery_date: "",
    remarks: ""
  });

  useEffect(() => {
    if (isOpen && order) {
      const getAddress = (customer) => {
        if (!customer) return ""; // Still loading
        return customer.legal_name || customer.trading_name || "No address available";
      };

      setFormData({
        driver_id: "",
        vehicle_id: "",
        trip_type: order.order_type || "FTL",
        origin_address: getAddress(consignor),
        destination_address: getAddress(consignee),
        scheduled_pickup_date: order.pickup_date || "",
        scheduled_delivery_date: order.delivery_date || "",
        remarks: order.notes || ""
      });
    }
  }, [isOpen, order, consignor, consignee]);

  const handleSubmit = (e) => {
    e.preventDefault();
    assignTripMutation.mutate({ id: order.id, data: formData }, {
      onSuccess: () => onClose()
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Trip for: ${order?.lr_number}`}>
      <div className="mb-4 p-3 bg-indigo-50 text-indigo-800 rounded-lg border border-indigo-200 text-[11px] font-bold uppercase tracking-wider">
        Defining operational leg for this shipment
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px] tracking-widest">Driver *</label>
            <select
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.driver_id}
              onChange={e => setFormData({ ...formData, driver_id: e.target.value })}
            >
              <option value="">Select Driver</option>
              {drivers.map((d, idx) => (
                <option key={`${d.id}-${idx}`} value={d.id}>
                  {d.user?.first_name || 'Driver'} {d.user?.last_name || ''} ({d.employee_id || (d.id ? d.id.slice(-6) : 'N/A')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px] tracking-widest">Vehicle *</label>
            <select
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.vehicle_id}
              onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((v, idx) => (
                <option key={`${v.id}-${idx}`} value={v.id}>
                  {v.registration_number || v.registration || (v.id ? v.id.slice(-6) : 'N/A')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px] tracking-widest">Origin Point</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              placeholder="e.g. Warehouse A"
              value={formData.origin_address}
              onChange={e => setFormData({ ...formData, origin_address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px] tracking-widest">Destination Point</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              placeholder="e.g. Hub Center"
              value={formData.destination_address}
              onChange={e => setFormData({ ...formData, destination_address: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px] tracking-widest">Scheduled Pickup</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.scheduled_pickup_date}
              onChange={e => setFormData({ ...formData, scheduled_pickup_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px] tracking-widest">Scheduled Delivery</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.scheduled_delivery_date}
              onChange={e => setFormData({ ...formData, scheduled_delivery_date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px] tracking-widest">Trip Type</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.trip_type}
              onChange={e => setFormData({ ...formData, trip_type: e.target.value })}
            >
              <option value="FTL">FTL (Full Truck Load)</option>
              <option value="LTL">LTL (Less than Truck Load)</option>
              <option value="CONTAINER">CONTAINER</option>
              <option value="COURIER">COURIER</option>
              <option value="MULTI_DROP">MULTI DROP</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px] tracking-widest">Trip Number</label>
            <input
              type="text"
              readOnly
              className="w-full p-2 border border-gray-200 bg-gray-50 rounded text-gray-500 cursor-not-allowed outline-none"
              value="Auto-generated"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px] tracking-widest">Trip Remarks / Notes</label>
            <textarea
              rows="2"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              placeholder="Special instructions for this trip leg..."
              value={formData.remarks}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
          <button
            type="submit"
            disabled={assignTripMutation.isPending}
            className="px-6 py-2 font-black text-white bg-[#0052CC] rounded-xl hover:bg-[#0747A6] shadow-md shadow-blue-100 transition-all disabled:opacity-50"
          >
            {assignTripMutation.isPending ? 'Processing...' : 'Confirm Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
