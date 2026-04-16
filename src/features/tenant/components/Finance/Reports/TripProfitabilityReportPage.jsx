import React, { useMemo, useState } from 'react'
import { Download, RefreshCcw } from 'lucide-react'
import { useTripProfitabilityReport } from '../../../queries/finance/financeQuery'

const number = (value) => {
  const n = Number(value || 0)
  if (Number.isNaN(n)) return '0.00'
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function TripProfitabilityReportPage() {
  const { data = [], isLoading, refetch } = useTripProfitabilityReport({})
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => 
    (data || []).filter(r => 
      String(r.trip_id).toLowerCase().includes(search.toLowerCase())
    ), [data, search]
  )

  const downloadCsv = () => {
    const headers = ['Trip ID', 'Revenue', 'Cost', 'Profit']
    const csvContent = [
      headers.join(','),
      ...filtered.map(r => [r.trip_id, r.revenue, r.cost, r.profit].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'trip_profitability_report.csv'
    link.click()
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search trip ID..."
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs w-64 outline-none focus:ring-2 focus:ring-blue-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={() => refetch()} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        <button
          onClick={downloadCsv}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trip ID</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Revenue</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Cost</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((row) => (
                <tr key={`${row.trip_id}-${row.revenue}`} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-4 py-3 text-[12px] font-semibold text-gray-700">{row.trip_id}</td>
                  <td className="px-4 py-3 text-right text-[12px] font-bold text-gray-700">{number(row.revenue)}</td>
                  <td className="px-4 py-3 text-right text-[12px] font-bold text-gray-700">{number(row.cost)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-[13px] font-black ${Number(row.profit) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {number(row.profit)}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400 text-xs">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
