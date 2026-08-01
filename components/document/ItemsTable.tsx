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
    if (language === 'de') return 'UST.';
    if (language === 'en') return 'TAX';
    return 'UST. / TAX';
  };

  const getPriceHeader = () => {
    if (language === 'de') return 'PREIS (NETTO)';
    if (language === 'en') return 'PRICE (NET)';
    return 'PREIS (NETTO) / PRICE (NET)';
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
      <table className="w-full text-left text-xs font-body border-collapse">
        <thead>
          <tr className="bg-[#2E4036] text-white text-[10px] font-mono uppercase tracking-wider">
            <th className="py-3 px-4 font-bold text-center w-12">{getPosHeader()}</th>
            <th className="py-3 px-4 font-bold">{getDescHeader()}</th>
            <th className="py-3 px-4 font-bold text-center w-24">{getTaxHeader()}</th>
            <th className="py-3 px-4 font-bold text-right w-36">{getPriceHeader()}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/60 font-mono text-[11px]">
          {items.map((item, idx) => {
            const isEven = idx % 2 === 0;
            const itemSubtotal = item.quantity * item.unitPrice;
            const discountAmount = itemSubtotal * (item.discount / 100);
            const lineTotalNet = item.total || (itemSubtotal - discountAmount);

            return (
              <tr 
                key={idx} 
                className={`${isEven ? 'bg-white' : 'bg-slate-50/80'} align-top`}
              >
                {/* Position */}
                <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                  {item.position || idx + 1}
                </td>

                {/* Beschreibung (Title & Subtitle only - no unit, qty, rate, discount breakdown) */}
                <td className="py-3.5 px-4 font-body">
                  <p className="font-extrabold text-slate-900 text-xs leading-snug">
                    {item.serviceName}
                  </p>
                  {item.description && (
                    <p className="text-[10px] text-slate-500 mt-0.5 whitespace-pre-line leading-relaxed font-mono">
                      {item.description}
                    </p>
                  )}
                </td>

                {/* Tax / USt. */}
                <td className="py-3.5 px-4 text-center font-bold text-slate-700 text-xs">
                  {item.vatPercent}%
                </td>

                {/* Net Price */}
                <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-xs">
                  {formatCurrency(lineTotalNet)}
                </td>
              </tr>
            );
          })}

          {items.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-slate-400 font-mono text-xs">
                Keine Positionen hinzugefügt.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
