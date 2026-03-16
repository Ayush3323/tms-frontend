import React, { useState } from 'react';
import {
  Loader2, AlertCircle, Plus,
  Pencil, Trash2, AlertTriangle, RefreshCw,
  X, ChevronDown,
} from 'lucide-react';
import {
  useDriverIncidents,
  useCreateIncident,
  useUpdateIncident,
  useDeleteIncident,
} from '../../../queries/drivers/incidentsAndAttendance';

// ── Style Maps ────────────────────────────────────────────────────────

const SEVERITY_STYLES = {
  LOW:      { text: 'text-green-700',  bg: 'bg-green-50 border border-green-200' },
  MEDIUM:   { text: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200' },
  HIGH:     { text: 'text-red-700',    bg: 'bg-red-50 border border-red-200' },
  CRITICAL: { text: 'text-red-900',    bg: 'bg-red-100 border border-red-300' },
};

const RESOLUTION_STYLES = {
  OPEN:          { text: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200' },
  INVESTIGATING: { text: 'text-blue-700',   bg: 'bg-blue-50 border border-blue-200' },
  RESOLVED:      { text: 'text-green-700',  bg: 'bg-green-50 border border-green-200' },
  CLOSED:        { text: 'text-gray-600',   bg: 'bg-gray-50 border border-gray-200' },
};

const INCIDENT_TYPES   = ['ACCIDENT', 'TRAFFIC_VIOLATION', 'COMPLAINT', 'THEFT', 'VEHICLE_BREAKDOWN'];
const SEVERITY_LIST    = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const RESOLUTION_LIST  = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];

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

const Sel = ({ children, ...props }) => (
  <div className="relative">
    <select {...props}
      className="w-full appearance-none px-3 pr-8 py-2 text-sm border border-gray-200
        rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20
        focus:border-[#0052CC] cursor-pointer transition-all">
      {children}
    </select>
    <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// ── MODALS START HERE ─────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────

// ── Add Incident Modal ────────────────────────────────────────────────
const AddIncidentModal = ({ driverId, onClose }) => {
  const [form, setForm] = useState({
    incident_type:          '',
    incident_date:          '',
    location:               '',
    description:            '',
    severity:               'LOW',
    resolution_status:      'OPEN',
    police_report_number:   '',
    insurance_claim_number: '',
    resolution_notes:       '',
  });
  const [error, setError] = useState('');
  const createIncident = useCreateIncident(driverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.incident_type) return setError('Incident type is required.');
    if (!form.incident_date) return setError('Incident date is required.');
    if (!form.location)      return setError('Location is required.');
    if (!form.description)   return setError('Description is required.');
    if (!form.severity)      return setError('Severity is required.');

    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    createIncident.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to add incident.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Report Incident</h2>
            <p className="text-xs text-gray-400 mt-0.5">Report a new incident for this driver</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>Incident Type</Label>
              <Sel value={form.incident_type} onChange={set('incident_type')}>
                <option value="">Select type</option>
                {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Sel>
            </div>
            <div><Label required>Severity</Label>
              <Sel value={form.severity} onChange={set('severity')}>
                {SEVERITY_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </Sel>
            </div>
            <div><Label required>Incident Date</Label>
              <Input type="datetime-local" value={form.incident_date} onChange={set('incident_date')} />
            </div>
            <div><Label>Resolution Status</Label>
              <Sel value={form.resolution_status} onChange={set('resolution_status')}>
                {RESOLUTION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </Sel>
            </div>
          </div>
          <div><Label required>Location</Label>
            <Input placeholder="e.g. Highway 101, KM 45" value={form.location} onChange={set('location')} />
          </div>
          <div><Label required>Description</Label>
            <textarea rows={2} placeholder="Describe the incident..." value={form.description} onChange={set('description')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Police Report No.</Label>
              <Input placeholder="e.g. PR123456" value={form.police_report_number} onChange={set('police_report_number')} />
            </div>
            <div><Label>Insurance Claim No.</Label>
              <Input placeholder="e.g. IC789012" value={form.insurance_claim_number} onChange={set('insurance_claim_number')} />
            </div>
          </div>
          <div><Label>Resolution Notes</Label>
            <textarea rows={2} placeholder="Any resolution notes..." value={form.resolution_notes} onChange={set('resolution_notes')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit}
            disabled={!form.incident_type || !form.incident_date || !form.location || !form.description || createIncident.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createIncident.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Report Incident</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Incident Modal ───────────────────────────────────────────────
const EditIncidentModal = ({ incident, driverId, onClose }) => {
  const [form, setForm] = useState({
    incident_type:          incident.incident_type          ?? '',
    incident_date:          incident.incident_date
      ? incident.incident_date.slice(0, 16)                 // datetime-local format
      : '',
    location:               incident.location               ?? '',
    description:            incident.description            ?? '',
    severity:               incident.severity               ?? 'LOW',
    resolution_status:      incident.resolution_status      ?? 'OPEN',
    police_report_number:   incident.police_report_number   ?? '',
    insurance_claim_number: incident.insurance_claim_number ?? '',
    resolution_notes:       incident.resolution_notes       ?? '',
  });
  const [error, setError] = useState('');
  const updateIncident = useUpdateIncident(driverId, incident.id);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.incident_type) return setError('Incident type is required.');
    if (!form.incident_date) return setError('Incident date is required.');
    if (!form.location)      return setError('Location is required.');
    if (!form.description)   return setError('Description is required.');

    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    updateIncident.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to update incident.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Edit Incident</h2>
            <p className="text-xs text-gray-400 mt-0.5">Editing: <span className="font-semibold text-gray-600">{incident.incident_type_display ?? incident.incident_type}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>Incident Type</Label>
              <Sel value={form.incident_type} onChange={set('incident_type')}>
                <option value="">Select type</option>
                {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Sel>
            </div>
            <div><Label required>Severity</Label>
              <Sel value={form.severity} onChange={set('severity')}>
                {SEVERITY_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </Sel>
            </div>
            <div><Label required>Incident Date</Label>
              <Input type="datetime-local" value={form.incident_date} onChange={set('incident_date')} />
            </div>
            <div><Label>Resolution Status</Label>
              <Sel value={form.resolution_status} onChange={set('resolution_status')}>
                {RESOLUTION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </Sel>
            </div>
          </div>
          <div><Label required>Location</Label>
            <Input placeholder="e.g. Highway 101, KM 45" value={form.location} onChange={set('location')} />
          </div>
          <div><Label required>Description</Label>
            <textarea rows={2} placeholder="Describe the incident..." value={form.description} onChange={set('description')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Police Report No.</Label>
              <Input placeholder="e.g. PR123456" value={form.police_report_number} onChange={set('police_report_number')} />
            </div>
            <div><Label>Insurance Claim No.</Label>
              <Input placeholder="e.g. IC789012" value={form.insurance_claim_number} onChange={set('insurance_claim_number')} />
            </div>
          </div>
          <div><Label>Resolution Notes</Label>
            <textarea rows={2} placeholder="Any resolution notes..." value={form.resolution_notes} onChange={set('resolution_notes')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit}
            disabled={!form.incident_type || !form.incident_date || !form.location || updateIncident.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {updateIncident.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Pencil size={14} /> Update Incident</>}
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
const DeleteConfirm = ({ incident, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <Trash2 size={20} className="text-red-500" />
      </div>
      <h3 className="text-base font-black text-[#172B4D] mb-1">Delete Incident?</h3>
      <p className="text-sm text-gray-400 mb-5">
        <span className="font-semibold text-gray-600">{incident.incident_type_display ?? incident.incident_type}</span> incident will be permanently deleted.
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

// ── Main Tab Component ────────────────────────────────────────────────
const IncidentsTab = ({ driverId }) => {
  const [addOpen,       setAddOpen]       = useState(false);
  const [editIncident,  setEditIncident]  = useState(null);
  const [deleteIncident,setDeleteIncident]= useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverIncidents(driverId);
  const deleteIncidentMutation = useDeleteIncident(driverId);
  const incidents = data?.results ?? [];

  const handleDelete = () => {
    deleteIncidentMutation.mutate(deleteIncident.id, {
      onSuccess: () => setDeleteIncident(null),
    });
  };

  // Format datetime for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <Loader2 size={20} className="animate-spin text-[#0052CC]" />
      <span className="text-sm">Loading incidents...</span>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
      <AlertCircle size={32} />
      <p className="text-sm font-medium">Failed to load incidents</p>
      <p className="text-xs text-gray-400">{error?.message}</p>
      <button onClick={() => refetch()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg">
        <RefreshCw size={13} /> Try Again
      </button>
    </div>
  );

  return (
    <>
      {/* ── Modals ── */}
      {addOpen        && <AddIncidentModal  driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editIncident   && <EditIncidentModal incident={editIncident} driverId={driverId} onClose={() => setEditIncident(null)} />}
      {deleteIncident && <DeleteConfirm incident={deleteIncident} onConfirm={handleDelete} onCancel={() => setDeleteIncident(null)} isDeleting={deleteIncidentMutation.isPending} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Incidents</h3>
          <p className="text-xs text-gray-400 mt-0.5">{incidents.length} incident{incidents.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
          <Plus size={14} /> Report Incident
        </button>
      </div>

      {/* ── Empty State ── */}
      {incidents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <AlertTriangle size={32} className="mb-2 opacity-30" />
          <p className="text-sm font-semibold">No incidents found</p>
          <p className="text-xs mt-1">Click Report Incident to add one</p>
        </div>
      )}

      {/* ── Table ── */}
      {incidents.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Type','Date','Location','Severity','Resolution','Police Report','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {incidents.map(inc => {
                const sv = SEVERITY_STYLES[inc.severity]           ?? SEVERITY_STYLES.LOW;
                const rs = RESOLUTION_STYLES[inc.resolution_status] ?? RESOLUTION_STYLES.OPEN;
                return (
                  <tr key={inc.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* Type */}
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#172B4D] text-[13px]">
                      {inc.incident_type_display ?? inc.incident_type}
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                      {formatDate(inc.incident_date)}
                    </td>
                    {/* Location */}
                    <td className="px-4 py-3 text-[12px] text-gray-600 max-w-37.5 truncate">
                      {inc.location ?? '—'}
                    </td>
                    {/* Severity */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit ${sv.bg} ${sv.text}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {inc.severity_display ?? inc.severity}
                      </span>
                    </td>
                    {/* Resolution */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit ${rs.bg} ${rs.text}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {inc.resolution_status_display ?? inc.resolution_status}
                      </span>
                    </td>
                    {/* Police Report */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {inc.police_report_number
                        ? <span className="font-mono text-[12px] text-gray-600">{inc.police_report_number}</span>
                        : <span className="text-[12px] text-gray-400">—</span>}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditIncident(inc)}
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => setDeleteIncident(inc)}
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default IncidentsTab;