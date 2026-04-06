import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { STATUS_STYLES } from '../../common/constants';
import { getInitials } from '../../common/utils';

const AttendanceTable = ({ records, onEdit, onView, showDriver = false, driverMap = {} }) => {
  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    return timeStr;
  };

  return (
    <div className="w-full min-w-max">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#fafbff] border-b border-gray-100">
            {showDriver && (
              <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">Driver</th>
            )}
            {['Date', 'Status', 'Check In', 'Check Out', 'Total Hours', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {records.map(rec => (
            <tr 
              key={rec.id} 
              onClick={() => onView && onView(rec)}
              className="hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              {showDriver && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-xs text-white shadow-sm font-syne bg-[#0052CC]">
                      {getInitials(driverMap[rec.driver]?.name || rec.driver_name || '-')}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1a202c] text-[13px] line-height-1">
                        {driverMap[rec.driver]?.name || rec.driver_name || '-'}
                      </div>
                      <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5 uppercase">
                        {driverMap[rec.driver]?.employee_id || rec.employee_id || '—'}
                      </div>
                    </div>
                  </div>
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#172B4D] text-[13px]">
                {rec.date ?? '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={rec.status_display ?? rec.status}
                  styles={STATUS_STYLES[rec.status]}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600 font-mono">
                {formatTime(rec.check_in)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600 font-mono">
                {formatTime(rec.check_out)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                {rec.total_hours != null ? `${rec.total_hours} hrs` : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <TableActions
                  onEdit={() => onEdit(rec)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
