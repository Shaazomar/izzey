import React from 'react';
import BaseTemplate, { DocumentData } from './BaseTemplate';

interface QuotationTemplateProps {
  data: Omit<DocumentData, 'type'>;
}

export default function QuotationTemplate({ data }: QuotationTemplateProps) {
  const quoteData: DocumentData = {
    ...data,
    type: 'quotation',
  };

  return <BaseTemplate data={quoteData} />;
}
