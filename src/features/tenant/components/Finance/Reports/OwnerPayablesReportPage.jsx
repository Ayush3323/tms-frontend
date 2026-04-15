import React, { useMemo, useState } from 'react'
import { Download, RefreshCcw } from 'lucide-react'
import { useOwnerPayablesReport } from '../../../queries/finance/financeQuery'

const number = (value) => {
  const n = Number(value || 0)
  if (Number.isNaN(n)) return '0.00'
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function OwnerPayablesReportPage() {
  const { data = [], isLoading, refetch } = useOwnerPayablesReport({})
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => 
    (data || []).filter(r => 
      r.status?.toLowerCase().includes(search.toLowerCase())
    ), [data, search]
  )

  const downloadCsv = () => {
    const headers = ['Status', 'Total Amount']
    const csvContent = [
      headers.join(','),
      ...filtered.map(r => [r.status, r.total].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'owner_payables_report.csv'
    link.click()
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search status..."
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
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Total Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((row) => (
                  <tr key={row.status} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-bold text-[#172B4D]">{row.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[13px] font-black text-[#172B4D]">{number(row.total)}</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={2} className="px-4 py-12 text-center text-gray-400 text-xs">No records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
