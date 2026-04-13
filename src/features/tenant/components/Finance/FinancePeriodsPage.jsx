import React, { useMemo, useState } from 'react'

import FinanceListPage from './FinanceListPage'
import { useCloseFinancePeriod, useCreateFinancePeriod, useFinancePeriods } from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function FinancePeriodsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    period_code: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })
  const params = useMemo(() => {
    const p = {}
    if (search) p.search = search
    if (status) p.status = status
    return p
  }, [search, status])
  const { data, isLoading, refetch } = useFinancePeriods(params)
  const createPeriod = useCreateFinancePeriod()
  const closePeriod = useCloseFinancePeriod()
  const rows = asList(data)

  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count ?? rows.length, className: 'text-blue-600' },
    { label: 'Open', value: rows.filter((r) => r.status === 'OPEN').length, className: 'text-green-600' },
    { label: 'Closed', value: rows.filter((r) => r.status === 'CLOSED').length, className: 'text-gray-600' },
  ]), [data?.count, rows])

  return (
    <>
      <FinanceListPage
        title="Finance Periods"
        subtitle="Open and close accounting periods to gate invoice posting."
        search={search}
        setSearch={setSearch}
        secondaryFilters={(
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
          >
            <option value="">All</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
        )}
        onRefresh={refetch}
        isLoading={isLoading}
        stats={stats}
        rows={rows}
        columns={[
          { key: 'period_code', title: 'Code' },
          { key: 'month', title: 'Month' },
          { key: 'year', title: 'Year' },
          { key: 'status', title: 'Status' },
          { key: 'closed_at', title: 'Closed At' },
        ]}
        actions={(
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl bg-[#0052CC] text-white text-xs font-bold"
          >
            New Period
          </button>
        )}
        rowActions={(row) => (
          row.status === 'OPEN' ? (
            <button
              type="button"
              onClick={() => window.confirm('Close this period? Posting may be blocked.') && closePeriod.mutate(row.id)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800"
            >
              Close
            </button>
          ) : null
        )}
      />
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[#172B4D]">Create Finance Period</h3>
            <label className="block text-xs font-semibold text-gray-600">Period code</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.period_code}
              onChange={(e) => setForm({ ...form, period_code: e.target.value })}
              placeholder="e.g. 2026-04"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600">Month</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600">Year</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="px-4 py-2 text-sm" onClick={() => setShowCreate(false)}>Cancel</button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-[#0052CC] text-white text-sm font-bold"
                disabled={!form.period_code || createPeriod.isPending}
                onClick={() => {
                  createPeriod.mutate(form, {
                    onSuccess: () => { setShowCreate(false); refetch() },
                  })
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
