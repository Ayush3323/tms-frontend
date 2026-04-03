import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, Plus, Search, Filter, Download,
  MapPin, Calendar, Truck, CheckCircle2,
  Clock, AlertTriangle, RefreshCcw, User, Hash, X, Eye, Edit2, XCircle
} from 'lucide-react';
import {
  useTrips, useUpdateTrip, useTripDetail
} from '../../queries/orders/ordersQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';
import {
  CreateTripModal,
  EditTripModal,
  ViewTripModal
} from './TripModals';

// --- Configuration & Status Badges ---
const TRIP_STATUS_CONFIG = {
  CREATED: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: <Clock size={14} /> },
  ASSIGNED: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: <Truck size={14} /> },
  IN_TRANSIT: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: <RefreshCcw size={14} /> },
  DELIVERED: { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', icon: <CheckCircle2 size={14} /> },
  CANCELLED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: <XCircle size={14} /> },
  // Legacy or alternative backend statuses for robustness
  COMPLETED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: <CheckCircle2 size={14} /> },
  STARTED: { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', icon: <Clock size={14} /> },
  DELAYED: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: <AlertTriangle size={14} /> },
};

const TAB_CONFIG = [
  { label: 'All Status' },
  { label: 'CREATED' },
  { label: 'ASSIGNED' },
  { label: 'IN_TRANSIT' },
  { label: 'DELIVERED' },
  { label: 'CANCELLED' },
];



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

  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Queries
  const queryParams = { page, ordering: '-created_at' };
  if (search) queryParams.search = search;
  if (filterStatus !== 'All Status') queryParams.status = filterStatus;

  const { data: tripsData, isLoading, refetch } = useTrips(queryParams);
  let trips = tripsData?.results || [];

  // Frontend filter fallback
  // Handle DELIVERED/COMPLETED ambiguity and backend missing filter param
  if (filterStatus !== 'All Status' && trips.length > 0) {
    trips = trips.filter(t => {
      if (filterStatus === 'DELIVERED') return t.status === 'DELIVERED' || t.status === 'COMPLETED';
      return t.status === filterStatus;
    });
  }
  const totalCount = tripsData?.count || 0;

  // Additional Queries for Resolving IDs
  const { data: driversData } = useDrivers({ page_size: 100 });
  const drivers = driversData?.results || (Array.isArray(driversData) ? driversData : []);

  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const vehicles = vehiclesData?.results || (Array.isArray(vehiclesData) ? vehiclesData : []);

  // Stats mapped directly
  const activeCount = trips.filter(t => t.status !== 'DELIVERED' && t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length;
  const inTransitCount = trips.filter(t => t.status === 'IN_TRANSIT').length;
  const deliveredCount = trips.filter(t => t.status === 'DELIVERED' || t.status === 'COMPLETED').length;

  // Resolvers
  const getDriverDisplay = (id, fallbackName) => {
    if (!id) return fallbackName || 'Unassigned';
    const d = drivers.find(dr => dr.id === id);
    if (!d) return fallbackName || id.slice(-6);
    return `${d.user?.first_name || 'Driver'} ${d.user?.last_name || ''}`.trim() || d.employee_id || id.slice(-6);
  };

  const getVehicleDisplay = (id, fallbackNumber) => {
    if (!id) return fallbackNumber || 'Unassigned';
    const v = vehicles.find(vh => vh.id === id);
    if (!v) return fallbackNumber || id.slice(-6);
    return v.registration_number || v.registration || fallbackNumber || id.slice(-6);
  };

  const handleEditClick = (trip) => {
    setSelectedTrip(trip);
    setIsEditOpen(true);
  };

  const handleViewClick = (trip) => {
    navigate(`/tenant/dashboard/orders/trips/${trip.id}`);
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
              onClick={() => navigate('/tenant/dashboard/orders/trips/new')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#4a6cf7] text-white rounded-lg text-sm font-bold hover:bg-[#3b59d9] shadow-md shadow-blue-200 transition-all"
            >
              <Plus size={18} /> Plan New Trip
            </button>
          </div>
        </div>

        {/* Filters and Search */}
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
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Trips:</span>
                  <span className="text-[18px] font-black text-blue-600">{totalCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Active:</span>
                  <span className="text-[18px] font-black text-amber-600">{activeCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">In Transit:</span>
                  <span className="text-[18px] font-black text-indigo-600">{inTransitCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Delivered:</span>
                  <span className="text-[18px] font-black text-green-600">{deliveredCount}</span>
                </div>
              </>
            )}
          </div>
          <div className="p-4 border-b border-gray-50 flex flex-col lg:flex-row gap-4 items-center justify-between bg-gray-50/30">
            <div className="flex overflow-x-auto w-full lg:w-auto scrollbar-hide gap-1 bg-white p-1 rounded-xl border border-gray-100">
               {TAB_CONFIG.map(tab => (
                 <button
                  key={tab.label}
                  onClick={() => {
                    setFilterStatus(tab.label);
                    setPage(1);
                  }}
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
                placeholder="Search by Trip ID, Route..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#4a6cf7] outline-none transition-all font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trip</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Order</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
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
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          {trip.lr_number && (
                            <span className="text-xs font-black text-[#0052CC] uppercase tracking-widest bg-blue-50 px-2 py-1 rounded w-fit border border-blue-100/50">
                              {trip.lr_number}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 w-fit uppercase tracking-wider">
                            {trip.trip_type || 'FTL'}
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
                            <Truck size={14} className="text-gray-400" /> {getVehicleDisplay(trip.vehicle_id || trip.primary_vehicle_id, trip.vehicle_number)}
                          </div>
                          <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600" title={trip.driver_id || trip.primary_driver_id}>
                            <User size={14} className="text-gray-400" /> {getDriverDisplay(trip.driver_id || trip.primary_driver_id, trip.primary_driver_name)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={trip.status} />
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button
                            onClick={() => handleViewClick(trip)}
                            title="View Details"
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => handleEditClick(trip)}
                            title="Edit Trip"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={16} />
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
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-white">
            <div className="text-sm text-gray-500">
              Showing <span className="font-bold text-[#172B4D]">{trips.length}</span> of <span className="font-bold text-[#172B4D]">{totalCount}</span> Trips
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1 || isLoading}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                PREV
              </button>
              <div className="flex items-center justify-center min-w-8 h-8 bg-[#172B4D] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
                 {page}
              </div>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={!tripsData?.next || isLoading}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                NEXT
              </button>
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

      {selectedTrip && (
        <EditTripModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          trip={selectedTrip}
        />
      )}
    </div>
  );
}

// Modals are now imported from TripModals.jsx
