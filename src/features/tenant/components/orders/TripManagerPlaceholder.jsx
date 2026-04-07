import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ExternalLink, Search, Siren, TimerReset, Truck } from 'lucide-react';
import { useTrips, useUpdateTrip } from '../../queries/orders/ordersQuery';

const TRIP_TRANSITIONS = {
  CREATED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELAYED', 'ARRIVED', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
  DELAYED: ['IN_TRANSIT', 'CANCELLED'],
  ARRIVED: ['DELIVERED', 'COMPLETED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

const REVIEW_STATE_KEY = 'trip_manager_review_state_v1';

function toDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function TripManagerOperationsBoard() {
  const navigate = useNavigate();
  const updateTripMutation = useUpdateTrip();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [exceptionFilter, setExceptionFilter] = useState('ALL');
  const [reviewState, setReviewState] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REVIEW_STATE_KEY);
      if (saved) setReviewState(JSON.parse(saved));
    } catch (_) {
      // ignore corrupt local state
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(reviewState));
    } catch (_) {
      // ignore storage errors
    }
  }, [reviewState]);

  // Phase 2 path: use backend-supported status/search filters first, then client refine.
  const queryParams = {
    page_size: 250,
    ordering: '-updated_at',
    ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  };
  const { data: tripsData, isLoading } = useTrips(queryParams);
  const trips = tripsData?.results || [];

  const exceptionRows = useMemo(() => {
    const now = new Date();
    return trips
      .map((trip) => {
        const tags = [];
        if (!trip.primary_driver_id || !trip.primary_vehicle_id) tags.push('UNASSIGNED');
        if (trip.status === 'DELAYED') tags.push('DELAYED');
        if (trip.status === 'DELIVERED' && !trip.pod_received_date) tags.push('MISSING_POD');
        const scheduledDelivery = toDate(trip.scheduled_delivery_date);
        if (
          scheduledDelivery &&
          scheduledDelivery < now &&
          !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(trip.status)
        ) {
          tags.push('OVERDUE_DELIVERY');
        }
        return { ...trip, exceptionTags: tags };
      })
      .filter((trip) => trip.exceptionTags.length > 0)
      .filter((trip) => (exceptionFilter === 'ALL' ? true : trip.exceptionTags.includes(exceptionFilter)));
  }, [trips, exceptionFilter]);

  const metrics = useMemo(() => {
    const delayed = exceptionRows.filter((r) => r.exceptionTags.includes('DELAYED')).length;
    const missingPod = exceptionRows.filter((r) => r.exceptionTags.includes('MISSING_POD')).length;
    const unassigned = exceptionRows.filter((r) => r.exceptionTags.includes('UNASSIGNED')).length;
    const overdue = exceptionRows.filter((r) => r.exceptionTags.includes('OVERDUE_DELIVERY')).length;
    return { delayed, missingPod, unassigned, overdue };
  }, [exceptionRows]);

  const onQuickStatus = (tripId, nextStatus) => {
    updateTripMutation.mutate({ id: tripId, data: { status: nextStatus } });
  };

  const toggleReview = (tripId, key) => {
    setReviewState((prev) => ({
      ...prev,
      [tripId]: {
        ...(prev[tripId] || {}),
        [key]: !(prev[tripId] || {})[key],
      },
    }));
  };

  return (
    <div className="min-h-[70vh] bg-[#F8FAFC] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">Trip Manager: Operations Control</h1>
            <p className="text-sm text-gray-600">
              Exception queue only. Deep edit remains in Trips and Trip Detail pages.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={<AlertTriangle size={16} />} label="Delayed Trips" value={metrics.delayed} color="amber" />
          <MetricCard icon={<TimerReset size={16} />} label="Missing POD" value={metrics.missingPod} color="rose" />
          <MetricCard icon={<Truck size={16} />} label="Unassigned" value={metrics.unassigned} color="indigo" />
          <MetricCard icon={<Siren size={16} />} label="Overdue Delivery" value={metrics.overdue} color="orange" />
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by trip number or UUID"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
              <option value="ALL">All Statuses</option>
              <option value="CREATED">CREATED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="DELAYED">DELAYED</option>
              <option value="ARRIVED">ARRIVED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <select value={exceptionFilter} onChange={(e) => setExceptionFilter(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
              <option value="ALL">All Exceptions</option>
              <option value="DELAYED">Delayed</option>
              <option value="MISSING_POD">Missing POD</option>
              <option value="UNASSIGNED">Unassigned</option>
              <option value="OVERDUE_DELIVERY">Overdue Delivery</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-3 text-[11px] font-bold uppercase text-gray-500 border-b border-gray-100">
            <div className="col-span-2">Trip</div>
            <div className="col-span-2">Route</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Exceptions</div>
            <div className="col-span-2">Ops Review</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {isLoading ? (
            <div className="p-8 text-sm text-gray-500">Loading exceptions...</div>
          ) : exceptionRows.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">No exception trips found for selected filters.</div>
          ) : (
            exceptionRows.map((trip) => {
              const nextStatuses = TRIP_TRANSITIONS[trip.status] || [];
              const review = reviewState[trip.id] || {};
              return (
                <div key={trip.id} className="grid grid-cols-12 px-4 py-3 border-t border-gray-50 text-sm items-center">
                  <div className="col-span-2">
                    <p className="font-bold text-[#172B4D]">{trip.trip_number || trip.id?.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500">{trip.id?.slice(0, 8)}...</p>
                  </div>
                  <div className="col-span-2 text-xs text-gray-700">{trip.origin_address || '-'} {'->'} {trip.destination_address || '-'}</div>
                  <div className="col-span-2">
                    <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">{trip.status}</span>
                  </div>
                  <div className="col-span-2 flex flex-wrap gap-1">
                    {trip.exceptionTags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold">{t}</span>
                    ))}
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <button type="button" onClick={() => toggleReview(trip.id, 'reviewed')} className={`px-2 py-1 text-[10px] rounded ${review.reviewed ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {review.reviewed ? 'Reviewed' : 'Mark Reviewed'}
                    </button>
                    <button type="button" onClick={() => toggleReview(trip.id, 'escalated')} className={`px-2 py-1 text-[10px] rounded ${review.escalated ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                      {review.escalated ? 'Escalated' : 'Escalate'}
                    </button>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/tenant/dashboard/orders/trips/${trip.id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold"
                    >
                      Open <ExternalLink size={12} />
                    </button>
                    {nextStatuses.slice(0, 2).map((ns) => (
                      <button
                        key={ns}
                        type="button"
                        onClick={() => onQuickStatus(trip.id, ns)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold"
                      >
                        {ns}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="text-xs text-gray-500 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600" />
          Non-redundant design: no stops/docs/finance CRUD here. Those remain in Trip Detail and other module pages.
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }) {
  const colors = {
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.indigo}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-extrabold">{value}</p>
    </div>
  );
}
