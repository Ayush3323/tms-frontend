import React, { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import FinanceListPage from './FinanceListPage'
import { useMarkPayrollEntryPaid, usePayrollEntries } from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function PayrollEntriesPage() {
  const { periodId } = useParams()
  const navigate = useNavigate()
  const params = useMemo(() => ({ payroll_period: periodId, page_size: 100 }), [periodId])
  const { data, isLoading, refetch } = usePayrollEntries(params)
  const markPaid = useMarkPayrollEntryPaid()
  const rows = asList(data)

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate('/tenant/dashboard/finance/payroll')}
          className="inline-flex items-center gap-2 text-[#0052CC] text-sm font-semibold hover:underline"
        >
          <ArrowLeft size={16} /> Back to Payroll
        </button>
        <FinanceListPage
          embedded
          showSearch={false}
          title="Payroll Entries"
          subtitle={`Period ${periodId?.slice(0, 8)}…`}
          onRefresh={refetch}
          isLoading={isLoading}
          stats={[]}
          rows={rows}
          columns={[
            { key: 'driver_id', title: 'Driver' },
            { key: 'gross_pay', title: 'Gross' },
            { key: 'net_pay', title: 'Net' },
            { key: 'payment_status', title: 'Status' },
          ]}
          rowActions={(row) =>
            row.payment_status === 'PENDING' ? (
              <button
                type="button"
                onClick={() => markPaid.mutate(row.id)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-green-50 text-green-800"
              >
                Mark paid
              </button>
            ) : null
          }
        />
      </div>
    </div>
  )
}
