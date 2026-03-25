import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { getScoreColor, getInitials } from '../../common/utils';

const PerformanceTable = ({ metrics, onEdit, showDriver = false, driverMap = {} }) => {
  return (
    <div className="w-full min-w-max">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#fafbff] border-b border-gray-100">
            {showDriver && (
              <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">Driver</th>
            )}
            {['period', 'trips_completed', 'distance_covered', 'on_time_delivery_rate', 'fuel_efficiency', 'safety_score', 'customer_rating', 'notes', 'actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">{h.replace(/_/g, ' ')}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {metrics.map(m => (
            <tr key={m.id} className="hover:bg-blue-50/30 transition-colors">
              {showDriver && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-xs text-white shadow-sm font-syne bg-[#0052CC]">
                      {getInitials(driverMap[m.driver]?.name || m.driver_name || 'System Driver')}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1a202c] text-[13px] line-height-1">
                        {driverMap[m.driver]?.name || m.driver_name || 'System Driver'}
                      </div>
                      <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5 uppercase">
                        {driverMap[m.driver]?.employee_id || m.employee_id || '—'}
                      </div>
                    </div>
                  </div>
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="font-semibold text-[#172B4D] text-[12px]">{m.period_start}</div>
                <div className="text-[11px] text-gray-400">to {m.period_end}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] font-semibold text-gray-700">
                {m.trips_completed ?? '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                {m.distance_covered ? `${Number(m.distance_covered).toLocaleString('en-IN')} km` : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`text-[12px] ${getScoreColor(m.on_time_delivery_rate, 100)}`}>
                  {m.on_time_delivery_rate != null ? `${m.on_time_delivery_rate}%` : '—'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                {m.fuel_efficiency != null ? `${m.fuel_efficiency} km/L` : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`text-[12px] ${getScoreColor(m.safety_score, 100)}`}>
                  {m.safety_score != null ? `${m.safety_score}/100` : '—'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`text-[12px] ${getScoreColor(m.customer_rating, 5)}`}>
                  {m.customer_rating != null ? `⭐ ${m.customer_rating}` : '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-[12px] text-gray-800 max-w-xs truncate" title={m.notes}>
                {m.notes || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <TableActions onEdit={() => onEdit(m)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PerformanceTable;
