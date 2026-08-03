import React from 'react';

interface SummaryProps {
  subtotal: number;
  discount?: number;
  vat: number;
  total: number;
  currency?: string;
  language?: 'de' | 'en' | 'both';
}

export default function Summary({
  subtotal,
  discount,
  vat,
  total,
  currency = 'EUR',
  language = 'both',
}: SummaryProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(val);
  };

  const getSubtotalLabel = () => {
    if (language === 'de') return 'ZWISCHENSUMME';
    if (language === 'en') return 'SUBTOTAL';
    return 'ZWISCHENSUMME / SUBTOTAL';
  };

  const getDiscountLabel = () => {
    if (language === 'de') return 'RABATT';
    if (language === 'en') return 'DISCOUNT';
    return 'RABATT / DISCOUNT';
  };

  const getVatLabel = () => {
    if (language === 'de') return 'MEHRWERTSTEUER';
    if (language === 'en') return 'VAT';
    return 'MEHRWERTSTEUER / VAT';
  };

  const getGrandTotalLabel = () => {
    if (language === 'de') return 'GESAMTBETRAG';
    if (language === 'en') return 'GRAND TOTAL';
    return 'GESAMTBETRAG / TOTAL';
  };

  return (
    <div className="w-[290px] space-y-1.5 text-xs font-mono">
      {/* Subtotal */}
      <div className="flex justify-between px-3 py-0.5 text-slate-600">
        <span className="font-semibold">{getSubtotalLabel()}:</span>
        <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
      </div>

      {/* Discount (if > 0) */}
      {discount && discount > 0 ? (
        <div className="flex justify-between px-3 py-0.5 text-rose-700 font-bold border-t border-slate-200 pt-1">
          <span>{getDiscountLabel()}:</span>
          <span>-{formatCurrency(discount)}</span>
        </div>
      ) : null}

      {/* VAT (19%) */}
      <div className="flex justify-between px-3 py-0.5 text-slate-600 border-t border-slate-200 pt-1">
        <span className="font-semibold">{getVatLabel()}:</span>
        <span className="font-bold text-slate-900">{formatCurrency(vat)}</span>
      </div>

      {/* Grand Total inside Moss Green Box */}
      <div className="bg-[#2E4036] text-white rounded-xl p-3 flex justify-between items-center shadow-md border border-[#2E4036]">
        <span className="font-heading font-extrabold uppercase text-[10px] tracking-wider text-[#F2F0E9]/80">
          {getGrandTotalLabel()}:
        </span>
        <span className="font-heading font-black text-lg text-white">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
