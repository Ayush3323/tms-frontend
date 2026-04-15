import React from 'react'
import { RefreshCcw } from 'lucide-react'

const statusClass = (value = '') => {
  const v = String(value).toUpperCase()
  if (['PAID', 'VERIFIED', 'APPROVED', 'DELIVERED', 'SETTLED', 'FILED'].includes(v)) return 'bg-green-50 text-green-700 border-green-200'
  if (['PENDING', 'DRAFT', 'RECEIVED', 'CALCULATED', 'PROCESSING'].includes(v)) return 'bg-blue-50 text-blue-700 border-blue-200'
  if (['OVERDUE', 'BOUNCED', 'CANCELLED', 'REJECTED'].includes(v)) return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-gray-50 text-gray-700 border-gray-200'
}

export default function FinanceListPage({
  title,
  subtitle,
  stats = [],
  rows = [],
  columns = [],
  search,
  setSearch,
  onRefresh,
  isLoading,
  actions,
  rowActions,
  keyField = 'id',
  secondaryFilters = null,
  emptyMessage = 'No records found',
  /** When true, omit outer page shell (parent provides background / padding). */
  embedded = false,
  /** When false, search box is hidden (e.g. payroll entries drill-down). */
  showSearch = true,
  onRowClick,
}) {
  const shellClass = embedded ? 'h-full flex flex-col min-h-0' : 'h-full flex flex-col bg-[#F8FAFC] p-6 lg:p-8 overflow-hidden'

  return (
    <div className={shellClass}>
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col min-h-0 space-y-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1 basis-full sm:basis-[min(280px,100%)]">
            <h1 className="text-2xl font-bold text-[#172B4D]">{title}</h1>
            <p className="text-gray-500 text-sm tracking-tight">{subtitle}</p>
          </div>
          {showSearch && setSearch != null && (
            <div className="flex-1 min-w-[200px] max-w-xl">
              <input
                type="text"
                value={search ?? ''}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium"
              />
            </div>
          )}
          {secondaryFilters && <div className="flex flex-wrap items-center gap-2">{secondaryFilters}</div>}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:ml-auto shrink-0">
            <button
              type="button"
              onClick={() => onRefresh?.()}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm"
            >
              <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
            </button>
            {actions}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
            {stats.map((s) => (
              <div className="flex items-center gap-2" key={s.label}>
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">{s.label}:</span>
                <span className={`text-[18px] font-black ${s.className || 'text-[#0052CC]'}`}>{s.value}</span>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-white">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-white">
                      {c.title}
                    </th>
                  ))}
                  {rowActions && <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right bg-white">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array(6).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={columns.length + (rowActions ? 1 : 0)} className="px-6 py-5 h-20 bg-gray-50/10" />
                    </tr>
                  ))
                ) : rows.length ? (
                  rows.map((row) => (
                    <tr
                      key={row[keyField]}
                      onClick={() => onRowClick?.(row)}
                      className={`hover:bg-blue-50/30 transition-colors group ${onRowClick ? 'cursor-pointer' : ''}`}
                    >
                      {columns.map((c) => (
                        <td key={c.key} className="px-6 py-4 text-[13px] font-bold text-[#172B4D]">
                          {c.key === 'status' ? (
                            <span className={`inline-flex px-2.5 py-1 text-[10px] rounded-full border font-bold ${statusClass(row[c.key])}`}>{row[c.key]}</span>
                          ) : (
                            c.render ? c.render(row[c.key], row) : (row[c.key] ?? '-')
                          )}
                        </td>
                      ))}
                      {rowActions && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {rowActions(row)}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + (rowActions ? 1 : 0)} className="px-6 py-20 text-center">
                      <p className="text-sm font-black uppercase tracking-[0.2em] opacity-30">No records found</p>
                      <p className="text-xs font-semibold text-gray-400 mt-2">{emptyMessage}</p>
                    </td>
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
