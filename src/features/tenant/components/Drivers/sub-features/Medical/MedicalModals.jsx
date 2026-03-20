import React, { useState } from 'react';
import { Loader2, Plus, Pencil } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject, formatError } from '../../common/utils';
import {
  useCreateMedicalRecord,
  useUpdateMedicalRecord,
  useDeleteMedicalRecord,
} from '../../../../queries/drivers/trainingAndMedicalQuery';
import DriverSelect from '../../common/DriverSelect';
import { VERIFICATION_STATUS } from '../../common/constants';

// Shared Form Fields for Medical
const MedicalFormFields = ({ form, setForm, error }) => {
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  return (
    <div className="space-y-4">
      {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div><Label required>Examination Date</Label><Input type="date" value={form.examination_date} onChange={set('examination_date')} /></div>
        <div><Label required>Next Due Date</Label><Input type="date" value={form.next_due_date} onChange={set('next_due_date')} /></div>
        <div><Label>Fitness Status</Label>
          <Select value={form.fitness_status} onChange={set('fitness_status')}>
            {VERIFICATION_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div><Label>Blood Group</Label><Input placeholder="e.g. O+" value={form.blood_group} onChange={set('blood_group')} /></div>
        <div><Label>Certificate Number</Label><Input placeholder="MED123456" value={form.certificate_number} onChange={set('certificate_number')} /></div>
        <div><Label>Examining Doctor</Label><Input placeholder="Dr. Smith" value={form.examining_doctor} onChange={set('examining_doctor')} /></div>
        <div className="col-span-2"><Label>Certificate File (URL)</Label><Input placeholder="https://example.com/cert.pdf" value={form.certificate_url} onChange={set('certificate_url')} /></div>
      </div>
      <div><Label>Restrictions</Label>
        <textarea rows={2} placeholder="Any medical restrictions..." value={form.restrictions} onChange={e => setForm(p => ({ ...p, restrictions: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
      </div>
      <div><Label>Notes</Label>
        <textarea rows={2} placeholder="Additional observations..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
      </div>
    </div>
  );
};

export const AddMedicalModal = ({ driverId, onClose }) => {
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const [form, setForm] = useState({
    examination_date: '',
    next_due_date: '',
    fitness_status: 'PENDING',
    blood_group: '',
    examining_doctor: '',
    certificate_number: '',
    certificate_url: '',
    restrictions: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const createMedical = useCreateMedicalRecord(targetDriverId);

  const validate = () => {
    if (!targetDriverId) return 'Please select a driver.';
    if (!form.examination_date) return 'Examination date is required.';
    if (!form.next_due_date) return 'Next due date is required.';
    if (form.examination_date > form.next_due_date) return 'Next due date cannot be before examination date.';
    return null;
  };

  const handleSubmit = () => {
    setError('');
    const validationError = validate();
    if (validationError) return setError(validationError);

    createMedical.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Add Medical Record"
      description="Add a new medical checkup record"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.examination_date || !form.next_due_date || createMedical.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createMedical.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Record</>}
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
        <MedicalFormFields form={form} setForm={setForm} error={error} />
      </div>
    </ModalWrapper>
  );
};

export const EditMedicalModal = ({ record, driverId, onClose }) => {
  const [form, setForm] = useState({
    examination_date: record.examination_date ?? '',
    next_due_date: record.next_due_date ?? '',
    fitness_status: record.fitness_status ?? 'PENDING',
    blood_group: record.blood_group ?? '',
    examining_doctor: record.examining_doctor ?? '',
    certificate_number: record.certificate_number ?? '',
    certificate_url: record.certificate_url ?? '',
    restrictions: record.restrictions ?? '',
    notes: record.notes ?? '',
  });
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const updateMedical = useUpdateMedicalRecord(driverId, record.id);
  const deleteMedical = useDeleteMedicalRecord(driverId);

  const validate = () => {
    if (!form.examination_date) return 'Examination date is required.';
    if (!form.next_due_date) return 'Next due date is required.';
    if (form.examination_date > form.next_due_date) return 'Next due date cannot be before examination date.';
    return null;
  };

  const handleSubmit = () => {
    setError('');
    const validationError = validate();
    if (validationError) return setError(validationError);

    updateMedical.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Edit Medical Record"
      description={<span>Editing checkup from: <span className="font-semibold text-gray-600">{record.examination_date}</span></span>}
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
            <button onClick={handleSubmit} disabled={!form.examination_date || !form.next_due_date || updateMedical.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
              {updateMedical.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Pencil size={14} /> Update Record</>}
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Medical Record?"
          description="This medical record will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteMedical.mutate(record.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteMedical.isPending}
        />
      )}
      <MedicalFormFields form={form} setForm={setForm} error={error} />
    </ModalWrapper>
  );
};

export const DeleteMedicalDialog = ({ record, driverId, onClose }) => {
  const deleteMutation = useDeleteMedicalRecord(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(record.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Medical Record?"
      description={<p>Record from <span className="font-semibold text-gray-600">{record.examination_date}</span> will be permanently deleted.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};
