import React, { useState } from 'react';
import { 
  Plus, Search, Download, Edit2, Truck, XCircle, 
  Trash2, Package, CheckCircle2, Clock, RefreshCcw, X, Eye
} from 'lucide-react';
import { 
  useOrders, useCreateOrder, useUpdateOrder, 
  useCancelOrder, useAssignTrip, useOrderDetail 
} from '../../queries/orders/ordersQuery';
import { useCustomers } from '../../queries/customers/customersQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';

// --- Configuration & Helpers ---
const STATUS_CONFIG = {
  DRAFT: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: <Clock size={14} /> },
  CONFIRMED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: <CheckCircle2 size={14} /> },
  ASSIGNED: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: <Truck size={14} /> },
  IN_TRANSIT: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: <Package size={14} /> },
  DELIVERED: { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', icon: <CheckCircle2 size={14} /> },
  CANCELLED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: <XCircle size={14} /> },
};

const TYPE_COLORS = {
  FTL: 'bg-purple-100 text-purple-700',
  LTL: 'bg-indigo-100 text-indigo-700',
  CONTAINER: 'bg-cyan-100 text-cyan-700',
  COURIER: 'bg-orange-100 text-orange-700',
  MULTI_DROP: 'bg-pink-100 text-pink-700',
};



const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span className="text-[11px] font-bold uppercase tracking-wide">{status}</span>
    </div>
  );
};

// --- Modal Component ---
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


// --- Main Body Component ---
export default function OrdersMainBody() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Data for dropdowns
  const { data: customersData } = useCustomers({ page_size: 100 });
  const customers = customersData?.results || (Array.isArray(customersData) ? customersData : []);

  const getCustomerName = (id) => {
    if (!id) return '-';
    const c = customers.find(cust => cust.id === id);
    if (!c) return 'Unknown';
    return c.legal_name || c.trading_name || c.customer_code || id.slice(-6);
  };

  // Queries
  const queryParams = { page, ordering: '-created_at' };
  if (search) queryParams.search = search;
  if (filterStatus !== 'All Status') queryParams.status = filterStatus;

  const { data: ordersData, isLoading, refetch } = useOrders(queryParams);
  const orders = ordersData?.results || [];
  const totalCount = ordersData?.count || 0;

  // Global counts for stats (using the API count for total, mocked stats for the rest due to no aggregate API)
  const stats = {
    total: totalCount,
    confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
    inTransit: orders.filter(o => o.status === 'IN_TRANSIT').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length,
  };

  // Actions
  const handleViewClick = (order) => {
    setSelectedOrder(order);
    setIsViewOpen(true);
  };

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setIsEditOpen(true);
  };

  const handleAssignClick = (order) => {
    setSelectedOrder(order);
    setIsAssignOpen(true);
  };

  const cancelOrderMutation = useCancelOrder();
  const handleCancelOrder = (id) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      cancelOrderMutation.mutate(id);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col relative">
      <div className="p-8 flex-1 flex flex-col min-h-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">Orders (LR) Management</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Manage Lorry Receipts, shipments, and trip assignments.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
            >
              <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#4a6cf7] text-white rounded-lg text-sm font-bold hover:bg-[#3b59d9] shadow-md shadow-blue-200 transition-all"
            >
              <Plus size={18} /> Add Order
            </button>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
          {/* Compact Stats Row */}
          <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            {isLoading ? (
              <div className="flex gap-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-28"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Orders:</span>
                  <span className="text-[18px] font-black text-[#172B4D]">{stats.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Confirmed:</span>
                  <span className="text-[18px] font-black text-green-600">{stats.confirmed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">In Transit:</span>
                  <span className="text-[18px] font-black text-orange-500">{stats.inTransit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Cancelled:</span>
                  <span className="text-[18px] font-black text-red-500">{stats.cancelled}</span>
                </div>
              </>
            )}
          </div>
          {/* Table Header & Search */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center bg-white flex-wrap">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search LR number, reference..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#4a6cf7] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select 
                className="flex-1 md:w-40 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 outline-none focus:border-[#4a6cf7]"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1); // reset to page 1 on filter
                }}
              >
                <option>All Status</option>
                <option>DRAFT</option>
                <option>CONFIRMED</option>
                <option>ASSIGNED</option>
                <option>IN_TRANSIT</option>
                <option>DELIVERED</option>
                <option>CANCELLED</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1 || isLoading}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Previous
              </button>
              <div className="flex items-center justify-center min-w-8 h-8 bg-[#4a6cf7] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
                {page}
              </div>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={!ordersData?.next || isLoading}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Next
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-auto min-h-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4a6cf7]"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-gray-400">
                <Package size={48} className="mb-4 opacity-20" />
                <p>No orders found matching your criteria</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1000px] relative">
                <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Order / LR ↕</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Billing / Ref</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Consignor / Consignee</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Type</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Pickup Date</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[#4a6cf7] font-bold text-xs truncate">
                            {order.lr_number?.slice(-3) || 'LR'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#172B4D]">{order.lr_number}</p>
                            <p className="text-[10px] text-gray-400 font-medium truncate w-32" title={order.id}>{order.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-[#172B4D] truncate w-32" title={getCustomerName(order.billing_customer_id)}>
                          {getCustomerName(order.billing_customer_id)}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">Ref: {order.reference_number || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-700 truncate w-32" title={`From: ${getCustomerName(order.consigner_id)}`}>
                          <span className="text-[10px] text-gray-400 mr-1">F:</span>{getCustomerName(order.consigner_id)}
                        </p>
                        <p className="text-sm font-medium text-gray-700 truncate w-32 mt-0.5" title={`To: ${getCustomerName(order.consignee_id)}`}>
                          <span className="text-[10px] text-gray-400 mr-1">T:</span>{getCustomerName(order.consignee_id)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${TYPE_COLORS[order.order_type] || 'bg-gray-100'}`}>
                          {order.order_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {order.pickup_date || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          
                          <button 
                            onClick={() => handleViewClick(order)}
                            title="View Details"
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <Eye size={16} />
                          </button>

                          {(order.status === 'CONFIRMED' || order.status === 'DRAFT') && (
                            <button 
                              onClick={() => handleAssignClick(order)}
                              title="Assign Trip"
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg flex items-center gap-1 text-xs font-bold"
                            >
                              <Truck size={16} /> Assign
                            </button>
                          )}

                          <button 
                            onClick={() => handleEditClick(order)}
                            title="Edit Order"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          {order.status !== 'CANCELLED' && (
                            <button 
                              onClick={() => handleCancelOrder(order.id)}
                              title="Cancel Order"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-white">
            <div className="text-sm text-gray-500">
              Showing <span className="font-bold text-[#172B4D]">{orders.length}</span> of <span className="font-bold text-[#172B4D]">{totalCount}</span> Orders
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateOrderModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
      />

      {selectedOrder && (
        <ViewOrderModal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          orderId={selectedOrder.id}
        />
      )}

      {selectedOrder && (
        <EditOrderModal 
          isOpen={isEditOpen} 
          onClose={() => setIsEditOpen(false)} 
          order={selectedOrder} 
        />
      )}

      {selectedOrder && (
        <AssignTripModal
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          order={selectedOrder}
        />
      )}

    </div>
  );
}

// -----------------------------------------------------------------------------
// Sub-components for Modals (to keep things organized)
// -----------------------------------------------------------------------------

function CreateOrderModal({ isOpen, onClose }) {
  const createOrderMutation = useCreateOrder();
  
  // Data for dropdowns
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
    // Clean empty optional UUID fields by removing them or setting to null
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

function EditOrderModal({ isOpen, onClose, order }) {
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

  // Reset form when order changes
  React.useEffect(() => {
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

function AssignTripModal({ isOpen, onClose, order }) {
  const assignTripMutation = useAssignTrip();
  
  const { data: driversData } = useDrivers({ page_size: 100 });
  const drivers = driversData?.results || (Array.isArray(driversData) ? driversData : []);

  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const vehicles = vehiclesData?.results || (Array.isArray(vehiclesData) ? vehiclesData : []);

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

function ViewOrderModal({ isOpen, onClose, orderId }) {
  const { data: order, isLoading } = useOrderDetail(orderId);
  const { data: customersData } = useCustomers({ page_size: 100 });
  const customers = customersData?.results || (Array.isArray(customersData) ? customersData : []);

  const getCustomerName = (id) => {
    if (!id) return '-';
    const c = customers.find(cust => cust.id === id);
    if (!c) return 'Unknown';
    return c.legal_name || c.trading_name || c.customer_code || id.slice(-6);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Order Details`}>
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4a6cf7]"></div>
        </div>
      ) : order ? (
        <div className="space-y-6 text-sm">
          {/* Detailed Info Grid */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
             <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">LR Number</p>
                  <p className="font-semibold text-gray-800">{order.lr_number}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Reference Number</p>
                  <p className="font-semibold text-gray-800">{order.reference_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Order Type</p>
                  <p className="font-semibold text-gray-800">{order.order_type}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                  <StatusBadge status={order.status} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pickup Date</p>
                  <p className="font-semibold text-gray-800">{order.pickup_date || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Delivery Date</p>
                  <p className="font-semibold text-gray-800">{order.delivery_date || '-'}</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Customer Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Billing Customer</p>
                    <p className="font-medium text-gray-700">{getCustomerName(order.billing_customer_id)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Consignor (From)</p>
                    <p className="font-medium text-gray-700">{getCustomerName(order.consigner_id)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Consignee (To)</p>
                    <p className="font-medium text-gray-700">{getCustomerName(order.consignee_id)}</p>
                  </div>
                </div>
             </div>

             <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">System Details</h3>
                <div className="space-y-3 flex-1">
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Order ID</p>
                    <p className="font-mono text-xs text-gray-600 truncate" title={order.id}>{order.id}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Created By</p>
                    <p className="font-mono text-xs text-gray-600 truncate">{order.created_by}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Created At</p>
                    <p className="font-medium text-gray-700">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Last Updated</p>
                    <p className="font-medium text-gray-700">{new Date(order.updated_at).toLocaleString()}</p>
                  </div>
                </div>
             </div>
          </div>

          {order.notes && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mt-4">
              <h3 className="font-bold text-amber-800 text-sm mb-1">Notes / Instructions</h3>
              <p className="text-amber-700 text-sm whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">Failed to load order details</div>
      )}
      
      <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-white bg-[#4a6cf7] rounded-lg hover:bg-[#3b59d9] font-medium transition-colors">
          Close
        </button>
      </div>
    </Modal>
  );
}