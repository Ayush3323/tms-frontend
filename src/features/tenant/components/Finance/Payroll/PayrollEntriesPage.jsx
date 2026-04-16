import React, { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Coins, Edit2, Plus, Trash2 } from 'lucide-react'

import FinanceListPage from '../Common/FinanceListPage'
import {
  useCreatePayrollEntry,
  useDeletePayrollEntry,
  useMarkPayrollEntryPaid,
  usePayrollDeductions,
  usePayrollEntries,
  useUpdatePayrollEntry,
} from '../../../queries/finance/financeQuery'
import { useDrivers } from '../../../queries/drivers/driverCoreQuery'
import { getDriverName } from '../../Drivers/common/utils'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function PayrollEntriesPage() {
  const { periodId } = useParams()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  const initialForm = {
    payroll_period: periodId,
    driver_id: '',
    // Earnings
    base_salary: 0,
    trip_earnings: 0,
    per_km_earnings: 0,
    overtime_amount: 0,
    total_earnings: 0,
    // Deductions
    advance_recovery: 0,
    tds_deduction: 0,
    total_deductions: 0,
    // Finals
    gross_pay: 0,
    net_pay: 0,
    payment_status: 'PENDING',
    notes: '',
  }
  const [form, setForm] = useState(initialForm)

  const params = useMemo(() => ({ payroll_period: periodId, page_size: 200 }), [periodId])
  const { data, isLoading, refetch } = usePayrollEntries(params)
  const { data: driversData } = useDrivers({ page_size: 1000 })
  const { data: deductionsData } = usePayrollDeductions({ page_size: 1000 })
  
  const createEntry = useCreatePayrollEntry()
  const updateEntry = useUpdatePayrollEntry()
  const deleteEntry = useDeletePayrollEntry()
  const markPaid = useMarkPayrollEntryPaid()
  
  const rows = asList(data)
  const drivers = asList(driversData)
  const deductionTypes = asList(deductionsData)

  const stats = useMemo(() => ([
    { label: 'Total', value: rows.length, className: 'text-blue-600' },
    { label: 'Pending', value: rows.filter((r) => r.payment_status === 'PENDING').length, className: 'text-amber-600' },
    { label: 'Paid', value: rows.filter((r) => r.payment_status === 'PAID').length, className: 'text-green-600' },
  ]), [rows])

  const calculatedForm = useMemo(() => {
    const te = Number(form.base_salary || 0) + Number(form.trip_earnings || 0) + Number(form.per_km_earnings || 0) + Number(form.overtime_amount || 0)
    const td = Number(form.advance_recovery || 0) + Number(form.tds_deduction || 0) + Number(form.total_deductions || 0)
    return {
      ...form,
      total_earnings: te,
      gross_pay: te,
      net_pay: te - td
    }
  }, [form])

  const handleSave = () => {
    const payload = { 
      ...calculatedForm,
      base_salary: Number(calculatedForm.base_salary),
      trip_earnings: Number(calculatedForm.trip_earnings),
      per_km_earnings: Number(calculatedForm.per_km_earnings),
      overtime_amount: Number(calculatedForm.overtime_amount),
      advance_recovery: Number(calculatedForm.advance_recovery),
      tds_deduction: Number(calculatedForm.tds_deduction),
      total_deductions: Number(calculatedForm.total_deductions),
    }
    
    if (editingId) {
      updateEntry.mutate({ id: editingId, data: payload }, { onSuccess: () => { setShowForm(false); refetch() } })
    } else {
      createEntry.mutate(payload, { onSuccess: () => { setShowForm(false); refetch() } })
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-4 font-sans">
        <button
          type="button"
          onClick={() => navigate('/tenant/dashboard/finance/payroll')}
          className="inline-flex items-center gap-2 text-[#0052CC] text-xs font-bold uppercase tracking-wider hover:underline transition-all"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
        <FinanceListPage
          embedded
          showSearch={false}
          title="Payroll Entries"
          subtitle={`Managing entries for period: ${periodId?.slice(0, 8).toUpperCase()}`}
          onRefresh={refetch}
          isLoading={isLoading}
          stats={stats}
          rows={rows}
          columns={[
            {
              key: 'driver_id',
              title: 'Employee',
              render: (eid, row) => {
                const uid = row.driver_id || row.employee_id || row.user_id
                const d = drivers.find(drv => drv.id === uid || drv.user_id === uid)
                return (
                  <div className="flex flex-col">
                    <span className="font-bold text-[#172B4D]">{d ? getDriverName(d) : 'System User'}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{(uid || '-').slice(0, 8)}</span>
                  </div>
                )
              }
            },
            { 
              key: 'gross_pay', 
              title: 'Gross Pay', 
              render: (_, row) => <span className="text-[#172B4D] font-bold">₹{Number(row.gross_pay || row.total_earnings || 0).toLocaleString()}</span> 
            },
            { 
              key: 'total_deductions', 
              title: 'Deductions', 
              render: (v) => <span className="text-red-600 font-medium">₹{Number(v || 0).toLocaleString()}</span> 
            },
            { 
              key: 'net_pay', 
              title: 'Net Payable', 
              render: (v) => <span className="text-emerald-700 font-black">₹{Number(v || 0).toLocaleString()}</span>
            },
            { 
              key: 'payment_status', 
              title: 'Status', 
              render: (s) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  s === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {s}
                </span>
              ) 
            },
          ]}
          actions={(
            <button 
              type="button" 
              onClick={() => { setForm(initialForm); setEditingId(null); setShowForm(true) }} 
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#0747A6] text-white text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Plus size={14} /> New Entry
            </button>
          )}
          rowActions={(row) => (
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => { setForm(row); setEditingId(row.id); setShowForm(true) }} 
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              >
                <Edit2 size={16} />
              </button>
              {row.payment_status === 'PENDING' && (
                <button
                  type="button"
                  disabled={markPaid.isPending}
                  onClick={() => markPaid.mutate(row.id, { onSuccess: () => refetch() })}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white disabled:opacity-50 transition-all uppercase tracking-tighter"
                >
                  Mark Paid
                </button>
              )}
              <button 
                type="button" 
                onClick={() => window.confirm('Delete entry?') && deleteEntry.mutate(row.id, { onSuccess: refetch })} 
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091E42]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full space-y-5 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-black text-[#172B4D] tracking-tight">{editingId ? 'Edit Payroll Entry' : 'Manual Payroll Entry'}</h3>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Entry Details & Calculations</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-500">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">Employee / Driver</label>
                <select 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={form.driver_id || form.employee_id} 
                  onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                >
                  <option value="">Select an employee...</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{getDriverName(d)} (ID: {d.employee_id || 'N/A'})</option>
                  ))}
                </select>
              </div>

              {/* Grid for detailed fields */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">Base Salary (₹)</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.base_salary} onChange={(e) => setForm({ ...form, base_salary: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">Trip Earnings (₹)</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.trip_earnings} onChange={(e) => setForm({ ...form, trip_earnings: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">Per KM Earnings (₹)</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.per_km_earnings} onChange={(e) => setForm({ ...form, per_km_earnings: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">Overtime (₹)</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.overtime_amount} onChange={(e) => setForm({ ...form, overtime_amount: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">Advance Recovery (₹)</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.advance_recovery} onChange={(e) => setForm({ ...form, advance_recovery: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">TDS Deduction (₹)</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.tds_deduction} onChange={(e) => setForm({ ...form, tds_deduction: e.target.value })} />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">Other Deductions (₹)</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.total_deductions} onChange={(e) => setForm({ ...form, total_deductions: e.target.value })} />
              </div>

              <div className="col-span-2 p-4 bg-[#F4F5F7] rounded-xl flex justify-between items-center border border-gray-200">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Total Net Payable</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-emerald-600">Earnings ₹{calculatedForm.total_earnings}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-[10px] font-bold text-red-600">Deductions ₹{calculatedForm.total_deductions + Number(calculatedForm.advance_recovery) + Number(calculatedForm.tds_deduction)}</span>
                  </div>
                </div>
                <span className="text-2xl text-[#172B4D] font-black tracking-tight">₹{calculatedForm.net_pay.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors uppercase tracking-widest" onClick={() => setShowForm(false)}>Discard</button>
              <button
                type="button"
                className="px-8 py-2.5 rounded-xl bg-[#0052CC] text-white text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
                disabled={!form.driver_id || createEntry.isPending || updateEntry.isPending}
                onClick={handleSave}
              >
                {editingId ? 'Update' : 'Post Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
