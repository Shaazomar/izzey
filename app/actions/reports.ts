'use server';

import prisma from '../../lib/prisma';

export async function getFinancialSummary(startDate: Date, endDate: Date, mode: 'OFFICIAL' | 'MANAGEMENT') {
  try {
    // 1. Calculate revenues from standard invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'DRAFT', // Drafts are not realized revenue
        },
      },
    });

    const totalInvoiceRevenue = invoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);
    const subtotalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.subtotal), 0);
    const totalVatCollected = invoices.reduce((sum, inv) => sum + Number(inv.vatAmount), 0);
    
    // Payments received (Cash basis view)
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    
    const cashRevenue = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);

    // 2. Fetch business expenses
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        // Filter out cash/internal expenses for OFFICIAL mode
        isOfficial: mode === 'OFFICIAL' ? true : undefined,
      },
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    
    // Group expenses by category
    const expenseBreakdown = expenses.reduce((acc: any, exp) => {
      const cat = exp.category;
      acc[cat] = (acc[cat] || 0) + Number(exp.amount);
      return acc;
    }, {});

    // OFFICIAL Mode Calculations (Mode 1)
    if (mode === 'OFFICIAL') {
      const netProfit = subtotalRevenue - totalExpenses;
      return {
        success: true,
        data: {
          revenue: totalInvoiceRevenue,
          subtotalRevenue,
          vatCollected: totalVatCollected,
          expenses: totalExpenses,
          expenseBreakdown,
          netProfit,
          cashRevenue,
        },
      };
    }

    // MANAGEMENT Mode Calculations (Mode 2)
    // Gather all labor & job costs within the date range
    const jobCosts = await prisma.managementJobCost.findMany({
      where: {
        job: {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    });

    const realLabourCost = jobCosts.reduce((sum, cost) => sum + Number(cost.realLabourCost), 0);
    const bonuses = jobCosts.reduce((sum, cost) => sum + Number(cost.bonuses), 0);
    const commission = jobCosts.reduce((sum, cost) => sum + Number(cost.commission), 0);
    const materialCost = jobCosts.reduce((sum, cost) => sum + Number(cost.materialCost), 0);
    const hiddenCosts = jobCosts.reduce((sum, cost) => sum + Number(cost.hiddenCosts), 0);

    const totalJobLevelCosts = realLabourCost + bonuses + commission + materialCost + hiddenCosts;
    const totalManagementOutflow = totalExpenses + totalJobLevelCosts;
    const managementNetProfit = subtotalRevenue - totalManagementOutflow;
    const profitMargin = subtotalRevenue > 0 ? (managementNetProfit / subtotalRevenue) * 100 : 0;

    return {
      success: true,
      data: {
        revenue: totalInvoiceRevenue,
        subtotalRevenue,
        vatCollected: totalVatCollected,
        expenses: totalExpenses, // combined official and unofficial expenses
        expenseBreakdown,
        realLabourCost,
        bonuses,
        commission,
        materialCost,
        hiddenCosts,
        totalJobLevelCosts,
        totalManagementOutflow,
        netProfit: managementNetProfit,
        profitMargin,
      },
    };
  } catch (error: any) {
    console.error('Error generating financial summary:', error);
    return { success: false, error: error?.message || 'Failed to generate financial summary.' };
  }
}

export async function getJobsAnalytics(startDate: Date, endDate: Date) {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        startDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      include: {
        quotation: {
          include: { customer: true },
        },
        managementCost: true,
      },
    });

    const jobsReport = jobs.map((job) => {
      const subtotal = Number(job.quotation?.subtotal || 0);
      const labour = Number(job.managementCost?.realLabourCost || 0);
      const bonuses = Number(job.managementCost?.bonuses || 0);
      const comm = Number(job.managementCost?.commission || 0);
      const material = Number(job.managementCost?.materialCost || 0);
      const hidden = Number(job.managementCost?.hiddenCosts || 0);
      
      const totalCost = labour + bonuses + comm + material + hidden;
      const profit = subtotal - totalCost;
      const margin = subtotal > 0 ? (profit / subtotal) * 100 : 0;

      return {
        id: job.id,
        quoteNumber: job.quotation?.quoteNumber || 'N/A',
        customerName: job.quotation?.customer.name || 'N/A',
        companyName: job.quotation?.customer.companyName || null,
        date: job.startDate,
        revenue: subtotal,
        subtotal,
        labour,
        bonuses,
        comm,
        material,
        hidden,
        totalCost,
        profit,
        margin,
      };
    });

    return { success: true, data: jobsReport };
  } catch (error: any) {
    console.error('Error generating jobs analytics:', error);
    return { success: false, error: error?.message || 'Failed to fetch jobs analytics.' };
  }
}
