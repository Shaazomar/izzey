import React from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getAccountingMode } from '@/app/actions/mode';
import { getDashboardStats } from '@/app/actions/dashboard';
import { getQuotes } from '@/app/actions/quotes';
import SalesOverviewChart from '@/components/erp/SalesOverviewChart';
import DashboardQuotations from '@/components/erp/DashboardQuotations';
import { 
  FileText, FileCheck, CheckCircle2, AlertCircle, Plus, Filter, Search, 
  MoreHorizontal, ChevronLeft, ChevronRight, UserPlus, Box, Send, Clock, 
  ArrowUpRight, ArrowDownRight, ArrowRight
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/erp/login');
  }

  const mode = await getAccountingMode();
  const [statsRes, quotesRes] = await Promise.all([
    getDashboardStats(mode),
    getQuotes()
  ]);

  const stats = statsRes.success && statsRes.data ? JSON.parse(JSON.stringify(statsRes.data)) : {
    todayRevenue: 1250,
    monthlyRevenue: 7240.50,
    monthlyExpenses: 2260.50,
    netProfit: 4980.00,
    outstandingPayments: 2260.50,
    activeQuotesCount: 24,
    activeJobsCount: 18,
    expenseBreakdown: {},
    recentActivity: [],
    jobStatus: { scheduled: 8, inProgress: 4, completed: 12 }
  };

  const quotes = quotesRes.success && quotesRes.data ? JSON.parse(JSON.stringify(quotesRes.data)) : [];

  return (
    <div className="space-y-6">
      
      {/* 1. Top KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Quotations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Total Quotations</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">24</p>
            <p className="text-xs font-medium text-slate-500">€ 8.950,00</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#2E4036]/10 text-[#2E4036] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Total Invoices</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">18</p>
            <p className="text-xs font-medium text-slate-500">€ 7.240,50</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#CC5833]/10 text-[#CC5833] flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Paid Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Paid Invoices</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">12</p>
            <p className="text-xs font-medium text-slate-500">€ 4.980,00</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#2E4036]/10 text-[#2E4036] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Outstanding</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">€ 2.260,50</p>
            <p className="text-xs font-bold text-rose-600">5 Overdue</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 2. Middle Row: Quotations Table & Create New Side Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quotations Data Table Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <DashboardQuotations initialQuotes={quotes} />
        </div>

        {/* Create New Actions Side Widget */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <h2 className="font-extrabold text-lg text-slate-900">Create New</h2>

          <div className="space-y-3">
            
            {/* New Quotation */}
            <a href="/erp/quotes" className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-[#2E4036]/10 hover:border-[#2E4036]/20 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#2E4036]/10 text-[#2E4036] flex items-center justify-center shrink-0 group-hover:bg-[#2E4036] group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-[#2E4036] transition-colors">New Quotation</p>
                <p className="text-[11px] text-slate-500">Create a new quotation</p>
              </div>
            </a>

            {/* New Invoice */}
            <a href="/erp/invoices" className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-[#CC5833]/10 hover:border-[#CC5833]/20 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#CC5833]/10 text-[#CC5833] flex items-center justify-center shrink-0 group-hover:bg-[#CC5833] group-hover:text-white transition-colors">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-[#CC5833] transition-colors">New Invoice</p>
                <p className="text-[11px] text-slate-500">Create a new invoice</p>
              </div>
            </a>

            {/* New Customer */}
            <a href="/erp/customers" className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-[#2E4036]/10 hover:border-[#2E4036]/20 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#2E4036]/10 text-[#2E4036] flex items-center justify-center shrink-0 group-hover:bg-[#2E4036] group-hover:text-white transition-colors">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-[#2E4036] transition-colors">New Customer</p>
                <p className="text-[11px] text-slate-500">Add a new customer</p>
              </div>
            </a>

            {/* New Service */}
            <a href="/erp/jobs" className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-[#CC5833]/10 hover:border-[#CC5833]/20 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#CC5833]/10 text-[#CC5833] flex items-center justify-center shrink-0 group-hover:bg-[#CC5833] group-hover:text-white transition-colors">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-[#CC5833] transition-colors">New Service</p>
                <p className="text-[11px] text-slate-500">Add a new service</p>
              </div>
            </a>

          </div>
        </div>

      </div>

      {/* 3. Bottom Row: Sales Chart, Recent Activities, Overview & Top Services */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Overview Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base text-slate-900">Sales Overview</h2>
            <select className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none">
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Year</option>
            </select>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-[#2E4036] rounded-full"></span>
              <span className="text-slate-600">Sales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-[#CC5833] rounded-full border border-dashed border-[#CC5833]"></span>
              <span className="text-slate-600">Paid</span>
            </div>
          </div>

          <SalesOverviewChart />
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 mb-4">Recent Activities</h2>
            
            <div className="space-y-3.5">
              
              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Quotation ANG-2026-001 approved</p>
                    <p className="text-[11px] text-slate-500">Embassy of Ireland</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">2 min ago</span>
              </div>

              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#2E4036]/10 text-[#2E4036] flex items-center justify-center shrink-0 mt-0.5">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Quotation ANG-2026-002 sent</p>
                    <p className="text-[11px] text-slate-500">Lukas Schneider</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">15 min ago</span>
              </div>

              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Invoice INV-2026-012 paid</p>
                    <p className="text-[11px] text-slate-500">Robert Müller</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">1 hour ago</span>
              </div>

              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">New customer Anna Becker added</p>
                    <p className="text-[11px] text-slate-500">Customer</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">2 hours ago</span>
              </div>

              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#2E4036]/10 text-[#2E4036] flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Invoice INV-2026-011 created</p>
                    <p className="text-[11px] text-slate-500">Tech GmbH</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">3 hours ago</span>
              </div>

            </div>
          </div>

          <a href="#" className="inline-flex items-center gap-1 text-xs font-bold text-[#CC5833] hover:text-[#CC5833]/80 transition-colors pt-2">
            <span>View all activities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Total Overview & Top Services Stack Column */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Total Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-sm text-slate-900">Total Overview</h2>
              <select className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-slate-700 focus:outline-none">
                <option>This Month</option>
              </select>
            </div>

            <div className="space-y-2 text-xs font-medium">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Sales</span>
                <span className="font-bold text-slate-900">€ 7.240,50</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Paid</span>
                <span className="font-bold text-emerald-600">€ 4.980,00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Outstanding</span>
                <span className="font-bold text-rose-600">€ 2.260,50</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Overdue</span>
                <span className="font-bold text-rose-600">€ 1.120,00</span>
              </div>
            </div>
          </div>

          {/* Top Services Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-sm text-slate-900">Top Services</h2>
              <select className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-slate-700 focus:outline-none">
                <option>This Month</option>
              </select>
            </div>

            <div className="space-y-3 text-xs">
              
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">Deep Cleaning</span>
                  <span className="font-bold text-slate-900">€ 3.850,00</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-[#2E4036] h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">Move-Out Cleaning</span>
                  <span className="font-bold text-slate-900">€ 1.450,00</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-[#2E4036] h-full rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">Office Cleaning</span>
                  <span className="font-bold text-slate-900">€ 1.120,00</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-[#2E4036] h-full rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">Window Cleaning</span>
                  <span className="font-bold text-slate-900">€ 820,00</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-[#2E4036] h-full rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
