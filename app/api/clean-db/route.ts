import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  try {
    console.log('[API] Starting database cleanup...');

    // Delete in correct order to respect constraints
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`[API] Deleted ${deletedPayments.count} payments.`);

    const deletedInvoiceItems = await prisma.invoiceItem.deleteMany({});
    console.log(`[API] Deleted ${deletedInvoiceItems.count} invoice items.`);

    const deletedInvoices = await prisma.invoice.deleteMany({});
    console.log(`[API] Deleted ${deletedInvoices.count} invoices.`);

    const deletedQuotationItems = await prisma.quotationItem.deleteMany({});
    console.log(`[API] Deleted ${deletedQuotationItems.count} quotation items.`);

    const deletedQuotations = await prisma.quotation.deleteMany({});
    console.log(`[API] Deleted ${deletedQuotations.count} quotations.`);

    const deletedExpenses = await prisma.expense.deleteMany({});
    console.log(`[API] Deleted ${deletedExpenses.count} expenses.`);

    return NextResponse.json({
      success: true,
      message: 'Database cleanup completed successfully!',
      details: {
        payments: deletedPayments.count,
        invoiceItems: deletedInvoiceItems.count,
        invoices: deletedInvoices.count,
        quotationItems: deletedQuotationItems.count,
        quotations: deletedQuotations.count,
        expenses: deletedExpenses.count,
      }
    });
  } catch (error: any) {
    console.error('[API] Error during database cleanup:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An error occurred during database cleanup.',
    }, { status: 500 });
  }
}
