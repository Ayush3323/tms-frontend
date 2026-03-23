import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import {
  ASSIGNMENT_TYPE_STYLES,
  ASSIGNMENT_STATUS_STYLES,
} from '../../common/constants';
import { getInitials, getAvatarColor } from '../../common/utils';

const AssignmentTable = ({ assignments, onEdit, showDriver = false, driverMap = {}, userMap = {}, currentUser = null }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 text-nowrap">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {showDriver && (
              <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">Driver</th>
            )}
            {['vehicle', 'assignment_type', 'assigned_date', 'unassigned_date', 'is_active', 'assigned_by', 'notes', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {assignments.map(a => (
            <tr key={a.id} className="hover:bg-blue-50/30 transition-colors">
              {showDriver && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-xs text-white shadow-sm font-syne ${getAvatarColor(driverMap[a.driver]?.name || a.driver_name || 'System Driver')}`}>
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
                <span className="font-mono text-[12px] text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {a.vehicle_registration ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={a.assignment_type_display ?? a.assignment_type}
                  styles={ASSIGNMENT_TYPE_STYLES[a.assignment_type]}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">{a.assigned_date ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">{a.unassigned_date ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={a.is_active ? 'Active' : 'Inactive'}
                  styles={ASSIGNMENT_STATUS_STYLES[a.is_active ? 'ACTIVE' : 'INACTIVE']}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {(() => {
                  const assignedBy = userMap[a.assigned_by] || 
                    (a.assigned_by === currentUser?.id ? `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || currentUser?.username : null) || 
                    a.assigned_by_name || a.assigned_by || '—';
                  
                  if (assignedBy === '—') return <span className="text-[12px] text-gray-400">—</span>;

                  return (
                    <div className="flex items-center gap-2">
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm ${getAvatarColor(assignedBy)}`}>
                         {getInitials(assignedBy)}
                       </div>
                       <span className="text-[12px] font-semibold text-[#1a202c]">{assignedBy}</span>
                    </div>
                  );
                })()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-800 max-w-[150px] truncate" title={a.notes}>
                {a.notes || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
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
