'use server';

import { revalidatePath } from 'next/cache';
import prisma from '../../lib/prisma';
import { InvoiceSchema, PaymentSchema } from '../../lib/validators';
import { InvoiceStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

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
      include: {
        customer: true,
      },
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
      include: {
        customer: true,
        items: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
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

export async function createInvoice(data: any) {
  try {
    const validatedData = InvoiceSchema.parse(data);
    const invoiceNumber = await generateInvoiceNumber();

    let subtotal = 0;
    let vatAmount = 0;

    const itemsData = validatedData.items.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const discountAmount = itemSubtotal * (item.discount / 100);
      const itemTotalAfterDiscount = itemSubtotal - discountAmount;
      const itemVat = itemTotalAfterDiscount * (item.vatPercent / 100);

      subtotal += itemTotalAfterDiscount;
      vatAmount += itemVat;

      return {
        serviceName: item.serviceName,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discount: item.discount,
        vatPercent: item.vatPercent,
        total: itemTotalAfterDiscount,
      };
    });

    const grandTotal = subtotal + vatAmount;

    const invoice = await prisma.$transaction(async (tx) => {
      return tx.invoice.create({
        data: {
          invoiceNumber,
          quotationId: validatedData.quotationId,
          customerId: validatedData.customerId,
          issueDate: validatedData.issueDate,
          dueDate: validatedData.dueDate,
          status: validatedData.status,
          subtotal,
          vatAmount,
          grandTotal,
          notes: validatedData.notes,
          items: {
            create: itemsData,
          },
        },
      });
    });

    revalidatePath('/erp/invoices');
    return { success: true, data: invoice };
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return { success: false, error: error?.errors?.[0]?.message || error?.message || 'Failed to create invoice.' };
  }
}

export async function updateInvoice(id: string, data: any) {
  try {
    const validatedData = InvoiceSchema.parse(data);

    let subtotal = 0;
    let vatAmount = 0;

    const itemsData = validatedData.items.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const discountAmount = itemSubtotal * (item.discount / 100);
      const itemTotalAfterDiscount = itemSubtotal - discountAmount;
      const itemVat = itemTotalAfterDiscount * (item.vatPercent / 100);

      subtotal += itemTotalAfterDiscount;
      vatAmount += itemVat;

      return {
        serviceName: item.serviceName,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discount: item.discount,
        vatPercent: item.vatPercent,
        total: itemTotalAfterDiscount,
      };
    });

    const grandTotal = subtotal + vatAmount;

    const invoice = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      return tx.invoice.update({
        where: { id },
        data: {
          customerId: validatedData.customerId,
          quotationId: validatedData.quotationId,
          issueDate: validatedData.issueDate,
          dueDate: validatedData.dueDate,
          status: validatedData.status,
          subtotal,
          vatAmount,
          grandTotal,
          notes: validatedData.notes,
          items: {
            create: itemsData,
          },
        },
      });
    });

    revalidatePath('/erp/invoices');
    revalidatePath(`/erp/invoices/${id}`);
    return { success: true, data: invoice };
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return { success: false, error: error?.errors?.[0]?.message || error?.message || 'Failed to update invoice.' };
  }
}

export async function recordPayment(data: any) {
  try {
    const validatedData = PaymentSchema.parse(data);

    const payment = await prisma.$transaction(async (tx) => {
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
    });

    revalidatePath('/erp/invoices');
    revalidatePath(`/erp/invoices/${validatedData.invoiceId}`);
    revalidatePath('/erp'); // dashboard revalidate
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
    });
    revalidatePath('/erp/invoices');
    revalidatePath(`/erp/invoices/${id}`);
    return { success: true, data: invoice };
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
    revalidatePath('/erp/invoices');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return { success: false, error: error?.message || 'Failed to delete invoice.' };
  }
}
