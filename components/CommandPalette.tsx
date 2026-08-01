'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, FileText, ClipboardList, Briefcase, Settings, CreditCard, X } from 'lucide-react';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const commands = [
    { name: 'Dashboard overview', path: '/erp', icon: ClipboardList },
    { name: 'Customer database', path: '/erp/customers', icon: User },
    { name: 'Quotations index', path: '/erp/quotes', icon: FileText },
    { name: 'Invoices & billing', path: '/erp/invoices', icon: CreditCard },
    { name: 'Job schedules calendar', path: '/erp/jobs', icon: Briefcase },
    { name: 'Expenses tracking list', path: '/erp/expenses', icon: CreditCard },
    { name: 'System settings', path: '/erp/settings', icon: Settings },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-[#EAE8E2] border border-black/5 rounded-2xl shadow-2xl overflow-hidden text-dark font-body pointer-events-auto">
        
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 border-b border-black/5">
          <Search className="w-5 h-5 text-dark/40" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or navigate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 py-4 bg-transparent focus:outline-none placeholder:text-dark/30 text-[15px]"
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md hover:bg-black/5 text-dark/40 hover:text-dark transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredCommands.length > 0 ? (
            <div className="space-y-1">
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.path}
                  onClick={() => handleNavigate(cmd.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm hover:bg-accent hover:text-white transition-colors group"
                >
                  <cmd.icon className="w-4 h-4 text-dark/40 group-hover:text-white" />
                  <span className="font-medium">{cmd.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-dark/40 font-mono">
              NO RESULTS FOUND
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-black/5 bg-[#F2F0E9] flex items-center justify-between text-[11px] text-dark/40 font-mono">
          <span>Press <kbd className="bg-black/5 px-1.5 py-0.5 rounded border border-black/10">ESC</kbd> to close</span>
          <span>Use mouse to select</span>
        </div>

      </div>
    </div>
  );
}
