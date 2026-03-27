import React, { useState } from 'react';
import { Loader2, Plus, Edit, User, Clock, GraduationCap, ExternalLink, ShieldCheck, MapPin, Briefcase, FileText, AlertCircle } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject, formatError } from '../../common/utils';
import {
  useCreateTrainingRecord,
  useUpdateTrainingRecord,
  useDeleteTrainingRecord,
} from '../../../../queries/drivers/trainingAndMedicalQuery';
import DriverSelect from '../../common/DriverSelect';
import { TRAINING_TYPES, VERIFICATION_STATUS } from '../../common/constants';

// Shared Form Fields for Training
const TrainingFormFields = ({ form, setForm, error }) => {
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  return (
    <div className="space-y-4">
      {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div><Label required>Training Type</Label>
          <Select value={form.training_type} onChange={set('training_type')}>
            <option value="">Select type</option>
            {TRAINING_TYPES.map(t => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
          </Select>
        </div>
        <div><Label required>Status</Label>
          <Select value={form.status} onChange={set('status')}>
            {VERIFICATION_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div><Label required>Training Date</Label><Input type="date" value={form.training_date} onChange={set('training_date')} /></div>
        <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={set('expiry_date')} /></div>
        <div><Label>Certificate Number</Label><Input placeholder="e.g. CERT123456" value={form.certificate_number} onChange={set('certificate_number')} /></div>
        <div><Label>Trainer Name</Label><Input placeholder="e.g. John Trainer" value={form.trainer_name} onChange={set('trainer_name')} /></div>
      </div>
      <div><Label>Certificate URL</Label><Input placeholder="https://example.com/certs/cert.pdf" value={form.certificate_url} onChange={set('certificate_url')} /></div>
      <div><Label>Notes</Label>
        <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
      </div>
    </div>
  );
};

export const AddTrainingModal = ({ driverId, onClose }) => {
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const [form, setForm] = useState({
    training_type: '',
    training_date: '',
    expiry_date: '',
    certificate_number: '',
    trainer_name: '',
    status: 'PENDING',
    certificate_url: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const createTraining = useCreateTrainingRecord(targetDriverId);

  const validate = () => {
    if (!targetDriverId) return 'Please select a driver.';
    if (!form.training_type) return 'Training type is required.';
    if (!form.training_date) return 'Training date is required.';
    if (!form.status) return 'Status is required.';
    if (form.expiry_date && form.training_date > form.expiry_date) {
      return 'Expiry date cannot be before training date.';
    }
    return null;
  };

  const handleSubmit = () => {
    setError('');
    const validationError = validate();
    if (validationError) return setError(validationError);

    createTraining.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Add Training Record"
      description="Add a new training record"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.training_type || !form.training_date || createTraining.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createTraining.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Record</>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {!driverId && (
          <div>
            <Label required>Driver</Label>
            <DriverSelect value={targetDriverId} onChange={setTargetDriverId} />
          </div>
        )}
        <TrainingFormFields form={form} setForm={setForm} error={error} />
      </div>
    </ModalWrapper>
  );
};

export const EditTrainingModal = ({ record, driverId, onClose }) => {
  const [form, setForm] = useState({
    training_type: record.training_type ?? '',
    training_date: record.training_date ?? '',
    expiry_date: record.expiry_date ?? '',
    certificate_number: record.certificate_number ?? '',
    trainer_name: record.trainer_name ?? '',
    status: record.status ?? 'PENDING',
    certificate_url: record.certificate_url ?? '',
    notes: record.notes ?? '',
  });
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const updateTraining = useUpdateTrainingRecord(driverId, record.id);
  const deleteTraining = useDeleteTrainingRecord(driverId);

  const validate = () => {
    if (!form.training_type) return 'Training type is required.';
    if (!form.training_date) return 'Training date is required.';
    if (!form.status) return 'Status is required.';
    if (form.expiry_date && form.training_date > form.expiry_date) {
      return 'Expiry date cannot be before training date.';
    }
    return null;
  };

  const handleSubmit = () => {
    setError('');
    const validationError = validate();
    if (validationError) return setError(validationError);

    updateTraining.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Edit Training Record"
      description={<span>Editing: <span className="font-semibold text-gray-600">{record.training_type_display ?? record.training_type}</span></span>}
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
            <button onClick={handleSubmit} disabled={!form.training_type || !form.training_date || updateTraining.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
              {updateTraining.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Edit size={14} /> Update Record</>}
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Training Record?"
          description="This training record will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteTraining.mutate(record.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteTraining.isPending}
        />
      )}
      <TrainingFormFields form={form} setForm={setForm} error={error} />
    </ModalWrapper>
  );
};

export const DeleteTrainingDialog = ({ record, driverId, onClose }) => {
  const deleteMutation = useDeleteTrainingRecord(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(record.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Training Record?"
      description={<p><span className="font-semibold text-gray-600">{record.training_type_display || record.training_type}</span> will be permanently deleted.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};

export const ViewTrainingModal = ({ record, driverName, employeeId, onClose }) => {
  const LabelValue = ({ label, value, isLink, color }) => (
    <div className="py-2 border-b border-gray-50 last:border-0 flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      {isLink && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-[#0052CC] hover:underline flex items-center gap-1.5 bg-blue-50/50 px-2 py-1 rounded-md border border-blue-100 w-fit">
          <ExternalLink size={12} /> View Certificate
        </a>
      ) : (
        <span className={`text-[13px] font-medium text-[#172B4D] ${color || ''}`}>
          {value || '—'}
        </span>
      )}
    </div>
  );

  const daysToExpiry = record.expiry_date ? Math.ceil((new Date(record.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysToExpiry !== null && daysToExpiry <= 30 && daysToExpiry > 0;
  const isExpired = daysToExpiry !== null && daysToExpiry <= 0;

  return (
    <ModalWrapper
      title="Training Information"
      onClose={onClose}
      footer={
        <div className="flex justify-end w-full">
          <button 
            onClick={onClose} 
            className="px-8 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Identity Section - Header Card */}
        <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100 mb-2">
          <div className="w-12 h-12 rounded-xl bg-[#0052CC]/10 flex items-center justify-center text-[#0052CC] shadow-sm">
            <GraduationCap size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-[#172B4D] leading-none uppercase tracking-tight">{driverName || record.driver_name || 'System Driver'}</h3>
              <div className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase flex items-center gap-1
                ${record.status === 'PASSED' || record.status === 'VERIFIED' ? 'bg-green-50 text-green-600 border-green-100' : 
                  record.status === 'FAILED' || record.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' : 
                  'bg-amber-50 text-amber-600 border-amber-100'}`}>
                {record.status_display || record.status}
              </div>
            </div>
            <div className="text-gray-400 text-[10px] font-mono font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
               <User size={12} /> Employee ID: {employeeId || record.employee_id || '—'}
            </div>
          </div>
        </div>

        {/* Core Info Grid */}
        <div className="grid grid-cols-2 gap-x-8 px-2 border-b border-gray-50 mb-2">
           <LabelValue label="Training Type" value={record.training_type_display || record.training_type?.replaceAll('_', ' ')} />
           <LabelValue label="Training Date" value={record.training_date} />
           <LabelValue label="Certificate No." value={record.certificate_number} color="font-mono" />
           <div className="flex items-center gap-3">
             <LabelValue label="Expiry Date" value={record.expiry_date} />
             {isExpiringSoon && (
               <div className="flex items-center gap-1 mt-4 px-2 py-1 bg-amber-50 text-amber-600 rounded-md border border-amber-100 animate-pulse">
                 <AlertCircle size={12} />
                 <span className="text-[10px] font-bold uppercase whitespace-nowrap">Expiring in {daysToExpiry} days</span>
               </div>
             )}
             {isExpired && (
               <div className="flex items-center gap-1 mt-4 px-2 py-1 bg-red-50 text-red-600 rounded-md border border-red-100 animate-pulse">
                 <AlertCircle size={12} />
                 <span className="text-[10px] font-bold uppercase whitespace-nowrap">Expired {Math.abs(daysToExpiry)} days ago</span>
               </div>
             )}
           </div>
        </div>

        {/* Training Details */}
        <div className="grid grid-cols-2 gap-x-8 px-2 pt-2">
           <LabelValue label="Trainer Name" value={record.trainer_name} />
           <LabelValue label="Certificate File" value={record.certificate_url} isLink />
           <LabelValue 
             label="Record Created At" 
             value={record.created_at ? new Date(record.created_at).toLocaleString('en-GB', { 
               day: '2-digit', month: 'short', year: 'numeric', 
               hour: '2-digit', minute: '2-digit', hour12: true 
             }) : '—'} 
           />
        </div>

        {/* Notes Section */}
        <div className="px-2 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Notes & Remarks</span>
          <div className="p-3 bg-gray-50 rounded-lg text-[13px] text-gray-600 border border-gray-100 italic leading-relaxed">
             {record.notes || 'No additional notes provided.'}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
