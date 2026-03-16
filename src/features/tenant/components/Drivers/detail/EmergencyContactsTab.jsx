import React, { useState } from 'react';
import {
  Loader2, AlertCircle, Plus,
  Pencil, Trash2, ShieldAlert, RefreshCw,
  X, Phone,
} from 'lucide-react';
import {
  useDriverContacts,
  useCreateEmergencyContact,
  useUpdateEmergencyContact,
  useDeleteEmergencyContact,
} from '../../../queries/drivers/driverContactQuery';

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

// ─────────────────────────────────────────────────────────────────────
// ── MODALS START HERE ─────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────

// ── Add Emergency Contact Modal ───────────────────────────────────────
const AddContactModal = ({ driverId, onClose }) => {
  const [form, setForm] = useState({
    contact_name:    '',
    relationship:    '',
    phone:           '',
    alternate_phone: '',
    address:         '',
    is_primary:      false,
  });
  const [error, setError] = useState('');
  const createContact = useCreateEmergencyContact(driverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.contact_name) return setError('Contact name is required.');
    if (!form.relationship) return setError('Relationship is required.');
    if (!form.phone)        return setError('Phone number is required.');

    const clean = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
    );
    createContact.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to add contact.'),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Add Emergency Contact</h2>
            <p className="text-xs text-gray-400 mt-0.5">Add a new emergency contact for this driver</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Contact Name</Label>
              <Input placeholder="e.g. Priya Kumar" value={form.contact_name} onChange={set('contact_name')} />
            </div>
            <div>
              <Label required>Relationship</Label>
              <Input placeholder="e.g. Spouse, Father, Mother" value={form.relationship} onChange={set('relationship')} />
            </div>
            <div>
              <Label required>Phone</Label>
              <Input placeholder="+91-9876543210" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <Label>Alternate Phone</Label>
              <Input placeholder="+91-9876543211" value={form.alternate_phone} onChange={set('alternate_phone')} />
            </div>
          </div>
          <div>
            <Label>Address</Label>
            <Input placeholder="e.g. 123 Main Street, City" value={form.address} onChange={set('address')} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_primary"
              checked={form.is_primary}
              onChange={e => setForm(p => ({ ...p, is_primary: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-[#0052CC] focus:ring-[#0052CC]/20 cursor-pointer"
            />
            <label htmlFor="is_primary" className="text-sm font-semibold text-gray-600 cursor-pointer">
              Mark as Primary Contact
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.contact_name || !form.relationship || !form.phone || createContact.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createContact.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
              : <><Plus size={14} /> Add Contact</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Emergency Contact Modal ──────────────────────────────────────
const EditContactModal = ({ contact, driverId, onClose }) => {
  const [form, setForm] = useState({
    contact_name:    contact.contact_name    ?? '',
    relationship:    contact.relationship    ?? '',
    phone:           contact.phone           ?? '',
    alternate_phone: contact.alternate_phone ?? '',
    address:         contact.address         ?? '',
    is_primary:      contact.is_primary      ?? false,
  });
  const [error, setError] = useState('');
  const updateContact = useUpdateEmergencyContact(driverId, contact.id);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.contact_name) return setError('Contact name is required.');
    if (!form.relationship) return setError('Relationship is required.');
    if (!form.phone)        return setError('Phone number is required.');

    const clean = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
    );
    updateContact.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to update contact.'),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Edit Contact</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Editing: <span className="font-semibold text-gray-600">{contact.contact_name}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Contact Name</Label>
              <Input placeholder="e.g. Priya Kumar" value={form.contact_name} onChange={set('contact_name')} />
            </div>
            <div>
              <Label required>Relationship</Label>
              <Input placeholder="e.g. Spouse, Father" value={form.relationship} onChange={set('relationship')} />
            </div>
            <div>
              <Label required>Phone</Label>
              <Input placeholder="+91-9876543210" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <Label>Alternate Phone</Label>
              <Input placeholder="+91-9876543211" value={form.alternate_phone} onChange={set('alternate_phone')} />
            </div>
          </div>
          <div>
            <Label>Address</Label>
            <Input placeholder="e.g. 123 Main Street, City" value={form.address} onChange={set('address')} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit_is_primary"
              checked={form.is_primary}
              onChange={e => setForm(p => ({ ...p, is_primary: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-[#0052CC] focus:ring-[#0052CC]/20 cursor-pointer"
            />
            <label htmlFor="edit_is_primary" className="text-sm font-semibold text-gray-600 cursor-pointer">
              Mark as Primary Contact
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.contact_name || !form.relationship || !form.phone || updateContact.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateContact.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
              : <><Pencil size={14} /> Update Contact</>
            }
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
const DeleteConfirm = ({ contact, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <Trash2 size={20} className="text-red-500" />
      </div>
      <h3 className="text-base font-black text-[#172B4D] mb-1">Delete Contact?</h3>
      <p className="text-sm text-gray-400 mb-5">
        <span className="font-semibold text-gray-600">{contact.contact_name}</span> will be permanently deleted.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
        >
          {isDeleting ? <><Loader2 size={13} className="animate-spin" /> Deleting...</> : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ── Main Tab Component ────────────────────────────────────────────────
const EmergencyTab = ({ driverId }) => {
  const [addOpen,     setAddOpen]     = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [deleteContact, setDeleteContact] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverContacts(driverId);
  const deleteContactMutation = useDeleteEmergencyContact(driverId);
  const contacts = data?.results ?? [];

  const handleDelete = () => {
    deleteContactMutation.mutate(deleteContact.id, {
      onSuccess: () => setDeleteContact(null),
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <Loader2 size={20} className="animate-spin text-[#0052CC]" />
      <span className="text-sm">Loading contacts...</span>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
      <AlertCircle size={32} />
      <p className="text-sm font-medium">Failed to load contacts</p>
      <p className="text-xs text-gray-400">{error?.message}</p>
      <button onClick={() => refetch()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg">
        <RefreshCw size={13} /> Try Again
      </button>
    </div>
  );

  return (
    <>
      {/* ── Modals ── */}
      {addOpen       && <AddContactModal  driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editContact   && <EditContactModal contact={editContact} driverId={driverId} onClose={() => setEditContact(null)} />}
      {deleteContact && <DeleteConfirm contact={deleteContact} onConfirm={handleDelete} onCancel={() => setDeleteContact(null)} isDeleting={deleteContactMutation.isPending} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Emergency Contacts</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all"
        >
          <Plus size={14} /> Add Contact
        </button>
      </div>

      {/* ── Empty State ── */}
      {contacts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <ShieldAlert size={32} className="mb-2 opacity-30" />
          <p className="text-sm font-semibold">No emergency contacts found</p>
          <p className="text-xs mt-1">Click Add Contact to add one</p>
        </div>
      )}

      {/* ── Table ── */}
      {contacts.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Contact Name','Relationship','Phone','Alternate Phone','Address','Primary','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contacts.map(contact => (
                <tr key={contact.id} className="hover:bg-blue-50/30 transition-colors">
                  {/* Contact Name */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-[#172B4D] text-[13px]">
                      {contact.contact_name}
                    </span>
                  </td>

                  {/* Relationship */}
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                    {contact.relationship ?? '—'}
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-1.5 font-mono text-[12px] text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 w-fit">
                      <Phone size={10} /> {contact.phone ?? '—'}
                    </span>
                  </td>

                  {/* Alternate Phone */}
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-500 font-mono">
                    {contact.alternate_phone ?? '—'}
                  </td>

                  {/* Address */}
                  <td className="px-4 py-3 text-[12px] text-gray-600 max-w-45 truncate">
                    {contact.address ?? '—'}
                  </td>

                  {/* Primary */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {contact.is_primary ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit bg-green-50 border border-green-200 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Primary
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditContact(contact)}
                        className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
                      >
                        <Pencil size={11} /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteContact(contact)}
                        className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default EmergencyTab;