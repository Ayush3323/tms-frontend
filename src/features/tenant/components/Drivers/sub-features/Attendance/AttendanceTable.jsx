import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { STATUS_STYLES } from '../../common/constants';

const AttendanceTable = ({ records, onEdit, onDelete, showDriver = false, driverMap = {} }) => {
  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    return timeStr;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {showDriver && (
              <>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Driver Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Emp ID</th>
              </>
            )}
            {['Date', 'Status', 'Check In', 'Check Out', 'Total Hours', 'Notes', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {records.map(rec => (
            <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors">
              {showDriver && (
                <>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-700 text-[12px]">
                    {driverMap[rec.driver]?.name || rec.driver_name || 'System Driver'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-500 font-mono">
                    {driverMap[rec.driver]?.employee_id || rec.employee_id || '—'}
                  </td>
                </>
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
              <td className="px-4 py-3 text-[12px] text-gray-600 max-w-xs truncate" title={rec.notes}>
                {rec.notes || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <TableActions
                  onEdit={() => onEdit(rec)}
                  onDelete={() => onDelete(rec)}
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
