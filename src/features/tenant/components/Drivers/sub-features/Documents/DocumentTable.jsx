import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { STATUS_STYLES as VERIFICATION_STYLES } from '../../common/constants';
import { getExpiryColor } from '../../common/utils';

const DocumentTable = ({ documents, onEdit, showDriver = false, driverMap = {}, userMap = {}, currentUser = null }) => {
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
            {[
              'Document Type', 'Document Number', 'Issue Date', 'Expiry Date', 
              'Issuing Authority', 'Verification', 'Verified By', 'Verified At', 
              'File URL', 'Notes', 'Actions'
            ].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {documents.map(doc => (
            <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors">
              {showDriver && (
                <>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-700 text-[12px]">
                    {driverMap[doc.driver]?.name || doc.driver_name || 'System Driver'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-500 font-mono">
                    {driverMap[doc.driver]?.employee_id || doc.employee_id || '—'}
                  </td>
                </>
              )}
              <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#172B4D] text-[13px]">
                {doc.document_type_display ?? doc.document_type}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="font-mono text-[12px] text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {doc.document_number ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">{doc.issue_date ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`text-[12px] font-mono ${getExpiryColor(doc.expiry_date)}`}>
                  {doc.expiry_date ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">{doc.issuing_authority ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={doc.verification_status_display ?? doc.verification_status}
                  styles={VERIFICATION_STYLES[doc.verification_status]}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                {doc.verification_status === 'VERIFIED' ? (
                  userMap[doc.verified_by]?.name || 
                  (doc.verified_by === currentUser?.id ? `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || currentUser?.username : null) ||
                  doc.verified_by || '—'
                ) : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                {doc.verification_status === 'VERIFIED' && doc.verified_at ? new Date(doc.verified_at).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                {doc.file_url 
                  ? <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-[#0052CC] hover:underline flex items-center gap-1">View File</a>
                  : <span className="text-gray-400">—</span>
                }
              </td>
              <td className="px-4 py-3 text-[12px] text-gray-800 max-w-xs truncate" title={doc.notes}>
                {doc.notes || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <TableActions
                  onEdit={() => onEdit(doc)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentTable;
