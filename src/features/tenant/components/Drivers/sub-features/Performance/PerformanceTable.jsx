import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { getScoreColor } from '../../common/utils';

const PerformanceTable = ({ metrics, onEdit, showDriver = false, driverMap = {} }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 text-nowrap">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {showDriver && (
              <>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Driver Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Emp ID</th>
              </>
            )}
            {['Period', 'Trips', 'Distance', 'On-Time %', 'Fuel Eff.', 'Safety', 'Rating', 'Notes', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {metrics.map(m => (
            <tr key={m.id} className="hover:bg-blue-50/30 transition-colors">
              {showDriver && (
                <>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-700 text-[12px]">
                    {driverMap[m.driver]?.name || m.driver_name || 'System Driver'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-500 font-mono">
                    {driverMap[m.driver]?.employee_id || m.employee_id || '—'}
                  </td>
                </>
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
              <td className="px-4 py-3 text-[12px] text-gray-400 max-w-xs truncate italic" title={m.notes}>
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
