import React, { useState } from 'react';
import {
  Loader2, AlertCircle, Plus,
  Pencil, Trash2, Truck, RefreshCw,
  X, ChevronDown,
} from 'lucide-react';
import {
  useDriverVehicleAssignments,
  useCreateVehicleAssignment,
  useUpdateVehicleAssignment,
  useDeleteVehicleAssignment,
  useVehiclesList,
} from '../../../queries/drivers/vehicleAssignmentQuery';

// ── Style Maps ────────────────────────────────────────────────────────

const ASSIGNMENT_TYPE_STYLES = {
  PERMANENT:  { text: 'text-blue-700',   bg: 'bg-blue-50 border border-blue-200' },
  TEMPORARY:  { text: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200' },
};

const ASSIGNMENT_TYPES = ['PERMANENT', 'TEMPORARY'];

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

// ── Vehicle Dropdown — fetch vehicles list ────────────────────────────
const VehicleSelect = ({ value, onChange }) => {
  const { data, isLoading } = useVehiclesList({ status: 'ACTIVE' });
  const vehicles = data?.results ?? [];

  return (
    <Sel value={value} onChange={onChange} disabled={isLoading}>
      <option value="">{isLoading ? 'Loading vehicles...' : 'Select vehicle'}</option>
      {vehicles.map(v => (
        <option key={v.id} value={v.id}>
          {v.registration_number} {v.vehicle_type ? `— ${v.vehicle_type}` : ''}
        </option>
      ))}
    </Sel>
  );
};

// ─────────────────────────────────────────────────────────────────────
// ── MODALS START HERE ─────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────

// ── Add Vehicle Assignment Modal ──────────────────────────────────────
const AddVehicleModal = ({ driverId, onClose }) => {
  const [form, setForm] = useState({
    vehicle:         '',
    assigned_date:   '',
    assignment_type: 'PERMANENT',
    notes:           '',
  });
  const [error, setError] = useState('');
  const createAssignment = useCreateVehicleAssignment(driverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.vehicle)       return setError('Vehicle is required.');
    if (!form.assigned_date) return setError('Assigned date is required.');

    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    createAssignment.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to assign vehicle.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Assign Vehicle</h2>
            <p className="text-xs text-gray-400 mt-0.5">Assign a vehicle to this driver</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
          <div>
            <Label required>Vehicle</Label>
            <VehicleSelect value={form.vehicle} onChange={set('vehicle')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>Assigned Date</Label><Input type="date" value={form.assigned_date} onChange={set('assigned_date')} /></div>
            <div><Label>Assignment Type</Label>
              <Sel value={form.assignment_type} onChange={set('assignment_type')}>
                {ASSIGNMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </Sel>
            </div>
          </div>
          <div><Label>Notes</Label>
            <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.vehicle || !form.assigned_date || createAssignment.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createAssignment.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Assign Vehicle</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Vehicle Assignment Modal ─────────────────────────────────────
const EditVehicleModal = ({ assignment, driverId, onClose }) => {
  const [form, setForm] = useState({
    vehicle:          assignment.vehicle          ?? '',
    assigned_date:    assignment.assigned_date    ?? '',
    unassigned_date:  assignment.unassigned_date  ?? '',
    assignment_type:  assignment.assignment_type  ?? 'PERMANENT',
    is_active:        assignment.is_active        ?? true,
    notes:            assignment.notes            ?? '',
  });
  const [error, setError] = useState('');
  const updateAssignment = useUpdateVehicleAssignment(driverId, assignment.id);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.vehicle)      return setError('Vehicle is required.');
    if (!form.assigned_date) return setError('Assigned date is required.');

    const clean = Object.fromEntries(
      Object.entries(form).map(([k, v]) => {
        if (k === 'is_active') return [k, v];
        return [k, v === '' ? null : v];
      })
    );
    updateAssignment.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to update assignment.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Edit Assignment</h2>
            <p className="text-xs text-gray-400 mt-0.5">Editing: <span className="font-semibold text-gray-600">{assignment.vehicle_registration ?? 'Vehicle'}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
          <div>
            <Label required>Vehicle</Label>
            <VehicleSelect value={form.vehicle} onChange={set('vehicle')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>Assigned Date</Label><Input type="date" value={form.assigned_date} onChange={set('assigned_date')} /></div>
            <div><Label>Unassigned Date</Label><Input type="date" value={form.unassigned_date} onChange={set('unassigned_date')} /></div>
            <div><Label>Assignment Type</Label>
              <Sel value={form.assignment_type} onChange={set('assignment_type')}>
                {ASSIGNMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </Sel>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" id="is_active" checked={form.is_active}
                onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-[#0052CC] cursor-pointer" />
              <label htmlFor="is_active" className="text-sm font-semibold text-gray-600 cursor-pointer">Active</label>
            </div>
          </div>
          <div><Label>Notes</Label>
            <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.vehicle || !form.assigned_date || updateAssignment.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {updateAssignment.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Pencil size={14} /> Update Assignment</>}
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
const DeleteConfirm = ({ assignment, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <Trash2 size={20} className="text-red-500" />
      </div>
      <h3 className="text-base font-black text-[#172B4D] mb-1">Delete Assignment?</h3>
      <p className="text-sm text-gray-400 mb-5">
        Vehicle <span className="font-semibold text-gray-600">{assignment.vehicle_registration ?? 'assignment'}</span> will be permanently removed.
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
const VehicleTab = ({ driverId }) => {
  const [addOpen,        setAddOpen]        = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);
  const [deleteAssignment, setDeleteAssignment] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverVehicleAssignments(driverId);
  const deleteAssignmentMutation = useDeleteVehicleAssignment(driverId);
  const assignments = data?.results ?? [];

  const handleDelete = () => {
    deleteAssignmentMutation.mutate(deleteAssignment.id, {
      onSuccess: () => setDeleteAssignment(null),
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <Loader2 size={20} className="animate-spin text-[#0052CC]" />
      <span className="text-sm">Loading vehicle assignments...</span>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
      <AlertCircle size={32} />
      <p className="text-sm font-medium">Failed to load vehicle assignments</p>
      <p className="text-xs text-gray-400">{error?.message}</p>
      <button onClick={() => refetch()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg">
        <RefreshCw size={13} /> Try Again
      </button>
    </div>
  );

  return (
    <>
      {/* ── Modals ── */}
      {addOpen          && <AddVehicleModal  driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editAssignment   && <EditVehicleModal assignment={editAssignment} driverId={driverId} onClose={() => setEditAssignment(null)} />}
      {deleteAssignment && <DeleteConfirm assignment={deleteAssignment} onConfirm={handleDelete} onCancel={() => setDeleteAssignment(null)} isDeleting={deleteAssignmentMutation.isPending} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Vehicle Assignments</h3>
          <p className="text-xs text-gray-400 mt-0.5">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
          <Plus size={14} /> Assign Vehicle
        </button>
      </div>

      {/* ── Empty State ── */}
      {assignments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Truck size={32} className="mb-2 opacity-30" />
          <p className="text-sm font-semibold">No vehicle assignments found</p>
          <p className="text-xs mt-1">Click Assign Vehicle to add one</p>
        </div>
      )}

      {/* ── Table ── */}
      {assignments.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Vehicle','Assignment Type','Assigned Date','Unassigned Date','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {assignments.map(a => {
                const at = ASSIGNMENT_TYPE_STYLES[a.assignment_type] ?? ASSIGNMENT_TYPE_STYLES.PERMANENT;
                return (
                  <tr key={a.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* Vehicle */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-[12px] text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {a.vehicle_registration ?? '—'}
                      </span>
                    </td>

                    {/* Assignment Type */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit ${at.bg} ${at.text}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {a.assignment_type_display ?? a.assignment_type}
                      </span>
                    </td>

                    {/* Assigned Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                      {a.assigned_date ?? '—'}
                    </td>

                    {/* Unassigned Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                      {a.unassigned_date ?? '—'}
                    </td>

                    {/* Active Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.is_active
                        ? <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit bg-green-50 border border-green-200 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                          </span>
                        : <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit bg-gray-50 border border-gray-200 text-gray-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Inactive
                          </span>
                      }
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditAssignment(a)}
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => setDeleteAssignment(a)}
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

export default VehicleTab;