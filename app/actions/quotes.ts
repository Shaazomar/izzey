'use server';

import { revalidatePath } from 'next/cache';
import prisma from '../../lib/prisma';
import { QuotationSchema } from '../../lib/validators';
import { QuotationStatus, InvoiceStatus } from '@prisma/client';
import { generateInvoiceNumber } from './invoices';

async function generateQuoteNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `Q-${currentYear}-`;
  
  const lastQuote = await prisma.quotation.findFirst({
    where: {
      quoteNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      quoteNumber: 'desc',
    },
    select: {
      quoteNumber: true,
    },
  });

  let nextNum = 1;
  if (lastQuote) {
    const parts = lastQuote.quoteNumber.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

export async function getQuotes(query?: string) {
  try {
    const quotes = await prisma.quotation.findMany({
      where: query
        ? {
            OR: [
              { quoteNumber: { contains: query, mode: 'insensitive' } },
              { customer: { name: { contains: query, mode: 'insensitive' } } },
              { customer: { companyName: { contains: query, mode: 'insensitive' } } },
            ],
          }
        : undefined,
      include: {
        customer: true,
        property: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: quotes };
  } catch (error: any) {
    console.error('Error fetching quotes:', error);
    return { success: false, error: error?.message || 'Failed to fetch quotes.' };
  }
}

export async function getQuote(id: string) {
  try {
    const quote = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        property: true,
        items: true,
      },
    });

    if (!quote) {
      return { success: false, error: 'Quotation not found.' };
    }

    return { success: true, data: quote };
  } catch (error: any) {
    console.error('Error fetching quote:', error);
    return { success: false, error: error?.message || 'Failed to fetch quote.' };
  }
}

export async function createQuotation(data: any) {
  try {
    const validatedData = QuotationSchema.parse(data);
    const quoteNumber = await generateQuoteNumber();

    // Perform calculations on server side
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

    const quotation = await prisma.$transaction(async (tx) => {
      let resolvedPropertyId = validatedData.propertyId;
      if (!resolvedPropertyId || resolvedPropertyId === "") {
        const firstProperty = await tx.property.findFirst({
          where: { customerId: validatedData.customerId }
        });
        if (firstProperty) {
          resolvedPropertyId = firstProperty.id;
        } else {
          const customer = await tx.customer.findUnique({
            where: { id: validatedData.customerId }
          });
          if (!customer) {
            throw new Error('Customer not found.');
          }
          const newProperty = await tx.property.create({
            data: {
              customerId: customer.id,
              address: customer.address || 'Boxhagener Str. 119',
              city: customer.city || 'Berlin',
              postalCode: '10245',
              country: customer.country || 'Germany',
            }
          });
          resolvedPropertyId = newProperty.id;
        }
      }

      return tx.quotation.create({
        data: {
          quoteNumber,
          customerId: validatedData.customerId,
          propertyId: resolvedPropertyId,
          date: validatedData.date,
          validUntil: validatedData.validUntil,
          status: validatedData.status,
          subtotal,
          vatAmount,
          grandTotal,
          notes: validatedData.notes,
          items: {
            create: itemsData,
          },
        },
        include: {
          items: true,
        },
      });
    });

    revalidatePath('/erp/quotes');
    return { success: true, data: quotation };
  } catch (error: any) {
    console.error('Error creating quotation:', error);
    return { success: false, error: error?.errors?.[0]?.message || error?.message || 'Failed to create quotation.' };
  }
}

export async function updateQuotation(id: string, data: any) {
  try {
    const validatedData = QuotationSchema.parse(data);

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

    const quotation = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.quotationItem.deleteMany({
        where: { quotationId: id },
      });

      let resolvedPropertyId = validatedData.propertyId;
      if (!resolvedPropertyId || resolvedPropertyId === "") {
        const firstProperty = await tx.property.findFirst({
          where: { customerId: validatedData.customerId }
        });
        if (firstProperty) {
          resolvedPropertyId = firstProperty.id;
        } else {
          const customer = await tx.customer.findUnique({
            where: { id: validatedData.customerId }
          });
          if (!customer) {
            throw new Error('Customer not found.');
          }
          const newProperty = await tx.property.create({
            data: {
              customerId: customer.id,
              address: customer.address || 'Boxhagener Str. 119',
              city: customer.city || 'Berlin',
              postalCode: '10245',
              country: customer.country || 'Germany',
            }
          });
          resolvedPropertyId = newProperty.id;
        }
      }

      return tx.quotation.update({
        where: { id },
        data: {
          customerId: validatedData.customerId,
          propertyId: resolvedPropertyId,
          date: validatedData.date,
          validUntil: validatedData.validUntil,
          status: validatedData.status,
          subtotal,
          vatAmount,
          grandTotal,
          notes: validatedData.notes,
          items: {
            create: itemsData,
          },
        },
        include: {
          items: true,
        },
      });
    });

    revalidatePath('/erp/quotes');
    revalidatePath(`/erp/quotes/${id}`);
    return { success: true, data: quotation };
  } catch (error: any) {
    console.error('Error updating quotation:', error);
    return { success: false, error: error?.errors?.[0]?.message || error?.message || 'Failed to update quotation.' };
  }
}

export async function updateQuoteStatus(id: string, status: QuotationStatus) {
  try {
    const quote = await prisma.quotation.update({
      where: { id },
      data: { status },
    });
    revalidatePath('/erp/quotes');
    revalidatePath(`/erp/quotes/${id}`);
    return { success: true, data: quote };
  } catch (error: any) {
    console.error('Error updating quote status:', error);
    return { success: false, error: error?.message || 'Failed to update status.' };
  }
}

export async function duplicateQuotation(id: string) {
  try {
    const sourceQuote = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sourceQuote) {
      return { success: false, error: 'Quotation not found.' };
    }

    const quoteNumber = await generateQuoteNumber();

    const newQuote = await prisma.$transaction(async (tx) => {
      return tx.quotation.create({
        data: {
          quoteNumber,
          customerId: sourceQuote.customerId,
          propertyId: sourceQuote.propertyId,
          date: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days valid
          status: QuotationStatus.DRAFT,
          subtotal: sourceQuote.subtotal,
          vatAmount: sourceQuote.vatAmount,
          grandTotal: sourceQuote.grandTotal,
          notes: sourceQuote.notes,
          items: {
            create: sourceQuote.items.map((item) => ({
              serviceName: item.serviceName,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              discount: item.discount,
              vatPercent: item.vatPercent,
              total: item.total,
            })),
          },
        },
      });
    });

    revalidatePath('/erp/quotes');
    return { success: true, data: newQuote };
  } catch (error: any) {
    console.error('Error duplicating quote:', error);
    return { success: false, error: error?.message || 'Failed to duplicate quotation.' };
  }
}

export async function convertQuoteToInvoice(
  quoteId: string,
  customData?: { invoiceNumber?: string; issueDate?: Date; dueDate?: Date }
) {
  try {
    const quote = await prisma.quotation.findUnique({
      where: { id: quoteId },
      include: { items: true },
    });

    if (!quote) {
      return { success: false, error: 'Quotation not found.' };
    }

    const invoiceNumber = customData?.invoiceNumber || (await generateInvoiceNumber());
    const issueDate = customData?.issueDate || new Date();
    const dueDate = customData?.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          quotationId: quote.id,
          customerId: quote.customerId,
          issueDate,
          dueDate,
          status: InvoiceStatus.DRAFT,
          subtotal: quote.subtotal,
          vatAmount: quote.vatAmount,
          grandTotal: quote.grandTotal,
          notes: quote.notes,
          items: {
            create: quote.items.map((item) => ({
              serviceName: item.serviceName,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              discount: item.discount,
              vatPercent: item.vatPercent,
              total: item.total,
            })),
          },
        },
      });

      // 2. Mark Quote as Converted
      await tx.quotation.update({
        where: { id: quoteId },
        data: { status: QuotationStatus.CONVERTED },
      });

      return inv;
    });

    revalidatePath('/erp/quotes');
    revalidatePath('/erp/invoices');
    return { success: true, data: invoice };
  } catch (error: any) {
    console.error('Error converting quote to invoice:', error);
    return { success: false, error: error?.message || 'Failed to convert quotation to invoice.' };
  }
}

export async function deleteQuotation(id: string) {
  try {
    await prisma.quotation.delete({
      where: { id },
    });
    revalidatePath('/erp/quotes');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting quote:', error);
    return { success: false, error: error?.message || 'Failed to delete quote.' };
  }
}
