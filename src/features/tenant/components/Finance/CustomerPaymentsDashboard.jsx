import React, { useMemo, useState } from 'react'
import { CheckCircle2, GitMerge, Plus, XCircle } from 'lucide-react'

import FinanceListPage from './FinanceListPage'
import {
  useAutoReconcilePayment,
  useBounceCustomerPayment,
  useCreateCustomerPayment,
  useCustomerPayments,
  useReconcilePayment,
  useVerifyCustomerPayment,
} from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function CustomerPaymentsDashboard() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showReconcile, setShowReconcile] = useState(false)
  const [payForm, setPayForm] = useState({
    payment_number: `CP-${Date.now()}`,
    customer_id: '',
    payment_date: new Date().toISOString().slice(0, 10),
    amount: '',
    payment_mode: 'BANK_TRANSFER',
    reference_number: '',
    invoice_id: '',
  })
  const [recForm, setRecForm] = useState({
    customer_payment_id: '',
    invoice_id: '',
    amount_applied: '',
  })
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
  const createPayment = useCreateCustomerPayment()
  const reconcile = useReconcilePayment()
  const rows = asList(data)

  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
    { label: 'Received', value: rows.filter((r) => r.status === 'RECEIVED').length, className: 'text-indigo-600' },
    { label: 'Verified', value: rows.filter((r) => r.status === 'VERIFIED').length, className: 'text-green-600' },
    { label: 'Bounced', value: rows.filter((r) => r.status === 'BOUNCED').length, className: 'text-red-600' },
  ]), [data?.count, rows])

  return (
    <>
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
        actions={(
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#0052CC] text-white text-xs font-bold">
              <Plus size={14} /> Record payment
            </button>
            <button type="button" onClick={() => setShowReconcile(true)} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-[#0052CC] text-[#0052CC] text-xs font-bold">
              Manual reconcile
            </button>
          </div>
        )}
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
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-2 shadow-xl">
            <h3 className="font-bold text-[#172B4D]">Record customer payment</h3>
            <input className="w-full border rounded px-2 py-1 text-xs" placeholder="Payment #" value={payForm.payment_number} onChange={(e) => setPayForm({ ...payForm, payment_number: e.target.value })} />
            <input className="w-full border rounded px-2 py-1 text-xs" placeholder="Customer UUID" value={payForm.customer_id} onChange={(e) => setPayForm({ ...payForm, customer_id: e.target.value })} />
            <input type="date" className="w-full border rounded px-2 py-1 text-xs" value={payForm.payment_date} onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })} />
            <input className="w-full border rounded px-2 py-1 text-xs" type="number" placeholder="Amount" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
            <select className="w-full border rounded px-2 py-1 text-xs" value={payForm.payment_mode} onChange={(e) => setPayForm({ ...payForm, payment_mode: e.target.value })}>
              <option value="CASH">CASH</option>
              <option value="BANK_TRANSFER">BANK_TRANSFER</option>
              <option value="UPI">UPI</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="CHEQUE">CHEQUE</option>
            </select>
            <input className="w-full border rounded px-2 py-1 text-xs" placeholder="Reference (optional)" value={payForm.reference_number} onChange={(e) => setPayForm({ ...payForm, reference_number: e.target.value })} />
            <input className="w-full border rounded px-2 py-1 text-xs" placeholder="Invoice UUID (optional)" value={payForm.invoice_id} onChange={(e) => setPayForm({ ...payForm, invoice_id: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="px-3 py-1 text-sm" onClick={() => setShowCreate(false)}>Cancel</button>
              <button
                type="button"
                className="px-3 py-1 rounded-lg bg-[#0052CC] text-white text-sm font-bold"
                disabled={createPayment.isPending}
                onClick={() => {
                  const payload = {
                    payment_number: payForm.payment_number,
                    customer_id: payForm.customer_id,
                    payment_date: payForm.payment_date,
                    amount: payForm.amount,
                    payment_mode: payForm.payment_mode,
                    reference_number: payForm.reference_number,
                    status: 'RECEIVED',
                  }
                  if (payForm.invoice_id) payload.invoice_id = payForm.invoice_id
                  createPayment.mutate(payload, { onSuccess: () => { setShowCreate(false); refetch() } })
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {showReconcile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-2 shadow-xl">
            <h3 className="font-bold text-[#172B4D]">Manual reconcile</h3>
            <input className="w-full border rounded px-2 py-1 text-xs" placeholder="Customer payment UUID" value={recForm.customer_payment_id} onChange={(e) => setRecForm({ ...recForm, customer_payment_id: e.target.value })} />
            <input className="w-full border rounded px-2 py-1 text-xs" placeholder="Invoice UUID" value={recForm.invoice_id} onChange={(e) => setRecForm({ ...recForm, invoice_id: e.target.value })} />
            <input className="w-full border rounded px-2 py-1 text-xs" type="number" placeholder="Amount applied" value={recForm.amount_applied} onChange={(e) => setRecForm({ ...recForm, amount_applied: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="px-3 py-1 text-sm" onClick={() => setShowReconcile(false)}>Cancel</button>
              <button
                type="button"
                className="px-3 py-1 rounded-lg bg-[#0052CC] text-white text-sm font-bold"
                disabled={reconcile.isPending}
                onClick={() => reconcile.mutate({
                  customer_payment_id: recForm.customer_payment_id,
                  invoice_id: recForm.invoice_id,
                  amount_applied: recForm.amount_applied,
                }, { onSuccess: () => { setShowReconcile(false); refetch() } })}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
