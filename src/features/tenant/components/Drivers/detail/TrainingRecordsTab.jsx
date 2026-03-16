import React, { useState } from 'react';
import {
  Loader2, AlertCircle, Plus,
  Pencil, Trash2, GraduationCap, RefreshCw,
  X, ChevronDown,
} from 'lucide-react';
import {
  useDriverTrainingRecords,
  useCreateTrainingRecord,
  useUpdateTrainingRecord,
  useDeleteTrainingRecord,
} from '../../../queries/drivers/trainingAndMedicalQuery';

// ── Style Maps ────────────────────────────────────────────────────────

const STATUS_STYLES = {
  COMPLETED: { text: 'text-green-700', bg: 'bg-green-50 border border-green-200' },
  IN_PROGRESS: { text: 'text-blue-700', bg: 'bg-blue-50 border border-blue-200' },
  REJECTED: { text: 'text-red-700', bg: 'bg-red-50 border border-red-200' },
};

const TRAINING_TYPES = ['SAFETY', 'DEFENSIVE_DRIVING', 'FIRST_AID', 'HAZARDOUS_MATERIALS', 'CUSTOMER_SERVICE'];
const TRAINING_STATUS = ['COMPLETED', 'IN_PROGRESS', 'REJECTED'];

// ── Helpers ───────────────────────────────────────────────────────────

const getExpiryColor = (dateStr) => {
  if (!dateStr) return 'text-gray-400';
  const diffDays = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'text-red-600 font-semibold';
  if (diffDays < 90) return 'text-orange-500 font-semibold';
  return 'text-green-600 font-semibold';
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

// ── Add Training Modal ────────────────────────────────────────────────
const AddTrainingModal = ({ driverId, onClose }) => {
  const [form, setForm] = useState({
    training_type: '',
    training_date: '',
    expiry_date: '',
    certificate_number: '',
    trainer_name: '',
    status: 'COMPLETED',
    certificate_url: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const createRecord = useCreateTrainingRecord(driverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.training_type) return setError('Training type is required.');
    if (!form.training_date) return setError('Training date is required.');
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    createRecord.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to add training record.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Add Training Record</h2>
            <p className="text-xs text-gray-400 mt-0.5">Add a new training record for this driver</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>Training Type</Label>
              <Sel value={form.training_type} onChange={set('training_type')}>
                <option value="">Select type</option>
                {TRAINING_TYPES.map(t => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
              </Sel>
            </div>
            <div><Label>Status</Label>
              <Sel value={form.status} onChange={set('status')}>
                {TRAINING_STATUS.map(s => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
              </Sel>
            </div>
            <div><Label required>Training Date</Label><Input type="date" value={form.training_date} onChange={set('training_date')} /></div>
            <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={set('expiry_date')} /></div>
            <div><Label>Certificate Number</Label><Input placeholder="e.g. CERT123456" value={form.certificate_number} onChange={set('certificate_number')} /></div>
            <div><Label>Trainer Name</Label><Input placeholder="e.g. John Trainer" value={form.trainer_name} onChange={set('trainer_name')} /></div>
          </div>
          <div><Label>Certificate URL</Label><Input placeholder="https://example.com/certs/cert.pdf" value={form.certificate_url} onChange={set('certificate_url')} /></div>
          <div><Label>Notes</Label>
            <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.training_type || !form.training_date || createRecord.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createRecord.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Record</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Training Modal ───────────────────────────────────────────────
const EditTrainingModal = ({ record, driverId, onClose }) => {
  const [form, setForm] = useState({
    training_type: record.training_type ?? '',
    training_date: record.training_date ?? '',
    expiry_date: record.expiry_date ?? '',
    certificate_number: record.certificate_number ?? '',
    trainer_name: record.trainer_name ?? '',
    status: record.status ?? 'COMPLETED',
    certificate_url: record.certificate_url ?? '',
    notes: record.notes ?? '',
  });
  const [error, setError] = useState('');
  const updateRecord = useUpdateTrainingRecord(driverId, record.id);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.training_type) return setError('Training type is required.');
    if (!form.training_date) return setError('Training date is required.');
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    updateRecord.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to update training record.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Edit Training Record</h2>
            <p className="text-xs text-gray-400 mt-0.5">Editing: <span className="font-semibold text-gray-600">{record.training_type_display ?? record.training_type}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>Training Type</Label>
              <Sel value={form.training_type} onChange={set('training_type')}>
                <option value="">Select type</option>
                {TRAINING_TYPES.map(t => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
              </Sel>
            </div>
            <div><Label>Status</Label>
              <Sel value={form.status} onChange={set('status')}>
                {TRAINING_STATUS.map(s => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
              </Sel>
            </div>
            <div><Label required>Training Date</Label><Input type="date" value={form.training_date} onChange={set('training_date')} /></div>
            <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={set('expiry_date')} /></div>
            <div><Label>Certificate Number</Label><Input placeholder="e.g. CERT123456" value={form.certificate_number} onChange={set('certificate_number')} /></div>
            <div><Label>Trainer Name</Label><Input placeholder="e.g. John Trainer" value={form.trainer_name} onChange={set('trainer_name')} /></div>
          </div>
          <div><Label>Certificate URL</Label><Input placeholder="https://example.com/certs/cert.pdf" value={form.certificate_url} onChange={set('certificate_url')} /></div>
          <div><Label>Notes</Label>
            <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.training_type || !form.training_date || updateRecord.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {updateRecord.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Pencil size={14} /> Update Record</>}
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
      <h3 className="text-base font-black text-[#172B4D] mb-1">Delete Training Record?</h3>
      <p className="text-sm text-gray-400 mb-5">
        <span className="font-semibold text-gray-600">{record.training_type_display ?? record.training_type}</span> will be permanently deleted.
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
const TrainingTab = ({ driverId }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverTrainingRecords(driverId);
  const deleteRecordMutation = useDeleteTrainingRecord(driverId);
  const records = data?.results ?? [];

  const handleDelete = () => {
    deleteRecordMutation.mutate(deleteRecord.id, {
      onSuccess: () => setDeleteRecord(null),
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <Loader2 size={20} className="animate-spin text-[#0052CC]" />
      <span className="text-sm">Loading training records...</span>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
      <AlertCircle size={32} />
      <p className="text-sm font-medium">Failed to load training records</p>
      <p className="text-xs text-gray-400">{error?.message}</p>
      <button onClick={() => refetch()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg">
        <RefreshCw size={13} /> Try Again
      </button>
    </div>
  );

  return (
    <>
      {/* ── Modals ── */}
      {addOpen && <AddTrainingModal driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editRecord && <EditTrainingModal record={editRecord} driverId={driverId} onClose={() => setEditRecord(null)} />}
      {deleteRecord && <DeleteConfirm record={deleteRecord} onConfirm={handleDelete} onCancel={() => setDeleteRecord(null)} isDeleting={deleteRecordMutation.isPending} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Training Records</h3>
          <p className="text-xs text-gray-400 mt-0.5">{records.length} record{records.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
          <Plus size={14} /> Add Record
        </button>
      </div>

      {/* ── Empty State ── */}
      {records.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <GraduationCap size={32} className="mb-2 opacity-30" />
          <p className="text-sm font-semibold">No training records found</p>
          <p className="text-xs mt-1">Click Add Record to add one</p>
        </div>
      )}

      {/* ── Table ── */}
      {records.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Training Type', 'Training Date', 'Expiry Date', 'Certificate No.', 'Trainer', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map(rec => {
                const st = STATUS_STYLES[rec.status] ?? STATUS_STYLES.COMPLETED;
                return (
                  <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#172B4D] text-[13px]">{rec.training_type_display ?? rec.training_type}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">{rec.training_date ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-[12px] font-mono ${getExpiryColor(rec.expiry_date)}`}>{rec.expiry_date ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {rec.certificate_number
                        ? <span className="font-mono text-[12px] text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{rec.certificate_number}</span>
                        : <span className="text-[12px] text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">{rec.trainer_name ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit ${st.bg} ${st.text}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {rec.status_display ?? rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditRecord(rec)} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => setDeleteRecord(rec)} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
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

export default TrainingTab;