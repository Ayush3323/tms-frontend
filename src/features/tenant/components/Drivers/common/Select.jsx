import React from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({ children, ...props }) => (
  <div className="relative">
    <select
      {...props}
      className={`w-full appearance-none px-3 pr-8 py-2 text-sm border border-gray-200
        rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3b7ef8]/10
        focus:border-[#3b7ef8] cursor-pointer transition-all ${props.className || ''}`}
    >
      {children}
    </select>
    <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);

export default Select;
