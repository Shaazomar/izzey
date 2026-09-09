import React from 'react';
import { notFound } from 'next/navigation';
import { getInvoice } from '@/app/actions/invoices';
import { getSettings } from '@/app/actions/settings';
import DocumentPreviewClient from '@/components/document/DocumentPreviewClient';
import { DocumentData } from '@/components/document/BaseTemplate';

interface InvoicePreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePreviewPage({ params }: InvoicePreviewPageProps) {
  const { id } = await params;

  const [invoiceRes, settingsRes] = await Promise.all([
    getInvoice(id),
    getSettings(),
  ]);

  if (!invoiceRes.success || !invoiceRes.data) {
    notFound();
  }

  const invoice = invoiceRes.data;
  const settings = settingsRes.success && settingsRes.data ? settingsRes.data : null;

  const company = {
    name: settings?.companyName || 'Izzey Clean & Move',
    address: 'Alt-Moabit 58\n10555 Berlin, Germany',
    phone: '+49 176 2170 9991',
    email: 'info@izzey.de',
    website: 'izzeycleanmove.com',
    vatNumber: settings?.vatNumber || '1130 / 360 / 50274 steuerlich',
  };

  const customer = {
    name: invoice.customer.name,
    companyName: invoice.customer.companyName,
    propertyAddress: `${invoice.customer.address}\n${invoice.customer.city}, ${invoice.customer.country}`,
    email: invoice.customer.email,
    phone: invoice.customer.phone,
    service: invoice.items?.[0]?.serviceName || 'Cleaning & Move services',
  };

  const items = (invoice.items || []).map((item: any, idx: number) => ({
    position: idx + 1,
    serviceName: item.serviceName,
    description: item.description,
    quantity: Number(item.quantity),
    unit: item.unit || 'Std.',
    unitPrice: Number(item.unitPrice),
    discount: Number(item.discount || 0),
    vatPercent: Number(item.vatPercent),
    total: Number(item.total),
  }));

  const documentData: DocumentData = {
    type: 'invoice',
    number: invoice.invoiceNumber,
    date: new Date(invoice.issueDate),
    serviceDate: new Date(invoice.issueDate),
    dueDate: new Date(invoice.dueDate),
    company,
    customer,
    items,
    notes: invoice.notes || 'Zahlbar innerhalb von 14 Tagen ohne Abzug. Bitte geben Sie bei der Überweisung die Rechnungsnummer an.',
    subtotal: Number(invoice.subtotal),
    vat: Number(invoice.vatAmount),
    total: Number(invoice.grandTotal),
  };

  const serializedData = JSON.parse(JSON.stringify(documentData));

  return (
    <DocumentPreviewClient 
      data={serializedData} 
      backUrl="/erp/invoices" 
    />
  );
}
