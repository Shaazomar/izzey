'use server';

import prisma from '../../lib/prisma';
import { JobStatus, QuotationStatus, InvoiceStatus } from '@prisma/client';

export async function getDashboardStats(mode: 'OFFICIAL' | 'MANAGEMENT') {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Calculate Revenue
    // Standard invoices issued this month
    const monthlyInvoices = await prisma.invoice.findMany({
      where: {
        issueDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: {
          not: InvoiceStatus.DRAFT,
        },
      },
      select: { grandTotal: true, issueDate: true },
    });

    const monthlyRevenue = monthlyInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);

    // Today's revenue
    const todayInvoices = await prisma.invoice.findMany({
      where: {
        issueDate: {
          gte: today,
        },
        status: {
          not: InvoiceStatus.DRAFT,
        },
      },
      select: { grandTotal: true },
    });

    const todayRevenue = todayInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);

    // 2. Outstanding Payments
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE],
        },
      },
      select: { grandTotal: true, amountPaid: true },
    });

    const outstandingPayments = unpaidInvoices.reduce(
      (sum, inv) => sum + (Number(inv.grandTotal) - Number(inv.amountPaid)),
      0
    );

    // 3. Active Quotations & Jobs
    const activeQuotesCount = await prisma.quotation.count({
      where: {
        status: {
          in: [QuotationStatus.SENT, QuotationStatus.APPROVED],
        },
      },
    });

    const activeJobsCount = await prisma.job.count({
      where: {
        status: {
          in: [JobStatus.SCHEDULED, JobStatus.IN_PROGRESS],
        },
      },
    });

    // 4. Calculate Expenses
    const monthlyExpensesData = await prisma.expense.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        isOfficial: mode === 'OFFICIAL' ? true : undefined,
      },
      select: { amount: true, category: true },
    });

    let monthlyExpenses = monthlyExpensesData.reduce((sum, exp) => sum + Number(exp.amount), 0);

    const expenseBreakdown: Record<string, number> = {};
    monthlyExpensesData.forEach((exp) => {
      const cat = exp.category;
      expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + Number(exp.amount);
    });

    // Incorporate Job Costs for Management Analytics Mode
    let realLabourCost = 0;
    let jobLevelCosts = 0;

    if (mode === 'MANAGEMENT') {
      const monthlyJobCosts = await prisma.managementJobCost.findMany({
        where: {
          job: {
            startDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        },
      });

      realLabourCost = monthlyJobCosts.reduce((sum, cost) => sum + Number(cost.realLabourCost), 0);
      const bonuses = monthlyJobCosts.reduce((sum, cost) => sum + Number(cost.bonuses), 0);
      const commission = monthlyJobCosts.reduce((sum, cost) => sum + Number(cost.commission), 0);
      const materials = monthlyJobCosts.reduce((sum, cost) => sum + Number(cost.materialCost), 0);
      const hidden = monthlyJobCosts.reduce((sum, cost) => sum + Number(cost.hiddenCosts), 0);

      jobLevelCosts = realLabourCost + bonuses + commission + materials + hidden;
      monthlyExpenses += jobLevelCosts;

      if (realLabourCost > 0) expenseBreakdown['LABOUR'] = (expenseBreakdown['LABOUR'] || 0) + realLabourCost;
      if (bonuses > 0) expenseBreakdown['BONUSES'] = (expenseBreakdown['BONUSES'] || 0) + bonuses;
      if (commission > 0) expenseBreakdown['COMMISSION'] = (expenseBreakdown['COMMISSION'] || 0) + commission;
      if (materials > 0) expenseBreakdown['MATERIALS'] = (expenseBreakdown['MATERIALS'] || 0) + materials;
      if (hidden > 0) expenseBreakdown['HIDDEN_COSTS'] = (expenseBreakdown['HIDDEN_COSTS'] || 0) + hidden;
    }

    const netProfit = monthlyRevenue - monthlyExpenses;

    // 5. Job Status Breakdown
    const scheduledJobs = await prisma.job.count({ where: { status: JobStatus.SCHEDULED } });
    const inProgressJobs = await prisma.job.count({ where: { status: JobStatus.IN_PROGRESS } });
    const completedJobs = await prisma.job.count({ where: { status: JobStatus.COMPLETED } });
    const cancelledJobs = await prisma.job.count({ where: { status: JobStatus.CANCELLED } });

    // 6. Recent Activity list
    // Let's grab last 5 customer registrations, last 5 invoice generations, and last 5 payments
    const [recentCustomers, recentInvoices, recentPayments] = await Promise.all([
      prisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, companyName: true, createdAt: true },
      }),
      prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, invoiceNumber: true, grandTotal: true, status: true, createdAt: true },
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, amount: true, invoice: { select: { invoiceNumber: true } }, paymentDate: true },
      }),
    ]);

    const recentActivity = [
      ...recentCustomers.map((c) => ({
        type: 'CUSTOMER',
        text: `New customer registered: ${c.name}${c.companyName ? ` (${c.companyName})` : ''}`,
        date: c.createdAt,
      })),
      ...recentInvoices.map((i) => ({
        type: 'INVOICE',
        text: `Invoice generated: ${i.invoiceNumber} for €${Number(i.grandTotal).toFixed(2)} (${i.status})`,
        date: i.createdAt,
      })),
      ...recentPayments.map((p) => ({
        type: 'PAYMENT',
        text: `Payment of €${Number(p.amount).toFixed(2)} recorded for ${p.invoice.invoiceNumber}`,
        date: p.paymentDate,
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 7);

    // 7. Graph Data: Last 6 months revenue and expenses
    const graphData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const label = monthStart.toLocaleString('default', { month: 'short' });

      // Revenue
      const invs = await prisma.invoice.findMany({
        where: {
          issueDate: { gte: monthStart, lte: monthEnd },
          status: { not: InvoiceStatus.DRAFT },
        },
        select: { grandTotal: true },
      });
      const revSum = invs.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);

      // Expenses
      const exps = await prisma.expense.findMany({
        where: {
          date: { gte: monthStart, lte: monthEnd },
          isOfficial: mode === 'OFFICIAL' ? true : undefined,
        },
        select: { amount: true },
      });
      let expSum = exps.reduce((sum, exp) => sum + Number(exp.amount), 0);

      if (mode === 'MANAGEMENT') {
        const jCosts = await prisma.managementJobCost.findMany({
          where: {
            job: {
              startDate: { gte: monthStart, lte: monthEnd },
            },
          },
          select: { realLabourCost: true, bonuses: true, commission: true, materialCost: true, hiddenCosts: true },
        });
        const jobSum = jCosts.reduce(
          (sum, c) =>
            sum +
            Number(c.realLabourCost) +
            Number(c.bonuses) +
            Number(c.commission) +
            Number(c.materialCost) +
            Number(c.hiddenCosts),
          0
        );
        expSum += jobSum;
      }

      graphData.push({
        month: label,
        revenue: revSum,
        expenses: expSum,
        profit: revSum - expSum,
      });
    }

    return {
      success: true,
      data: {
        todayRevenue,
        monthlyRevenue,
        outstandingPayments,
        activeQuotesCount,
        activeJobsCount,
        monthlyExpenses,
        netProfit,
        jobStatus: {
          scheduled: scheduledJobs,
          inProgress: inProgressJobs,
          completed: completedJobs,
          cancelled: cancelledJobs,
        },
        recentActivity,
        graphData,
        expenseBreakdown,
      },
    };
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return { success: false, error: error?.message || 'Failed to fetch dashboard stats.' };
  }
}
