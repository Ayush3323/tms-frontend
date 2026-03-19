import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { SEVERITY_STYLES, INCIDENT_TYPE_STYLES, STATUS_STYLES } from '../../common/constants';

const IncidentTable = ({ incidents, onEdit, showDriver = false, driverMap = {}, vehicleMap = {}, userMap = {} }) => {
  // Diagnostic log to see if backend is returning resolution data
  React.useEffect(() => {
    if (incidents.length > 0) {
      console.log('DEBUG: Incidents from server:', incidents);
    }
  }, [incidents]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {showDriver && (
              <>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-nowrap">Driver Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Emp ID</th>
              </>
            )}
            {['Type', 'Vehicle', 'Trip ID', 'Date', 'Location', 'Severity', 'Description', 'Resolution', 'Resolution Notes', 'Resolved By', 'Resolved At', 'Police Report No', 'Insurance No', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {incidents.map(inc => (
            <tr key={inc.id} className="hover:bg-blue-50/30 transition-colors text-nowrap">
              {showDriver && (
                <>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-700 text-[12px]">
                    {driverMap[inc.driver]?.name || inc.driver_name || 'System Driver'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-500 font-mono">
                    {driverMap[inc.driver]?.employee_id || inc.employee_id || '—'}
                  </td>
                </>
              )}
              <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#172B4D] text-[13px]">
                <StatusBadge
                  label={inc.incident_type_display ?? inc.incident_type}
                  styles={INCIDENT_TYPE_STYLES[inc.incident_type]}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600 font-mono">
                {vehicleMap[inc.vehicle] || inc.vehicle_registration_number || inc.vehicle || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-500 font-mono">
                {inc.trip_id || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                {formatDate(inc.incident_date)}
              </td>
              <td className="px-4 py-3 text-[12px] text-gray-600 max-w-37.5 truncate whitespace-nowrap">
                {inc.location ?? '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={inc.severity_display ?? inc.severity}
                  styles={SEVERITY_STYLES[inc.severity]}
                />
              </td>
              <td className="px-4 py-3 text-[12px] text-gray-600 max-w-xs truncate" title={inc.description}>
                {inc.description || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={inc.resolution_status_display ?? inc.resolution_status}
                  styles={STATUS_STYLES[inc.resolution_status]}
                />
              </td>
              <td className="px-4 py-3 text-[12px] text-gray-600 max-w-xs truncate" title={inc.resolution_notes}>
                {inc.resolution_notes || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                {userMap[inc.resolved_by] || inc.resolved_by || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-500">
                {inc.resolved_at ? formatDate(inc.resolved_at) : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {inc.police_report_number
                  ? <span className="font-mono text-[12px] text-gray-600">{inc.police_report_number}</span>
                  : <span className="text-[12px] text-gray-400">—</span>}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600 font-mono">
                {inc.insurance_claim_number || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <TableActions
                  onEdit={() => onEdit(inc)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default IncidentTable;
