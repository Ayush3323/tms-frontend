import React, { useMemo, useState, useEffect } from 'react'
import { useQueries } from '@tanstack/react-query'
import { FileSpreadsheet, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react'

import { settlementApi } from '../../api/finance/financeEndpoint'
import { useTrips, useOrders } from '../../queries/orders/ordersQuery'
import { useTripsLookup } from '../../queries/finance/financeQuery'
import { useCustomers } from '../../queries/customers/customersQuery'

const asList = (d) => d?.results || (Array.isArray(d) ? d : [])
const rupee = (v) => (v != null && v !== '' && Number(v) !== 0)
  ? `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : null
const txt = (v) => (v != null && v !== '') ? String(v) : null
const arrVal = (v) => Array.isArray(v) ? (v.join(', ') || null) : txt(v)

// ── Column groups (mirrors the Excel sheet) ──────────────────
const GROUPS = [
  {
    label: 'LR RECORDS', accent: '#1e3a5f', light: '#dbeafe',
    cols: [
      { key: 'lr_number', label: 'LR No.', w: 110, bold: true },
      { key: 'vehicle_number', label: 'Vehicle', w: 110 },
      { key: 'vehicle_type_code', label: 'Type', w: 120 },
      { key: 'from_location', label: 'From', w: 160 },
      { key: 'to_location', label: 'To', w: 160 },
      { key: 'scheduled_pickup_date', label: 'Pickup Date', w: 105 },
      { key: 'scheduled_delivery_date', label: 'Del. Date', w: 100 },
      { key: 'loading_date', label: 'Loading', w: 95 },
      { key: 'unloading_date', label: 'Unloading', w: 95 },
    ],
  },
  {
    label: 'CONSIGNEE DETAILS', accent: '#4c1d95', light: '#ede9fe',
    cols: [
      { key: 'billing_company', label: 'Billing Co.', w: 160, bold: true },
      { key: '_customer_name', label: 'Customer', w: 150 },
      { key: 'consignor_name', label: 'Consignor', w: 150 },
      { key: 'consignee_name', label: 'Consignee', w: 150 },
      { key: '_cargo_desc', label: 'Cargo / LR', w: 150 },
    ],
  },
  {
    label: 'VEHICLE ADVANCE', accent: '#78350f', light: '#fef3c7',
    cols: [
      { key: 'vehicle_owner_name', label: 'Owner', w: 140 },
      { key: 'advance_total_disbursed', label: 'Advance', w: 110, money: true, bold: true },
    ],
  },
  {
    label: 'WAY EXPENSE', accent: '#7c2d12', light: '#ffedd5',
    cols: [
      { key: 'actual_fuel_liters', label: 'Fuel (L)', w: 75 },
      { key: 'total_diesel_amount', label: 'Diesel Amt', w: 105, money: true },
      { key: 'late_fee', label: 'Late Fee', w: 90, money: true },
      { key: 'broker_commission', label: 'Broker', w: 90, money: true },
      { key: 'incentive_amount', label: 'Incentive', w: 90, money: true },
      { key: 'damage_amount', label: 'Damage', w: 90, money: true },
    ],
  },
  {
    label: 'INVOICING & PAYMENT', accent: '#14532d', light: '#dcfce7',
    cols: [
      { key: 'total_bill_amount', label: 'Total Bill', w: 115, money: true, bold: true },
      { key: 'booked_price_trip', label: 'Booked Price', w: 110, money: true },
      { key: 'tds_amount_trip', label: 'TDS', w: 90, money: true },
      { key: 'balance_outstanding_for_trip_invoices', label: 'Outstanding', w: 110, money: true, bold: true },
      { key: 'payment_received_amount', label: 'Paid', w: 100, money: true },
      { key: 'payment_received_date', label: 'Paid Date', w: 95 },
      { key: 'invoice_numbers', label: 'Invoice Nos.', w: 120, arr: true },
      { key: 'cargo_package_count', label: 'Pkgs', w: 55 },
      { key: 'detention_days', label: 'Detention', w: 75 },
      { key: 'pod_received_date', label: 'POD Date', w: 95 },
    ],
  },
]

const ALL_COLS = GROUPS.flatMap(g => g.cols.map(c => ({ ...c, accent: g.accent, light: g.light })))
const LAST_IN_GROUP = new Set(GROUPS.map(g => g.cols[g.cols.length - 1].key))

function getCell(row, col) {
  if (row.pending) return undefined          // skeleton
  const d = row.merged
  if (!d) return null
  const raw = d[col.key]
  if (col.arr) return arrVal(raw)
  if (col.money) return rupee(raw)
  return txt(raw)
}

// ─────────────────────────────────────────────────────────────
export default function LRRecordsPage() {
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedTripId, setSelectedTripId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  const { data: tripsData, isLoading: tripsLoading, refetch } = useTripsLookup({ page_size: 500 })
  const trips = asList(tripsData)

  const settlementQueries = useQueries({
    queries: loaded
      ? trips.map(t => ({
        queryKey: ['settlement', 'lr', t.id],
        queryFn: () => settlementApi.getLrSettlement(t.id),
        retry: false, staleTime: 5 * 60 * 1000,
      }))
      : [],
  })

  const { data: ordersData } = useOrders({ page_size: 500 })
  const { data: customersData } = useCustomers({ page_size: 500 })

  const orders = asList(ordersData)
  const customers = asList(customersData)

  const getCustName = (id) => {
    if (!id) return null
    const c = customers.find(c => c.id === id || c.customer?.id === id)
    return c ? (c.customer?.legal_name || c.customer?.trading_name || c.legal_name || c.trading_name || id.slice(-8)) : null
  }

  const rows = useMemo(() => {
    if (!loaded) return []
    return trips.map((trip, i) => {
      const settlement = settlementQueries[i]?.data ?? null

      // Find associated order
      const order = orders.find(o => o.id === trip.order_id || o.trip_id === trip.id) || null

      const _billing_name = getCustName(order?.billing_customer_id)
      const _consignor = getCustName(order?.consignor_id)
      const _consignee = getCustName(order?.consignee_id)

      const merged = settlement ? {
        ...trip,          // Fallback to trip base fields first
        ...settlement,    // Settlement fields take precedence

        // Complex customer fallbacks
        billing_company: settlement.billing_company || _billing_name || null,
        consignor_name: settlement.consignor_name || _consignor || null,
        consignee_name: settlement.consignee_name || _consignee || null,

        // Vehicle fallbacks
        vehicle_number: settlement.vehicle_number || trip.vehicle_number || trip.vehicle?.registration_number || null,
        vehicle_type_code: settlement.vehicle_type_code || trip.vehicle_type || trip.vehicle?.vehicle_type || null,
        vehicle_owner_name: settlement.vehicle_owner_name || trip.owner_name || trip.vehicle?.owner_name || null,

        // Additional Expense & Invoice field mapping
        total_diesel_amount: settlement.total_diesel_amount || trip.total_diesel_amount || ((trip.actual_fuel_liters && trip.fuel_rate_per_liter) ? (trip.actual_fuel_liters * trip.fuel_rate_per_liter).toFixed(2) : null),
        booked_price_trip: settlement.booked_price_trip || trip.booked_price || null,
        tds_amount_trip: settlement.tds_amount_trip || trip.tds_amount || null,
        cargo_package_count: settlement.cargo_package_count || trip.cargo_package_count || order?.total_packages || order?.total_pieces || null,
        pod_received_date: settlement.pod_received_date || trip.pod_received_date || order?.pod_received_date || null,
        // Custom UI fields
        _customer_name: _billing_name || null,
        _cargo_desc: order?.cargo_description || order?.goods_description || null,
      } : null

      return {
        trip,
        data: settlement,
        merged,
        pending: settlementQueries[i]?.isLoading ?? false,
        failed: settlementQueries[i]?.isError ?? false,
      }
    })
  }, [loaded, trips, settlementQueries, orders, customers])

  const filtered = useMemo(() => {
    let result = rows
    // Filter by specific trip
    if (selectedTripId) {
      result = result.filter(r => r.trip.id === selectedTripId)
    }
    // Filter by text search
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(r => {
        const d = r.data
        if (!d) return false
        return [d.lr_number, d.billing_company, d.vehicle_number, d.from_location, d.to_location, d.consignee_name]
          .some(f => (f || '').toLowerCase().includes(q))
      })
    }
    return result
  }, [rows, search, selectedTripId])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedTripId, loaded])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [filtered, currentPage])

  const pendingCount = rows.filter(r => r.pending).length
  const progress = rows.length > 0 ? Math.round(((rows.length - pendingCount) / rows.length) * 100) : 0

  const handleDownload = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const header = ALL_COLS.map(c => esc(c.label)).join(',')
    const body = filtered.map(row => 
      ALL_COLS.map(col => esc(getCell(row, col) || '')).join(',')
    ).join('\n')
    
    const csv = `${header}\n${body}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `LR_Report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-[#EEF2F7]" style={{ minHeight: '100vh' }}>

      {/* ── Top bar ────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-5 py-3.5 flex flex-wrap items-center gap-3 shadow-sm">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-emerald-100">
            <FileSpreadsheet size={17} className="text-emerald-700" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-[#172B4D] text-base leading-tight">LR Records</h1>
            <p className="text-[11px] text-gray-400">
              {loaded ? `${rows.length} trips · ${rows.length - pendingCount} loaded` : `${trips.length} trips available`}
            </p>
          </div>
        </div>

        {loaded && pendingCount === 0 && (
          <>
            {/* Trip selector dropdown */}
            <select
              className="py-1.5 px-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 max-w-[200px]"
              value={selectedTripId}
              onChange={e => setSelectedTripId(e.target.value)}
            >
              <option value="">All Trips</option>
              {trips.map(t => {
                const label = t.trip_number || t.id.slice(-8).toUpperCase()
                return <option key={t.id} value={t.id}>{label}</option>
              })}
            </select>
            {/* Text search */}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 w-44"
                placeholder="Search LR, vehicle, part…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </>
        )}

        <button
          type="button"
          onClick={() => { refetch(); if (loaded) { setLoaded(false); setTimeout(() => setLoaded(true), 80) } }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-semibold hover:bg-gray-50"
        >
          <RefreshCw size={11} /> Refresh
        </button>

        {!loaded ? (
          <button
            type="button"
            disabled={tripsLoading || trips.length === 0}
            onClick={() => setLoaded(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0052CC] text-white text-xs font-bold disabled:opacity-50 hover:bg-[#0047b3] shadow-sm transition-colors"
          >
            <FileSpreadsheet size={13} /> Load All {tripsLoading ? '' : `(${trips.length})`}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${pendingCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              {pendingCount > 0 ? `${progress}% loaded` : '✓ All loaded'}
            </div>
            {pendingCount === 0 && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors"
              >
                <FileSpreadsheet size={13} /> Download
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {loaded && pendingCount > 0 && (
        <div className="h-0.5 bg-gray-200">
          <div className="h-0.5 bg-[#0052CC] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────── */}
      {!loaded && (
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-3 px-12 py-10">
            <FileSpreadsheet size={44} className="text-gray-200" />
            <p className="text-sm font-semibold text-gray-400 text-center">
              Click <strong className="text-[#0052CC]">Load All</strong> to see all LR settlements
            </p>
            <p className="text-xs text-gray-400">{tripsLoading ? 'Fetching trips…' : `${trips.length} trips available`}</p>
            {!tripsLoading && trips.length > 0 && (
              <button
                type="button"
                onClick={() => setLoaded(true)}
                className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0052CC] text-white text-xs font-bold hover:bg-[#0047b3] transition-colors shadow-md shadow-blue-100"
              >
                <FileSpreadsheet size={13} /> Load All {trips.length} LRs
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────── */}
      {loaded && (
        <div className="p-4" style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 160px)', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table className="min-w-max text-[13px] border-collapse">
              <thead className="sticky top-0 z-20">
                {/* Group header row */}
                <tr>
                  <th
                    className="sticky left-0 z-30 border-r-2 border-white/20 px-3 py-2.5 text-left whitespace-nowrap"
                    style={{ background: '#172B4D', color: '#64748b', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', minWidth: 36 }}
                  >
                    #
                  </th>
                  {GROUPS.map(g => (
                    <th
                      key={g.label}
                      colSpan={g.cols.length}
                      className="px-3 py-3 text-center text-[12px] font-black uppercase tracking-widest border-r-2 border-white/20"
                      style={{ background: g.accent, color: '#fff' }}
                    >
                      {g.label}
                    </th>
                  ))}
                </tr>
                {/* Column label row */}
                <tr>
                  <th
                    className="sticky left-0 z-30 px-3 py-2 text-left border-b border-r-2 border-gray-300 whitespace-nowrap"
                    style={{ background: '#1e293b', color: '#94a3b8', fontSize: 9 }}
                  >
                    LR No.
                  </th>
                  {ALL_COLS.map(col => (
                    <th
                      key={col.key}
                      className={`px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-left whitespace-nowrap border-b ${LAST_IN_GROUP.has(col.key) ? 'border-r-2 border-gray-300' : 'border-r border-white/10'}`}
                      style={{ background: col.accent, color: col.light, minWidth: col.w, maxWidth: col.w }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((row, idx) => (
                  <tr
                    key={row.trip.id}
                    className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}`}
                  >
                    {/* Index */}
                    <td
                      className="sticky left-0 z-10 px-3 py-3 font-bold border-r-2 border-gray-200 whitespace-nowrap text-center"
                      style={{ background: 'inherit', color: '#64748b', minWidth: 36 }}
                    >
                      {(currentPage - 1) * rowsPerPage + idx + 1}
                    </td>

                    {ALL_COLS.map(col => {
                      const v = getCell(row, col)
                      const isLast = LAST_IN_GROUP.has(col.key)
                      if (row.pending) {
                        return (
                          <td key={col.key} className={`px-3 py-2.5 ${isLast ? 'border-r-2 border-gray-200' : 'border-r border-gray-100'}`} style={{ minWidth: col.w, maxWidth: col.w }}>
                            <div className="h-3 bg-gray-200 animate-pulse rounded w-3/4" />
                          </td>
                        )
                      }
                      return (
                        <td
                          key={col.key}
                          title={v ?? ''}
                          className={`px-3 py-3 overflow-hidden text-ellipsis whitespace-nowrap ${isLast ? 'border-r-2 border-gray-200' : 'border-r border-gray-100'}`}
                          style={{
                            minWidth: col.w, maxWidth: col.w,
                            color: v ? (col.bold ? '#172B4D' : '#374151') : '#d1d5db',
                            fontWeight: col.bold && v ? 700 : 400,
                            textAlign: col.money ? 'right' : 'left',
                            fontVariantNumeric: col.money ? 'tabular-nums' : undefined,
                          }}
                        >
                          {v ?? '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {filtered.length === 0 && !pendingCount && (
                  <tr>
                    <td colSpan={ALL_COLS.length + 1} className="py-12 text-center text-sm text-gray-400 italic">
                      {search ? `No results for "${search}"` : 'No data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 px-2">
            <p className="text-[11px] text-gray-400">
              Showing <strong>{filtered.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</strong> to <strong>{Math.min(currentPage * rowsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> LRs (Total <strong>{rows.length}</strong>)
              {search && ` · filtered by "${search}"`}
            </p>
            
            <div className="flex items-center gap-4">
              <p className="text-[11px] text-gray-400 italic mr-2">↔ Scroll horizontally to see all columns</p>
              
              {/* Pagination Controls */}
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-medium text-gray-600 px-2 min-w-[80px] text-center">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
