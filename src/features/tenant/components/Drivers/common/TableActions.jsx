import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';

const TableActions = ({ onView, onEdit, onDelete, viewLabel = 'View', editLabel = 'Edit', deleteLabel = 'Delete' }) => {
  return (
    <div className="flex items-center gap-2">
      {onView && (
        <button
          onClick={onView}
          className="px-3 py-1.5 text-[11px] font-bold text-[#0052CC] bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 hover:border-blue-200 transition-all shadow-sm"
        >
          {viewLabel}
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          title={editLabel}
          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 border border-gray-200 transition-colors"
        >
          <Edit size={14} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          title={deleteLabel}
          className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-100 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

export default TableActions;
