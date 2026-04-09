import React, { useMemo, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

import FinanceListPage from './FinanceListPage'
import { useBounceCustomerPayment, useCustomerPayments, useVerifyCustomerPayment } from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function CustomerPaymentsDashboard() {
  const [search, setSearch] = useState('')
  const { data, isLoading, refetch } = useCustomerPayments(search ? { search } : {})
  const verify = useVerifyCustomerPayment()
  const bounce = useBounceCustomerPayment()
  const rows = asList(data)

  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
    { label: 'Received', value: rows.filter((r) => r.status === 'RECEIVED').length, className: 'text-indigo-600' },
    { label: 'Verified', value: rows.filter((r) => r.status === 'VERIFIED').length, className: 'text-green-600' },
    { label: 'Bounced', value: rows.filter((r) => r.status === 'BOUNCED').length, className: 'text-red-600' },
  ]), [data?.count, rows])

  return (
    <FinanceListPage
      title="Customer Payments"
      subtitle="Track received amounts, verification, and bounced transactions."
      search={search}
      setSearch={setSearch}
      onRefresh={refetch}
      isLoading={isLoading}
      stats={stats}
      rows={rows}
      columns={[
        { key: 'payment_number', title: 'Payment #' },
        { key: 'customer_id', title: 'Customer ID' },
        { key: 'invoice_id', title: 'Invoice ID' },
        { key: 'payment_date', title: 'Payment Date' },
        { key: 'amount', title: 'Amount' },
        { key: 'payment_mode', title: 'Mode' },
        { key: 'status', title: 'Status' },
      ]}
      rowActions={(row) => (
        <>
          {row.status === 'RECEIVED' && (
            <button type="button" onClick={() => verify.mutate(row.id)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg">
              <CheckCircle2 size={16} />
            </button>
          )}
          {row.status !== 'BOUNCED' && (
            <button type="button" onClick={() => bounce.mutate(row.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg">
              <XCircle size={16} />
            </button>
          )}
        </>
      )}
    />
  )
}
