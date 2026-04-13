import React, { useMemo, useState } from 'react'
import { RefreshCcw } from 'lucide-react'

import {
  useARAgingReport,
  useOwnerPayablesReport,
  useTDSRegisterReport,
  useTripProfitabilityReport,
} from '../../queries/finance/financeQuery'

const number = (value) => {
  const n = Number(value || 0)
  if (Number.isNaN(n)) return '0.00'
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const toCsv = (rows, columns) => {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const header = columns.map((c) => esc(c.label)).join(',')
  const body = rows.map((r) => columns.map((c) => esc(c.get(r))).join(',')).join('\n')
  return `${header}\n${body}`
}

const downloadCsv = (filename, rows, columns) => {
  const csv = toCsv(rows, columns)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function FinanceReportsDashboard() {
  const [financialYear, setFinancialYear] = useState('')
  const [quarter, setQuarter] = useState('')

  const params = useMemo(() => {
    const p = {}
    if (financialYear) p.financial_year = financialYear
    if (quarter) p.quarter = quarter
    return p
  }, [financialYear, quarter])

  const { data: arAging = [], isLoading: arLoading, refetch: refetchAr } = useARAgingReport({})
  const { data: ownerPayables = [], isLoading: ownerLoading, refetch: refetchOwner } = useOwnerPayablesReport({})
  const { data: tripProfitability = [], isLoading: tripLoading, refetch: refetchTrip } = useTripProfitabilityReport({})
  const { data: tdsRegister = [], isLoading: tdsLoading, refetch: refetchTds } = useTDSRegisterReport(params)

  const refreshAll = () => {
    refetchAr()
    refetchOwner()
    refetchTrip()
    refetchTds()
  }

  const loading = arLoading || ownerLoading || tripLoading || tdsLoading
  const totalArDue = (arAging || []).reduce((sum, r) => sum + Number(r.amount_due || 0), 0)
  const totalOwnerPayables = (ownerPayables || []).reduce((sum, r) => sum + Number(r.total || 0), 0)
  const totalRevenue = (tripProfitability || []).reduce((sum, r) => sum + Number(r.revenue || 0), 0)
  const totalCost = (tripProfitability || []).reduce((sum, r) => sum + Number(r.cost || 0), 0)
  const totalProfit = (tripProfitability || []).reduce((sum, r) => sum + Number(r.profit || 0), 0)
  const totalTds = (tdsRegister || []).reduce((sum, r) => sum + Number(r.total_tds || 0), 0)

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center">
          <div className="w-1/4">
            <h1 className="text-2xl font-bold text-[#172B4D]">Finance Reports</h1>
            <p className="text-gray-500 text-sm tracking-tight">AR aging, owner payables, profitability, and TDS register.</p>
          </div>
          <div className="flex-1 max-w-2xl px-8 flex items-center gap-3">
            <input
              type="text"
              placeholder="Financial Year (e.g. 2025-26)"
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium"
            />
            <input
              type="text"
              placeholder="Quarter (Q1..Q4)"
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="w-44 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium"
            />
            <button
              type="button"
              onClick={() => {
                setFinancialYear('')
                setQuarter('')
              }}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center justify-end gap-2 ml-auto">
            <button
              type="button"
              onClick={refreshAll}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm disabled:opacity-50"
              disabled={loading}
            >
              <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Combined Finance KPIs</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 p-5">
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AR Due</p>
                <p className="text-[16px] font-black text-[#172B4D]">{number(totalArDue)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Owner Payables</p>
                <p className="text-[16px] font-black text-[#172B4D]">{number(totalOwnerPayables)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
                <p className="text-[16px] font-black text-[#172B4D]">{number(totalRevenue)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cost</p>
                <p className="text-[16px] font-black text-[#172B4D]">{number(totalCost)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Profit</p>
                <p className={`text-[16px] font-black ${totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{number(totalProfit)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TDS Total</p>
                <p className="text-[16px] font-black text-[#172B4D]">{number(totalTds)}</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">AR Aging</p>
              <button
                type="button"
                onClick={() => downloadCsv('ar-aging.csv', arAging || [], [
                  { label: 'Invoice Number', get: (r) => r.invoice_number },
                  { label: 'Bucket', get: (r) => r.bucket },
                  { label: 'Amount Due', get: (r) => r.amount_due },
                ])}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/40">
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Invoice</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Bucket</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Amount Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(arAging || []).map((row) => (
                    <tr key={row.invoice_id} className="hover:bg-blue-50/20">
                      <td className="px-4 py-3 text-[13px] font-bold text-[#172B4D]">{row.invoice_number}</td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-gray-600">{row.bucket}</td>
                      <td className="px-4 py-3 text-[12px] font-bold text-right text-gray-700">{number(row.amount_due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Owner Payables</p>
              <button
                type="button"
                onClick={() => downloadCsv('owner-payables.csv', ownerPayables || [], [
                  { label: 'Status', get: (r) => r.status },
                  { label: 'Total', get: (r) => r.total },
                ])}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
              >
                Export CSV
              </button>
            </div>
            <div className="p-5 space-y-3">
              {(ownerPayables || []).map((row) => (
                <div key={row.status} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
                  <span className="text-[12px] font-bold text-gray-600">{row.status}</span>
                  <span className="text-[13px] font-black text-[#172B4D]">{number(row.total)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trip Profitability</p>
              <button
                type="button"
                onClick={() => downloadCsv('trip-profitability.csv', tripProfitability || [], [
                  { label: 'Trip ID', get: (r) => r.trip_id },
                  { label: 'Revenue', get: (r) => r.revenue },
                  { label: 'Cost', get: (r) => r.cost },
                  { label: 'Profit', get: (r) => r.profit },
                ])}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/40">
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trip ID</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Revenue</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Cost</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(tripProfitability || []).map((row) => (
                    <tr key={`${row.trip_id}-${row.revenue}`} className="hover:bg-blue-50/20">
                      <td className="px-4 py-3 text-[12px] font-semibold text-gray-700">{row.trip_id}</td>
                      <td className="px-4 py-3 text-[12px] font-bold text-right text-gray-700">{number(row.revenue)}</td>
                      <td className="px-4 py-3 text-[12px] font-bold text-right text-gray-700">{number(row.cost)}</td>
                      <td className="px-4 py-3 text-[12px] font-black text-right text-[#172B4D]">{number(row.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">TDS Register</p>
              <button
                type="button"
                onClick={() => downloadCsv('tds-register.csv', tdsRegister || [], [
                  { label: 'Financial Year', get: (r) => r.financial_year },
                  { label: 'Quarter', get: (r) => r.quarter },
                  { label: 'Total TDS', get: (r) => r.total_tds },
                ])}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/40">
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Financial Year</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Quarter</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Total TDS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(tdsRegister || []).map((row) => (
                    <tr key={`${row.financial_year}-${row.quarter}`} className="hover:bg-blue-50/20">
                      <td className="px-4 py-3 text-[12px] font-semibold text-gray-700">{row.financial_year}</td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-gray-700">{row.quarter}</td>
                      <td className="px-4 py-3 text-[12px] font-bold text-right text-gray-700">{number(row.total_tds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
