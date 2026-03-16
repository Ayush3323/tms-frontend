import React, { useState } from 'react';
import {
  Loader2, AlertCircle, Plus,
  Pencil, Trash2, BarChart2, RefreshCw, X,
} from 'lucide-react';
import {
  useDriverPerformanceMetrics,
  useCreatePerformanceMetric,
  useUpdatePerformanceMetric,
  useDeletePerformanceMetric,
} from '../../../queries/drivers/performanceMetricsQuery';

// ── Reusable Form Components ──────────────────────────────────────────

const Label = ({ children, required }) => (
  <label className="block text-xs font-bold text-gray-600 mb-1">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const Input = (props) => (
  <input {...props}
    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
      focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]
      placeholder:text-gray-300 transition-all"
  />
);

// ── Shared Form Fields Component ──────────────────────────────────────
const PerformanceFormFields = ({ form, setForm, error }) => {
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  return (
    <div className="space-y-4">
      {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div><Label required>Period Start</Label><Input type="date" value={form.period_start} onChange={set('period_start')} /></div>
        <div><Label required>Period End</Label><Input type="date" value={form.period_end} onChange={set('period_end')} /></div>
        <div><Label>Trips Completed</Label><Input type="number" placeholder="e.g. 45" min="0" value={form.trips_completed} onChange={set('trips_completed')} /></div>
        <div><Label>Distance Covered (km)</Label><Input type="number" placeholder="e.g. 12500.50" min="0" step="0.01" value={form.distance_covered} onChange={set('distance_covered')} /></div>
        <div><Label>Fuel Efficiency (km/L)</Label><Input type="number" placeholder="e.g. 8.5" min="0" step="0.1" value={form.fuel_efficiency} onChange={set('fuel_efficiency')} /></div>
        <div><Label>On-Time Delivery Rate (%)</Label><Input type="number" placeholder="e.g. 95.5" min="0" max="100" step="0.1" value={form.on_time_delivery_rate} onChange={set('on_time_delivery_rate')} /></div>
        <div><Label>Safety Score (0-10)</Label><Input type="number" placeholder="e.g. 9.2" min="0" max="10" step="0.1" value={form.safety_score} onChange={set('safety_score')} /></div>
        <div><Label>Customer Rating (0-5)</Label><Input type="number" placeholder="e.g. 4.5" min="0" max="5" step="0.1" value={form.customer_rating} onChange={set('customer_rating')} /></div>
      </div>
      <div><Label>Notes</Label>
        <textarea rows={2} placeholder="Any additional notes..." value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// ── MODALS START HERE ─────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────

// ── Add Performance Modal ─────────────────────────────────────────────
const AddPerformanceModal = ({ driverId, onClose }) => {
  const [form, setForm] = useState({
    period_start:          '',
    period_end:            '',
    trips_completed:       '',
    distance_covered:      '',
    fuel_efficiency:       '',
    on_time_delivery_rate: '',
    safety_score:          '',
    customer_rating:       '',
    notes:                 '',
  });
  const [error, setError] = useState('');
  const createMetric = useCreatePerformanceMetric(driverId);

  const handleSubmit = () => {
    setError('');
    if (!form.period_start) return setError('Period start date is required.');
    if (!form.period_end)   return setError('Period end date is required.');
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    createMetric.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to add performance metric.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Add Performance Metric</h2>
            <p className="text-xs text-gray-400 mt-0.5">Add performance data for a specific period</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <PerformanceFormFields form={form} setForm={setForm} error={error} />
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.period_start || !form.period_end || createMetric.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createMetric.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Metric</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Performance Modal ────────────────────────────────────────────
const EditPerformanceModal = ({ metric, driverId, onClose }) => {
  const [form, setForm] = useState({
    period_start:          metric.period_start          ?? '',
    period_end:            metric.period_end            ?? '',
    trips_completed:       metric.trips_completed       ?? '',
    distance_covered:      metric.distance_covered      ?? '',
    fuel_efficiency:       metric.fuel_efficiency       ?? '',
    on_time_delivery_rate: metric.on_time_delivery_rate ?? '',
    safety_score:          metric.safety_score          ?? '',
    customer_rating:       metric.customer_rating       ?? '',
    notes:                 metric.notes                 ?? '',
  });
  const [error, setError] = useState('');
  const updateMetric = useUpdatePerformanceMetric(driverId, metric.id);

  const handleSubmit = () => {
    setError('');
    if (!form.period_start) return setError('Period start date is required.');
    if (!form.period_end)   return setError('Period end date is required.');
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    updateMetric.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to update performance metric.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Edit Performance Metric</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Editing: <span className="font-semibold text-gray-600">{metric.period_start} → {metric.period_end}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <PerformanceFormFields form={form} setForm={setForm} error={error} />
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.period_start || !form.period_end || updateMetric.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {updateMetric.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Pencil size={14} /> Update Metric</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// ── MODALS END HERE ───────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────

// ── Delete Confirm Dialog ─────────────────────────────────────────────
const DeleteConfirm = ({ metric, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <Trash2 size={20} className="text-red-500" />
      </div>
      <h3 className="text-base font-black text-[#172B4D] mb-1">Delete Performance Metric?</h3>
      <p className="text-sm text-gray-400 mb-5">
        Period <span className="font-semibold text-gray-600">{metric.period_start} → {metric.period_end}</span> will be permanently deleted.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
        <button onClick={onConfirm} disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50">
          {isDeleting ? <><Loader2 size={13} className="animate-spin" /> Deleting...</> : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ── Score Color Helper ────────────────────────────────────────────────
const getScoreColor = (val, max = 10) => {
  if (val == null) return 'text-gray-400';
  const pct = val / max;
  if (pct >= 0.8) return 'text-green-600 font-semibold';
  if (pct >= 0.6) return 'text-orange-500 font-semibold';
  return 'text-red-600 font-semibold';
};

// ── Main Tab Component ────────────────────────────────────────────────
const PerformanceTab = ({ driverId }) => {
  const [addOpen,       setAddOpen]       = useState(false);
  const [editMetric,    setEditMetric]    = useState(null);
  const [deleteMetric,  setDeleteMetric]  = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverPerformanceMetrics(driverId);
  const deleteMetricMutation = useDeletePerformanceMetric(driverId);
  const metrics = data?.results ?? [];

  const handleDelete = () => {
    deleteMetricMutation.mutate(deleteMetric.id, {
      onSuccess: () => setDeleteMetric(null),
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <Loader2 size={20} className="animate-spin text-[#0052CC]" />
      <span className="text-sm">Loading performance metrics...</span>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
      <AlertCircle size={32} />
      <p className="text-sm font-medium">Failed to load performance metrics</p>
      <p className="text-xs text-gray-400">{error?.message}</p>
      <button onClick={() => refetch()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg">
        <RefreshCw size={13} /> Try Again
      </button>
    </div>
  );

  return (
    <>
      {/* ── Modals ── */}
      {addOpen      && <AddPerformanceModal  driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editMetric   && <EditPerformanceModal metric={editMetric} driverId={driverId} onClose={() => setEditMetric(null)} />}
      {deleteMetric && <DeleteConfirm metric={deleteMetric} onConfirm={handleDelete} onCancel={() => setDeleteMetric(null)} isDeleting={deleteMetricMutation.isPending} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Performance Metrics</h3>
          <p className="text-xs text-gray-400 mt-0.5">{metrics.length} record{metrics.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
          <Plus size={14} /> Add Metric
        </button>
      </div>

      {/* ── Empty State ── */}
      {metrics.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <BarChart2 size={32} className="mb-2 opacity-30" />
          <p className="text-sm font-semibold">No performance metrics found</p>
          <p className="text-xs mt-1">Click Add Metric to add one</p>
        </div>
      )}

      {/* ── Table ── */}
      {metrics.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Period','Trips','Distance','On-Time %','Fuel Eff.','Safety','Rating','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {metrics.map(m => (
                <tr key={m.id} className="hover:bg-blue-50/30 transition-colors">
                  {/* Period */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold text-[#172B4D] text-[12px]">{m.period_start}</div>
                    <div className="text-[11px] text-gray-400">to {m.period_end}</div>
                  </td>

                  {/* Trips */}
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] font-semibold text-gray-700">
                    {m.trips_completed ?? '—'}
                  </td>

                  {/* Distance */}
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                    {m.distance_covered ? `${Number(m.distance_covered).toLocaleString('en-IN')} km` : '—'}
                  </td>

                  {/* On-Time % */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[12px] ${getScoreColor(m.on_time_delivery_rate, 100)}`}>
                      {m.on_time_delivery_rate != null ? `${m.on_time_delivery_rate}%` : '—'}
                    </span>
                  </td>

                  {/* Fuel Efficiency */}
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                    {m.fuel_efficiency != null ? `${m.fuel_efficiency} km/L` : '—'}
                  </td>

                  {/* Safety Score */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[12px] ${getScoreColor(m.safety_score, 10)}`}>
                      {m.safety_score != null ? `${m.safety_score}/10` : '—'}
                    </span>
                  </td>

                  {/* Customer Rating */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[12px] ${getScoreColor(m.customer_rating, 5)}`}>
                      {m.customer_rating != null ? `⭐ ${m.customer_rating}` : '—'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditMetric(m)} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">
                        <Pencil size={11} /> Edit
                      </button>
                      <button onClick={() => setDeleteMetric(m)} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default PerformanceTab;