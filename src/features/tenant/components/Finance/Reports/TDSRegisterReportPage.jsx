import React, { useMemo, useState } from 'react'
import { Download, RefreshCcw } from 'lucide-react'
import { useTDSRegisterReport } from '../../../queries/finance/financeQuery'

const number = (value) => {
  const n = Number(value || 0)
  if (Number.isNaN(n)) return '0.00'
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function TDSRegisterReportPage() {
  const [financialYear, setFinancialYear] = useState('')
  const [quarter, setQuarter] = useState('')

  const params = useMemo(() => {
    const p = {}
    if (financialYear) p.financial_year = financialYear
    if (quarter) p.quarter = quarter
    return p
  }, [financialYear, quarter])

  const { data = [], isLoading, refetch } = useTDSRegisterReport(params)

  const downloadCsv = () => {
    const headers = ['Financial Year', 'Quarter', 'Total TDS']
    const csvContent = [
      headers.join(','),
      ...data.map(r => [r.financial_year, r.quarter, r.total_tds].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'tds_register_report.csv'
    link.click()
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/30">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="FY (e.g. 2025-26)"
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs w-40 outline-none focus:ring-2 focus:ring-blue-100"
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
          />
          <select
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs w-32 outline-none focus:ring-2 focus:ring-blue-100"
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
          >
            <option value="">All Quarters</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
          </select>
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
        <div className="max-w-4xl">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Financial Year</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quarter</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Total TDS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((row) => (
                  <tr key={`${row.financial_year}-${row.quarter}`} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-bold text-[#172B4D]">{row.financial_year}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-gray-600">{row.quarter}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[13px] font-black text-[#172B4D]">{number(row.total_tds)}</span>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-gray-400 text-xs">No records found</td>
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
