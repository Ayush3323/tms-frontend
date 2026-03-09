import React from 'react';
import { Search, RotateCcw, Plus, Eye, UserX, UserCheck, ShieldAlert } from 'lucide-react';

const Body = () => {
  const stats = [
    { label: "TOTAL TENANTS", value: 6, sub: "All registered", border: "border-gray-100" },
    { label: "ACTIVE", value: 4, sub: "Currently running", border: "border-green-100", textColor: "text-green-600" },
    { label: "PENDING VERIFY", value: 2, sub: "Awaiting review", border: "border-orange-100", textColor: "text-orange-500" },
    { label: "SUSPENDED", value: 1, sub: "Access blocked", border: "border-red-100", textColor: "text-red-600" },
  ];

  const tenants = [
    { name: "Demo Transport Co.", sub: "Demo TMS", code: "DEMO_TMS", contact: "admin@demo-tms.com", type: "LOGISTICS", status: "ACTIVE", verify: "VERIFIED", date: "15 Jan 2026" },
    { name: "Acme Logistics", sub: "Acme TMS", code: "ACME_LOG", contact: "admin@acme-logistics.com", type: "TRANSPORT", status: "ACTIVE", verify: "VERIFIED", date: "20 Jan 2026" },
    { name: "Swift Freight", sub: "SwiftTMS", code: "SWIFT_FRT", contact: "ops@swift-freight.in", type: "FREIGHT", status: "ACTIVE", verify: "PENDING", date: "01 Feb 2026" },
    { name: "Blueline Courier", sub: "Blueline", code: "BLUELINE_COR", contact: "hello@blueline.in", type: "COURIER", status: "SUSPENDED", verify: "VERIFIED", date: "10 Jan 2026" },
  ];

  return (
    <main className="p-8 bg-[#F4F5F7] min-h-screen">
      {/* Page Title Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#172B4D]">Tenants</h2>
          <p className="text-gray-500 text-sm">Manage all registered tenants on the platform</p>
        </div>
        <button className="bg-[#0052CC] text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-colors shadow-sm">
          <Plus size={18} /> New Tenant
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-white p-6 rounded-xl border-b-4 ${stat.border} shadow-sm transition-transform hover:scale-[1.02]`}>
            <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-2 uppercase">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${stat.textColor || 'text-[#172B4D]'}`}>{stat.value}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white">
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input type="text" placeholder="Search by name, code, email..." className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <select className="bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg px-3 py-2 outline-none">
              <option>All Status</option>
            </select>
            <select className="bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg px-3 py-2 outline-none">
              <option>All Verification</option>
            </select>
          </div>
          <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-2 font-medium">
            <RotateCcw size={16} /> Reset
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F8FAFC] border-b border-gray-100">
              <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Tenant Code</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {tenants.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#172B4D]">{row.name}</p>
                    <p className="text-xs text-gray-400">{row.sub}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-[#0052CC] text-[10px] font-bold px-2 py-1 rounded border border-blue-100">{row.code}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-medium">{row.contact}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${row.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-medium">{row.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 border border-gray-200"><Eye size={14}/></button>
                      <button className="px-3 py-1 bg-[#FFAB00]/10 text-[#FFAB00] text-[10px] font-bold rounded border border-[#FFAB00]/20">Suspend</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default Body;