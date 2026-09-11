import React from 'react';
import { notFound } from 'next/navigation';
import { getQuote } from '@/app/actions/quotes';
import { getSettings } from '@/app/actions/settings';
import DocumentPreviewClient from '@/components/document/DocumentPreviewClient';
import { DocumentData } from '@/components/document/BaseTemplate';

interface QuotePreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuotePreviewPage({ params }: QuotePreviewPageProps) {
  const { id } = await params;

  const [quoteRes, settingsRes] = await Promise.all([
    getQuote(id),
    getSettings(),
  ]);

  if (!quoteRes.success || !quoteRes.data) {
    notFound();
  }

  const quote = quoteRes.data;
  const settings = settingsRes.success && settingsRes.data ? settingsRes.data : null;

  const company = {
    name: settings?.companyName || 'Izzey Clean & Move',
    address: 'Alt-Moabit 58\n10555 Berlin, Germany',
    phone: '+49 176 2170 9991',
    email: 'info@izzey.de',
    website: 'www.izzey.de',
    vatNumber: settings?.vatNumber || '1130/360/50274',
  };

  const customer = {
    name: quote.customer.name,
    companyName: quote.customer.companyName,
    propertyAddress: `${quote.property.address}\n${quote.property.city}, ${quote.property.country}`,
    email: quote.customer.email,
    phone: quote.customer.phone,
    service: quote.items?.[0]?.serviceName || 'Cleaning & Move services',
  };

  const items = (quote.items || []).map((item: any, idx: number) => ({
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
    type: 'quotation',
    number: quote.quoteNumber,
    date: new Date(quote.date),
    serviceDate: new Date(quote.date),
    validUntil: new Date(quote.validUntil),
    company,
    customer,
    items,
    notes: quote.notes || 'Dieses Angebot ist freibleibend. Bitte geben Sie uns bei Annahme kurz Bescheid, damit wir den Wunschtermin fest einplanen können.',
    subtotal: Number(quote.subtotal),
    vat: Number(quote.vatAmount),
    total: Number(quote.grandTotal),
  };

  const serializedData = JSON.parse(JSON.stringify(documentData));

  return (
    <DocumentPreviewClient 
      data={serializedData} 
      backUrl="/erp/quotes" 
    />
  );
}
