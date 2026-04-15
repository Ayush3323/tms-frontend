import React, { useMemo, useState } from 'react'
import { CheckCircle2, Coins, List, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import FinanceListPage from './FinanceListPage'
import {
  useClosePayrollPeriod,
  useCreatePayrollPeriod,
  useGeneratePayrollEntries,
  useMarkAllPayrollPaid,
  usePayrollPeriods,
} from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function PayrollDashboard() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    period_code: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
  })
  const queryParams = useMemo(() => {
    const p = {}
    if (search) p.search = search
    if (status) p.status = status
    return p
  }, [search, status])
  const { data, isLoading, refetch } = usePayrollPeriods(queryParams)
  const generate = useGeneratePayrollEntries()
  const close = useClosePayrollPeriod()
  const markAllPaid = useMarkAllPayrollPaid()
  const createPeriod = useCreatePayrollPeriod()
  const rows = asList(data)
  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
    { label: 'Open', value: rows.filter((r) => r.status === 'OPEN').length, className: 'text-amber-600' },
    { label: 'Processing', value: rows.filter((r) => r.status === 'PROCESSING').length, className: 'text-indigo-600' },
    { label: 'Closed', value: rows.filter((r) => r.status === 'CLOSED').length, className: 'text-green-600' },
  ]), [data?.count, rows])

  return (
    <>
      <FinanceListPage
        title="Payroll"
        subtitle="Generate payroll entries, monitor processing, and close payroll periods."
        search={search}
        setSearch={setSearch}
        secondaryFilters={(
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="PROCESSING">Processing</option>
            <option value="CLOSED">Closed</option>
          </select>
        )}
        onRefresh={refetch}
        isLoading={isLoading}
        stats={stats}
        rows={rows}
        columns={[
          { key: 'period_code', title: 'Period Code' },
          { key: 'month', title: 'Month' },
          { key: 'year', title: 'Year' },
          { key: 'start_date', title: 'Start Date' },
          { key: 'end_date', title: 'End Date' },
          { key: 'status', title: 'Status' },
        ]}
        actions={(
          <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#0052CC] text-white text-xs font-bold">
            <Plus size={14} /> New period
          </button>
        )}
        rowActions={(row) => (
          <>
            <button
              type="button"
              onClick={() => navigate(`/tenant/dashboard/finance/payroll/${row.id}/entries`)}
              className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg"
              title="Entries"
            >
              <List size={16} />
            </button>
            {row.status === 'OPEN' && (
              <button type="button" disabled={generate.isPending} onClick={() => generate.mutate(row.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white disabled:opacity-50">
                Generate
              </button>
            )}
            {['OPEN', 'PROCESSING'].includes(row.status) && (
              <button type="button" disabled={close.isPending} onClick={() => window.confirm('Close this payroll period?') && close.mutate(row.id)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg disabled:opacity-50" title="Close Period">
                <CheckCircle2 size={16} />
              </button>
            )}
            {row.status === 'PROCESSING' && (
              <button
                type="button"
                disabled={markAllPaid.isPending}
                onClick={() => markAllPaid.mutate(row.id)}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg disabled:opacity-50"
                title="Mark All Entries Paid"
              >
                <Coins size={16} />
              </button>
            )}
          </>
        )}
      />
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-2 text-xs shadow-xl">
            <h3 className="text-base font-bold text-[#172B4D]">Create payroll period</h3>
            <input className="w-full border rounded px-2 py-1" placeholder="Period code" value={form.period_code} onChange={(e) => setForm({ ...form, period_code: e.target.value })} />
            <div className="flex gap-2">
              <input type="number" min={1} max={12} className="flex-1 border rounded px-2 py-1" placeholder="Month" value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })} />
              <input type="number" className="flex-1 border rounded px-2 py-1" placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
            </div>
            <input type="date" className="w-full border rounded px-2 py-1" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <input type="date" className="w-full border rounded px-2 py-1" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCreate(false)}>Cancel</button>
              <button
                type="button"
                className="px-3 py-1 rounded-lg bg-[#0052CC] text-white font-bold"
                disabled={!form.period_code || !form.start_date || !form.end_date || createPeriod.isPending}
                onClick={() => createPeriod.mutate(
                  {
                    period_code: form.period_code,
                    month: form.month,
                    year: form.year,
                    start_date: form.start_date,
                    end_date: form.end_date,
                    status: 'OPEN',
                  },
                  { onSuccess: () => { setShowCreate(false); refetch() } },
                )}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
