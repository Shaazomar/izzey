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

function formatRelativeTime(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

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
    todayRevenue: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    netProfit: 0,
    outstandingPayments: 0,
    activeQuotesCount: 0,
    activeJobsCount: 0,
    expenseBreakdown: {},
    recentActivity: [],
    jobStatus: { scheduled: 0, inProgress: 0, completed: 0, cancelled: 0 },
    totalQuotesCount: 0,
    totalQuotesAmount: 0,
    totalInvoicesCount: 0,
    totalInvoicesAmount: 0,
    totalPaidInvoicesCount: 0,
    totalPaidAmount: 0,
    monthlyInvoicesCount: 0,
    monthlyPaidInvoicesCount: 0,
    monthlyPaidAmount: 0,
    overdueCount: 0,
    overdueAmount: 0,
    topServices: [],
    graphData: []
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
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.totalQuotesCount}</p>
            <p className="text-xs font-medium text-slate-500">
              € {Number(stats.totalQuotesAmount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#2E4036]/10 text-[#2E4036] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Total Invoices</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.totalInvoicesCount}</p>
            <p className="text-xs font-medium text-slate-500">
              € {Number(stats.totalInvoicesAmount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#CC5833]/10 text-[#CC5833] flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Paid Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Paid Invoices</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.totalPaidInvoicesCount}</p>
            <p className="text-xs font-medium text-slate-500">
              € {Number(stats.totalPaidAmount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#2E4036]/10 text-[#2E4036] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Outstanding</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              € {Number(stats.outstandingPayments).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-xs font-bold ${stats.overdueCount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
              {stats.overdueCount} Overdue
            </p>
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

          <SalesOverviewChart data={stats.graphData} />
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 mb-4">Recent Activities</h2>
            
            <div className="space-y-3.5">
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity: any, idx: number) => {
                  let Icon = CheckCircle2;
                  let colorClass = 'bg-emerald-50 text-emerald-600';
                  
                  if (activity.type === 'CUSTOMER') {
                    Icon = UserPlus;
                    colorClass = 'bg-amber-50 text-amber-600';
                  } else if (activity.type === 'INVOICE') {
                    Icon = FileCheck;
                    colorClass = 'bg-purple-50 text-purple-600';
                  } else if (activity.type === 'QUOTATION') {
                    Icon = Send;
                    colorClass = 'bg-[#2E4036]/10 text-[#2E4036]';
                  }
                  
                  return (
                    <div key={idx} className="flex items-start justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <div className={`w-7 h-7 rounded-full ${colorClass} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{activity.title}</p>
                          <p className="text-[11px] text-slate-500">{activity.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {formatRelativeTime(activity.date)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs font-mono">
                  No recent activity found.
                </div>
              )}
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
                <span className="font-bold text-slate-900">
                  € {Number(stats.monthlyRevenue).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Paid</span>
                <span className="font-bold text-emerald-600">
                  € {Number(stats.monthlyPaidAmount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Outstanding</span>
                <span className="font-bold text-rose-600">
                  € {Number(stats.outstandingPayments).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Overdue</span>
                <span className="font-bold text-rose-600">
                  € {Number(stats.overdueAmount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
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
              {stats.topServices && stats.topServices.length > 0 ? (
                stats.topServices.map((service: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-700 truncate pr-2 max-w-[150px]">{service.name}</span>
                      <span className="font-bold text-slate-900">
                        € {Number(service.amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#2E4036] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${service.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs font-mono">
                  No service sales recorded this month.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
