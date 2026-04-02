import React from 'react';
import { 
  Plus, Edit2, Loader2, Save, Trash2, X, 
  AlertCircle, ChevronDown, Info as LucideInfo 
} from 'lucide-react';

// Re-exporting basic building blocks from VehicleCommon (central entry point for consistency)
export { 
  Badge, InfoCard, SectionHeader, EmptyState, Label, 
  Input, Sel, Section, Textarea, Field, Modal, DeleteConfirm,
  VehicleTypeMultiSelect
} from '../../Vehicles/Common/VehicleCommon';

import { 
  Section, Field, Sel, Input 
} from '../../Vehicles/Common/VehicleCommon';

/**
 * Shared section for Sales Person and Account Manager assignment
 */
export const RelationshipManagementFields = ({ 
  form, 
  setField, 
  allUsers, 
  errors = {}, 
  portalUsers = [], 
  userToCustomerMap = {}, 
  initial = null, 
  createPortalUser = false,
  disabled = false
}) => {
  return (
    <>
      <Section title="Relationship Management" className="col-span-2" />
      <Field label="Sales Person" error={errors.sales_person_id}>
        <Sel
          value={form.sales_person_id || ''}
          onChange={e => setField('sales_person_id', e.target.value)}
          disabled={disabled}
        >
          <option value="">-- No Assignment --</option>
          {allUsers.filter(u => u.account_type === 'EMPLOYEE' || u.account_type === 'MANAGER').map(u => (
            <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
          ))}
        </Sel>
      </Field>
      <Field label="Account Manager" error={errors.account_manager_id}>
        <Sel
          value={form.account_manager_id || ''}
          onChange={e => setField('account_manager_id', e.target.value)}
          disabled={disabled}
        >
          <option value="">-- No Assignment --</option>
          {allUsers.filter(u => u.account_type === 'EMPLOYEE' || u.account_type === 'MANAGER').map(u => (
            <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
          ))}
        </Sel>
      </Field>
      
      {!createPortalUser && (
        <Field label="Portal User (Linked User)" className="col-span-2" error={errors.user_id}>
          <Sel
            value={form.user_id || ''}
            onChange={e => setField('user_id', e.target.value)}
            disabled={disabled}
          >
            <option value="">-- No Linked User --</option>
            {portalUsers.map(u => {
              const linkedTo = userToCustomerMap[String(u.id)];
              // Check both standard and nested structures
              const currentUserId = initial?.customer?.user_id || initial?.customer?.user?.id || initial?.user_id;
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
    </>
  );
};

/**
 * Shared section for creating a new portal user directly from the customer form
 */
export const CreatePortalUserSection = ({ 
  createPortalUser, 
  setCreatePortalUser, 
  form, 
  setField, 
  errors = {}, 
  moduleName = "Customer" 
}) => {
  return (
    <div className="col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-2">
      <label className="flex items-center gap-2 cursor-pointer mb-4">
        <input
          type="checkbox"
          checked={createPortalUser}
          onChange={e => setCreatePortalUser(e.target.checked)}
          className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="text-sm font-bold text-[#172B4D]">Create New Portal User for this {moduleName}</span>
      </label>

      {createPortalUser && (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <Field label="Username" required error={errors['user.username']}>
            <Input
              value={form.user.username}
              onChange={e => setField('user.username', e.target.value)}
              placeholder="john_doe"
            />
          </Field>
          <Field label="Email Address" required error={errors['user.email']}>
            <Input
              type="email"
              value={form.user.email}
              onChange={e => setField('user.email', e.target.value)}
              placeholder="john@example.com"
            />
          </Field>
          <Field label="Password" required error={errors['user.password']}>
            <Input
              type="password"
              value={form.user.password}
              onChange={e => setField('user.password', e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label="Confirm Password" required error={errors['user.password_confirm']}>
            <Input
              type="password"
              value={form.user.password_confirm}
              onChange={e => setField('user.password_confirm', e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label="First Name" required error={errors['user.first_name']}>
            <Input
              value={form.user.first_name}
              onChange={e => setField('user.first_name', e.target.value)}
              placeholder="John"
            />
          </Field>
          <Field label="Last Name" error={errors['user.last_name']}>
            <Input
              value={form.user.last_name}
              onChange={e => setField('user.last_name', e.target.value)}
              placeholder="Doe"
            />
          </Field>
          <Field label="Phone Number" error={errors['user.phone']}>
            <Input
              value={form.user.phone}
              onChange={e => setField('user.phone', e.target.value)}
              placeholder="+91 ..."
            />
          </Field>
        </div>
      )}
    </div>
  );
};

/**
 * Shared Relationship Info for Overview/View modes
 */
export const RelationshipOverviewSection = ({ item }) => {
  const cust = item?.customer || item;
  return (
    <>
      <Section title="Relationship Management" />
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="Sales Person" value={cust.sales_person?.full_name || cust.sales_person?.name || cust.sales_person_name || 'Not Assigned'} />
        <InfoCard label="Account Manager" value={cust.account_manager?.full_name || cust.account_manager?.name || cust.account_manager_name || 'Not Assigned'} />
        <InfoCard label="Portal User" value={cust.portal_user?.username || cust.user?.username || 'None'} />
        <InfoCard label="Warehouse Address" value={item.warehouse_address || 'Not Provided'} />
      </div>
    </>
  );
};

// Internal Import for local use
import { InfoCard } from '../../Vehicles/Common/VehicleCommon';
