import React, { useMemo, useState } from 'react'
import { Edit2, Plus, Trash2 } from 'lucide-react'

import FinanceListPage from '../Common/FinanceListPage'
import {
  useCreatePayrollDeduction,
  useDeletePayrollDeduction,
  usePayrollDeductions,
  useUpdatePayrollDeduction,
} from '../../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function PayrollDeductionsPage() {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  const initialForm = {
    name: '',
    description: '',
    type: 'FIXED',
    amount: '',
  }
  const [form, setForm] = useState(initialForm)

  const queryParams = useMemo(() => ({ search }), [search])
  const { data, isLoading, refetch } = usePayrollDeductions(queryParams)
  const createDeduc = useCreatePayrollDeduction()
  const updateDeduc = useUpdatePayrollDeduction()
  const deleteDeduc = useDeletePayrollDeduction()
  
  const rows = asList(data)

  return (
    <>
      <FinanceListPage
        title="Payroll Deductions"
        subtitle="Manage standardized deduction types applied across payroll entries."
        search={search}
        setSearch={setSearch}
        onRefresh={refetch}
        isLoading={isLoading}
        rows={rows}
        columns={[
          { key: 'name', title: 'Name', render: (v) => <span className="font-bold text-[#172B4D]">{v}</span> },
          { key: 'description', title: 'Description' },
          { key: 'type', title: 'Type', render: (v) => <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">{v}</span> },
          { key: 'amount', title: 'Default Amount', render: (v) => <span className="text-red-600 font-bold">₹{Number(v || 0).toLocaleString()}</span> },
        ]}
        actions={(
          <button 
            type="button" 
            onClick={() => {
              setForm(initialForm)
              setEditingId(null)
              setShowCreate(true)
            }} 
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#0747A6] text-white text-xs font-bold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={14} /> New deduction
          </button>
        )}
        rowActions={(row) => (
          <>
            <button 
              type="button" 
              onClick={() => { setForm(row); setEditingId(row.id); setShowCreate(true) }} 
              className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg transition-all"
            >
              <Edit2 size={16} />
            </button>
            <button 
              type="button" 
              onClick={() => window.confirm('Delete this deduction type?') && deleteDeduc.mutate(row.id, { onSuccess: refetch })} 
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091E42]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-white/20">
            <h3 className="text-xl font-black text-[#172B4D]">{editingId ? 'Edit deduction' : 'Create deduction'}</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="e.g. Employee State Insurance" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all min-h-[60px]" placeholder="Brief explanation..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="FIXED">Fixed Amount</option>
                    <option value="PERCENTAGE">Percentage</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setShowCreate(false)}>Cancel</button>
              <button
                type="button"
                className="px-8 py-2.5 rounded-xl bg-[#0052CC] text-white text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                disabled={createDeduc.isPending || updateDeduc.isPending}
                onClick={() => {
                  if (editingId) {
                    updateDeduc.mutate({ id: editingId, data: form }, { onSuccess: () => { setShowCreate(false); refetch() } })
                  } else {
                    createDeduc.mutate(form, { onSuccess: () => { setShowCreate(false); refetch() } })
                  }
                }}
              >
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
