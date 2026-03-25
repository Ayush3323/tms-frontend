import React, { useState } from 'react';
import { 
  Package, Plus, Search, Filter, Download, 
  MoreHorizontal, Eye, Edit2, Trash2, 
  Layers, Scale, Maximize, Move,
  Hash, RefreshCcw, AlertCircle, CheckCircle2, X
} from 'lucide-react';
import { useCargoItems, useCreateCargo, useTrips } from '../../queries/orders/ordersQuery';

// --- Configuration & Helpers ---
const CARGO_TYPE_COLORS = {
  HAZMAT: 'bg-red-100 text-red-700 border-red-200',
  PERISHABLE: 'bg-teal-100 text-teal-700 border-teal-200',
  FRAGILE: 'bg-amber-100 text-amber-700 border-amber-200',
  GENERAL: 'bg-blue-100 text-blue-700 border-blue-200',
};



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

export default function CargoMainBody() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All Types");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState(null);

  // Queries
  const queryParams = { page, ordering: '-created_at' };
  if (search) queryParams.search = search;
  if (filterType !== 'All Types') queryParams.cargo_type = filterType;

  const { data: cargoData, isLoading, refetch } = useCargoItems(queryParams);
  const cargoItems = cargoData?.results || [];
  const totalCount = cargoData?.count || 0;

  // Global counts for stats (using API length for demo, until backend supports aggregation)
  const stats = {
    total: totalCount,
    hazmat: cargoItems.filter(c => c.cargo_type === 'HAZMAT').length,
    fragile: cargoItems.filter(c => c.cargo_type === 'FRAGILE').length,
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative bg-[#F8FAFC]">
      <div className="p-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">Cargo Inventory</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Manage individual cargo items, dimensions, and loading details.</p>
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
              <Plus size={18} /> Add Cargo Item
            </button>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden mt-2">
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
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Items:</span>
                  <span className="text-[18px] font-black text-blue-600">{stats.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Hazmat Alerts:</span>
                  <span className="text-[18px] font-black text-red-600">{stats.hazmat}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Fragile Goods:</span>
                  <span className="text-[18px] font-black text-amber-600">{stats.fragile}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Loaded Items:</span>
                  <span className="text-[18px] font-black text-green-600">—</span>
                </div>
              </>
            )}
          </div>
          {/* Filters Bar */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-white items-center flex-wrap">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search Item Code or Description..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-[#4a6cf7] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
               <select 
                 className="flex-1 md:w-40 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 outline-none focus:border-[#4a6cf7]"
                 value={filterType}
                 onChange={(e) => {
                   setFilterType(e.target.value);
                   setPage(1);
                 }}
               >
                 <option>All Types</option>
                 <option>GENERAL</option>
                 <option>FRAGILE</option>
                 <option>PERISHABLE</option>
                 <option>HAZMAT</option>
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
                disabled={!cargoData?.next || isLoading}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Next
              </button>
            </div>
          </div>
        </div>

          {/* Cargo Table */}
          <div className="flex-1 min-h-0 overflow-auto bg-white rounded-xl shadow-sm border border-gray-100 mt-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4a6cf7]"></div>
              </div>
            ) : cargoItems.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-gray-400">
                <Package size={48} className="mb-4 opacity-20" />
                <p>No cargo items found matching criteria</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Item / Code</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Specifications</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trip Link</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cargoItems.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-blue-100 group-hover:text-[#4a6cf7] transition-colors">
                            <Package size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#172B4D]">{item.description || 'N/A'}</p>
                            <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-0.5 uppercase">
                              <Hash size={10} /> {item.item_code || item.id.slice(-6)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600">
                            <Scale size={14} className="text-gray-400" /> {item.weight || 'N/A'} kg
                          </div>
                          <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600">
                            <Maximize size={14} className="text-gray-400" /> {item.dimensions || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-100 rounded-md text-[11px] font-bold text-gray-600 uppercase tracking-tight" title={item.trip_id}>
                          <Move size={12} /> {item.trip_id ? "Linked to Trip" : "Unassigned"}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${CARGO_TYPE_COLORS[item.cargo_type] || CARGO_TYPE_COLORS['GENERAL']}`}>
                          {item.cargo_type || 'GENERAL'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setSelectedCargo(item);
                                setIsViewOpen(true);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between mt-4 px-2">
            <div className="text-sm text-gray-500">
              Showing <span className="font-bold text-[#172B4D]">{cargoItems.length}</span> of <span className="font-bold text-[#172B4D]">{totalCount}</span> items
            </div>
          </div>
      </div>

      <CreateCargoModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {selectedCargo && (
        <ViewCargoModal 
          isOpen={isViewOpen} 
          onClose={() => setIsViewOpen(false)} 
          item={selectedCargo} 
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Modals
// -----------------------------------------------------------------------------

function ViewCargoModal({ isOpen, onClose, item }) {
  if (!item) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cargo Details: ${item.item_code || item.id.slice(-8)}`}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div>
            <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Item ID / Code</p>
            <p className="font-semibold text-gray-900">{item.item_code || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Type</p>
            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${CARGO_TYPE_COLORS[item.cargo_type] || CARGO_TYPE_COLORS['GENERAL']}`}>
              {item.cargo_type || 'GENERAL'}
            </span>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Description</p>
            <p className="font-semibold text-gray-900">{item.description || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Weight</p>
            <p className="font-semibold text-gray-900">{item.weight ? `${item.weight} kg` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Dimensions</p>
            <p className="font-semibold text-gray-900">{item.dimensions || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Quantity</p>
            <p className="font-semibold text-gray-900">{item.quantity || '1'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Linked Trip ID</p>
            <p className="font-mono text-xs text-gray-800 break-all">{item.trip_id || item.trip || 'Unassigned'}</p>
          </div>
        </div>
        
        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-white bg-[#4a6cf7] rounded-lg hover:bg-[#3b59d9] text-sm font-medium">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreateCargoModal({ isOpen, onClose }) {
  const createCargoMutation = useCreateCargo();
  
  const { data: tripsData } = useTrips({ page_size: 100 });
  const trips = tripsData?.results || (Array.isArray(tripsData) ? tripsData : []);

  const [formData, setFormData] = useState({
    item_code: "",
    description: "",
    cargo_type: "GENERAL",
    weight: "",
    dimensions: "",
    trip: "",
    quantity: "1"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.item_code) payload.item_code = null;
    if (!payload.weight) payload.weight = null;
    if (!payload.dimensions) payload.dimensions = null;
    
    // Convert quantity to integer
    payload.quantity = parseInt(payload.quantity, 10);

    createCargoMutation.mutate(payload, {
      onSuccess: () => {
        setFormData({
          item_code: "", description: "", cargo_type: "GENERAL", weight: "", dimensions: "", trip: "", quantity: "1"
        });
        onClose();
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Cargo Item">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Item Code</label>
            <input 
              type="text" 
              placeholder="e.g. ITM-001"
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.item_code}
              onChange={e => setFormData({ ...formData, item_code: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Description *</label>
            <input 
              type="text" 
              required
              placeholder="Boxes of electronics..."
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Cargo Type</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.cargo_type}
              onChange={e => setFormData({ ...formData, cargo_type: e.target.value })}
            >
              <option value="GENERAL">GENERAL</option>
              <option value="FRAGILE">FRAGILE</option>
              <option value="PERISHABLE">PERISHABLE</option>
              <option value="HAZMAT">HAZMAT</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Assign to Trip *</label>
            <select
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.trip}
              onChange={e => setFormData({ ...formData, trip: e.target.value })}
            >
              <option value="">Select a trip</option>
              {trips.map(trip => (
                <option key={trip.id} value={trip.id}>{trip.trip_number || trip.id}</option>
              ))}
            </select>
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
            <label className="block text-gray-700 font-medium mb-1">Weight</label>
            <input 
              type="text" 
              placeholder="e.g. 1500 kg"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.weight}
              onChange={e => setFormData({ ...formData, weight: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Dimensions</label>
            <input 
              type="text" 
              placeholder="L x W x H (cm)"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none"
              value={formData.dimensions}
              onChange={e => setFormData({ ...formData, dimensions: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button 
            type="submit" 
            disabled={createCargoMutation.isPending}
            className="px-4 py-2 text-white bg-[#4a6cf7] rounded-lg hover:bg-[#3b59d9] disabled:opacity-50"
          >
            {createCargoMutation.isPending ? 'Logging...' : 'Log Cargo Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
}