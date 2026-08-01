'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, Eye, FileText, Download, Send, ArrowRight, 
  Copy, Trash2, CreditCard, CheckCircle2 
} from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'accent' | 'success';
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

export default function ActionMenu({ items }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg hover:bg-black/5 text-dark/60 hover:text-dark transition-all flex items-center justify-center"
        title="Quick Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-1 w-48 rounded-2xl bg-white border border-black/10 shadow-xl z-50 py-1.5 animate-fade-in font-body text-xs text-dark">
          {items.map((item, idx) => {
            const Icon = item.icon;
            let textClass = 'text-dark/80 hover:bg-black/5';
            if (item.variant === 'danger') textClass = 'text-red-600 hover:bg-red-50';
            if (item.variant === 'accent') textClass = 'text-[#102B6A] font-bold hover:bg-[#102B6A]/5';
            if (item.variant === 'success') textClass = 'text-[#2E4036] font-bold hover:bg-[#2E4036]/5';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  item.onClick();
                }}
                className={`w-full text-left px-4 py-2 flex items-center gap-2.5 transition-colors ${textClass}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
