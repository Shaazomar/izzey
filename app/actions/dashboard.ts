'use server';

import prisma from '../../lib/prisma';
import { JobStatus, QuotationStatus, InvoiceStatus, PaymentStatus } from '@prisma/client';

export async function getDashboardStats(mode: 'OFFICIAL' | 'MANAGEMENT') {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Parallelize initial database statistical queries
    const [
      monthlyInvoices,
      todayInvoices,
      unpaidInvoices,
      overdueInvoices,
      monthlyPaidInvoices,
      monthlyPayments,
      activeQuotesCount,
      totalQuotesCount,
      totalQuotesList,
      totalInvoices,
      totalPaidInvoices,
      totalPayments,
      activeJobsCount,
      monthlyExpensesData,
    ] = await Promise.all([
      prisma.invoice.findMany({
        where: { issueDate: { gte: startOfMonth, lte: endOfMonth }, status: { not: InvoiceStatus.DRAFT } },
        select: { grandTotal: true, issueDate: true },
      }),
      prisma.invoice.findMany({
        where: { issueDate: { gte: today }, status: { not: InvoiceStatus.DRAFT } },
        select: { grandTotal: true },
      }),
      prisma.invoice.findMany({
        where: { status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] } },
        select: { grandTotal: true, amountPaid: true },
      }),
      prisma.invoice.findMany({
        where: { status: InvoiceStatus.OVERDUE },
        select: { grandTotal: true, amountPaid: true },
      }),
      prisma.invoice.findMany({
        where: { issueDate: { gte: startOfMonth, lte: endOfMonth }, status: InvoiceStatus.PAID },
        select: { grandTotal: true },
      }),
      prisma.payment.findMany({
        where: { paymentDate: { gte: startOfMonth, lte: endOfMonth }, status: PaymentStatus.PAID },
        select: { amount: true },
      }),
      prisma.quotation.count({
        where: { status: { in: [QuotationStatus.SENT, QuotationStatus.APPROVED] } },
      }),
      prisma.quotation.count(),
      prisma.quotation.findMany({ select: { grandTotal: true } }),
      prisma.invoice.findMany({
        where: { status: { not: InvoiceStatus.DRAFT } },
        select: { grandTotal: true },
      }),
      prisma.invoice.findMany({
        where: { status: InvoiceStatus.PAID },
        select: { grandTotal: true },
      }),
      prisma.payment.findMany({
        where: { status: PaymentStatus.PAID },
        select: { amount: true },
      }),
      prisma.job.count({
        where: { status: { in: [JobStatus.SCHEDULED, JobStatus.IN_PROGRESS] } },
      }),
      prisma.expense.findMany({
        where: { date: { gte: startOfMonth, lte: endOfMonth }, isOfficial: mode === 'OFFICIAL' ? true : undefined },
        select: { amount: true, category: true },
      }),
    ]);

    const monthlyRevenue = monthlyInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);
    const monthlyInvoicesCount = monthlyInvoices.length;
    const todayRevenue = todayInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);

    const outstandingPayments = unpaidInvoices.reduce(
      (sum, inv) => sum + (Number(inv.grandTotal) - Number(inv.amountPaid)),
      0
    );

    const overdueCount = overdueInvoices.length;
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + (Number(inv.grandTotal) - Number(inv.amountPaid)),
      0
    );

    const monthlyPaidInvoicesCount = monthlyPaidInvoices.length;
    const monthlyPaidAmount = monthlyPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const totalQuotesAmount = totalQuotesList.reduce((sum, q) => sum + Number(q.grandTotal), 0);

    const totalInvoicesCount = totalInvoices.length;
    const totalInvoicesAmount = totalInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);

    const totalPaidInvoicesCount = totalPaidInvoices.length;
    const totalPaidAmount = totalPayments.reduce((sum, p) => sum + Number(p.amount), 0);

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
    // Grab last 5 customer registrations, last 5 invoice generations, last 5 payments, and last 5 quotations
    const [recentCustomers, recentInvoices, recentPayments, recentQuotations] = await Promise.all([
      prisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, companyName: true, createdAt: true },
      }),
      prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { 
          id: true, 
          invoiceNumber: true, 
          grandTotal: true, 
          status: true, 
          createdAt: true,
          customer: { select: { name: true } }
        },
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { 
          id: true, 
          amount: true, 
          invoice: { 
            select: { 
              invoiceNumber: true,
              customer: { select: { name: true } }
            } 
          }, 
          paymentDate: true 
        },
      }),
      prisma.quotation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { 
          id: true, 
          quoteNumber: true, 
          grandTotal: true, 
          status: true, 
          createdAt: true,
          customer: { select: { name: true } }
        },
      }),
    ]);

    const recentActivity = [
      ...recentCustomers.map((c) => ({
        type: 'CUSTOMER',
        title: 'Customer Added',
        subtitle: `${c.name}${c.companyName ? ` (${c.companyName})` : ''}`,
        date: c.createdAt,
      })),
      ...recentInvoices.map((i) => ({
        type: 'INVOICE',
        title: `Invoice ${i.invoiceNumber}`,
        subtitle: `${i.customer.name} - €${Number(i.grandTotal).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${i.status})`,
        date: i.createdAt,
      })),
      ...recentPayments.map((p) => ({
        type: 'PAYMENT',
        title: 'Payment Received',
        subtitle: `Invoice ${p.invoice.invoiceNumber} - €${Number(p.amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        date: p.paymentDate,
      })),
      ...recentQuotations.map((q) => ({
        type: 'QUOTATION',
        title: `Quotation ${q.quoteNumber}`,
        subtitle: `${q.customer.name} - €${Number(q.grandTotal).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${q.status})`,
        date: q.createdAt,
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 7);

    // 7. Top Services this month based on Invoice Items
    const monthlyInvoiceItems = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          issueDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          status: {
            not: InvoiceStatus.DRAFT,
          },
        },
      },
      select: {
        serviceName: true,
        total: true,
      },
    });

    const serviceTotals: Record<string, number> = {};
    monthlyInvoiceItems.forEach((item) => {
      serviceTotals[item.serviceName] = (serviceTotals[item.serviceName] || 0) + Number(item.total);
    });

    const topServicesRaw = Object.entries(serviceTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    const maxServiceAmount = topServicesRaw.length > 0 ? Math.max(...topServicesRaw.map(s => s.amount)) : 1;
    const topServices = topServicesRaw.map(s => ({
      ...s,
      percentage: maxServiceAmount > 0 ? Math.round((s.amount / maxServiceAmount) * 100) : 0
    }));

    // 8. Graph Data: Last 6 months revenue and payments
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

      // Paid
      const payments = await prisma.payment.findMany({
        where: {
          paymentDate: { gte: monthStart, lte: monthEnd },
          status: PaymentStatus.PAID,
        },
        select: { amount: true },
      });
      const paidSum = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Expenses (For backward compatibility / internal calculations)
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
        date: label,
        sales: revSum,
        paid: paidSum,
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
        totalQuotesCount,
        totalQuotesAmount,
        totalInvoicesCount,
        totalInvoicesAmount,
        totalPaidInvoicesCount,
        totalPaidAmount,
        monthlyInvoicesCount,
        monthlyPaidInvoicesCount,
        monthlyPaidAmount,
        overdueCount,
        overdueAmount,
        topServices,
      },
    };
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return { success: false, error: error?.message || 'Failed to fetch dashboard stats.' };
  }
}
