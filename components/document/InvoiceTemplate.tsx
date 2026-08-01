import React from 'react';
import BaseTemplate, { DocumentData } from './BaseTemplate';

interface InvoiceTemplateProps {
  data: Omit<DocumentData, 'type'>;
}

export default function InvoiceTemplate({ data }: InvoiceTemplateProps) {
  const invoiceData: DocumentData = {
    ...data,
    type: 'invoice',
  };

  return <BaseTemplate data={invoiceData} />;
}
