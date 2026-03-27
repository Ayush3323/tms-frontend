import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Download, Edit2, Truck, XCircle, 
  Trash2, Package, CheckCircle2, Clock, RefreshCcw, X, Eye
} from 'lucide-react';
import { 
  useOrders, useCancelOrder, useOrderDetail 
} from '../../queries/orders/ordersQuery';
import { useCustomers } from '../../queries/customers/customersQuery';
import { 
  CreateOrderModal, 
  EditOrderModal, 
  AssignTripModal 
} from './OrderModals';

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

// --- Modal Component moved to OrderModals.jsx ---


// --- Main Body Component ---
export default function OrdersMainBody() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [page, setPage] = useState(1);

  const navigate = useNavigate();
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
    navigate(`/tenant/dashboard/orders/${order.id}`);
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

// Modals are now imported from OrderModals.jsx

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