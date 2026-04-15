import React, { useMemo, useState } from 'react'
import { CheckCircle2, Coins } from 'lucide-react'

import FinanceListPage from '../Common/FinanceListPage'
import {
  useFileTDSReturn,
  useIssueTDSCertificate,
  useMarkTDSEntryPaid,
  useMarkTDSReturnPaid,
  useTDSReturns,
  useTDSEntries,
  useTripsLookup,
} from '../../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function TDSSummaryDashboard() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [activeTab, setActiveTab] = useState('entries')
  const [showFileModal, setShowFileModal] = useState(false)
  const [fileForm, setFileForm] = useState({ financial_year: '', quarter: '' })
  const entryQuery = useMemo(() => {
    const p = {}
    if (search) p.search = search
    if (status) p.status = status
    return p
  }, [search, status])
  const { data, isLoading, refetch } = useTDSEntries(entryQuery)
  const { data: returnsData, isLoading: isReturnsLoading, refetch: refetchReturns } = useTDSReturns(entryQuery)
  const { data: tripsData } = useTripsLookup({ page_size: 500 })
  const trips = asList(tripsData)
  const issue = useIssueTDSCertificate()
  const markPaid = useMarkTDSEntryPaid()
  const markReturnPaid = useMarkTDSReturnPaid()
  const fileReturn = useFileTDSReturn()
  const rows = asList(data)
  const returnRows = asList(returnsData)
  const stats = useMemo(() => {
    if (activeTab === 'returns') {
      return [
        { label: 'Total', value: returnsData?.count || returnRows.length, className: 'text-blue-600' },
        { label: 'Filed', value: returnRows.filter((r) => r.status === 'FILED').length, className: 'text-indigo-600' },
        { label: 'Paid', value: returnRows.filter((r) => r.status === 'PAID').length, className: 'text-green-600' },
      ]
    }
    return [
      { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
      { label: 'Pending', value: rows.filter((r) => r.status === 'PENDING').length, className: 'text-amber-600' },
      { label: 'Paid', value: rows.filter((r) => r.status === 'PAID').length, className: 'text-indigo-600' },
      { label: 'Cert. Issued', value: rows.filter((r) => r.status === 'CERTIFICATE_ISSUED').length, className: 'text-green-600' },
    ]
  }, [activeTab, data?.count, rows, returnsData?.count, returnRows])

  return (
    <>
    <FinanceListPage
      title="TDS Summary"
      subtitle="Track deductible tax entries and filing progress by quarter."
      search={search}
      setSearch={setSearch}
      secondaryFilters={(
        <>
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setActiveTab('entries')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${activeTab === 'entries' ? 'bg-[#0052CC] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Entries
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('returns')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${activeTab === 'returns' ? 'bg-[#0052CC] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Returns
            </button>
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="CERTIFICATE_ISSUED">Certificate Issued</option>
          </select>
        </>
      )}
      onRefresh={() => {
        refetch()
        refetchReturns()
      }}
      isLoading={activeTab === 'entries' ? isLoading : isReturnsLoading}
      stats={stats}
      rows={activeTab === 'entries' ? rows : returnRows}
      columns={activeTab === 'entries'
        ? [
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
          { key: 'financial_year', title: 'FY' },
          { key: 'quarter', title: 'Quarter' },
          { key: 'tds_amount', title: 'TDS Amount', render: (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
          { key: 'status', title: 'Status' },
        ]
        : [
          { key: 'financial_year', title: 'Financial Year' },
          { key: 'quarter', title: 'Quarter' },
          { key: 'total_tds_deducted', title: 'Total Deducted' },
          { key: 'total_tds_paid', title: 'Total Paid' },
          { key: 'filing_date', title: 'Filing Date' },
          { key: 'status', title: 'Status' },
        ]}
      actions={(
        <button
          type="button"
          onClick={() => setShowFileModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] rounded-xl text-xs font-bold text-white hover:bg-[#0747A6] shadow-md shadow-blue-100 transition-all disabled:opacity-50"
          disabled={fileReturn.isPending}
        >
          File Return
        </button>
      )}
      rowActions={(row) => (
        <>
          {activeTab === 'entries' && row.status === 'PENDING' && (
            <button
              type="button"
              disabled={markPaid.isPending}
              onClick={() => markPaid.mutate(row.id)}
              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg disabled:opacity-50"
              title="Mark Paid"
            >
              <Coins size={16} />
            </button>
          )}
          {activeTab === 'entries' && row.status === 'PAID' && (
            <button
              type="button"
              onClick={() => {
                const cert = window.prompt('TDS Certificate Number')
                if (cert) issue.mutate({ id: row.id, tds_certificate_number: cert })
              }}
              className="p-2 text-gray-400 hover:text-green-600 rounded-lg disabled:opacity-50"
              disabled={issue.isPending}
              title="Issue Certificate"
            >
              <CheckCircle2 size={16} />
            </button>
          )}
          {activeTab === 'returns' && row.status === 'FILED' && (
            <button
              type="button"
              disabled={markReturnPaid.isPending}
              onClick={() => markReturnPaid.mutate(row.id)}
              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg disabled:opacity-50"
              title="Mark Return Paid"
            >
              <Coins size={16} />
            </button>
          )}
        </>
      )}
    />
    {showFileModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-3 shadow-xl">
          <h3 className="font-bold text-[#172B4D]">File quarterly return</h3>
          <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Financial year (e.g. 2025-26)" value={fileForm.financial_year} onChange={(e) => setFileForm({ ...fileForm, financial_year: e.target.value })} />
          <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Quarter (Q1–Q4)" value={fileForm.quarter} onChange={(e) => setFileForm({ ...fileForm, quarter: e.target.value })} />
          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-1 text-sm" onClick={() => setShowFileModal(false)}>Cancel</button>
            <button
              type="button"
              className="px-3 py-1 rounded-lg bg-[#0052CC] text-white text-sm font-bold"
              disabled={fileReturn.isPending}
              onClick={() => {
                if (!fileForm.financial_year || !fileForm.quarter) return
                fileReturn.mutate({ financial_year: fileForm.financial_year, quarter: fileForm.quarter }, { onSuccess: () => setShowFileModal(false) })
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
