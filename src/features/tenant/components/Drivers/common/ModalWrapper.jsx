import React from 'react';
import { X } from 'lucide-react';

const ModalWrapper = ({ title, description, children, onClose, footer, maxWidth = 'max-w-lg' }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">{title}</h2>
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalWrapper;
