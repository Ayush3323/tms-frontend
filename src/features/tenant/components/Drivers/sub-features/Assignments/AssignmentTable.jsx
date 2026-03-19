import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import {
  ASSIGNMENT_TYPE_STYLES,
  ASSIGNMENT_STATUS_STYLES,
} from '../../common/constants';

const AssignmentTable = ({ assignments, onEdit, showDriver = false, driverMap = {} }) => {
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
            {['Vehicle', 'Assignment Type', 'Assigned Date', 'Unassigned Date', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {assignments.map(a => (
            <tr key={a.id} className="hover:bg-blue-50/30 transition-colors">
              {showDriver && (
                <>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-700 text-[12px]">
                    {driverMap[a.driver]?.name || a.driver_name || 'System Driver'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-500 font-mono">
                    {driverMap[a.driver]?.employee_id || a.employee_id || '—'}
                  </td>
                </>
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
