import React, { useMemo, useState } from 'react'
import { CheckCircle2, Plus } from 'lucide-react'

import FinanceListPage from '../Common/FinanceListPage'
import { useApproveOwnerPayment, useCreateOwnerPayment, useMarkOwnerPaymentPaid, useOwnerPayments } from '../../../queries/finance/financeQuery'
import { useTripsLookup } from '../../../queries/finance/financeQuery'
import { useVehicles } from '../../../queries/vehicles/vehicleQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function OwnerPaymentsDashboard() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const { data: vehiclesData } = useVehicles({ page_size: 1000 })
  const { data: tripsData } = useTripsLookup({ page_size: 200 })
  const vehRows = asList(vehiclesData)
  const trips = asList(tripsData)
  const ownerOptions = useMemo(() => {
    const seen = new Set()
    return vehRows.filter(v => v.owner_name).reduce((acc, v) => {
      if (!seen.has(v.owner_name)) {
        seen.add(v.owner_name)
        acc.push(v.owner_name)
      }
      return acc
    }, []).sort()
  }, [vehRows])

  const [form, setForm] = useState({
    payment_number: `OP-${Date.now()}`,
    owner_name: '',
    trip_id: '',
    payment_date: new Date().toISOString().slice(0, 10),
    booked_price: '',
    tds_percentage: '0',
    tds_amount: '0',
    advance_deduction: '0',
    net_payable: '',
    payment_mode: 'BANK_TRANSFER',
  })
  const queryParams = useMemo(() => {
    const p = {}
    if (search) p.search = search
    if (status) p.status = status
    return p
  }, [search, status])
  const { data, isLoading, refetch } = useOwnerPayments(queryParams)
  const approve = useApproveOwnerPayment()
  const markPaid = useMarkOwnerPaymentPaid()
  const createOwner = useCreateOwnerPayment()
  const rows = asList(data)
  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
    { label: 'Pending', value: rows.filter((r) => r.status === 'PENDING').length, className: 'text-amber-600' },
    { label: 'Approved', value: rows.filter((r) => r.status === 'APPROVED').length, className: 'text-indigo-600' },
    { label: 'Paid', value: rows.filter((r) => r.status === 'PAID').length, className: 'text-green-600' },
  ]), [data?.count, rows])

  return (
    <>
      <FinanceListPage
        title="Owner Payments"
        subtitle="Control owner payables, approvals, and payout completion."
        search={search}
        setSearch={setSearch}
        secondaryFilters={(
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
          </select>
        )}
        onRefresh={refetch}
        isLoading={isLoading}
        stats={stats}
        rows={rows}
        columns={[
          { key: 'payment_number', title: 'Payment #' },
          { key: 'owner_name', title: 'Owner' },
          { 
            key: 'trip_id', 
            title: 'Trip',
            render: (tid) => {
              if (!tid) return '-'
              const t = trips.find(tr => tr.id === tid)
              return t ? (t.trip_number || tid.slice(-8).toUpperCase()) : tid.slice(-8).toUpperCase()
            }
          },
          { key: 'payment_date', title: 'Payment Date' },
          { key: 'net_payable', title: 'Net Payable', render: (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
          { key: 'tds_amount', title: 'TDS', render: (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
          { key: 'status', title: 'Status' },
        ]}
        actions={(
          <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#0052CC] text-white text-xs font-bold">
            <Plus size={14} /> New owner payment
          </button>
        )}
        rowActions={(row) => (
          <>
            {row.status === 'PENDING' && (
              <button type="button" disabled={approve.isPending} onClick={() => approve.mutate(row.id)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg disabled:opacity-50" title="Approve">
                <CheckCircle2 size={16} />
              </button>
            )}
            {row.status === 'APPROVED' && (
              <button type="button" disabled={markPaid.isPending} onClick={() => markPaid.mutate(row.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white disabled:opacity-50" title="Mark Paid">
                Mark Paid
              </button>
            )}
          </>
        )}
      />
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-2 shadow-xl text-xs">
            <h3 className="text-base font-bold text-[#172B4D]">Create owner payment</h3>
            <input className="w-full border rounded px-2 py-1" placeholder="Payment #" value={form.payment_number} onChange={(e) => setForm({ ...form, payment_number: e.target.value })} />
            <select
              className="w-full border rounded px-2 py-1"
              value={form.owner_name}
              onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
            >
              <option value="">Select Owner</option>
              {ownerOptions.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.trip_id}
              onChange={(e) => setForm({ ...form, trip_id: e.target.value })}
            >
              <option value="">Link to Trip (Optional)</option>
              {trips.map(t => {
                const label = [t.trip_number || t.id.slice(-8).toUpperCase(), t.origin_address, t.destination_address].filter(Boolean).join(' | ')
                return <option key={t.id} value={t.id}>{label}</option>
              })}
            </select>
            <input type="date" className="w-full border rounded px-2 py-1" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
            <input className="w-full border rounded px-2 py-1" placeholder="Booked price" value={form.booked_price} onChange={(e) => setForm({ ...form, booked_price: e.target.value })} />
            <input className="w-full border rounded px-2 py-1" placeholder="TDS %" value={form.tds_percentage} onChange={(e) => setForm({ ...form, tds_percentage: e.target.value })} />
            <input className="w-full border rounded px-2 py-1" placeholder="TDS amount" value={form.tds_amount} onChange={(e) => setForm({ ...form, tds_amount: e.target.value })} />
            <input className="w-full border rounded px-2 py-1" placeholder="Advance deduction" value={form.advance_deduction} onChange={(e) => setForm({ ...form, advance_deduction: e.target.value })} />
            <input className="w-full border rounded px-2 py-1" placeholder="Net payable" value={form.net_payable} onChange={(e) => setForm({ ...form, net_payable: e.target.value })} />
            <select className="w-full border rounded px-2 py-1" value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}>
              <option value="BANK_TRANSFER">BANK_TRANSFER</option>
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="CHEQUE">CHEQUE</option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="px-3 py-1" onClick={() => setShowCreate(false)}>Cancel</button>
              <button
                type="button"
                className="px-3 py-1 rounded-lg bg-[#0052CC] text-white font-bold"
                disabled={createOwner.isPending}
                onClick={() => {
                  const payload = {
                    payment_number: form.payment_number,
                    owner_name: form.owner_name,
                    payment_date: form.payment_date,
                    booked_price: form.booked_price || '0',
                    tds_percentage: form.tds_percentage || '0',
                    tds_amount: form.tds_amount || '0',
                    advance_deduction: form.advance_deduction || '0',
                    net_payable: form.net_payable || '0',
                    payment_mode: form.payment_mode,
                    status: 'PENDING',
                  }
                  if (form.trip_id) payload.trip_id = form.trip_id
                  createOwner.mutate(payload, { onSuccess: () => { setShowCreate(false); refetch() } })
                }}
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
