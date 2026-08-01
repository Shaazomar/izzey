import React from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getAccountingMode } from '@/app/actions/mode';
import { getFinancialSummary, getJobsAnalytics } from '@/app/actions/reports';
import ReportsClient from './ReportsClient';

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/erp/login');
  }

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const mode = await getAccountingMode();
  
  const [summaryRes, jobsRes] = await Promise.all([
    getFinancialSummary(startOfMonth, endOfDay, mode),
    getJobsAnalytics(startOfMonth, endOfDay),
  ]);

  const summary = summaryRes.success && summaryRes.data ? summaryRes.data : {
    revenue: 0,
    subtotalRevenue: 0,
    vatCollected: 0,
    expenses: 0,
    expenseBreakdown: {},
    netProfit: 0,
    cashRevenue: 0,
    realLabourCost: 0,
    bonuses: 0,
    commission: 0,
    materialCost: 0,
    hiddenCosts: 0,
    totalJobLevelCosts: 0,
    totalManagementOutflow: 0,
    profitMargin: 0,
  };

  const jobsAnalytics = jobsRes.success && jobsRes.data ? jobsRes.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-3xl tracking-tight">FINANCIAL REPORTS</h1>
        <p className="text-sm text-dark/60">
          Generate profit & loss statements, review VAT balances, audit job cost margins, and export CSV ledger sheets.
        </p>
      </div>
      <ReportsClient 
        initialSummary={summary} 
        initialJobsAnalytics={jobsAnalytics} 
        mode={mode} 
      />
    </div>
  );
}
