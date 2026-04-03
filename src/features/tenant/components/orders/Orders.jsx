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
  IN_TRANSIT: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: <RefreshCcw size={14} /> },
  DELIVERED: { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', icon: <CheckCircle2 size={14} /> },
  CANCELLED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: <XCircle size={14} /> },
};

const TAB_CONFIG = [
  { label: 'All Status', count: 0 },
  { label: 'DRAFT', count: 0 },
  { label: 'CONFIRMED', count: 0 },
  { label: 'ASSIGNED', count: 0 },
  { label: 'IN_TRANSIT', count: 0 },
  { label: 'DELIVERED', count: 0 },
];

export default function Orders() {
  const navigate = useNavigate();
  
  // -- State --
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
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
    draft: orders.filter(o => o.status === 'DRAFT').length,
    in_transit: orders.filter(o => o.status === 'IN_TRANSIT').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setIsEditOpen(true);
  };

  const handleView = (orderId) => {
    navigate(`/tenant/dashboard/orders/${orderId}`);
  };

  const handleAssignTrip = (order) => {
    setSelectedOrder(order);
    setIsAssignOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] p-6 lg:p-8">
      {/* Header section with high-density stats */}
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-[#172B4D] tracking-tight leading-none mb-2">Order Management</h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">LR Inventory & Logistics Dispatch</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
              <Download size={14} /> Export CSV
            </button>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#4a6cf7] rounded-xl text-xs font-black text-white hover:bg-[#3b59d9] shadow-lg shadow-blue-100 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={16} /> Create New LR
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#4a6cf7] flex items-center justify-center">
              <Package size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total LR's</p>
              <p className="text-2xl font-black text-[#172B4D]">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Pending Drafts</p>
              <p className="text-2xl font-black text-[#172B4D]">{stats.draft}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <Truck size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Active In-Transit</p>
              <p className="text-2xl font-black text-[#172B4D]">{stats.in_transit}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Delivered (MTD)</p>
              <p className="text-2xl font-black text-[#172B4D]">{stats.delivered}</p>
            </div>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
          
          <div className="p-4 border-b border-gray-50 flex flex-col lg:flex-row gap-4 items-center justify-between bg-gray-50/30">
            <div className="flex overflow-x-auto w-full lg:w-auto scrollbar-hide gap-1 bg-white p-1 rounded-xl border border-gray-100">
               {TAB_CONFIG.map(tab => (
                 <button
                  key={tab.label}
                  onClick={() => setFilterStatus(tab.label)}
                  className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                  ${filterStatus === tab.label ? 'bg-[#172B4D] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                 >
                   {tab.label}
                 </button>
               ))}
            </div>

            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search LR #, Reference Number..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#4a6cf7] outline-none transition-all font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">LR Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Entities (F/T)</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Billing Customer</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Schedule</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="6" className="px-6 py-5 underline-offset-1 h-20 bg-gray-50/10"></td>
                    </tr>
                  ))
                ) : orders.length > 0 ? (
                  orders.map((order) => {
                    const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.DRAFT;
                    return (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${st.bg} ${st.color} border ${st.border}`}>
                            <Package size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#172B4D] leading-none mb-1 group-hover:text-[#4a6cf7] transition-colors">{order.lr_number}</p>
                            <p className={`${order.status === 'CANCELLED' ? 'text-red-400' : 'text-gray-400'} text-[10px] font-mono mt-0.5 whitespace-nowrap`}>
                              Ref Number: {order.reference_number || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-700 truncate w-32" title={`From: ${getCustomerName(order.consignor_id)}`}>
                          <span className="text-[10px] text-gray-400 mr-1">F:</span>{getCustomerName(order.consignor_id)}
                        </p>
                        <p className="text-sm font-medium text-gray-700 truncate w-32 mt-0.5" title={`To: ${getCustomerName(order.consignee_id)}`}>
                          <span className="text-[10px] text-gray-400 mr-1">T:</span>{getCustomerName(order.consignee_id)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-[#172B4D] leading-none">{getCustomerName(order.billing_customer_id)}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">{order.order_type}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 grayscale opacity-60">
                            <Clock size={12} className="text-blue-500" />
                            <span className="text-[10px] font-bold text-gray-500">{order.pickup_date || 'TBD'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-green-500" />
                            <span className="text-[10px] font-bold text-gray-500">{order.delivery_date || 'TBD'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-sm ${st.color} ${st.bg} ${st.border}`}>
                            <span className="relative flex h-1.5 w-1.5">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${st.color.replace('text', 'bg')}`}></span>
                              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${st.color.replace('text', 'bg')}`}></span>
                            </span>
                            {order.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button 
                            onClick={() => handleView(order.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-blue-100 shadow-sm transition-all"
                            title="Quick View Record"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {order.status === 'CONFIRMED' && (
                            <button 
                              onClick={() => handleAssignTrip(order)}
                              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-white rounded-lg border border-transparent hover:border-amber-100 shadow-sm transition-all"
                              title="Assign to Vehicle"
                            >
                              <Truck size={16} />
                            </button>
                          )}

                          <button 
                            onClick={() => handleEdit(order)}
                            className="p-2 text-gray-400 hover:text-[#4a6cf7] hover:bg-white rounded-lg border border-transparent hover:border-blue-100 shadow-sm transition-all"
                            title="Operational Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                   );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center opacity-20">
                        <Package size={48} className="mb-4" />
                        <p className="text-sm font-black uppercase tracking-[0.2em]">No Shipment Records found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/20">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Showing <span className="text-[#172B4D]">{orders.length}</span> of <span className="text-[#172B4D]">{totalCount}</span> active shipments
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all font-mono"
              >
                PREV
              </button>
              <span className="px-3 py-1 bg-[#172B4D] text-white rounded-lg text-xs font-black font-mono">{page}</span>
              <button 
                disabled={orders.length < 10}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all font-mono"
              >
                NEXT
              </button>
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
          onClose={() => {
            setIsEditOpen(false);
            setSelectedOrder(null);
          }} 
          order={selectedOrder}
        />
      )}

      {selectedOrder && (
        <AssignTripModal
          isOpen={isAssignOpen}
          onClose={() => {
            setIsAssignOpen(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          consignor={customers.find(c => c.id === selectedOrder.consignor_id)}
          consignee={customers.find(c => c.id === selectedOrder.consignee_id)}
        />
      )}
    </div>
  );
}