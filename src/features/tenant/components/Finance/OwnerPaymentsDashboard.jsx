import React, { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

import FinanceListPage from './FinanceListPage'
import { useApproveOwnerPayment, useMarkOwnerPaymentPaid, useOwnerPayments } from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function OwnerPaymentsDashboard() {
  const [search, setSearch] = useState('')
  const { data, isLoading, refetch } = useOwnerPayments(search ? { search } : {})
  const approve = useApproveOwnerPayment()
  const markPaid = useMarkOwnerPaymentPaid()
  const rows = asList(data)
  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
    { label: 'Pending', value: rows.filter((r) => r.status === 'PENDING').length, className: 'text-amber-600' },
    { label: 'Approved', value: rows.filter((r) => r.status === 'APPROVED').length, className: 'text-indigo-600' },
    { label: 'Paid', value: rows.filter((r) => r.status === 'PAID').length, className: 'text-green-600' },
  ]), [data?.count, rows])

  return (
    <FinanceListPage
      title="Owner Payments"
      subtitle="Control owner payables, approvals, and payout completion."
      search={search}
      setSearch={setSearch}
      onRefresh={refetch}
      isLoading={isLoading}
      stats={stats}
      rows={rows}
      columns={[
        { key: 'payment_number', title: 'Payment #' },
        { key: 'owner_name', title: 'Owner' },
        { key: 'trip_id', title: 'Trip ID' },
        { key: 'payment_date', title: 'Payment Date' },
        { key: 'net_payable', title: 'Net Payable' },
        { key: 'tds_amount', title: 'TDS' },
        { key: 'status', title: 'Status' },
      ]}
      rowActions={(row) => (
        <>
          {row.status === 'PENDING' && (
            <button type="button" onClick={() => approve.mutate(row.id)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg" title="Approve">
              <CheckCircle2 size={16} />
            </button>
          )}
          {row.status === 'APPROVED' && (
            <button type="button" onClick={() => markPaid.mutate(row.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white" title="Mark Paid">
              Mark Paid
            </button>
          )}
        </>
      )}
    />
  )
}
