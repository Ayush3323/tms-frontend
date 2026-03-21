import React, { useState } from 'react';
import { Loader2, Plus, Pencil } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import StatusBadge from '../../common/StatusBadge';
import { FREQUENCY_STYLES } from '../../common/constants';
import { cleanObject, formatError } from '../../common/utils';
import {
  useCreateSalaryStructure,
  useUpdateSalaryStructure,
  useDeleteSalaryStructure,
} from '../../../../queries/drivers/salaryStructureQuery';

export const PAYMENT_FREQUENCIES = ['MONTHLY', 'BIWEEKLY', 'WEEKLY'];

export const formatCurrency = (val) => {
  if (val == null) return '—';
  const numericVal = typeof val === 'object' ? sumObjectValues(val) : Number(val);
  if (isNaN(numericVal)) return '—';
  return `₹${numericVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

export const sumObjectValues = (obj) => {
  if (!obj) return 0;
  if (typeof obj !== 'object') return parseFloat(obj) || 0;
  return Object.values(obj).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
};

const valueToObject = (val) => {
  if (!val) return {};
  if (typeof val === 'object') return val;
  return { "Total": parseFloat(val) || 0 };
};

// Net Salary Preview component
export const NetSalaryPreview = ({ base, allowances, deductions }) => {
  const b = parseFloat(base) || 0;
  const a = typeof allowances === 'object' ? sumObjectValues(allowances) : (parseFloat(allowances) || 0);
  const d = typeof deductions === 'object' ? sumObjectValues(deductions) : (parseFloat(deductions) || 0);
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
import DriverSelect from '../../common/DriverSelect';

export const AddSalaryModal = ({ driverId, onClose }) => {
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const [form, setForm] = useState({
    base_salary: '',
    per_trip_rate: '',
    per_km_rate: '',
    overtime_rate: '',
    allowances: '',
    deductions: '',
    payment_frequency: 'MONTHLY',
    effective_from: '',
    effective_to: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const createSalary = useCreateSalaryStructure(targetDriverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!targetDriverId) return setError('Please select a driver.');
    if (!form.base_salary) return setError('Base salary is required.');
    if (!form.effective_from) return setError('Effective from date is required.');

    if (form.effective_to && form.effective_to < form.effective_from) {
      return setError('Effective To date cannot be before Effective From date.');
    }

    const submissionData = {
      ...form,
      per_trip_rate: form.per_trip_rate || 0,
      per_km_rate: form.per_km_rate || 0,
      overtime_rate: form.overtime_rate || 0,
      allowances: valueToObject(form.allowances),
      deductions: valueToObject(form.deductions),
    };

    createSalary.mutate(cleanObject(submissionData), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Add Salary Structure"
      description="Set salary details"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.base_salary || !form.effective_from || createSalary.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createSalary.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Salary</>}
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
          <div><Label required>base_salary (₹)</Label><Input type="number" placeholder="monthly base" value={form.base_salary} onChange={set('base_salary')} /></div>
          <div><Label>per_trip_rate (₹)</Label><Input type="number" placeholder="rate per trip" value={form.per_trip_rate} onChange={set('per_trip_rate')} /></div>
          <div><Label>per_km_rate (₹)</Label><Input type="number" placeholder="rate per km" value={form.per_km_rate} onChange={set('per_km_rate')} /></div>
          <div><Label>overtime_rate (₹/hr)</Label><Input type="number" placeholder="hourly rate" value={form.overtime_rate} onChange={set('overtime_rate')} /></div>
          <div><Label>payment_frequency</Label>
            <Select value={form.payment_frequency} onChange={set('payment_frequency')}>
              {PAYMENT_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </div>
          <div><Label>allowances (₹)</Label><Input type="number" placeholder="total allowances" value={form.allowances} onChange={set('allowances')} /></div>
          <div><Label>deductions (₹)</Label><Input type="number" placeholder="total deductions" value={form.deductions} onChange={set('deductions')} /></div>
          <div><Label required>effective_from</Label><Input type="date" value={form.effective_from} onChange={set('effective_from')} /></div>
          <div><Label>effective_to</Label><Input type="date" value={form.effective_to} onChange={set('effective_to')} /></div>
        </div>
        <NetSalaryPreview base={form.base_salary} allowances={form.allowances} deductions={form.deductions} />
        <div><Label>Notes</Label>
          <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const EditSalaryModal = ({ salary, driverId, onClose }) => {
  const [form, setForm] = useState({
    base_salary: salary.base_salary ?? '',
    per_trip_rate: salary.per_trip_rate ?? '',
    per_km_rate: salary.per_km_rate ?? '',
    overtime_rate: salary.overtime_rate ?? '',
    allowances: typeof salary.allowances === 'object' ? sumObjectValues(salary.allowances) : (salary.allowances ?? ''),
    deductions: typeof salary.deductions === 'object' ? sumObjectValues(salary.deductions) : (salary.deductions ?? ''),
    payment_frequency: salary.payment_frequency ?? 'MONTHLY',
    effective_from: salary.effective_from ?? '',
    effective_to: salary.effective_to ?? '',
    notes: salary.notes ?? '',
  });
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const updateSalary = useUpdateSalaryStructure(driverId, salary.id);
  const deleteSalary = useDeleteSalaryStructure(driverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.base_salary) return setError('Base salary is required.');
    if (!form.effective_from) return setError('Effective from date is required.');

    if (form.effective_to && form.effective_to < form.effective_from) {
      return setError('Effective To date cannot be before Effective From date.');
    }

    const submissionData = {
      ...form,
      per_trip_rate: form.per_trip_rate || 0,
      per_km_rate: form.per_km_rate || 0,
      overtime_rate: form.overtime_rate || 0,
      allowances: valueToObject(form.allowances),
      deductions: valueToObject(form.deductions),
    };

    updateSalary.mutate(cleanObject(submissionData), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Edit Salary Structure"
      description={<span>Effective from: <span className="font-semibold text-gray-600">{salary.effective_from}</span></span>}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Delete Structure
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={!form.base_salary || !form.effective_from || updateSalary.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
              {updateSalary.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Pencil size={14} /> Update Salary</>}
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Salary Structure?"
          description="Everything for this salary structure will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteSalary.mutate(salary.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteSalary.isPending}
        />
      )}
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div><Label required>base_salary (₹)</Label><Input type="number" placeholder="monthly base" value={form.base_salary} onChange={set('base_salary')} /></div>
          <div><Label>per_trip_rate (₹)</Label><Input type="number" placeholder="rate per trip" value={form.per_trip_rate} onChange={set('per_trip_rate')} /></div>
          <div><Label>per_km_rate (₹)</Label><Input type="number" placeholder="rate per km" value={form.per_km_rate} onChange={set('per_km_rate')} /></div>
          <div><Label>overtime_rate (₹/hr)</Label><Input type="number" placeholder="hourly rate" value={form.overtime_rate} onChange={set('overtime_rate')} /></div>
          <div><Label>payment_frequency</Label>
            <Select value={form.payment_frequency} onChange={set('payment_frequency')}>
              {PAYMENT_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </div>
          <div><Label>allowances (₹)</Label><Input type="number" placeholder="total allowances" value={form.allowances} onChange={set('allowances')} /></div>
          <div><Label>deductions (₹)</Label><Input type="number" placeholder="total deductions" value={form.deductions} onChange={set('deductions')} /></div>
          <div><Label required>effective_from</Label><Input type="date" value={form.effective_from} onChange={set('effective_from')} /></div>
          <div><Label>effective_to</Label><Input type="date" value={form.effective_to} onChange={set('effective_to')} /></div>
        </div>
        <NetSalaryPreview base={form.base_salary} allowances={form.allowances} deductions={form.deductions} />
        <div><Label>Notes</Label>
          <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const ViewSalaryModal = ({ salary, onClose }) => {
  const b = parseFloat(salary.base_salary) || 0;
  
  const getArr = (val) => {
    if (!val) return [];
    if (typeof val === 'object' && !Array.isArray(val)) return Object.entries(val);
    return [['Total', val]];
  };

  const allowancesArr = getArr(salary.allowances);
  const deductionsArr = getArr(salary.deductions);
  const aTotal = sumObjectValues(salary.allowances);
  const dTotal = sumObjectValues(salary.deductions);
  const net = b + aTotal - dTotal;

  return (
    <ModalWrapper
      title="Salary Structure Detail"
      description={<span>Effective from: <span className="font-semibold text-gray-600">{salary.effective_from}</span></span>}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="space-y-5 pb-1">
        {/* Core Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">payment_frequency</p>
            <StatusBadge label={salary.payment_frequency_display || salary.payment_frequency} styles={FREQUENCY_STYLES[salary.payment_frequency]} />
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Effective Range</p>
            <p className="text-sm font-bold text-[#172B4D]">
              {salary.effective_from} → {salary.effective_to || 'Current'}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Base Salary</span>
            <span className="font-bold text-[#172B4D]">{formatCurrency(b)}</span>
          </div>

          {allowancesArr.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-dashed border-gray-100">
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Allowances</p>
              {allowancesArr.map(([key, val]) => (
                <div key={key} className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">{key}</span>
                  <span className="font-medium text-green-700">+{formatCurrency(val)}</span>
                </div>
              ))}
            </div>
          )}

          {deductionsArr.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-dashed border-gray-100">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Deductions</p>
              {deductionsArr.map(([key, val]) => (
                <div key={key} className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">{key}</span>
                  <span className="font-medium text-red-600">-{formatCurrency(val)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Rates */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
             <div><p className="text-[9px] text-gray-400 uppercase font-bold">per_trip_rate</p><p className="text-xs font-bold">{formatCurrency(salary.per_trip_rate)}</p></div>
             <div><p className="text-[9px] text-gray-400 uppercase font-bold">per_km_rate</p><p className="text-xs font-bold">{formatCurrency(salary.per_km_rate)}</p></div>
             <div><p className="text-[9px] text-gray-400 uppercase font-bold">overtime_rate</p><p className="text-xs font-bold">{formatCurrency(salary.overtime_rate)}/hr</p></div>
          </div>
        </div>

        {/* Final Net */}
        <div className="p-4 bg-[#0052CC] rounded-2xl shadow-xl shadow-blue-100 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mb-0.5">Final Net Salary</p>
              <p className="text-2xl font-black">{formatCurrency(salary.net_salary || net)}</p>
            </div>
            <div className="text-right">
               <p className="text-[9px] text-blue-200">Base + Allowances - Deductions</p>
            </div>
          </div>
        </div>

        {salary.notes && (
          <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
            <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-1">Notes</p>
            <p className="text-xs text-yellow-800 leading-relaxed italic">"{salary.notes}"</p>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};

export const DeleteSalaryDialog = ({ salary, driverId, onClose }) => {
  const deleteMutation = useDeleteSalaryStructure(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(salary.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Salary Structure?"
      description={<p>Structure from <span className="font-semibold text-gray-600">{salary.effective_from}</span> will be permanently deleted.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};
