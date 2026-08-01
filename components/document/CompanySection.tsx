import React from 'react';

interface CompanyDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  vatNumber: string;
}

interface CustomerDetails {
  name: string;
  companyName?: string | null;
  propertyAddress: string;
  email: string;
  phone?: string | null;
  vatNumber?: string | null;
  service?: string;
}

interface CompanySectionProps {
  type: 'quotation' | 'invoice';
  company: CompanyDetails;
  customer: CustomerDetails;
  language?: 'de' | 'en' | 'both';
}

export default function CompanySection({
  type,
  company,
  customer,
  language = 'both',
}: CompanySectionProps) {
  const isQuote = type === 'quotation';

  const getProviderLabel = () => {
    if (language === 'de') return 'ANBIETER';
    if (language === 'en') return 'PROVIDER';
    return 'ANBIETER / PROVIDER';
  };

  const getRecipientLabel = () => {
    if (isQuote) {
      if (language === 'de') return 'ANGEBOT AN';
      if (language === 'en') return 'QUOTATION FOR';
      return 'ANGEBOT AN / QUOTATION TO';
    } else {
      if (language === 'de') return 'RECHNUNG AN';
      if (language === 'en') return 'INVOICE FOR';
      return 'RECHNUNG AN / INVOICE TO';
    }
  };

  return (
    <div className="grid grid-cols-2 gap-7 text-[10.5px] leading-snug">
      {/* Left Column: Anbieter */}
      <div className="space-y-1.5">
        <h3 className="font-mono text-[9px] font-bold tracking-widest text-[#2E4036] uppercase border-b border-slate-200 pb-1">
          {getProviderLabel()}
        </h3>
        <div>
          <p className="font-bold text-slate-900 text-xs">{company.name}</p>
          <p className="text-slate-700 whitespace-pre-wrap">{company.address}</p>
        </div>
        <div className="space-y-0.5 text-slate-600 font-mono text-[10px]">
          <p><span className="text-slate-400 font-bold uppercase mr-1">TEL:</span>{company.phone}</p>
          <p><span className="text-slate-400 font-bold uppercase mr-1">MAIL:</span>{company.email}</p>
          <p><span className="text-slate-400 font-bold uppercase mr-1">WEB:</span>{company.website}</p>
          <p className="pt-1"><span className="text-slate-400 font-bold uppercase mr-1">USt-IdNr.:</span>{company.vatNumber}</p>
        </div>
      </div>

      {/* Right Column: Angebot/Rechnung an */}
      <div className="space-y-1.5">
        <h3 className="font-mono text-[9px] font-bold tracking-widest text-[#2E4036] uppercase border-b border-slate-200 pb-1">
          {getRecipientLabel()}
        </h3>
        <div>
          <p className="font-bold text-slate-900 text-xs">{customer.name}</p>
          {customer.companyName && (
            <p className="font-bold text-slate-600 font-mono uppercase text-[10px]">{customer.companyName}</p>
          )}
          <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">{customer.propertyAddress}</p>
        </div>
        <div className="space-y-0.5 text-slate-600 font-mono text-[10px]">
          <p><span className="text-slate-400 font-bold uppercase mr-1">MAIL:</span>{customer.email}</p>
          {customer.phone && (
            <p><span className="text-slate-400 font-bold uppercase mr-1">TEL:</span>{customer.phone}</p>
          )}
          {customer.vatNumber && (
            <p><span className="text-slate-400 font-bold uppercase mr-1">USt-IdNr.:</span>{customer.vatNumber}</p>
          )}
          {customer.service && (
            <p className="pt-1">
              <span className="text-slate-400 font-bold uppercase mr-1">LEISTUNG:</span>
              <span className="text-[#CC5833] font-bold">{customer.service}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
