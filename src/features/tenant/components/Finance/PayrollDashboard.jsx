import React, { useMemo, useState } from 'react'
import { CheckCircle2, Coins } from 'lucide-react'

import FinanceListPage from './FinanceListPage'
import {
  useClosePayrollPeriod,
  useGeneratePayrollEntries,
  useMarkAllPayrollPaid,
  usePayrollPeriods,
} from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function PayrollDashboard() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
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
  const rows = asList(data)
  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
    { label: 'Open', value: rows.filter((r) => r.status === 'OPEN').length, className: 'text-amber-600' },
    { label: 'Processing', value: rows.filter((r) => r.status === 'PROCESSING').length, className: 'text-indigo-600' },
    { label: 'Closed', value: rows.filter((r) => r.status === 'CLOSED').length, className: 'text-green-600' },
  ]), [data?.count, rows])

  return (
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
      rowActions={(row) => (
        <>
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
  )
}
