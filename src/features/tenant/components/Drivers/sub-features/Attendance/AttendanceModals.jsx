import React, { useState } from 'react';
import { Loader2, Plus, Edit } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject, formatError } from '../../common/utils';
import {
  useCreateAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
} from '../../../../queries/drivers/incidentsAndAttendance';
import DriverSelect from '../../common/DriverSelect';
import { ATTENDANCE_STATUS, STATUS_STYLES } from '../../common/constants';
import { User, FileText, Clock, Calendar, CheckSquare } from 'lucide-react';
import StatusBadge from '../../common/StatusBadge';

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
      onError: (err) => setError(formatError(err)),
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
  const [showDelete, setShowDelete] = useState(false);
  const updateAttendance = useUpdateAttendance(driverId, record.id);
  const deleteAttendance = useDeleteAttendance(driverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.date) return setError('Date is required.');
    if (!form.status) return setError('Status is required.');

    updateAttendance.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Edit Attendance"
      description={<span>Editing: <span className="font-semibold text-gray-600">{record.date}</span></span>}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Delete Record
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={!form.date || !form.status || updateAttendance.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
              {updateAttendance.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Edit size={14} /> Update Attendance</>}
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Attendance?"
          description="This attendance record will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteAttendance.mutate(record.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteAttendance.isPending}
        />
      )}
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

export const ViewAttendanceModal = ({ record, driverName, employeeId, onClose }) => {
  const LabelValue = ({ label, value, color }) => (
    <div className="py-2 border-b border-gray-50 last:border-0 flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      <span className={`text-[13px] font-medium text-[#172B4D] ${color || ''}`}>
        {value || '—'}
      </span>
    </div>
  );

  return (
    <ModalWrapper
      title="Attendance Details"
      onClose={onClose}
      footer={
        <div className="flex justify-end w-full">
          <button 
            onClick={onClose} 
            className="px-8 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Header Record Card */}
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#0052CC] shrink-0 border border-blue-100/50">
              <Calendar size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#172B4D] leading-none uppercase tracking-tight">{driverName || record.driver_name || 'System Driver'}</h3>
                <StatusBadge 
                  label={record.status_display ?? record.status} 
                  styles={STATUS_STYLES[record.status]} 
                />
              </div>
              <div className="text-gray-400 text-[10px] font-mono font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                 <User size={12} /> Employee ID: {employeeId || record.employee_id || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Details Content - Direct on White */}
        <div className="px-1">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <LabelValue label="Date" value={record.date} />
            <LabelValue label="Check In" value={record.check_in || '—'} />
            <LabelValue label="Check Out" value={record.check_out || '—'} />
            <LabelValue label="Total Hours" value={record.total_hours != null ? `${record.total_hours} hrs` : '—'} />
            <LabelValue 
              label="Record Created At" 
              value={record.created_at ? new Date(record.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '') : '—'} 
            />
          </div>

          {/* Notes Section */}
          <div className="mt-4 pt-4 border-t border-gray-50 uppercase">
             <span className="text-[10px] font-bold text-gray-400 tracking-widest ">Notes & Remarks</span>
             <div className="mt-2 bg-gray-50/50 rounded-lg p-3 border border-gray-100/50">
                <p className="text-[12px] text-gray-600 leading-relaxed italic">
                  {record.notes || 'No additional notes provided for this record.'}
                </p>
             </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
