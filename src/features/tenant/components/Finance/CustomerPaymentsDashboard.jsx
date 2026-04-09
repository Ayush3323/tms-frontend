import React, { useMemo, useState } from 'react'
import { CheckCircle2, GitMerge, XCircle } from 'lucide-react'

import FinanceListPage from './FinanceListPage'
import {
  useAutoReconcilePayment,
  useBounceCustomerPayment,
  useCustomerPayments,
  useVerifyCustomerPayment,
} from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function CustomerPaymentsDashboard() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const queryParams = useMemo(() => {
    const p = {}
    if (search) p.search = search
    if (status) p.status = status
    return p
  }, [search, status])
  const { data, isLoading, refetch } = useCustomerPayments(queryParams)
  const verify = useVerifyCustomerPayment()
  const bounce = useBounceCustomerPayment()
  const autoReconcile = useAutoReconcilePayment()
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
      secondaryFilters={(
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
        >
          <option value="">All Statuses</option>
          <option value="RECEIVED">Received</option>
          <option value="VERIFIED">Verified</option>
          <option value="BOUNCED">Bounced</option>
        </select>
      )}
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
            <button type="button" disabled={verify.isPending} onClick={() => verify.mutate(row.id)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg disabled:opacity-50">
              <CheckCircle2 size={16} />
            </button>
          )}
          {row.status !== 'BOUNCED' && (
            <button type="button" disabled={bounce.isPending} onClick={() => window.confirm('Mark this payment as bounced?') && bounce.mutate(row.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg disabled:opacity-50">
              <XCircle size={16} />
            </button>
          )}
          {row.status === 'VERIFIED' && (
            <button
              type="button"
              disabled={autoReconcile.isPending}
              onClick={() => autoReconcile.mutate(row.id)}
              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg disabled:opacity-50"
              title="Auto Reconcile"
            >
              <GitMerge size={16} />
            </button>
          )}
        </>
      )}
    />
  )
}
