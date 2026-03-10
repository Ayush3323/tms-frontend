import { useState, useEffect } from 'react';
import {
  useCreateDomainMutation,
  useDeleteDomainMutation,
} from '../queries/domainQuery';
import { useTenants } from '../queries/tenantQuery';

/* ══════════════════════════════════════════════
   MODAL WRAPPER
══════════════════════════════════════════════ */
function Modal({ open, onClose, children, maxWidth = 460 }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3
                 bg-gray-900/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-h-[92vh] overflow-y-auto"
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, sub, onClose }) {
  return (
    <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100
                    sticky top-0 bg-white z-10 rounded-t-2xl">
      <div>
        <div className="text-sm font-extrabold text-gray-800">{title}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
      <button
        onClick={onClose}
        className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center
                   justify-center text-gray-400 text-xs hover:bg-red-50 hover:text-red-500
                   hover:border-red-200 transition-all cursor-pointer"
      >✕</button>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </div>
  );
}

const inputCls = `w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm
                  text-gray-800 outline-none focus:border-indigo-400 focus:ring-2
                  focus:ring-indigo-100 placeholder:text-gray-400 transition-all`;

/* ══════════════════════════════════════════════
   CREATE DOMAIN MODAL
   tenantId → URL se aaya (particular tenant)
   tenantId → null (sidebar se aaya, dropdown show)
══════════════════════════════════════════════ */
export function CreateDomainModal({ open, onClose, tenantId = null }) {
  const createMutation = useCreateDomainMutation();

  // ✅ Fix 1: useEffect hataya, seedha useState mein tenantId diya
  const [form, setForm] = useState({
    tenant    : tenantId || '',
    domain    : '',
    is_primary: false,
  });
  const [errors, setErrors] = useState({});

  // ✅ Fix 2: useTenantsQuery ka dusra argument hataya
  const { data: tenantsData } = useTenants({});

  const validate = () => {
    const e = {};
    if (!form.tenant)        e.tenant = 'Please select a tenant';
    if (!form.domain.trim()) e.domain = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ✅ Fix 3: reset mein bhi seedha tenantId
  const reset = () => {
    setForm({
      tenant    : tenantId || '',
      domain    : '',
      is_primary: false,
    });
    setErrors({});
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createMutation.mutate(form, {
      onSuccess: () => { onClose(); reset(); },
    });
  };

  const handleClose = () => { onClose(); reset(); };

  return (
    <Modal open={open} onClose={handleClose} maxWidth={460}>
      <ModalHeader
        title="🌐 Add New Domain"
        sub="Assign a domain to a tenant"
        onClose={handleClose}
      />

      <div className="px-5 py-4 space-y-3">

        {/* Tenant Field */}
        {tenantId ? (
          // Particular tenant se aaye → locked field
          <Field label="Tenant">
            <input
              className={`${inputCls} opacity-60 cursor-not-allowed`}
              value="Tenant selected from URL"
              disabled
            />
            <span className="text-[11px] text-indigo-500">
              ✓ Domain will be added to the selected tenant
            </span>
          </Field>
        ) : (
          // Sidebar se aaye → dropdown
          <Field label="Tenant" required error={errors.tenant}>
            <select
              className={inputCls}
              value={form.tenant}
              onChange={(e) => setForm((p) => ({ ...p, tenant: e.target.value }))}
            >
              <option value="">Select tenant</option>
              {tenantsData?.results?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.company_name}
                </option>
              ))}
            </select>
          </Field>
        )}

        {/* Domain Field */}
        <Field label="Domain" required error={errors.domain}>
          <input
            className={inputCls}
            value={form.domain}
            placeholder="e.g. abc.tms.app or abclogistics.com"
            onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}
          />
        </Field>

        {/* Primary Checkbox */}
        <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border
                        border-gray-200 rounded-lg">
          <input
            type="checkbox"
            id="is_primary"
            checked={form.is_primary}
            onChange={(e) =>
              setForm((p) => ({ ...p, is_primary: e.target.checked }))
            }
            className="w-4 h-4 accent-indigo-500 cursor-pointer"
          />
          <label htmlFor="is_primary" className="text-xs font-bold text-gray-700 cursor-pointer">
            Set as Primary Domain
          </label>
          <span className="text-[11px] text-gray-400 ml-auto">
            ⭐ Main login domain
          </span>
        </div>

        {/* API Error */}
        {createMutation.isError && (
          <div className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-100
                          text-red-600 text-xs">
            ⚠️ {createMutation.error?.response?.data?.error?.message
              || 'Failed to create domain.'}
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
        <button
          onClick={handleClose}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs
                     font-bold hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500
                     text-white text-xs font-bold shadow-sm hover:shadow-indigo-200
                     hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-60"
        >
          {createMutation.isPending ? '⏳ Adding…' : '🌐 Add Domain'}
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════
   DELETE DOMAIN MODAL
══════════════════════════════════════════════ */
export function DeleteDomainModal({ open, domain, onClose }) {
  const deleteMutation = useDeleteDomainMutation();

  const handleConfirm = () => {
    deleteMutation.mutate(domain?.id, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={400}>
      <ModalHeader
        title="🗑 Delete Domain"
        sub="This action cannot be undone"
        onClose={onClose}
      />

      <div className="px-5 py-4 space-y-3">
        <div className="flex gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
          <span className="text-lg leading-tight">⚠️</span>
          <div>
            <div className="text-xs font-bold text-red-700">
              Are you sure you want to delete this domain?
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Domain{' '}
              <span className="font-mono font-bold text-gray-700">
                {domain?.domain}
              </span>{' '}
              will be permanently removed.
            </div>
          </div>
        </div>

        {domain?.is_primary && (
          <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100
                          text-[11px] text-amber-700 font-medium">
            ⭐ This is a primary domain. Deleting it may affect tenant login.
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs
                     font-bold hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={deleteMutation.isPending}
          className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600
                     text-xs font-bold hover:bg-red-100 transition-all disabled:opacity-50"
        >
          {deleteMutation.isPending ? '⏳ Deleting…' : '🗑 Confirm Delete'}
        </button>
      </div>
    </Modal>
  );
}