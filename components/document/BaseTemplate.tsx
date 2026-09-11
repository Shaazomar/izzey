import React from 'react';
import Header from './Header';
import CompanySection from './CompanySection';
import ItemsTable from './ItemsTable';
import Summary from './Summary';
import Notes from './Notes';
import Footer from './Footer';

export interface DocumentItemData {
  position: number;
  serviceName: string;
  description?: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  vatPercent: number;
  total: number;
}

export interface DocumentData {
  type: 'quotation' | 'invoice';
  number: string;
  date: Date | string;
  serviceDate?: Date | string | null;
  dueDate?: Date | string | null;
  validUntil?: Date | string | null;
  language?: 'de' | 'en' | 'both';
  currency?: string;
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    vatNumber: string;
  };
  customer: {
    name: string;
    companyName?: string | null;
    propertyAddress: string;
    email: string;
    phone?: string | null;
    vatNumber?: string | null;
    service?: string;
  };
  items: DocumentItemData[];
  notes?: string | null;
  subtotal: number;
  discount?: number;
  vat: number;
  total: number;
}

interface BaseTemplateProps {
  data: DocumentData;
}

export default function BaseTemplate({ data }: BaseTemplateProps) {
  const language = data.language || 'both';

  return (
    <div 
      id="print-area"
      className="print-container bg-white w-[210mm] min-h-[297mm] max-h-[297mm] p-[10mm] mx-auto text-slate-900 flex flex-col justify-between box-border relative select-none font-body shadow-sm print:shadow-none print:border-none print:m-0 overflow-hidden"
    >
      {/* Upper Content Wrapper */}
      <div className="space-y-3.5">
        {/* Document Header */}
        <Header
          type={data.type}
          number={data.number}
          date={data.date}
          serviceDate={data.serviceDate}
          validUntil={data.validUntil}
          dueDate={data.dueDate}
          language={language}
        />

        {/* Company & Client Section */}
        <CompanySection
          type={data.type}
          company={data.company}
          customer={data.customer}
          language={language}
        />

        {/* Services Line Items Table */}
        <ItemsTable 
          items={data.items} 
          currency={data.currency}
          language={language} 
        />
        
        {/* Notes & Summary */}
        <div className="grid grid-cols-12 gap-4 items-start pt-1">
          <div className="col-span-7">
            <Notes notes={data.notes} language={language} />
          </div>
          <div className="col-span-5 flex justify-end">
            <Summary
              subtotal={data.subtotal}
              discount={data.discount}
              vat={data.vat}
              total={data.total}
              currency={data.currency}
              language={language}
              vatPercent={data.items[0]?.vatPercent}
            />
          </div>
        </div>
      </div>

      {/* Footer Pinned to Bottom */}
      <div className="pt-3">
        <Footer type={data.type} language={language} />
      </div>
      
    </div>
  );
}
