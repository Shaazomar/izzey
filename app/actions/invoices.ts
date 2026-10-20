'use server';

import { revalidatePath } from 'next/cache';
import prisma from '../../lib/prisma';
import { InvoiceSchema, PaymentSchema } from '../../lib/validators';
import { InvoiceStatus, PaymentStatus, PaymentMethod, Prisma } from '@prisma/client';
import { calcInvoiceTotals } from '../../lib/invoice';

export async function generateInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;
  
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
    select: {
      invoiceNumber: true,
    },
  });

  let nextNum = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

const INVOICE_INCLUDE = {
  customer: true,
  items: { orderBy: { position: 'asc' as const } },
  payments: { orderBy: { paymentDate: 'desc' as const } },
};

/** Plain, JSON-safe copy (Decimals -> strings, Dates -> ISO strings) so server and client see identical data. */
function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function revalidateInvoice(id?: string) {
  try {
    revalidatePath('/erp/invoices');
    revalidatePath('/erp');
    revalidatePath('/erp/payments');
    revalidatePath('/erp/reports');
    if (id) {
      revalidatePath(`/erp/invoices/${id}`);
      revalidatePath(`/erp/invoices/${id}/preview`);
    }
  } catch (e) {
    console.warn('revalidatePath error ignored:', e);
  }
}

function errorMessage(error: any, fallback: string): string {
  if (error?.code === 'P2002') {
    return 'This invoice number already exists. Please choose a different one.';
  }
  return error?.issues?.[0]?.message || error?.errors?.[0]?.message || error?.message || fallback;
}

function buildItemsAndTotals(items: any[]) {
  const totals = calcInvoiceTotals(items);
  const itemsData = items.map((item, idx) => ({
    position: idx,
    serviceName: item.serviceName,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    discount: item.discount,
    vatPercent: item.vatPercent,
    total: totals.lines[idx].net,
  }));
  return { totals, itemsData };
}

export async function getInvoices(query?: string) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: query
        ? {
            OR: [
              { invoiceNumber: { contains: query, mode: 'insensitive' } },
              { customer: { name: { contains: query, mode: 'insensitive' } } },
              { customer: { companyName: { contains: query, mode: 'insensitive' } } },
            ],
          }
        : undefined,
      include: INVOICE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: invoices };
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return { success: false, error: error?.message || 'Failed to fetch invoices.' };
  }
}

export async function getInvoice(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: INVOICE_INCLUDE,
    });

    if (!invoice) {
      return { success: false, error: 'Invoice not found.' };
    }

    return { success: true, data: invoice };
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return { success: false, error: error?.message || 'Failed to fetch invoice.' };
  }
}

/** Client-callable variant of getInvoice that returns plain JSON, used to load the canonical record into the editor. */
export async function getInvoiceForEdit(id: string) {
  const res = await getInvoice(id);
  return res.success && res.data ? { success: true, data: serialize(res.data) } : res;
}

function optionalFields(v: any) {
  // `undefined` means "not supplied": Prisma skips it, so omitted fields keep their saved values.
  return {
    reference: v.reference,
    serviceDate: v.serviceDate,
    currency: v.currency,
    language: v.language,
    paymentTerms: v.paymentTerms,
    paymentMethod: v.paymentMethod,
    bankDetails: v.bankDetails,
    footerText: v.footerText,
    billingDetails: v.billingDetails === null ? Prisma.DbNull : v.billingDetails,
    companyDetails: v.companyDetails === null ? Prisma.DbNull : v.companyDetails,
  };
}

export async function createInvoice(data: any) {
  try {
    const validatedData = InvoiceSchema.parse(data);
    const { totals, itemsData } = buildItemsAndTotals(validatedData.items);

    const invoice = await prisma.$transaction(
      async (tx) => {
        let invoiceNumber = validatedData.invoiceNumber;
        if (invoiceNumber) {
          const clash = await tx.invoice.findUnique({ where: { invoiceNumber }, select: { id: true } });
          if (clash) throw new Error(`Invoice number ${invoiceNumber} already exists. Please choose a different one.`);
        } else {
          invoiceNumber = await generateInvoiceNumber();
        }

        return tx.invoice.create({
          data: {
            invoiceNumber,
            quotationId: validatedData.quotationId,
            customerId: validatedData.customerId,
            dateType: validatedData.dateType,
            issueDate: validatedData.issueDate,
            toDate: validatedData.dateType === 'CONTRACT_PERIOD' ? validatedData.toDate : null,
            dueDate: validatedData.dueDate,
            status: validatedData.status,
            subtotal: totals.netTotal,
            vatAmount: totals.vat,
            grandTotal: totals.grandTotal,
            notes: validatedData.notes,
            ...optionalFields(validatedData),
            items: { create: itemsData },
          },
          include: INVOICE_INCLUDE,
        });
      },
      { timeout: 15000 }
    );

    revalidateInvoice(invoice.id);
    return { success: true, data: serialize(invoice) };
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return { success: false, error: errorMessage(error, 'Failed to create invoice.') };
  }
}

export async function updateInvoice(id: string, data: any) {
  try {
    const validatedData = InvoiceSchema.parse(data);
    const { totals, itemsData } = buildItemsAndTotals(validatedData.items);

    const invoice = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.invoice.findUnique({
          where: { id },
          select: { id: true, invoiceNumber: true, updatedAt: true },
        });
        if (!existing) throw new Error('Invoice not found. It may have been deleted.');

        // Stale-write protection: refuse to overwrite a version the user has not seen.
        if (
          validatedData.expectedUpdatedAt &&
          new Date(validatedData.expectedUpdatedAt).getTime() !== existing.updatedAt.getTime()
        ) {
          throw new Error('This invoice was changed elsewhere since you opened it. Close the editor and reopen it to load the latest version.');
        }

        // Uniqueness: the new number must not belong to any OTHER invoice.
        const newNumber = validatedData.invoiceNumber;
        if (newNumber && newNumber !== existing.invoiceNumber) {
          const clash = await tx.invoice.findFirst({
            where: { invoiceNumber: newNumber, NOT: { id } },
            select: { id: true },
          });
          if (clash) throw new Error(`Invoice number ${newNumber} already exists. Please choose a different one.`);
        }

        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

        // Same row is updated in place (never re-created), so payments, jobs and the quotation link are preserved.
        return tx.invoice.update({
          where: { id },
          data: {
            invoiceNumber: newNumber,
            customerId: validatedData.customerId,
            quotationId: validatedData.quotationId,
            dateType: validatedData.dateType,
            issueDate: validatedData.issueDate,
            toDate: validatedData.dateType === 'CONTRACT_PERIOD' ? validatedData.toDate : null,
            dueDate: validatedData.dueDate,
            status: validatedData.status,
            subtotal: totals.netTotal,
            vatAmount: totals.vat,
            grandTotal: totals.grandTotal,
            notes: validatedData.notes,
            ...optionalFields(validatedData),
            items: { create: itemsData },
          },
          include: INVOICE_INCLUDE,
        });
      },
      { timeout: 15000 }
    );

    revalidateInvoice(id);
    return { success: true, data: serialize(invoice) };
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return { success: false, error: errorMessage(error, 'Failed to update invoice.') };
  }
}

export async function recordPayment(data: any) {
  try {
    const validatedData = PaymentSchema.parse(data);

    const payment = await prisma.$transaction(
      async (tx) => {
        // 1. Fetch current invoice details
        const invoice = await tx.invoice.findUnique({
          where: { id: validatedData.invoiceId },
          select: { grandTotal: true, amountPaid: true },
        });

        if (!invoice) {
          throw new Error('Invoice not found.');
        }

        // 2. Create Payment
        const p = await tx.payment.create({
          data: {
            invoiceId: validatedData.invoiceId,
            amount: validatedData.amount,
            paymentDate: validatedData.paymentDate,
            paymentMethod: validatedData.paymentMethod,
            status: PaymentStatus.PAID,
            notes: validatedData.notes,
          },
        });

        // 3. Update Invoice payment amounts
        const newAmountPaid = Number(invoice.amountPaid) + validatedData.amount;
        const total = Number(invoice.grandTotal);
        
        let newStatus: InvoiceStatus = InvoiceStatus.PARTIALLY_PAID;
        if (newAmountPaid >= total) {
          newStatus = InvoiceStatus.PAID;
        }

        await tx.invoice.update({
          where: { id: validatedData.invoiceId },
          data: {
            amountPaid: newAmountPaid,
            status: newStatus,
          },
        });

        return p;
      },
      { timeout: 15000 }
    );

    try {
      revalidatePath('/erp/invoices');
      revalidatePath(`/erp/invoices/${validatedData.invoiceId}`);
      revalidatePath(`/erp/invoices/${validatedData.invoiceId}/preview`);
      revalidatePath('/erp');
    } catch (e) {
      console.warn('revalidatePath error ignored:', e);
    }
    return { success: true, data: payment };
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return { success: false, error: error?.errors?.[0]?.message || error?.message || 'Failed to record payment.' };
  }
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  try {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: INVOICE_INCLUDE,
    });
    try {
      revalidatePath('/erp/invoices');
      revalidatePath(`/erp/invoices/${id}`);
      revalidatePath(`/erp/invoices/${id}/preview`);
    } catch (e) {
      console.warn('revalidatePath error ignored:', e);
    }
    return { success: true, data: serialize(invoice) };
  } catch (error: any) {
    console.error('Error updating status:', error);
    return { success: false, error: error?.message || 'Failed to update status.' };
  }
}

export async function deleteInvoice(id: string) {
  try {
    await prisma.invoice.delete({
      where: { id },
    });
    try {
      revalidatePath('/erp/invoices');
    } catch (e) {
      console.warn('revalidatePath error ignored:', e);
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return { success: false, error: error?.message || 'Failed to delete invoice.' };
  }
}
