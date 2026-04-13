import React, { useMemo, useState } from 'react'

import FinanceListPage from './FinanceListPage'
import { useReconciliations } from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function ReconciliationsPage() {
  const [search, setSearch] = useState('')
  const params = useMemo(() => (search ? { search } : {}), [search])
  const { data, isLoading, refetch } = useReconciliations(params)
  const rows = asList(data)

  return (
    <FinanceListPage
      title="Payment Reconciliations"
      subtitle="Customer payment allocations to invoices."
      search={search}
      setSearch={setSearch}
      onRefresh={refetch}
      isLoading={isLoading}
      stats={[{ label: 'Records', value: data?.count ?? rows.length, className: 'text-blue-600' }]}
      rows={rows}
      columns={[
        { key: 'id', title: 'ID' },
        { key: 'invoice_id', title: 'Invoice' },
        { key: 'customer_payment', title: 'Payment' },
        { key: 'amount_applied', title: 'Amount' },
        { key: 'reconciled_date', title: 'Date' },
      ]}
    />
  )
}
