import React, { useState } from 'react';
import { Loader2, Plus, Pencil } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject } from '../../common/utils';
import {
  useCreateEmergencyContact,
  useUpdateEmergencyContact,
  useDeleteEmergencyContact,
} from '../../../../queries/drivers/driverContactQuery';
import DriverSelect from '../../common/DriverSelect';

export const AddContactModal = ({ driverId, onClose }) => {
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const [form, setForm] = useState({
    contact_name: '',
    relationship: '',
    phone: '',
    alternate_phone: '',
    address: '',
    is_primary: false,
  });
  const [error, setError] = useState('');
  const createContact = useCreateEmergencyContact(targetDriverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!targetDriverId) return setError('Please select a driver.');
    if (!form.contact_name) return setError('Contact name is required.');
    if (!form.relationship) return setError('Relationship is required.');
    if (!form.phone) return setError('Phone number is required.');

    createContact.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to add contact.'),
    });
  };

  return (
    <ModalWrapper
      title="Add Emergency Contact"
      description="Add a new emergency contact"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.contact_name || !form.phone || createContact.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createContact.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Contact</>}
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
          <div className="col-span-2"><Label required>Full Name</Label><Input placeholder="e.g. John Doe" value={form.contact_name} onChange={set('contact_name')} /></div>
          <div><Label required>Relationship</Label><Input placeholder="e.g. Spouse" value={form.relationship} onChange={set('relationship')} /></div>
          <div><Label required>Phone Number</Label><Input placeholder="e.g. +91 98765 43210" value={form.phone} onChange={set('phone')} /></div>
          <div><Label>Alternate Phone</Label><Input placeholder="Optional" value={form.alternate_phone} onChange={set('alternate_phone')} /></div>
          <div className="flex items-center gap-3 mt-6">
            <input type="checkbox" id="is_primary" checked={form.is_primary} onChange={e => setForm(p => ({ ...p, is_primary: e.target.checked }))} className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-[#0052CC]" />
            <label htmlFor="is_primary" className="text-sm font-semibold text-gray-700 cursor-pointer">Set as Primary Contact</label>
          </div>
        </div>
        <div><Label>Address</Label>
          <textarea rows={2} placeholder="Home or work address..." value={form.address} onChange={set('address')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const EditContactModal = ({ contact, driverId, onClose }) => {
  const [form, setForm] = useState({
    contact_name: contact.contact_name ?? '',
    relationship: contact.relationship ?? '',
    phone: contact.phone ?? '',
    alternate_phone: contact.alternate_phone ?? '',
    address: contact.address ?? '',
    is_primary: contact.is_primary ?? false,
  });
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const updateContact = useUpdateEmergencyContact(driverId, contact.id);
  const deleteContact = useDeleteEmergencyContact(driverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.contact_name) return setError('Contact name is required.');
    if (!form.relationship) return setError('Relationship is required.');
    if (!form.phone) return setError('Phone number is required.');

    updateContact.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to update contact.'),
    });
  };

  return (
    <ModalWrapper
      title="Edit Emergency Contact"
      description={<span>Editing: <span className="font-semibold text-gray-600">{contact.contact_name}</span></span>}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Delete Contact
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={!form.contact_name || !form.phone || updateContact.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
              {updateContact.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Pencil size={14} /> Update Contact</>}
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Contact?"
          description="This contact will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteContact.mutate(contact.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteContact.isPending}
        />
      )}
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Label required>Full Name</Label><Input placeholder="e.g. John Doe" value={form.contact_name} onChange={set('contact_name')} /></div>
          <div><Label required>Relationship</Label><Input placeholder="e.g. Spouse" value={form.relationship} onChange={set('relationship')} /></div>
          <div><Label required>Phone Number</Label><Input placeholder="e.g. +91 98765 43210" value={form.phone} onChange={set('phone')} /></div>
          <div><Label>Alternate Phone</Label><Input placeholder="Optional" value={form.alternate_phone} onChange={set('alternate_phone')} /></div>
          <div className="flex items-center gap-3 mt-6">
            <input type="checkbox" id="edit_is_primary" checked={form.is_primary} onChange={e => setForm(p => ({ ...p, is_primary: e.target.checked }))} className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-[#0052CC]" />
            <label htmlFor="edit_is_primary" className="text-sm font-semibold text-gray-700 cursor-pointer">Set as Primary Contact</label>
          </div>
        </div>
        <div><Label>Address</Label>
          <textarea rows={2} placeholder="Home or work address..." value={form.address} onChange={set('address')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const DeleteContactDialog = ({ contact, driverId, onClose }) => {
  const deleteMutation = useDeleteEmergencyContact(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(contact.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Contact?"
      description={<p><span className="font-semibold text-gray-600">{contact.contact_name}</span> will be permanently deleted.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};
