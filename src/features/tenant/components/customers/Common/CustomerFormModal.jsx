import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Loader2, Save, Trash2, X
} from 'lucide-react';
import { useCustomers, useCreateCustomer, useUpdateCustomer } from '../../../queries/customers/customersQuery';
import { useUsers } from '../../../queries/users/userQuery';
import { Modal, Field, Input, Sel, Section } from '../../Vehicles/Common/VehicleCommon';

export const EMPTY_FORM = {
  legal_name: '',
  trading_name: '',
  customer_type: 'CONSIGNOR',
  status: 'ACTIVE',
  tax_id: '',
  pan_number: '',
  registration_number: '',
  incorporation_date: '',
  credit_limit: '',
  customer_tier: 'STANDARD',
  payment_terms: '',
  credit_rating: '',
  credit_score: '',
  business_type: '',
  industry_sector: '',
  website: '',
  notes: '',
  sales_person_id: '',
  account_manager_id: '',
  parent_customer_id: '',
  user_id: '',
  user: {
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
    account_type: 'CUSTOMER'
  }
};

export const CustomerFormModal = ({ initial, onClose, onSuccess }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const { data: userData } = useUsers({ limit: 1000 });
  const allUsers = userData?.results ?? userData ?? [];

  const { data: filterCustomers } = useCustomers({ limit: 1000 });
  const allCustomers = filterCustomers?.results ?? filterCustomers ?? [];
  
  const userToCustomerMap = React.useMemo(() => {
    const map = {};
    allCustomers?.forEach(c => {
      const uid = c.user?.id || c.user_id || c.portal_user_id;
      if (uid) {
        map[String(uid)] = c.legal_name || c.name || c.trading_name || 'Another Customer';
      }
    });
    console.log('UserToCustomerMap Built (Modal):', map);
    return map;
  }, [allCustomers]);

  const [createPortalUser, setCreatePortalUser] = useState(false);

  const isEdit = !!initial?.id;

  useEffect(() => {
    if (initial) {
      setForm({
        legal_name: initial.legal_name ?? '',
        trading_name: initial.trading_name ?? '',
        customer_type: initial.customer_type ?? 'CONSIGNOR',
        status: initial.status ?? 'ACTIVE',
        tax_id: initial.tax_id ?? '',
        pan_number: initial.pan_number ?? '',
        registration_number: initial.registration_number ?? '',
        incorporation_date: initial.incorporation_date ?? '',
        credit_limit: initial.credit_limit ?? '',
        customer_tier: initial.customer_tier ?? 'STANDARD',
        payment_terms: initial.payment_terms ?? '',
        credit_rating: initial.credit_rating ?? '',
        credit_score: initial.credit_score ?? '',
        business_type: initial.business_type ?? '',
        industry_sector: initial.industry_sector ?? '',
        website: initial.website ?? '',
        notes: initial.notes ?? '',
        sales_person_id: initial.sales_person_id ?? initial.sales_person?.id ?? '',
        account_manager_id: initial.account_manager_id ?? initial.account_manager?.id ?? '',
        parent_customer_id: initial.parent_customer_id ?? '',
        user_id: initial.user_id ?? '',
        user: EMPTY_FORM.user
      });
      setCreatePortalUser(false);
    } else {
      setForm(EMPTY_FORM);
    }
  }, [initial]);

  const setField = (k, v) => {
    if (k.includes('.')) {
      const [parent, child] = k.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: v }
      }));
    } else {
      setForm(prev => ({ ...prev, [k]: v }));
    }
    if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.legal_name.trim()) {
      e.legal_name = 'Legal name is required';
    } else {
      const isDuplicate = allCustomers.some(c => 
        c.legal_name?.toLowerCase() === form.legal_name.trim().toLowerCase() && 
        c.id !== initial?.id
      );
      if (isDuplicate) e.legal_name = 'This legal name is already taken';
    }
    if (!form.customer_type) e.customer_type = 'Select a type';
    if (!form.tax_id?.trim()) e.tax_id = 'Tax ID is required';
    if (!form.pan_number?.trim()) e.pan_number = 'PAN number is required';

    if (createPortalUser && !isEdit) {
      if (!form.user.email) e['user.email'] = 'Email is required';
      if (!form.user.username) e['user.username'] = 'Username is required';
      if (!form.user.password) e['user.password'] = 'Password is required';
      if (form.user.password !== form.user.password_confirm) e['user.password_confirm'] = 'Passwords must match';
      if (!form.user.first_name) e['user.first_name'] = 'First name is required';
      if (!form.user.phone) e['user.phone'] = 'Phone is required';
    }

    if (!isEdit && !createPortalUser && !form.user_id) {
      e.user_id = 'Select an existing user or enable portal user creation';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = { ...form };

    if (payload.credit_limit) payload.credit_limit = String(payload.credit_limit);
    if (payload.credit_score) payload.credit_score = Number(payload.credit_score);
    else delete payload.credit_score;

    ['user_id', 'sales_person_id', 'account_manager_id', 'parent_customer_id', 'incorporation_date'].forEach(key => {
      if (typeof payload[key] === 'string' && !payload[key].trim()) payload[key] = null;
    });

    // customer_code is system-generated
    delete payload.customer_code;

    // Handle nested user object
    if (!createPortalUser || isEdit) {
      delete payload.user;
    } else {
      payload.user_id = null; // Ensure user_id is null if nested user is provided
      // Trim values in user object
      Object.keys(payload.user).forEach(k => {
        if (typeof payload.user[k] === 'string') payload.user[k] = payload.user[k].trim();
      });
    }

    if (!isEdit) {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onClose();
          if (onSuccess) onSuccess();
        },
        onError: (err) => {
          if (err.response?.status === 400 && err.response.data?.details) {
            setErrors(prev => ({ ...prev, ...err.response.data.details }));
          }
        }
      });
    } else {
      updateMutation.mutate({ id: initial.id, data: payload }, {
        onSuccess: () => {
          onClose();
          if (onSuccess) onSuccess();
        },
        onError: (err) => {
          if (err.response?.status === 400 && err.response.data?.details) {
            setErrors(prev => ({ ...prev, ...err.response.data.details }));
          }
        }
      });
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      title={!isEdit ? 'Add New Customer' : `Edit — ${initial?.legal_name}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-2 gap-4">
        <Section title="Basic Information" className="col-span-2" />

        <Field label="Legal Name" required error={errors.legal_name} info="Must be unique across all customers">
          <Input value={form.legal_name} onChange={e => setField('legal_name', e.target.value)}
            placeholder="Full legal name" />
        </Field>
        <Field label="Trading Name">
          <Input value={form.trading_name} onChange={e => setField('trading_name', e.target.value)}
            placeholder="Short / trading name" />
        </Field>
        <Field label="Customer Type" required error={errors.customer_type}>
          <Sel value={form.customer_type} onChange={e => setField('customer_type', e.target.value)}>
            <option value="CONSIGNOR">CONSIGNOR</option>
            <option value="CONSIGNEE">CONSIGNEE</option>
            <option value="BOTH">BOTH</option>
            <option value="BROKER">BROKER</option>
            <option value="AGENT">AGENT</option>
            <option value="OTHER">OTHER</option>
          </Sel>
        </Field>

        <Field label="Status">
          <Sel value={form.status} onChange={e => setField('status', e.target.value)}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="BLACKLISTED">BLACKLISTED</option>
          </Sel>
        </Field>

        <Section title="Tax & Registration" className="col-span-2" />

        <Field label="Tax ID (GSTIN)" required error={errors.tax_id}>
          <Input value={form.tax_id} onChange={e => setField('tax_id', e.target.value)}
            placeholder="e.g. 27AAACR5055K1ZV" />
        </Field>
        <Field label="PAN Number" required error={errors.pan_number}>
          <Input value={form.pan_number} onChange={e => setField('pan_number', e.target.value)}
            placeholder="e.g. AAACR5055K" />
        </Field>
        <Field label="Registration No.">
          <Input value={form.registration_number} onChange={e => setField('registration_number', e.target.value)}
            placeholder="e.g. U52100DL..." />
        </Field>
        <Field label="Incorporation Date">
          <Input type="date" value={form.incorporation_date} onChange={e => setField('incorporation_date', e.target.value)} />
        </Field>

        <Section title="Financial Details" className="col-span-2" />

        <Field label="Credit Limit (₹)">
          <Input type="number" value={form.credit_limit} onChange={e => setField('credit_limit', e.target.value)}
            placeholder="e.g. 1000000" />
        </Field>
        <Field label="Customer Tier">
          <Sel value={form.customer_tier} onChange={e => setField('customer_tier', e.target.value)}>
            <option value="PLATINUM">PLATINUM</option>
            <option value="GOLD">GOLD</option>
            <option value="SILVER">SILVER</option>
            <option value="STANDARD">STANDARD</option>
          </Sel>
        </Field>
        <Field label="Payment Terms">
          <Input value={form.payment_terms} onChange={e => setField('payment_terms', e.target.value)}
            placeholder="e.g. Net 30" />
        </Field>
        <Field label="Credit Rating">
          <Input value={form.credit_rating} onChange={e => setField('credit_rating', e.target.value)}
            placeholder="e.g. A+, BBB" />
        </Field>
        <Field label="Credit Score">
          <Input type="number" value={form.credit_score} onChange={e => setField('credit_score', e.target.value)}
            placeholder="e.g. 780" />
        </Field>

        <Section title="Additional Info" className="col-span-2" />

        <Field label="Business Type">
          <Input value={form.business_type} onChange={e => setField('business_type', e.target.value)}
            placeholder="e.g. Pvt Ltd" />
        </Field>
        <Field label="Industry Sector">
          <Input value={form.industry_sector} onChange={e => setField('industry_sector', e.target.value)}
            placeholder="e.g. Logistics" />
        </Field>
        <Field label="Website" className="col-span-2">
          <Input value={form.website} onChange={e => setField('website', e.target.value)}
            placeholder="https://example.com" />
        </Field>

        <Section title="Assignments & Meta" className="col-span-2" />

        <Field label="Sales Person" error={errors.sales_person_id}>
          <Sel value={form.sales_person_id} onChange={e => setField('sales_person_id', e.target.value)}>
            <option value="">-- No Assignment --</option>
            {allUsers.filter(u => u.account_type === 'EMPLOYEE' || u.account_type === 'MANAGER').map(u => (
              <option key={u.id} value={u.id}>{u.full_name || u.username} ({u.email})</option>
            ))}
          </Sel>
        </Field>
        <Field label="Account Manager" error={errors.account_manager_id}>
          <Sel value={form.account_manager_id} onChange={e => setField('account_manager_id', e.target.value)}>
            <option value="">-- No Assignment --</option>
            {allUsers.filter(u => u.account_type === 'EMPLOYEE' || u.account_type === 'MANAGER').map(u => (
              <option key={u.id} value={u.id}>{u.full_name || u.username} ({u.email})</option>
            ))}
          </Sel>
        </Field>
        <Field label="Parent Customer ID">
          <Input value={form.parent_customer_id} onChange={e => setField('parent_customer_id', e.target.value)}
            placeholder="UUID" />
        </Field>
        {!createPortalUser && (
          <Field label="Existing User ID" error={errors.user_id}>
            <Sel value={form.user_id} onChange={e => setField('user_id', e.target.value)}>
              <option value="">-- No Linked User --</option>
              {allUsers.filter(u => u.account_type === 'CUSTOMER').map(u => {
                const linkedTo = userToCustomerMap[String(u.id)];
                const currentUserId = initial?.user?.id || initial?.user_id;
                const isLinkedToOther = linkedTo && String(u.id) !== String(currentUserId);
                const displayName = u.full_name || u.username;
                
                return (
                  <option key={u.id} value={u.id} disabled={isLinkedToOther}>
                    {displayName} ({u.email}){linkedTo ? ` — [Linked to ${linkedTo}]` : ''}
                  </option>
                );
              })}
            </Sel>
          </Field>
        )}

        {!isEdit && (
          <div className="col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-2">
            <label className="flex items-center gap-2 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={createPortalUser}
                onChange={e => setCreatePortalUser(e.target.checked)}
                className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-bold text-[#172B4D]">Create New Portal User for this Customer</span>
            </label>

            {createPortalUser && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <Field label="Username" required error={errors['user.username']}>
                  <Input value={form.user.username} onChange={e => setField('user.username', e.target.value)} placeholder="portal_user_1" />
                </Field>
                <Field label="Email Address" required error={errors['user.email']}>
                  <Input type="email" value={form.user.email} onChange={e => setField('user.email', e.target.value)} placeholder="user@example.com" />
                </Field>
                <Field label="Password" required error={errors['user.password']}>
                  <Input type="password" value={form.user.password} onChange={e => setField('user.password', e.target.value)} placeholder="••••••••" />
                </Field>
                <Field label="Confirm Password" required error={errors['user.password_confirm']}>
                  <Input type="password" value={form.user.password_confirm} onChange={e => setField('user.password_confirm', e.target.value)} placeholder="••••••••" />
                </Field>
                <Field label="First Name" required error={errors['user.first_name']}>
                  <Input value={form.user.first_name} onChange={e => setField('user.first_name', e.target.value)} />
                </Field>
                <Field label="Last Name">
                  <Input value={form.user.last_name} onChange={e => setField('user.last_name', e.target.value)} />
                </Field>
              </div>
            )}
          </div>
        )}

        <Field label="Notes" className="col-span-2">
          <Input value={form.notes} onChange={e => setField('notes', e.target.value)}
            placeholder="Additional notes..." />
        </Field>
      </div>
    </Modal>
  );
};
