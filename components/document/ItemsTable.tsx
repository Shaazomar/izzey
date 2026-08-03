import React from 'react';

interface Item {
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

interface ItemsTableProps {
  items: Item[];
  currency?: string;
  language?: 'de' | 'en' | 'both';
}

export default function ItemsTable({
  items,
  currency = 'EUR',
  language = 'both',
}: ItemsTableProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(val);
  };

  const getPosHeader = () => {
    if (language === 'de') return 'POS.';
    if (language === 'en') return 'POS.';
    return 'POS.';
  };

  const getDescHeader = () => {
    if (language === 'de') return 'BESCHREIBUNG';
    if (language === 'en') return 'DESCRIPTION';
    return 'BESCHREIBUNG / DESCRIPTION';
  };

  const getTaxHeader = () => {
    if (language === 'de') return 'UST. %';
    if (language === 'en') return 'TAX %';
    return 'UST. % / TAX %';
  };

  const getTaxValHeader = () => {
    if (language === 'de') return 'UST. BETRAG';
    if (language === 'en') return 'TAX AMT.';
    return 'UST. BETRAG / TAX AMT.';
  };

  const getPriceHeader = () => {
    if (language === 'de') return 'NETTO';
    if (language === 'en') return 'NET';
    return 'NETTO / NET';
  };

  const getGrossPriceHeader = () => {
    if (language === 'de') return 'BRUTTO';
    if (language === 'en') return 'GROSS';
    return 'BRUTTO / GROSS';
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
      <table className="w-full text-left text-xs font-body border-collapse">
        <thead>
          <tr className="bg-[#2E4036] text-white text-[10px] font-mono uppercase tracking-wider">
            <th className="py-2 px-4 font-bold text-center w-12">{getPosHeader()}</th>
            <th className="py-2 px-4 font-bold">{getDescHeader()}</th>
            <th className="py-2 px-4 font-bold text-center w-20">{getTaxHeader()}</th>
            <th className="py-2 px-4 font-bold text-right w-28">{getTaxValHeader()}</th>
            <th className="py-2 px-4 font-bold text-right w-28">{getPriceHeader()}</th>
            <th className="py-2 px-4 font-bold text-right w-28">{getGrossPriceHeader()}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/60 font-mono text-[11px]">
          {items.map((item, idx) => {
            const isEven = idx % 2 === 0;
            const itemSubtotal = item.quantity * item.unitPrice;
            const discountAmount = itemSubtotal * (item.discount / 100);
            const lineTotalNet = item.total || (itemSubtotal - discountAmount);
            const lineVatVal = lineTotalNet * (item.vatPercent / 100);
            const lineTotalGross = lineTotalNet + lineVatVal;

            return (
              <tr 
                key={idx} 
                className={`${isEven ? 'bg-white' : 'bg-slate-50/80'} align-top`}
              >
                {/* Position */}
                <td className="py-1.5 px-4 text-center font-bold text-slate-400">
                  {item.position || idx + 1}
                </td>

                {/* Beschreibung (Title & Subtitle only - no unit, qty, rate, discount breakdown) */}
                <td className="py-1.5 px-4 font-body">
                  <p className="font-extrabold text-slate-900 text-xs leading-snug">
                    {item.serviceName}
                  </p>
                  {item.description && (
                    <p className="text-[10px] text-slate-500 mt-0.5 whitespace-pre-line leading-relaxed font-mono">
                      {item.description}
                    </p>
                  )}
                </td>

                {/* Tax / USt. % */}
                <td className="py-1.5 px-4 text-center font-bold text-slate-700 text-xs">
                  {item.vatPercent}%
                </td>

                {/* Tax Value */}
                <td className="py-1.5 px-4 text-right text-slate-700 text-xs">
                  {formatCurrency(lineVatVal)}
                </td>

                {/* Net Price */}
                <td className="py-1.5 px-4 text-right font-bold text-slate-900 text-xs">
                  {formatCurrency(lineTotalNet)}
                </td>

                {/* Gross Price */}
                <td className="py-1.5 px-4 text-right font-bold text-slate-900 text-xs">
                  {formatCurrency(lineTotalGross)}
                </td>
              </tr>
            );
          })}

          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400 font-mono text-xs">
                Keine Positionen hinzugefügt.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
