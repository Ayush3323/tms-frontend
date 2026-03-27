import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import {
  ASSIGNMENT_TYPE_STYLES,
  ASSIGNMENT_STATUS_STYLES,
} from '../../common/constants';
import { getInitials } from '../../common/utils';

const AssignmentTable = ({ assignments, onEdit, onView, showDriver = false, driverMap = {}, userMap = {}, currentUser = null }) => {
  return (
    <div className="w-full min-w-max text-sm">
      <table className="w-full">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#fafbff] border-b border-gray-100">
            {showDriver && (
              <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">Driver</th>
            )}
            {['Vehicle', 'Type', 'Assigned Date', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {assignments.map(a => (
            <tr 
              key={a.id} 
              onClick={() => onView && onView(a)}
              className="hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              {showDriver && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-xs text-white shadow-sm font-syne bg-[#0052CC]">
                      {getInitials(driverMap[a.driver]?.name || a.driver_name || 'System Driver')}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1a202c] text-[13px] line-height-1">
                        {driverMap[a.driver]?.name || a.driver_name || 'System Driver'}
                      </div>
                      <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5 uppercase">
                        {driverMap[a.driver]?.employee_id || a.employee_id || '—'}
                      </div>
                    </div>
                  </div>
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="font-mono text-[12px] text-[#0052CC] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 font-bold">
                  {a.vehicle_registration ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={a.assignment_type_display ?? a.assignment_type}
                  styles={ASSIGNMENT_TYPE_STYLES[a.assignment_type]}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600 font-medium">{a.assigned_date ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={a.is_active ? 'Active' : 'Inactive'}
                  styles={ASSIGNMENT_STATUS_STYLES[a.is_active ? 'ACTIVE' : 'INACTIVE']}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <TableActions onEdit={() => onEdit(a)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssignmentTable;
