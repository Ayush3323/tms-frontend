import React, { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

import FinanceListPage from './FinanceListPage'
import { useClosePayrollPeriod, useGeneratePayrollEntries, usePayrollPeriods } from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function PayrollDashboard() {
  const [search, setSearch] = useState('')
  const { data, isLoading, refetch } = usePayrollPeriods(search ? { search } : {})
  const generate = useGeneratePayrollEntries()
  const close = useClosePayrollPeriod()
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
            <button type="button" onClick={() => generate.mutate(row.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white">
              Generate
            </button>
          )}
          {['OPEN', 'PROCESSING'].includes(row.status) && (
            <button type="button" onClick={() => close.mutate(row.id)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg" title="Close Period">
              <CheckCircle2 size={16} />
            </button>
          )}
        </>
      )}
    />
  )
}
