import React, { useState } from 'react';
import {
  Loader2, AlertCircle, Plus,
  Pencil, Trash2, CalendarCheck, RefreshCw,
  X, ChevronDown,
} from 'lucide-react';
import {
  useDriverAttendance,
  useCreateAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
} from '../../../queries/drivers/incidentsAndAttendance';

// ── Style Maps ────────────────────────────────────────────────────────

const STATUS_STYLES = {
  PRESENT:  { text: 'text-green-700',  bg: 'bg-green-50 border border-green-200' },
  ABSENT:   { text: 'text-red-700',    bg: 'bg-red-50 border border-red-200' },
  HALF_DAY: { text: 'text-yellow-700', bg: 'bg-yellow-50 border border-yellow-200' },
  LEAVE:    { text: 'text-blue-700',   bg: 'bg-blue-50 border border-blue-200' },
  LATE:     { text: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200' },
};

const ATTENDANCE_STATUS = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'LATE'];

// ── Helpers ───────────────────────────────────────────────────────────

const formatTime = (isoStr) => {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

// Convert ISO datetime to datetime-local input format
const toLocalInput = (isoStr) => {
  if (!isoStr) return '';
  return isoStr.slice(0, 16);
};

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

// ── Add Attendance Modal ──────────────────────────────────────────────
const AddAttendanceModal = ({ driverId, onClose }) => {
  const [form, setForm] = useState({
    date:           '',
    status:         'PRESENT',
    check_in_time:  '',
    check_out_time: '',
    hours_worked:   '',
    overtime_hours: '',
    notes:          '',
  });
  const [error, setError] = useState('');
  const createAttendance = useCreateAttendance(driverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.date)   return setError('Date is required.');
    if (!form.status) return setError('Status is required.');

    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    createAttendance.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to add attendance.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Add Attendance</h2>
            <p className="text-xs text-gray-400 mt-0.5">Record attendance for this driver</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>Date</Label><Input type="date" value={form.date} onChange={set('date')} /></div>
            <div><Label required>Status</Label>
              <Sel value={form.status} onChange={set('status')}>
                {ATTENDANCE_STATUS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </Sel>
            </div>
            <div><Label>Check In Time</Label><Input type="datetime-local" value={form.check_in_time} onChange={set('check_in_time')} /></div>
            <div><Label>Check Out Time</Label><Input type="datetime-local" value={form.check_out_time} onChange={set('check_out_time')} /></div>
            <div><Label>Hours Worked</Label><Input type="number" placeholder="e.g. 9.0" min="0" step="0.5" value={form.hours_worked} onChange={set('hours_worked')} /></div>
            <div><Label>Overtime Hours</Label><Input type="number" placeholder="e.g. 1.5" min="0" step="0.5" value={form.overtime_hours} onChange={set('overtime_hours')} /></div>
          </div>
          <div><Label>Notes</Label>
            <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.date || !form.status || createAttendance.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createAttendance.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Attendance</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Attendance Modal ─────────────────────────────────────────────
const EditAttendanceModal = ({ record, driverId, onClose }) => {
  const [form, setForm] = useState({
    date:           record.date           ?? '',
    status:         record.status         ?? 'PRESENT',
    check_in_time:  toLocalInput(record.check_in_time),
    check_out_time: toLocalInput(record.check_out_time),
    hours_worked:   record.hours_worked   ?? '',
    overtime_hours: record.overtime_hours ?? '',
    notes:          record.notes          ?? '',
  });
  const [error, setError] = useState('');
  const updateAttendance = useUpdateAttendance(driverId, record.id);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.date)   return setError('Date is required.');
    if (!form.status) return setError('Status is required.');

    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    updateAttendance.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to update attendance.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Edit Attendance</h2>
            <p className="text-xs text-gray-400 mt-0.5">Editing: <span className="font-semibold text-gray-600">{record.date}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>Date</Label><Input type="date" value={form.date} onChange={set('date')} /></div>
            <div><Label required>Status</Label>
              <Sel value={form.status} onChange={set('status')}>
                {ATTENDANCE_STATUS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </Sel>
            </div>
            <div><Label>Check In Time</Label><Input type="datetime-local" value={form.check_in_time} onChange={set('check_in_time')} /></div>
            <div><Label>Check Out Time</Label><Input type="datetime-local" value={form.check_out_time} onChange={set('check_out_time')} /></div>
            <div><Label>Hours Worked</Label><Input type="number" placeholder="e.g. 9.0" min="0" step="0.5" value={form.hours_worked} onChange={set('hours_worked')} /></div>
            <div><Label>Overtime Hours</Label><Input type="number" placeholder="e.g. 1.5" min="0" step="0.5" value={form.overtime_hours} onChange={set('overtime_hours')} /></div>
          </div>
          <div><Label>Notes</Label>
            <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.date || !form.status || updateAttendance.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {updateAttendance.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Pencil size={14} /> Update Attendance</>}
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
const DeleteConfirm = ({ record, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <Trash2 size={20} className="text-red-500" />
      </div>
      <h3 className="text-base font-black text-[#172B4D] mb-1">Delete Attendance?</h3>
      <p className="text-sm text-gray-400 mb-5">
        Record for <span className="font-semibold text-gray-600">{record.date}</span> will be permanently deleted.
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
const AttendanceTab = ({ driverId }) => {
  const [addOpen,      setAddOpen]      = useState(false);
  const [editRecord,   setEditRecord]   = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverAttendance(driverId);
  const deleteAttendanceMutation = useDeleteAttendance(driverId);
  const records = data?.results ?? [];

  const handleDelete = () => {
    deleteAttendanceMutation.mutate(deleteRecord.id, {
      onSuccess: () => setDeleteRecord(null),
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <Loader2 size={20} className="animate-spin text-[#0052CC]" />
      <span className="text-sm">Loading attendance...</span>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
      <AlertCircle size={32} />
      <p className="text-sm font-medium">Failed to load attendance</p>
      <p className="text-xs text-gray-400">{error?.message}</p>
      <button onClick={() => refetch()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg">
        <RefreshCw size={13} /> Try Again
      </button>
    </div>
  );

  return (
    <>
      {/* ── Modals ── */}
      {addOpen      && <AddAttendanceModal  driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editRecord   && <EditAttendanceModal record={editRecord} driverId={driverId} onClose={() => setEditRecord(null)} />}
      {deleteRecord && <DeleteConfirm record={deleteRecord} onConfirm={handleDelete} onCancel={() => setDeleteRecord(null)} isDeleting={deleteAttendanceMutation.isPending} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Attendance</h3>
          <p className="text-xs text-gray-400 mt-0.5">{records.length} record{records.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
          <Plus size={14} /> Add Attendance
        </button>
      </div>

      {/* ── Empty State ── */}
      {records.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <CalendarCheck size={32} className="mb-2 opacity-30" />
          <p className="text-sm font-semibold">No attendance records found</p>
          <p className="text-xs mt-1">Click Add Attendance to add one</p>
        </div>
      )}

      {/* ── Table ── */}
      {records.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Date','Status','Check In','Check Out','Hours','Overtime','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map(rec => {
                const st = STATUS_STYLES[rec.status] ?? STATUS_STYLES.PRESENT;
                return (
                  <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#172B4D] text-[13px]">
                      {rec.date ?? '—'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit ${st.bg} ${st.text}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {rec.status_display ?? rec.status}
                      </span>
                    </td>

                    {/* Check In */}
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600 font-mono">
                      {formatTime(rec.check_in_time)}
                    </td>

                    {/* Check Out */}
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600 font-mono">
                      {formatTime(rec.check_out_time)}
                    </td>

                    {/* Hours Worked */}
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                      {rec.hours_worked != null ? `${rec.hours_worked} hrs` : '—'}
                    </td>

                    {/* Overtime */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {rec.overtime_hours > 0
                        ? <span className="text-[12px] font-semibold text-orange-600">{rec.overtime_hours} hrs</span>
                        : <span className="text-[12px] text-gray-400">—</span>
                      }
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditRecord(rec)}
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => setDeleteRecord(rec)}
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

export default AttendanceTab;