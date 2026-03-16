import React, { useState } from 'react';
import {
  Loader2, AlertCircle, Plus,
  Pencil, Trash2, Wallet, RefreshCw,
  X, ChevronDown,
} from 'lucide-react';
import {
  useDriverSalaryStructures,
  useCreateSalaryStructure,
  useUpdateSalaryStructure,
  useDeleteSalaryStructure,
} from '../../../queries/drivers/salaryStructureQuery';

// ── Style Maps ────────────────────────────────────────────────────────

const FREQUENCY_STYLES = {
  MONTHLY:  { text: 'text-blue-700',   bg: 'bg-blue-50 border border-blue-200' },
  BIWEEKLY: { text: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200' },
  WEEKLY:   { text: 'text-purple-700', bg: 'bg-purple-50 border border-purple-200' },
};

const PAYMENT_FREQUENCIES = ['MONTHLY', 'BIWEEKLY', 'WEEKLY'];

// ── Helpers ───────────────────────────────────────────────────────────

const formatCurrency = (val) => {
  if (val == null) return '—';
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

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

const Sel = ({ children, ...props }) => (
  <div className="relative">
    <select {...props}
      className="w-full appearance-none px-3 pr-8 py-2 text-sm border border-gray-200
        rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20
        focus:border-[#0052CC] cursor-pointer transition-all">
      {children}
    </select>
    <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);

// ── Net Salary Preview ────────────────────────────────────────────────
const NetSalaryPreview = ({ base, allowances, deductions }) => {
  const b = parseFloat(base)       || 0;
  const a = parseFloat(allowances) || 0;
  const d = parseFloat(deductions) || 0;
  const net = b + a - d;
  return (
    <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
      <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-1">Calculated Net Salary</p>
      <p className="text-xl font-black text-[#0052CC]">
        {net > 0 ? `₹${net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
      </p>
      <p className="text-[10px] text-blue-400 mt-0.5">Base + Allowances − Deductions</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// ── MODALS START HERE ─────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────

// ── Add Salary Modal ──────────────────────────────────────────────────
const AddSalaryModal = ({ driverId, onClose }) => {
  const [form, setForm] = useState({
    base_salary:        '',
    allowances:         '',
    deductions:         '',
    payment_frequency:  'MONTHLY',
    effective_from:     '',
    effective_to:       '',
    notes:              '',
  });
  const [error, setError] = useState('');
  const createSalary = useCreateSalaryStructure(driverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.base_salary)    return setError('Base salary is required.');
    if (!form.effective_from) return setError('Effective from date is required.');

    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    createSalary.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to add salary structure.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Add Salary Structure</h2>
            <p className="text-xs text-gray-400 mt-0.5">Set salary details for this driver</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div><Label required>Base Salary (₹)</Label>
              <Input type="number" placeholder="e.g. 50000" min="0" step="0.01" value={form.base_salary} onChange={set('base_salary')} />
            </div>
            <div><Label>Payment Frequency</Label>
              <Sel value={form.payment_frequency} onChange={set('payment_frequency')}>
                {PAYMENT_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
              </Sel>
            </div>
            <div><Label>Allowances (₹)</Label>
              <Input type="number" placeholder="e.g. 10000" min="0" step="0.01" value={form.allowances} onChange={set('allowances')} />
            </div>
            <div><Label>Deductions (₹)</Label>
              <Input type="number" placeholder="e.g. 5000" min="0" step="0.01" value={form.deductions} onChange={set('deductions')} />
            </div>
            <div><Label required>Effective From</Label>
              <Input type="date" value={form.effective_from} onChange={set('effective_from')} />
            </div>
            <div><Label>Effective To</Label>
              <Input type="date" value={form.effective_to} onChange={set('effective_to')} />
            </div>
          </div>

          {/* Net Salary Preview */}
          <NetSalaryPreview
            base={form.base_salary}
            allowances={form.allowances}
            deductions={form.deductions}
          />

          <div><Label>Notes</Label>
            <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.base_salary || !form.effective_from || createSalary.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createSalary.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Salary</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Salary Modal ─────────────────────────────────────────────────
const EditSalaryModal = ({ salary, driverId, onClose }) => {
  const [form, setForm] = useState({
    base_salary:       salary.base_salary       ?? '',
    allowances:        salary.allowances        ?? '',
    deductions:        salary.deductions        ?? '',
    payment_frequency: salary.payment_frequency ?? 'MONTHLY',
    effective_from:    salary.effective_from    ?? '',
    effective_to:      salary.effective_to      ?? '',
    notes:             salary.notes             ?? '',
  });
  const [error, setError] = useState('');
  const updateSalary = useUpdateSalaryStructure(driverId, salary.id);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.base_salary)    return setError('Base salary is required.');
    if (!form.effective_from) return setError('Effective from date is required.');

    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    updateSalary.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to update salary structure.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Edit Salary Structure</h2>
            <p className="text-xs text-gray-400 mt-0.5">Effective from: <span className="font-semibold text-gray-600">{salary.effective_from}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div><Label required>Base Salary (₹)</Label>
              <Input type="number" placeholder="e.g. 50000" min="0" step="0.01" value={form.base_salary} onChange={set('base_salary')} />
            </div>
            <div><Label>Payment Frequency</Label>
              <Sel value={form.payment_frequency} onChange={set('payment_frequency')}>
                {PAYMENT_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
              </Sel>
            </div>
            <div><Label>Allowances (₹)</Label>
              <Input type="number" placeholder="e.g. 10000" min="0" step="0.01" value={form.allowances} onChange={set('allowances')} />
            </div>
            <div><Label>Deductions (₹)</Label>
              <Input type="number" placeholder="e.g. 5000" min="0" step="0.01" value={form.deductions} onChange={set('deductions')} />
            </div>
            <div><Label required>Effective From</Label>
              <Input type="date" value={form.effective_from} onChange={set('effective_from')} />
            </div>
            <div><Label>Effective To</Label>
              <Input type="date" value={form.effective_to} onChange={set('effective_to')} />
            </div>
          </div>

          {/* Net Salary Preview */}
          <NetSalaryPreview
            base={form.base_salary}
            allowances={form.allowances}
            deductions={form.deductions}
          />

          <div><Label>Notes</Label>
            <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.base_salary || !form.effective_from || updateSalary.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {updateSalary.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Pencil size={14} /> Update Salary</>}
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
const DeleteConfirm = ({ salary, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <Trash2 size={20} className="text-red-500" />
      </div>
      <h3 className="text-base font-black text-[#172B4D] mb-1">Delete Salary Structure?</h3>
      <p className="text-sm text-gray-400 mb-5">
        Structure from <span className="font-semibold text-gray-600">{salary.effective_from}</span> will be permanently deleted.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
        <button onClick={onConfirm} disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50">
          {isDeleting ? <><Loader2 size={13} className="animate-spin" /> Deleting...</> : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ── Main Tab Component ────────────────────────────────────────────────
const SalaryTab = ({ driverId }) => {
  const [addOpen,      setAddOpen]      = useState(false);
  const [editSalary,   setEditSalary]   = useState(null);
  const [deleteSalary, setDeleteSalary] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverSalaryStructures(driverId);
  const deleteSalaryMutation = useDeleteSalaryStructure(driverId);
  const salaries = data?.results ?? [];

  const handleDelete = () => {
    deleteSalaryMutation.mutate(deleteSalary.id, {
      onSuccess: () => setDeleteSalary(null),
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <Loader2 size={20} className="animate-spin text-[#0052CC]" />
      <span className="text-sm">Loading salary structures...</span>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
      <AlertCircle size={32} />
      <p className="text-sm font-medium">Failed to load salary structures</p>
      <p className="text-xs text-gray-400">{error?.message}</p>
      <button onClick={() => refetch()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg">
        <RefreshCw size={13} /> Try Again
      </button>
    </div>
  );

  return (
    <>
      {/* ── Modals ── */}
      {addOpen      && <AddSalaryModal  driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editSalary   && <EditSalaryModal salary={editSalary} driverId={driverId} onClose={() => setEditSalary(null)} />}
      {deleteSalary && <DeleteConfirm salary={deleteSalary} onConfirm={handleDelete} onCancel={() => setDeleteSalary(null)} isDeleting={deleteSalaryMutation.isPending} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Salary Structures</h3>
          <p className="text-xs text-gray-400 mt-0.5">{salaries.length} structure{salaries.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
          <Plus size={14} /> Add Salary
        </button>
      </div>

      {/* ── Empty State ── */}
      {salaries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Wallet size={32} className="mb-2 opacity-30" />
          <p className="text-sm font-semibold">No salary structures found</p>
          <p className="text-xs mt-1">Click Add Salary to add one</p>
        </div>
      )}

      {/* ── Table ── */}
      {salaries.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Base Salary','Allowances','Deductions','Net Salary','Frequency','Effective From','Effective To','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {salaries.map(sal => {
                const fr = FREQUENCY_STYLES[sal.payment_frequency] ?? FREQUENCY_STYLES.MONTHLY;
                return (
                  <tr key={sal.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* Base Salary */}
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#172B4D] text-[13px]">
                      {formatCurrency(sal.base_salary)}
                    </td>

                    {/* Allowances */}
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-green-600 font-semibold">
                      {sal.allowances ? `+${formatCurrency(sal.allowances)}` : '—'}
                    </td>

                    {/* Deductions */}
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-red-500 font-semibold">
                      {sal.deductions ? `-${formatCurrency(sal.deductions)}` : '—'}
                    </td>

                    {/* Net Salary */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-black text-[13px] text-[#0052CC]">
                        {formatCurrency(sal.net_salary)}
                      </span>
                    </td>

                    {/* Frequency */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit ${fr.bg} ${fr.text}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {sal.payment_frequency_display ?? sal.payment_frequency}
                      </span>
                    </td>

                    {/* Effective From */}
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                      {sal.effective_from ?? '—'}
                    </td>

                    {/* Effective To */}
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                      {sal.effective_to ?? <span className="text-green-600 font-semibold">Current</span>}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditSalary(sal)}
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => setDeleteSalary(sal)}
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default SalaryTab;