import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Phone, FileText, ClipboardList, Info as LucideInfo, 
  History, Wallet, Pencil, Eye, Loader2, MessageSquare, Briefcase, User
} from 'lucide-react';
import { 
  useCustomerAddresses, useCustomerContacts, useCustomerDocuments, 
  useCustomerContracts, useCustomerCreditHistory, useCustomerNotes,
  useCreateCustomerAddress, useUpdateCustomerAddress, useDeleteCustomerAddress,
  useCreateCustomerContact, useUpdateCustomerContact, useDeleteCustomerContact,
  useCreateCustomerDocument, useUpdateCustomerDocument, useDeleteCustomerDocument,
  useCreateCustomerContract, useUpdateCustomerContract, useDeleteCustomerContract,
  useCreateCustomerNote, useUpdateCustomerNote, useDeleteCustomerNote
} from '../../../queries/customers/customersQuery';
import { Badge, InfoCard, SectionHeader, EmptyState, Section, Modal, Field, Input, Sel, DeleteConfirm, ItemActions } from '../../Vehicles/Common/VehicleCommon';

// ── Tab: Overview ────────────────────────────────────────────────────
export const CustomerOverview = ({ customer: c, onEdit }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
    <div className="grid grid-cols-2 gap-4">
      <InfoCard label="Legal Name" value={c?.legal_name} accent />
      <InfoCard label="Customer Code" value={c?.customer_code} />
      <InfoCard label="Trading Name" value={c?.trading_name} />
      <InfoCard label="Type" value={c?.customer_type} />
      <InfoCard label="Business Type" value={c?.business_type} />
      <InfoCard label="Industry Sector" value={c?.industry_sector} />
      <InfoCard label="Website" value={c?.website} />
      <InfoCard label="Notes" value={c?.notes} />
    </div>

    <Section title="Assignments & Portal" />
    <div className="grid grid-cols-2 gap-3">
      <div className="p-4 rounded-xl border border-gray-100 bg-white">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sales Person</p>
        <p className="text-sm font-bold text-[#172B4D]">{c?.sales_person?.full_name || c?.sales_person?.username || '—'}</p>
        {c?.sales_person?.email && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{c.sales_person.email}</p>}
      </div>
      <div className="p-4 rounded-xl border border-gray-100 bg-white">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Account Manager</p>
        <p className="text-sm font-bold text-[#172B4D]">{c?.account_manager?.full_name || c?.account_manager?.username || '—'}</p>
        {c?.account_manager?.email && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{c.account_manager.email}</p>}
      </div>
      <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 col-span-2">
        <p className="text-[10px] font-black text-[#0052CC] uppercase tracking-widest mb-2">Linked Portal User</p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center text-[#0052CC] text-xs font-black">
            {(c?.portal_user?.first_name?.[0] || c?.portal_user?.username?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-[#172B4D]">
              {c?.portal_user?.full_name || c?.portal_user?.username || 'No Portal User Linked'}
            </p>
            {c?.portal_user?.email && <p className="text-[10px] text-gray-500 font-medium">{c.portal_user.email} — {c.portal_user.account_type}</p>}
          </div>
        </div>
      </div>
    </div>

    <Section title="Tax & Registration" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Tax ID (GSTIN)" value={c?.tax_id} />
      <InfoCard label="PAN Number" value={c?.pan_number} />
      <InfoCard label="Registration No." value={c?.registration_number} />
      <InfoCard label="Incorporation Date" value={c?.incorporation_date ? new Date(c.incorporation_date).toLocaleDateString() : null} />
    </div>

    <Section title="Financial Details" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Credit Limit" value={c?.credit_limit ? `₹${Number(c.credit_limit).toLocaleString('en-IN')}` : null} />
      <InfoCard label="Customer Tier" value={c?.customer_tier} />
      <InfoCard label="Payment Terms" value={c?.payment_terms} />
      <InfoCard label="Status" value={c?.status} />
    </div>

    {onEdit && (
      <div className="pt-3 border-t border-gray-100 flex justify-end">
        <button onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm">
          <Pencil size={14} /> Edit Customer
        </button>
      </div>
    )}
  </div>
);

// ── Tab: Addresses ──────────────────────────────────────────────────
export const CustomerAddresses = ({ customerId }) => {
  const [modal, setModal] = useState(null); // 'ADD' | 'EDIT' | 'DELETE'
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useCustomerAddresses(customerId);
  const createMutation = useCreateCustomerAddress(customerId);
  const updateMutation = useUpdateCustomerAddress(customerId);
  const deleteMutation = useDeleteCustomerAddress(customerId);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 size={24} className="animate-spin text-[#0052CC]" /></div>;

  const addresses = data?.results ?? data ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader 
        title="Stored Addresses" 
        count={addresses.length} 
        icon={MapPin} 
        onAdd={() => setModal('ADD')}
        addLabel="Add Address"
      />
      
      {addresses.length === 0 ? (
        <EmptyState text="No addresses found" icon={MapPin} onAdd={() => setModal('ADD')} addLabel="Add First Address" />
      ) : (
        <div className="grid gap-3">
          {addresses.map(addr => (
            <div key={addr.id} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-all flex justify-between items-start group">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <MapPin size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0052CC]">{addr.address_type}</span>
                    {addr.is_default && (
                      <Badge className="bg-green-50 text-green-700 border-green-200">Default</Badge>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#172B4D] leading-tight">{addr.address_line1}</p>
                  {addr.address_line2 && <p className="text-xs text-gray-500 mt-0.5">{addr.address_line2}</p>}
                  <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-tight">
                    {addr.city}, {addr.state} — {addr.postal_code}
                  </p>
                </div>
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ItemActions 
                  onEdit={() => { setSelected(addr); setModal('EDIT'); }}
                  onDelete={() => { setSelected(addr); setModal('DELETE'); }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'ADD' || modal === 'EDIT') && (
        <AddressFormModal 
          initial={modal === 'EDIT' ? selected : null}
          onClose={() => { setModal(null); setSelected(null); }}
          onSubmit={(data) => {
            if (modal === 'ADD') createMutation.mutate(data, { onSuccess: () => setModal(null) });
            else updateMutation.mutate({ id: selected.id, data }, { onSuccess: () => setModal(null) });
          }}
          submitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {modal === 'DELETE' && (
        <DeleteConfirm 
          label="Address"
          onClose={() => setModal(null)}
          onConfirm={() => deleteMutation.mutate(selected.id, { onSuccess: () => setModal(null) })}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

const AddressFormModal = ({ initial, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState(initial || {
    address_line1: '', address_line2: '', city: '', state: '', 
    country: 'India', postal_code: '', address_type: 'HEADQUARTERS', is_default: false
  });

  return (
    <Modal title={initial ? 'Edit Address' : 'Add New Address'} onClose={onClose} onSubmit={() => onSubmit(form)} submitting={submitting}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Address Line 1" className="col-span-2" required>
          <Input value={form.address_line1} onChange={e => setForm({...form, address_line1: e.target.value})} />
        </Field>
        <Field label="Address Line 2" className="col-span-2">
          <Input value={form.address_line2} onChange={e => setForm({...form, address_line2: e.target.value})} />
        </Field>
        <Field label="City" required>
          <Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
        </Field>
        <Field label="State" required>
          <Input value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
        </Field>
        <Field label="Postal Code" required>
          <Input value={form.postal_code} onChange={e => setForm({...form, postal_code: e.target.value})} />
        </Field>
        <Field label="Landmark">
          <Input value={form.landmark} onChange={e => setForm({...form, landmark: e.target.value})} placeholder="e.g. Near City Center" />
        </Field>
        <Field label="Address Type">
          <Sel value={form.address_type} onChange={e => setForm({...form, address_type: e.target.value})}>
            <option value="REGISTERED">REGISTERED</option>
            <option value="BILLING">BILLING</option>
            <option value="SHIPPING">SHIPPING</option>
            <option value="WAREHOUSE">WAREHOUSE</option>
            <option value="OTHER">OTHER</option>
          </Sel>
        </Field>
        <label className="flex items-center gap-2 col-span-2 cursor-pointer mt-2">
          <input type="checkbox" checked={form.is_default} onChange={e => setForm({...form, is_default: e.target.checked})} className="w-4 h-4 text-[#0052CC] rounded" />
          <span className="text-xs font-bold text-gray-600">Set as default address</span>
        </label>
      </div>
    </Modal>
  );
};

// ── Tab: Contacts ───────────────────────────────────────────────────
export const CustomerContacts = ({ customerId, portalUser }) => {
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useCustomerContacts(customerId);
  const createMutation = useCreateCustomerContact(customerId);
  const updateMutation = useUpdateCustomerContact(customerId);
  const deleteMutation = useDeleteCustomerContact(customerId);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 size={24} className="animate-spin text-[#0052CC]" /></div>;

  const contacts = data?.results ?? data ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader 
        title="Contact Directory" 
        count={contacts.length} 
        icon={Phone} 
        onAdd={() => setModal('ADD')}
        addLabel="Add Contact"
      />

      {contacts.length === 0 ? (
        <EmptyState text="No contacts found" icon={Phone} onAdd={() => setModal('ADD')} addLabel="Add First Contact" />
      ) : (
        <div className="grid gap-3">
          {contacts.map(contact => (
            <div key={contact.id} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-all flex justify-between items-center group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#172B4D] font-black text-sm border border-gray-100">
                  {contact.first_name?.[0]}{contact.last_name?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-[#172B4D]">{contact.first_name} {contact.last_name}</p>
                    <div className="flex gap-1">
                      {contact.is_primary && <Badge className="bg-blue-50 text-blue-700 border-blue-200">Primary</Badge>}
                      {contact.status && (
                        <Badge className={`${contact.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                          {contact.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">{contact.designation || contact.contact_type || 'Staff'}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {contact.email && <span className="text-[11px] text-[#0052CC] font-mono flex items-center gap-1"><FileText size={10} /> {contact.email}</span>}
                    {contact.mobile && <span className="text-[11px] text-gray-500 font-bold flex items-center gap-1"><Phone size={10} /> {contact.mobile}</span>}
                  </div>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ItemActions 
                  onEdit={() => { setSelected(contact); setModal('EDIT'); }}
                  onDelete={() => { setSelected(contact); setModal('DELETE'); }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'ADD' || modal === 'EDIT') && (
        <ContactFormModal 
          initial={modal === 'EDIT' ? selected : null}
          portalUser={portalUser}
          onClose={() => { setModal(null); setSelected(null); }}
          onSubmit={(data) => {
            if (modal === 'ADD') createMutation.mutate(data, { onSuccess: () => setModal(null) });
            else updateMutation.mutate({ id: selected.id, data }, { onSuccess: () => setModal(null) });
          }}
          submitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {modal === 'DELETE' && (
        <DeleteConfirm 
          label="Contact"
          onClose={() => setModal(null)}
          onConfirm={() => deleteMutation.mutate(selected.id, { onSuccess: () => setModal(null) })}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

const ContactFormModal = ({ initial, onClose, onSubmit, submitting, portalUser }) => {
  const [form, setForm] = useState(initial || {
    salutation: '', first_name: '', last_name: '', email: '', 
    mobile: '', phone: '', fax: '', designation: '', 
    department: '', contact_type: 'PRIMARY', is_primary: false,
    status: 'ACTIVE'
  });

  // Auto-fill from portal user on create
  useEffect(() => {
    if (!initial && portalUser) {
      setForm(prev => ({
        ...prev,
        first_name: portalUser.first_name || portalUser.full_name?.split(' ')[0] || '',
        last_name: portalUser.last_name || portalUser.full_name?.split(' ').slice(1).join(' ') || '',
        email: portalUser.email || '',
      }));
    }
  }, [portalUser]);

  return (
    <Modal title={initial ? 'Edit Contact' : 'Add New Contact'} onClose={onClose} onSubmit={() => onSubmit(form)} submitting={submitting}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Salutation">
          <Input value={form.salutation} onChange={e => setForm({...form, salutation: e.target.value})} placeholder="Mr. / Ms. / Dr." />
        </Field>
        <Field label="First Name" required>
          <Input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
        </Field>
        <Field label="Last Name" required>
          <Input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </Field>
        <Field label="Mobile Number" required>
          <Input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
        </Field>
        <Field label="Fax">
          <Input value={form.fax} onChange={e => setForm({...form, fax: e.target.value})} />
        </Field>
        <Field label="Department">
          <Input value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Finance" />
        </Field>
        <Field label="Designation">
          <Input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="e.g. Operations Manager" />
        </Field>
        <Field label="Contact Type">
          <Sel value={form.contact_type} onChange={e => setForm({...form, contact_type: e.target.value})}>
            <option value="PRIMARY">PRIMARY</option>
            <option value="ACCOUNTS">ACCOUNTS</option>
            <option value="OPERATIONS">OPERATIONS</option>
            <option value="SALES">SALES</option>
            <option value="OTHER">OTHER</option>
          </Sel>
        </Field>
        <Field label="Status">
          <Sel value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </Sel>
        </Field>
        <label className="flex items-center gap-2 col-span-2 cursor-pointer mt-2">
          <input type="checkbox" checked={form.is_primary} onChange={e => setForm({...form, is_primary: e.target.checked})} className="w-4 h-4 text-[#0052CC] rounded" />
          <span className="text-xs font-bold text-gray-600">Primary contact person</span>
        </label>
      </div>
    </Modal>
  );
};

// ── Tab: Documents ──────────────────────────────────────────────────
export const CustomerDocuments = ({ customerId }) => {
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useCustomerDocuments(customerId);
  const createMutation = useCreateCustomerDocument(customerId);
  const updateMutation = useUpdateCustomerDocument(customerId);
  const deleteMutation = useDeleteCustomerDocument(customerId);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 size={24} className="animate-spin text-[#0052CC]" /></div>;

  const docs = data?.results ?? data ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader 
        title="Compliance Documents" 
        count={docs.length} 
        icon={FileText} 
        onAdd={() => setModal('ADD')}
        addLabel="Upload Document"
      />

      {docs.length === 0 ? (
        <EmptyState text="No documents uploaded" icon={FileText} onAdd={() => setModal('ADD')} addLabel="Upload First Document" />
      ) : (
        <div className="grid gap-3">
          {docs.map(doc => (
            <div key={doc.id} className="p-3 pr-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-all flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#172B4D]">{doc.document_type}</p>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tight">{doc.document_number}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Badge className={doc.verified_status === 'VERIFIED' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}>
                      {doc.verified_status}
                    </Badge>
                    {doc.expiry_date && (
                      <span className="text-[10px] font-bold text-gray-400">Expires: {new Date(doc.expiry_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={doc.file_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-500 transition-all">
                  <Eye size={14} />
                </a>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ItemActions 
                    onEdit={() => { setSelected(doc); setModal('EDIT'); }}
                    onDelete={() => { setSelected(doc); setModal('DELETE'); }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'ADD' || modal === 'EDIT') && (
        <DocumentFormModal 
          initial={modal === 'EDIT' ? selected : null}
          onClose={() => { setModal(null); setSelected(null); }}
          onSubmit={(payload) => {
            if (modal === 'ADD') createMutation.mutate(payload, { onSuccess: () => setModal(null) });
            else updateMutation.mutate({ id: selected.id, data: payload }, { onSuccess: () => setModal(null) });
          }}
          submitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {modal === 'DELETE' && (
        <DeleteConfirm 
          label="Document"
          onClose={() => setModal(null)}
          onConfirm={() => deleteMutation.mutate(selected.id, { onSuccess: () => setModal(null) })}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

const DocumentFormModal = ({ initial, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState(initial || {
    document_type: 'GST_CERTIFICATE', document_name: '', document_number: '', 
    file_url: '', issue_date: '', expiry_date: '', remarks: ''
  });

  const TYPES = ['GST_CERTIFICATE', 'PAN_CARD', 'CIN', 'REGISTRATION', 'AADHAR', 'VOTER_ID', 'PASSPORT', 'TAX_EXEMPTION', 'OTHER'];

  return (
    <Modal title={initial ? 'Edit Document' : 'Upload Document'} onClose={onClose} onSubmit={() => onSubmit(form)} submitting={submitting}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Document Type" required>
          <Sel value={form.document_type} onChange={e => setForm({...form, document_type: e.target.value})}>
            {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </Sel>
        </Field>
        <Field label="Document Name">
          <Input value={form.document_name} onChange={e => setForm({...form, document_name: e.target.value})} placeholder="e.g. GST Registration Copy" />
        </Field>
        <Field label="Document Number" required>
          <Input value={form.document_number} onChange={e => setForm({...form, document_number: e.target.value})} />
        </Field>
        <Field label="File URL" required>
          <Input value={form.file_url} onChange={e => setForm({...form, file_url: e.target.value})} placeholder="Direct link to file (e.g. S3/Storage URL)" />
        </Field>
        <Field label="Issue Date">
          <Input type="date" value={form.issue_date} onChange={e => setForm({...form, issue_date: e.target.value})} />
        </Field>
        <Field label="Expiry Date">
          <Input type="date" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} />
        </Field>
        <Field label="Remarks" className="col-span-2">
          <Input value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} />
        </Field>
        {!initial && (
          <div className="col-span-2 p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50 text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">File Upload Integration Required</p>
            <p className="text-[10px] text-gray-300">Placeholder for file selection logic</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

// ── Tab: Contracts ──────────────────────────────────────────────────
export const CustomerContracts = ({ customerId }) => {
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useCustomerContracts(customerId);
  const createMutation = useCreateCustomerContract(customerId);
  const updateMutation = useUpdateCustomerContract(customerId);
  const deleteMutation = useDeleteCustomerContract(customerId);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 size={24} className="animate-spin text-[#0052CC]" /></div>;

  const contracts = data?.results ?? data ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader 
        title="Service Contracts" 
        count={contracts.length} 
        icon={Briefcase} 
        onAdd={() => setModal('ADD')}
        addLabel="Create Contract"
      />

      {contracts.length === 0 ? (
        <EmptyState text="No contracts found" icon={Briefcase} onAdd={() => setModal('ADD')} addLabel="Create First Contract" />
      ) : (
        <div className="grid gap-3">
          {contracts.map(contract => (
            <div key={contract.id} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-all flex justify-between items-center group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex flex-col items-center justify-center border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Type</span>
                  <span className="text-xs font-black text-[#172B4D]">{contract.contract_type?.[0] || 'C'}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-black text-[#172B4D]">{contract.contract_type} — {contract.contract_number || 'N/A'}</p>
                    <Badge className={contract.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700'}>{contract.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Starts: {new Date(contract.start_date).toLocaleDateString()}</span>
                    {contract.end_date && <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Ends: {new Date(contract.end_date).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ItemActions 
                  onEdit={() => { setSelected(contract); setModal('EDIT'); }}
                  onDelete={() => { setSelected(contract); setModal('DELETE'); }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'ADD' || modal === 'EDIT') && (
        <ContractFormModal 
          initial={modal === 'EDIT' ? selected : null}
          onClose={() => { setModal(null); setSelected(null); }}
          onSubmit={(payload) => {
            if (modal === 'ADD') createMutation.mutate(payload, { onSuccess: () => setModal(null) });
            else updateMutation.mutate({ id: selected.id, data: payload }, { onSuccess: () => setModal(null) });
          }}
          submitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {modal === 'DELETE' && (
        <DeleteConfirm 
          label="Contract"
          onClose={() => setModal(null)}
          onConfirm={() => deleteMutation.mutate(selected.id, { onSuccess: () => setModal(null) })}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

const ContractFormModal = ({ initial, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState(initial || {
    contract_type: 'ANNUAL', start_date: '', end_date: '', 
    status: 'ACTIVE', terms: '', contract_number: ''
  });

  return (
    <Modal title={initial ? 'Edit Contract' : 'Create Contract'} onClose={onClose} onSubmit={() => onSubmit(form)} submitting={submitting}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Contract Number" className="col-span-2">
          <Input value={form.contract_number} onChange={e => setForm({...form, contract_number: e.target.value})} placeholder="e.g. CON-2024-001" />
        </Field>
        <Field label="Contract Type" required>
          <Sel value={form.contract_type} onChange={e => setForm({...form, contract_type: e.target.value})}>
            <option value="ANNUAL">ANNUAL</option>
            <option value="QUARTERLY">QUARTERLY</option>
            <option value="MONTHLY">MONTHLY</option>
            <option value="PROJECT_BASED">PROJECT_BASED</option>
          </Sel>
        </Field>
        <Field label="Status">
          <Sel value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="TERMINATED">TERMINATED</option>
          </Sel>
        </Field>
        <Field label="Start Date" required>
          <Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
        </Field>
        <Field label="End Date">
          <Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
        </Field>
        <Field label="Terms & Conditions" className="col-span-2">
          <textarea 
            className="w-full min-h-[100px] p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0052CC]/10 focus:border-[#0052CC] transition-all resize-none"
            value={form.terms}
            onChange={e => setForm({...form, terms: e.target.value})}
            placeholder="Contractual terms..."
          />
        </Field>
      </div>
    </Modal>
  );
};

// ── Tab: Notes ──────────────────────────────────────────────────────
export const CustomerNotes = ({ customerId }) => {
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useCustomerNotes(customerId);
  const createMutation = useCreateCustomerNote(customerId);
  const updateMutation = useUpdateCustomerNote(customerId);
  const deleteMutation = useDeleteCustomerNote(customerId);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 size={24} className="animate-spin text-[#0052CC]" /></div>;

  const notes = data?.results ?? data ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader 
        title="Internal Notes" 
        count={notes.length} 
        icon={MessageSquare} 
        onAdd={() => setModal('ADD')}
        addLabel="Add Note"
      />

      {notes.length === 0 ? (
        <EmptyState text="No notes found" icon={MessageSquare} onAdd={() => setModal('ADD')} addLabel="Add First Note" />
      ) : (
        <div className="grid gap-4">
          {notes.map(note => (
            <div key={note.id} className="p-5 rounded-2xl border border-gray-100 bg-white hover:border-blue-100 transition-all group relative">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0052CC]">
                    <User size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#172B4D]">{note.created_by_name || 'System User'}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{new Date(note.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ItemActions 
                    onEdit={() => { setSelected(note); setModal('EDIT'); }}
                    onDelete={() => { setSelected(note); setModal('DELETE'); }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">{note.content || note.note}</p>
              {note.note_type && (
                <Badge className="mt-4 bg-gray-50 text-gray-500 border-gray-200 tracking-widest uppercase">{note.note_type}</Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {(modal === 'ADD' || modal === 'EDIT') && (
        <NoteFormModal 
          initial={modal === 'EDIT' ? selected : null}
          onClose={() => { setModal(null); setSelected(null); }}
          onSubmit={(payload) => {
            if (modal === 'ADD') createMutation.mutate(payload, { onSuccess: () => setModal(null) });
            else updateMutation.mutate({ id: selected.id, data: payload }, { onSuccess: () => setModal(null) });
          }}
          submitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {modal === 'DELETE' && (
        <DeleteConfirm 
          label="Note"
          onClose={() => setModal(null)}
          onConfirm={() => deleteMutation.mutate(selected.id, { onSuccess: () => setModal(null) })}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

const NoteFormModal = ({ initial, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState(initial || { note: '', note_type: 'GENERAL' });

  return (
    <Modal title={initial ? 'Edit Note' : 'Add Note'} onClose={onClose} onSubmit={() => onSubmit(form)} submitting={submitting}>
      <div className="space-y-4">
        <Field label="Note Content" required>
          <textarea 
            className="w-full min-h-[120px] p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0052CC]/10 focus:border-[#0052CC] transition-all resize-none"
            value={form.note}
            onChange={e => setForm({...form, note: e.target.value})}
            placeholder="Write your internal note here..."
          />
        </Field>
        <Field label="Note Type">
          <Sel value={form.note_type} onChange={e => setForm({...form, note_type: e.target.value})}>
            <option value="GENERAL">GENERAL</option>
            <option value="COMPLAINT">COMPLAINT</option>
            <option value="COMPLIMENT">COMPLIMENT</option>
            <option value="REQUEST">REQUEST</option>
            <option value="FOLLOW_UP">FOLLOW_UP</option>
          </Sel>
        </Field>
      </div>
    </Modal>
  );
};

// ── Tab: Credit History ─────────────────────────────────────────────
export const CustomerCreditHistoryView = ({ customerId, currentLimit }) => {
  const { data, isLoading } = useCustomerCreditHistory(customerId);
  if (isLoading) return <div className="flex justify-center p-12"><Loader2 size={24} className="animate-spin text-[#0052CC]" /></div>;

  const history = data?.results ?? data ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Credit Limit History" count={history.length} icon={History} />
      <div className="p-4 bg-[#EBF3FF] rounded-xl border border-[#0052CC]/10 mb-6">
        <p className="text-[10px] font-black text-[#0052CC] uppercase tracking-widest mb-1 text-center">Current Active Limit</p>
        <p className="text-3xl font-black text-[#172B4D] text-center">₹{Number(currentLimit || 0).toLocaleString('en-IN')}</p>
      </div>
      
      {history.length === 0 ? (
        <EmptyState text="No history entries" icon={History} />
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
          {history.map(entry => (
            <div key={entry.id} className="relative">
              <div className="absolute -left-[2.15rem] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-[#0052CC]" />
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-black text-[#172B4D]">₹{Number(entry.credit_limit).toLocaleString('en-IN')}</p>
                <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(entry.effective_date).toLocaleDateString()}</span>
              </div>
              {entry.reason && <p className="text-xs text-gray-400 leading-tight italic">Reason: {entry.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
