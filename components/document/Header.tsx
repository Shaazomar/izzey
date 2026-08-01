import React from 'react';
import Image from 'next/image';

interface HeaderProps {
  type: 'quotation' | 'invoice';
  number: string;
  date: Date;
  serviceDate?: Date;
  validUntil?: Date;
  dueDate?: Date;
  language?: 'de' | 'en' | 'both';
}

export default function Header({
  type,
  number,
  date,
  serviceDate,
  validUntil,
  dueDate,
  language = 'both',
}: HeaderProps) {
  const isQuote = type === 'quotation';

  // Multilingual Headings
  const getHeading = () => {
    if (language === 'de') return isQuote ? 'ANGEBOT' : 'RECHNUNG';
    if (language === 'en') return isQuote ? 'QUOTATION' : 'INVOICE';
    return isQuote ? 'ANGEBOT / QUOTATION' : 'RECHNUNG / INVOICE';
  };

  const getNumberLabel = () => {
    if (language === 'de') return isQuote ? 'ANGEBOTS-NR.' : 'RECHNUNGS-NR.';
    if (language === 'en') return isQuote ? 'QUOTE NO.' : 'INVOICE NO.';
    return isQuote ? 'ANGEBOTS-NR. / QUOTE NO.' : 'RECHNUNGS-NR. / INV NO.';
  };

  const getDateLabel = () => {
    if (language === 'de') return 'DATUM';
    if (language === 'en') return 'DATE';
    return 'DATUM / DATE';
  };

  const getServiceDateLabel = () => {
    if (language === 'de') return 'LEISTUNGSDATUM';
    if (language === 'en') return 'SERVICE DATE';
    return 'LEISTUNGSDATUM / SERVICE DATE';
  };

  const getDueDateLabel = () => {
    if (isQuote) {
      if (language === 'de') return 'GÜLTIG BIS';
      if (language === 'en') return 'VALID UNTIL';
      return 'GÜLTIG BIS / VALID UNTIL';
    } else {
      if (language === 'de') return 'FÄLLIG AM';
      if (language === 'en') return 'DUE DATE';
      return 'FÄLLIG AM / DUE DATE';
    }
  };

  const formatDate = (d?: Date) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="flex justify-between items-start border-b-2 border-[#2E4036]/20 pb-2">
      {/* Top Left: Logo */}
      <div className="relative w-[170px] h-[50px]">
        <Image
          src="/logo.png"
          alt="Izzey Clean & Move"
          fill
          priority
          sizes="170px"
          className="object-contain object-left"
        />
      </div>

      {/* Top Right: Heading & Quotation Info Box */}
      <div className="flex flex-col items-end text-right">
        <h1 className="font-heading font-black text-lg text-[#2E4036] tracking-wider mb-1 uppercase">
          {getHeading()}
        </h1>

        {/* Info Box */}
        <div className="border border-slate-300 rounded-xl p-2 bg-slate-50 text-[9.5px] font-mono w-[280px] shadow-2xs">
          <div className="space-y-1">
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-500 uppercase text-[8.5px] font-bold tracking-wider whitespace-nowrap">{getNumberLabel()}</span>
              <span className="font-bold text-[#2E4036] text-[11.5px] whitespace-nowrap">{number}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-1.5 gap-4">
              <span className="text-slate-500 uppercase text-[8.5px] font-bold tracking-wider whitespace-nowrap">{getDateLabel()}</span>
              <span className="font-bold text-slate-800 whitespace-nowrap">{formatDate(date)}</span>
            </div>
            {serviceDate && (
              <div className="flex justify-between items-center border-t border-slate-200 pt-1.5 gap-4">
                <span className="text-slate-500 uppercase text-[8.5px] font-bold tracking-wider whitespace-nowrap">{getServiceDateLabel()}</span>
                <span className="font-bold text-slate-800 whitespace-nowrap">{formatDate(serviceDate)}</span>
              </div>
            )}
            {isQuote && validUntil && (
              <div className="flex justify-between items-center border-t border-rose-200 pt-1.5 text-rose-700 gap-4">
                <span className="uppercase text-[8.5px] font-bold tracking-wider whitespace-nowrap">{getDueDateLabel()}</span>
                <span className="font-bold whitespace-nowrap">{formatDate(validUntil)}</span>
              </div>
            )}
            {!isQuote && dueDate && (
              <div className="flex justify-between items-center border-t border-rose-200 pt-1.5 text-rose-700 gap-4">
                <span className="uppercase text-[8.5px] font-bold tracking-wider whitespace-nowrap">{getDueDateLabel()}</span>
                <span className="font-bold whitespace-nowrap">{formatDate(dueDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
