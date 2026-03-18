import React, { useState } from 'react';
import { Loader2, Plus, Pencil } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject } from '../../common/utils';
import {
  useCreateAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
} from '../../../../queries/drivers/incidentsAndAttendance';
import DriverSelect from '../../common/DriverSelect';
import { ATTENDANCE_STATUS } from '../../common/constants';

export const AddAttendanceModal = ({ driverId, onClose }) => {
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const [form, setForm] = useState({
    date: '',
    status: 'PRESENT',
    check_in: '',
    check_out: '',
    total_hours: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const createAttendance = useCreateAttendance(targetDriverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!targetDriverId) return setError('Please select a driver.');
    if (!form.date) return setError('Date is required.');
    if (!form.status) return setError('Status is required.');

    createAttendance.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to add attendance.'),
    });
  };

  return (
    <ModalWrapper
      title="Add Attendance"
      description="Record attendance"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.date || !form.status || createAttendance.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createAttendance.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Attendance</>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        
        {!driverId && (
          <div>
            <Label required>Driver</Label>
            <DriverSelect value={targetDriverId} onChange={setTargetDriverId} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div><Label required>Date</Label><Input type="date" value={form.date} onChange={set('date')} /></div>
          <div><Label required>Status</Label>
            <Select value={form.status} onChange={set('status')}>
              {ATTENDANCE_STATUS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </Select>
          </div>
          <div><Label>Check In</Label><Input type="time" value={form.check_in} onChange={set('check_in')} /></div>
          <div><Label>Check Out</Label><Input type="time" value={form.check_out} onChange={set('check_out')} /></div>
          <div><Label>Total Hours</Label><Input type="number" placeholder="e.g. 9.0" min="0" step="0.5" value={form.total_hours} onChange={set('total_hours')} /></div>
        </div>
        <div><Label>Notes</Label>
          <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const EditAttendanceModal = ({ record, driverId, onClose }) => {
  const [form, setForm] = useState({
    date: record.date ?? '',
    status: record.status ?? 'PRESENT',
    check_in: record.check_in ?? '',
    check_out: record.check_out ?? '',
    total_hours: record.total_hours ?? '',
    notes: record.notes ?? '',
  });
  const [error, setError] = useState('');
  const updateAttendance = useUpdateAttendance(driverId, record.id);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.date) return setError('Date is required.');
    if (!form.status) return setError('Status is required.');

    updateAttendance.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to update attendance.'),
    });
  };

  return (
    <ModalWrapper
      title="Edit Attendance"
      description={<span>Editing: <span className="font-semibold text-gray-600">{record.date}</span></span>}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.date || !form.status || updateAttendance.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {updateAttendance.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Pencil size={14} /> Update Attendance</>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div><Label required>Date</Label><Input type="date" value={form.date} onChange={set('date')} /></div>
          <div><Label required>Status</Label>
            <Select value={form.status} onChange={set('status')}>
              {ATTENDANCE_STATUS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </Select>
          </div>
          <div><Label>Check In</Label><Input type="time" value={form.check_in} onChange={set('check_in')} /></div>
          <div><Label>Check Out</Label><Input type="time" value={form.check_out} onChange={set('check_out')} /></div>
          <div><Label>Total Hours</Label><Input type="number" placeholder="e.g. 9.0" min="0" step="0.5" value={form.total_hours} onChange={set('total_hours')} /></div>
        </div>
        <div><Label>Notes</Label>
          <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const DeleteAttendanceDialog = ({ record, driverId, onClose }) => {
  const deleteMutation = useDeleteAttendance(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(record.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Attendance?"
      description={<p>Record for <span className="font-semibold text-gray-600">{record.date}</span> will be permanently deleted.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};
