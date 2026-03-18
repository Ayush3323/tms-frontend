import React from 'react';

const StatusBadge = ({ label, styles }) => {
  if (!styles) return <span className="text-gray-400">—</span>;
  
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit ${styles.bg} ${styles.text} uppercase tracking-wider`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
};

export default StatusBadge;
