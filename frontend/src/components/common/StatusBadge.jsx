import React from 'react';

export const StatusBadge = ({ status, type, className = '' }) => {
  const getColors = () => {
    const val = (type || status || '').toUpperCase();
    if (val.includes('CRITICAL') || val.includes('HIGH') || val.includes('DUPLICATE') || val.includes('ACTION')) {
      return 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]';
    }
    if (val.includes('MODERATE') || val.includes('WARNING') || val.includes('REVIEW') || val.includes('TENDERED')) {
      return 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
    }
    if (val.includes('LOW') || val.includes('COMPLETED') || val.includes('SANCTIONED') || val.includes('NORMAL')) {
      return 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]';
    }
    if (val.includes('EXECUTION') || val.includes('IN PROGRESS')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    return 'bg-surface-container-low text-on-surface-variant border-surface-container-high';
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-[11px] font-semibold border leading-none ${getColors()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block opacity-80" />
      <span>{status}</span>
    </span>
  );
};
