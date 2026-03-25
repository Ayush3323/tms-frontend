import React, { useState } from 'react';
import { 
  Globe, Plus, Search, Filter, Download, 
  MapPin, Calendar, Truck, CheckCircle2, 
  Clock, AlertTriangle, RefreshCcw, User, Hash, X, Eye
} from 'lucide-react';
import { useTrips, useCreateTrip } from '../../queries/orders/ordersQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';

// --- Configuration & Status Badges ---
const TRIP_STATUS_CONFIG = {
  CREATED: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: <Clock size={14} /> },
  STARTED: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: <RefreshCcw size={14} /> },
  IN_TRANSIT: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: <Truck size={14} /> },
  COMPLETED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: <CheckCircle2 size={14} /> },
  DELAYED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: <AlertTriangle size={14} /> },
};

// --- Sub-components ---
const TripStatCard = ({ label, value, colorClass, icon: Icon, isLoading }) => {
  return (
    <div className="bg-white p-4 lg:p-5 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-blue-200 w-full max-w-[240px]">
      <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-1.5 uppercase">{label}</p>
      <div className="flex items-baseline gap-2">
        {isLoading ? (
          <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <span className={`text-3xl font-black ${colorClass || 'text-[#172B4D]'}`}>{value}</span>
        )}
      </div>
      {Icon && <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5"><span className="opacity-50"><Icon size={14} /></span> <span>Metrics</span></p>}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const config = TRIP_STATUS_CONFIG[status] || TRIP_STATUS_CONFIG.CREATED;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
      {config.icon}
      <span className="text-[10px] font-bold uppercase tracking-wide">{status}</span>
    </div>
  );
};

// Modal Component
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
export default function TripsMainBody() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Queries
  const queryParams = { page, ordering: '-created_at' };
  if (search) queryParams.search = search;
  if (filterStatus !== 'All Status') queryParams.status = filterStatus;

  const { data: tripsData, isLoading, refetch } = useTrips(queryParams);
  const trips = tripsData?.results || [];
  const totalCount = tripsData?.count || 0;

  // Additional Queries for Resolving IDs
  const { data: driversData } = useDrivers({ page_size: 100 });
  const drivers = driversData?.results || (Array.isArray(driversData) ? driversData : []);
  
  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const vehicles = vehiclesData?.results || (Array.isArray(vehiclesData) ? vehiclesData : []);

  // Stats mapped directly
  const activeCount = trips.filter(t => t.status !== 'COMPLETED').length;
  const inTransitCount = trips.filter(t => t.status === 'IN_TRANSIT').length;
  const completedCount = trips.filter(t => t.status === 'COMPLETED').length;

  // Resolvers
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

  const handleEditClick = (trip) => {
    setSelectedTrip(trip);
    setIsEditOpen(true);
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col relative">
      <div className="p-8 flex-1 flex flex-col min-h-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">Trip Management</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Track vehicle journeys, driver assignments, and trip status.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
            >
              <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] text-white rounded-lg text-sm font-bold hover:bg-[#0747A6] shadow-md shadow-blue-200 transition-all"
            >
              <Plus size={18} /> Plan New Trip
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <TripStatCard label="Total Trips" value={totalCount} colorClass="text-blue-600" icon={Globe} isLoading={isLoading} />
          <TripStatCard label="Active" value={activeCount} colorClass="text-amber-600" icon={Calendar} isLoading={isLoading} />
          <TripStatCard label="In Transit" value={inTransitCount} colorClass="text-indigo-600" icon={Truck} isLoading={isLoading} />
          <TripStatCard label="Completed Page" value={completedCount} colorClass="text-green-600" icon={CheckCircle2} isLoading={isLoading} />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center bg-white flex-wrap">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search by Trip ID, Route..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select 
                className="flex-1 md:w-48 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 outline-none focus:border-[#0052CC]"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All Status">All Status</option>
                <option value="CREATED">CREATED</option>
                <option value="STARTED">STARTED</option>
                <option value="IN_TRANSIT">IN_TRANSIT</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DELAYED">DELAYED</option>
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
              <div className="flex items-center justify-center min-w-8 h-8 bg-[#0052CC] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
                {page}
              </div>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={!tripsData?.next || isLoading}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Next
              </button>
            </div>
          </div>

          {/* Trips Table */}
          <div className="flex-1 overflow-auto min-h-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]"></div>
              </div>
            ) : trips.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-gray-400">
                <Truck size={48} className="mb-4 opacity-20" />
                <p>No trips found matching your criteria</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1100px] relative">
                <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trip Details</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Route (Origin → Destination)</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Fleet Info</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {trips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                            <Hash size={14} className="text-[#0052CC]" /> {trip.trip_number || 'TRIP-' + trip.id.slice(-6)}
                          </span>
                          <span className="text-[11px] text-gray-500 font-semibold mt-1 bg-gray-100 px-1.5 py-0.5 rounded w-fit uppercase" title={trip.id}>
                            ID: {trip.id.slice(-8)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col text-xs font-medium text-gray-700">
                            <span className="flex items-center gap-1.5"><MapPin size={12} className="text-blue-500" /> {trip.origin || 'Not Specified'}</span>
                            <div className="h-4 border-l-2 border-dashed border-gray-200 ml-[5px] my-1"></div>
                            <span className="flex items-center gap-1.5"><MapPin size={12} className="text-red-500" /> {trip.destination || 'Not Specified'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600" title={trip.vehicle_id || trip.primary_vehicle_id}>
                            <Truck size={14} className="text-gray-400" /> {getVehicleDisplay(trip.vehicle_id || trip.primary_vehicle_id)}
                          </div>
                          <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600" title={trip.driver_id || trip.primary_driver_id}>
                            <User size={14} className="text-gray-400" /> {getDriverDisplay(trip.driver_id || trip.primary_driver_id)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={trip.status} />
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          {/* Trip editing disabled per API capabilities */}
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
              Showing <span className="font-bold text-[#172B4D]">{trips.length}</span> of <span className="font-bold text-[#172B4D]">{totalCount}</span> Trips
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateTripModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        drivers={drivers}
        vehicles={vehicles}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sub-components for Modals
// -----------------------------------------------------------------------------

function CreateTripModal({ isOpen, onClose, drivers, vehicles }) {
  const createTripMutation = useCreateTrip();

  const [formData, setFormData] = useState({
    trip_number: "",
    primary_driver_id: "",
    primary_vehicle_id: "",
    origin: "",
    destination: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.origin) payload.origin = null;
    if (!payload.destination) payload.destination = null;
    if (!payload.trip_number) payload.trip_number = null;

    createTripMutation.mutate(payload, {
      onSuccess: () => {
        setFormData({ trip_number: "", primary_driver_id: "", primary_vehicle_id: "", origin: "", destination: "" });
        onClose();
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Plan New Trip">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Driver *</label>
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
            <label className="block text-gray-700 font-medium mb-1">Origin (Optional)</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              placeholder="E.g., Mumbai Warehouse"
              value={formData.origin}
              onChange={e => setFormData({ ...formData, origin: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Destination (Optional)</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              placeholder="E.g., Delhi DC"
              value={formData.destination}
              onChange={e => setFormData({ ...formData, destination: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Trip Number (Optional)</label>
          <input 
            type="text" 
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
            placeholder="Auto-generated if left blank"
            value={formData.trip_number}
            onChange={e => setFormData({ ...formData, trip_number: e.target.value })}
          />
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
