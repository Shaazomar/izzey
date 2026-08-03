'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  LayoutDashboard, FileText, FileCheck, Users, 
  CreditCard, Receipt, BarChart3, PieChart, Settings, LogOut, 
  Search, Menu, X, Bell, Plus, ChevronDown, ChevronRight, ChevronLeft,
  Zap, Landmark, AreaChart, ToggleLeft, ToggleRight, Sparkles, Building2,
  Mail
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import CommandPalette from '@/components/CommandPalette';
import { setAccountingMode } from '@/app/actions/mode';

interface DashboardLayoutProps {
  children: React.ReactNode;
  initialMode: 'OFFICIAL' | 'MANAGEMENT';
}

export default function DashboardLayout({ children, initialMode }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mode, setMode] = useState<'OFFICIAL' | 'MANAGEMENT'>(initialMode);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();

  const userRole = session?.user?.role || 'EMPLOYEE';

  const handleToggleMode = async () => {
    const nextMode = mode === 'OFFICIAL' ? 'MANAGEMENT' : 'OFFICIAL';
    setMode(nextMode);
    await setAccountingMode(nextMode);
    router.refresh();
  };

  const navSections = [
    {
      title: null,
      items: [
        { name: 'Dashboard', path: '/erp', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
      ]
    },
    {
      title: 'SALES',
      items: [
        { name: 'Enquiries', path: '/erp/enquiries', icon: Mail, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
        { name: 'Quotations', path: '/erp/quotes', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
        { name: 'Invoices', path: '/erp/invoices', icon: FileCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
        { name: 'Customers', path: '/erp/customers', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { name: 'Payments', path: '/erp/payments', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
        { name: 'Expenses', path: '/erp/expenses', icon: Receipt, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
      ]
    },
    {
      title: 'REPORTS',
      items: [
        { name: 'Reports', path: '/erp/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN'] },
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { name: 'Settings', path: '/erp/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-body flex relative overflow-x-hidden">
      
      {/* Search Command Palette */}
      <CommandPalette />

      {/* Sidebar for Desktop */}
      <aside 
        className={`hidden lg:flex flex-col bg-[#2E4036] text-[#F2F0E9] h-screen fixed top-0 left-0 bottom-0 justify-between transition-all duration-300 ease-in-out z-40 ${
          isCollapsed ? 'w-[80px] py-6 px-3' : 'w-64 p-5'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar space-y-6">
          
          {/* Logo & Brand Header */}
          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-3 justify-center' : 'justify-between px-2'} pt-2`}>
            {!isCollapsed ? (
              <div className="flex items-center gap-3">
                <Image 
                  src="/logo.png" 
                  alt="Izzey Clean & Move" 
                  width={150} 
                  height={45} 
                  className="h-8 w-auto object-contain brightness-0 invert"
                  priority
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white mx-auto shadow-md">
                <Image 
                  src="/logo.png" 
                  alt="Izzey" 
                  width={24} 
                  height={24} 
                  className="w-6 h-6 object-contain brightness-0 invert" 
                  priority
                />
              </div>
            )}

            {/* Collapse/Expand Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="space-y-6 flex-1 pt-2">
            {navSections.map((section, idx) => {
              const visibleItems = section.items;

              return (
                <div key={idx} className="space-y-1.5">
                  {section.title && !isCollapsed && (
                    <p className="px-3 text-[11px] font-bold font-mono text-slate-400/80 tracking-wider uppercase mb-2">
                      {section.title}
                    </p>
                  )}
                  {visibleItems.map((item, itemIdx) => {
                    const isActive = pathname === item.path && (item.name === 'Dashboard' ? pathname === '/erp' : true);
                    const ItemIcon = item.icon;

                    return (
                      <Link
                        key={itemIdx}
                        href={item.path}
                        prefetch={true}
                        title={isCollapsed ? item.name : undefined}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          isActive 
                            ? 'bg-[#CC5833] text-white shadow-md shadow-[#CC5833]/30' 
                            : 'text-slate-300 hover:text-white hover:bg-white/10'
                        } ${isCollapsed ? 'justify-center px-0 w-11 h-11 mx-auto' : ''}`}
                      >
                        <ItemIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        {!isCollapsed && <span>{item.name}</span>}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* User Profile Card at Bottom */}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
            {!isCollapsed ? (
              <div className="flex items-center justify-between px-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">ERP Session</p>
                  <p className="text-[10px] text-[#F2F0E9]/60 font-mono">Active</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/erp/login' })}
                  title="Sign Out"
                  className="p-2 rounded-xl hover:bg-red-500/20 text-slate-300 hover:text-red-300 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => signOut({ callbackUrl: '/erp/login' })}
                title="Sign Out"
                className="w-11 h-11 mx-auto rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-64'
      }`}>
        
        {/* Top Navigation Bar Header */}
        <header className="h-16 border-b border-slate-200 bg-white px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          
          {/* Left: Mobile hamburger & Global Search input */}
          <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-xl">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search quotations, invoices, customers..."
                onClick={() => {
                  const e = new KeyboardEvent('keydown', { metaKey: true, key: 'k' });
                  window.dispatchEvent(e);
                }}
                readOnly
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-12 py-2 text-xs font-medium text-slate-700 focus:outline-none hover:bg-slate-100/80 cursor-pointer transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 bg-white text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded border border-slate-200">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            
            {/* Quick Actions Dropdown */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-[#CC5833]" />
                <span>Quick Actions</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {quickActionsOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-fade-in">
                  <Link href="/erp/quotes" prefetch={true} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-[#2E4036]/10 hover:text-[#2E4036] rounded-xl transition-colors">
                    <FileText className="w-4 h-4 text-[#2E4036]" />
                    <span>New Quotation</span>
                  </Link>
                  <Link href="/erp/invoices" prefetch={true} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-[#CC5833]/10 hover:text-[#CC5833] rounded-xl transition-colors">
                    <FileCheck className="w-4 h-4 text-[#CC5833]" />
                    <span>New Invoice</span>
                  </Link>
                  <Link href="/erp/customers" prefetch={true} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-[#2E4036]/10 hover:text-[#2E4036] rounded-xl transition-colors">
                    <Users className="w-4 h-4 text-[#2E4036]" />
                    <span>Add Customer</span>
                  </Link>
                </div>
              )}
            </div>

            {/* + New Button */}
            <Link
              href="/erp/quotes"
              prefetch={true}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E4036] hover:bg-[#1E2E25] text-white text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </Link>

          </div>
        </header>

        {/* Content Page Container */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-sm">
          <aside className="w-64 bg-[#2E4036] text-[#F2F0E9] p-6 flex flex-col justify-between h-full shadow-2xl relative animate-slide-right">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 text-slate-300 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6 mt-4 flex-1 overflow-y-auto">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#CC5833] flex items-center justify-center text-white font-black text-sm">
                  IZ
                </div>
                <span className="font-heading font-black tracking-wider text-base text-white">
                  IZZEY ERP
                </span>
              </div>

              <nav className="space-y-4">
                {navSections.map((section, idx) => {
                  const visibleItems = section.items;

                  return (
                    <div key={idx} className="space-y-1">
                      {section.title && (
                        <p className="px-3 text-[10px] font-bold font-mono text-slate-400 tracking-wider uppercase mb-1">
                          {section.title}
                        </p>
                      )}
                      {visibleItems.map((item, itemIdx) => {
                        const isActive = pathname === item.path;
                        const ItemIcon = item.icon;
                        return (
                          <Link
                            key={itemIdx}
                            href={item.path}
                            prefetch={true}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                              isActive ? 'bg-[#CC5833] text-white' : 'text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            <ItemIcon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => signOut({ callbackUrl: '/erp/login' })}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs text-red-300 hover:bg-red-500/20 transition-all font-semibold cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
