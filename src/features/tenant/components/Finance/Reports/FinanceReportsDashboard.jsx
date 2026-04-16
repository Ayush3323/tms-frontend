import React, { useMemo, useState } from 'react'
import { BarChart3, PieChart, TrendingUp, ShieldAlert, LayoutDashboard } from 'lucide-react'

import {
  useARAgingReport,
  useOwnerPayablesReport,
  useTDSRegisterReport,
  useTripProfitabilityReport,
} from '../../../queries/finance/financeQuery'

import ARAgingReportPage from './ARAgingReportPage'
import OwnerPayablesReportPage from './OwnerPayablesReportPage'
import TripProfitabilityReportPage from './TripProfitabilityReportPage'
import TDSRegisterReportPage from './TDSRegisterReportPage'

const number = (value) => {
  const n = Number(value || 0)
  if (Number.isNaN(n)) return '0.00'
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
  { id: 'ar_aging', label: 'AR Aging', icon: <PieChart size={14} /> },
  { id: 'owner_payables', label: 'Owner Payables', icon: <ShieldAlert size={14} /> },
  { id: 'profitability', label: 'Profitability', icon: <TrendingUp size={14} /> },
  { id: 'tds_register', label: 'TDS Register', icon: <BarChart3 size={14} /> },
]

export default function FinanceReportsDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  const { data: arAging = [] } = useARAgingReport({})
  const { data: ownerPayables = [] } = useOwnerPayablesReport({})
  const { data: tripProfitability = [] } = useTripProfitabilityReport({})
  const { data: tdsRegister = [] } = useTDSRegisterReport({})

  const stats = useMemo(() => {
    const totalArDue = (arAging || []).reduce((sum, r) => sum + Number(r.amount_due || 0), 0)
    const totalOwnerPayables = (ownerPayables || []).reduce((sum, r) => sum + Number(r.total || 0), 0)
    const totalRevenue = (tripProfitability || []).reduce((sum, r) => sum + Number(r.revenue || 0), 0)
    const totalCost = (tripProfitability || []).reduce((sum, r) => sum + Number(r.cost || 0), 0)
    const totalProfit = (tripProfitability || []).reduce((sum, r) => sum + Number(r.profit || 0), 0)
    const totalTds = (tdsRegister || []).reduce((sum, r) => sum + Number(r.total_tds || 0), 0)

    return [
      { label: 'AR Due', value: totalArDue, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Owner Payables', value: totalOwnerPayables, color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'Revenue', value: totalRevenue, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { label: 'Cost', value: totalCost, color: 'text-red-600', bg: 'bg-red-50' },
      { label: 'Net Profit', value: totalProfit, color: totalProfit >= 0 ? 'text-green-600' : 'text-red-700', bg: totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50' },
      { label: 'TDS Total', value: totalTds, color: 'text-teal-600', bg: 'bg-teal-50' },
    ]
  }, [arAging, ownerPayables, tripProfitability, tdsRegister])

  return (
    <div className="flex flex-col h-full bg-[#f4f5f7]">
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#172B4D]">Finance Reports</h1>
            <p className="text-xs text-gray-500 font-medium">Analyze accounts, profitability, and compliance data</p>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-[#0052CC] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-hover hover:border-blue-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.color}`}>{number(stat.value)}</p>
                  <div className={`mt-3 h-1.5 w-12 rounded-full ${stat.bg}`} />
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-[#172B4D] mb-4">Quick Financial Health</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Liquidity (AR Due)</span>
                    <span className="text-xs font-bold text-blue-600">{number(stats[0].value)}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: '70%' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Profit Margin</span>
                    <span className="text-xs font-bold text-green-600">
                      {stats[2].value ? ((stats[4].value / stats[2].value) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full" style={{ width: '45%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'ar_aging' && <ARAgingReportPage />}
        {activeTab === 'owner_payables' && <OwnerPayablesReportPage />}
        {activeTab === 'profitability' && <TripProfitabilityReportPage />}
        {activeTab === 'tds_register' && <TDSRegisterReportPage />}
      </div>
    </div>
  )
}
