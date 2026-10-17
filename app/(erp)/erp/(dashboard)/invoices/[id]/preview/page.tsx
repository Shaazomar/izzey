import React from 'react';
import { notFound } from 'next/navigation';
import { getInvoice } from '@/app/actions/invoices';
import { getSettings } from '@/app/actions/settings';
import DocumentPreviewClient from '@/components/document/DocumentPreviewClient';
import { formValuesToDocumentData, invoiceToFormValues, resolveCompanyDefaults } from '@/lib/invoice';

// Always render from the database: a saved edit must be visible on the very next load.
export const dynamic = 'force-dynamic';

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

  const settings = settingsRes.success && settingsRes.data ? settingsRes.data : null;

  // Same mapping the editor's live preview uses, so preview, print and PDF match what was edited.
  const values = invoiceToFormValues(invoiceRes.data, resolveCompanyDefaults(settings));
  const documentData = formValuesToDocumentData(values);

  return (
    <DocumentPreviewClient
      data={JSON.parse(JSON.stringify(documentData))}
      backUrl="/erp/invoices"
      documentId={invoiceRes.data.id}
    />
  );
}
