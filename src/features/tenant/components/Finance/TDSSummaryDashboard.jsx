import React, { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

import FinanceListPage from './FinanceListPage'
import { useFileTDSReturn, useIssueTDSCertificate, useTDSEntries } from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function TDSSummaryDashboard() {
  const [search, setSearch] = useState('')
  const { data, isLoading, refetch } = useTDSEntries(search ? { search } : {})
  const issue = useIssueTDSCertificate()
  const fileReturn = useFileTDSReturn()
  const rows = asList(data)
  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
    { label: 'Calculated', value: rows.filter((r) => r.status === 'CALCULATED').length, className: 'text-amber-600' },
    { label: 'Filed', value: rows.filter((r) => r.status === 'FILED').length, className: 'text-indigo-600' },
    { label: 'Paid', value: rows.filter((r) => r.status === 'PAID').length, className: 'text-green-600' },
  ]), [data?.count, rows])

  return (
    <FinanceListPage
      title="TDS Summary"
      subtitle="Track deductible tax entries and filing progress by quarter."
      search={search}
      setSearch={setSearch}
      onRefresh={refetch}
      isLoading={isLoading}
      stats={stats}
      rows={rows}
      columns={[
        { key: 'owner_name', title: 'Owner' },
        { key: 'trip_id', title: 'Trip ID' },
        { key: 'financial_year', title: 'Financial Year' },
        { key: 'quarter', title: 'Quarter' },
        { key: 'tds_amount', title: 'TDS Amount' },
        { key: 'status', title: 'Status' },
      ]}
      actions={(
        <button
          type="button"
          onClick={() => {
            const financial_year = window.prompt('Financial Year (e.g. 2025-26)')
            const quarter = window.prompt('Quarter (e.g. Q1)')
            if (financial_year && quarter) fileReturn.mutate({ financial_year, quarter })
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] rounded-xl text-xs font-bold text-white hover:bg-[#0747A6] shadow-md shadow-blue-100 transition-all"
        >
          File Return
        </button>
      )}
      rowActions={(row) => (
        <>
          {row.status === 'CALCULATED' && (
            <button
              type="button"
              onClick={() => {
                const cert = window.prompt('TDS Certificate Number')
                if (cert) issue.mutate({ id: row.id, tds_certificate_number: cert })
              }}
              className="p-2 text-gray-400 hover:text-green-600 rounded-lg"
              title="Issue Certificate"
            >
              <CheckCircle2 size={16} />
            </button>
          )}
        </>
      )}
    />
  )
}
