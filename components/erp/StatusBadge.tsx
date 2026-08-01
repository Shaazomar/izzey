import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getBadgeStyle = (s: string) => {
    switch (s.toUpperCase()) {
      case 'PAID':
      case 'APPROVED':
        return 'bg-[#2E4036]/15 text-[#2E4036] border-[#2E4036]/20';
      case 'CONVERTED':
        return 'bg-[#102B6A]/15 text-[#102B6A] border-[#102B6A]/20';
      case 'PARTIALLY_PAID':
        return 'bg-amber-500/15 text-amber-700 border-amber-500/20';
      case 'SENT':
        return 'bg-blue-600/15 text-blue-700 border-blue-600/20';
      case 'OVERDUE':
      case 'REJECTED':
      case 'EXPIRED':
      case 'CANCELLED':
        return 'bg-red-500/15 text-red-600 border-red-500/20';
      case 'DRAFT':
      default:
        return 'bg-black/5 text-dark/60 border-black/10';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${getBadgeStyle(status)}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
