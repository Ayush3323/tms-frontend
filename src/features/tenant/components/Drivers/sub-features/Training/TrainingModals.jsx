import React, { useState } from 'react';
import { Loader2, Plus, Pencil } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject } from '../../common/utils';
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
      onError: (err) => setError(err.message || 'Failed to add training record.'),
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
      onError: (err) => setError(err.message || 'Failed to update training record.'),
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
              {updateTraining.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Pencil size={14} /> Update Record</>}
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
