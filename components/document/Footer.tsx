import React from 'react';

interface FooterProps {
  type: 'quotation' | 'invoice';
  language?: 'de' | 'en' | 'both';
}

export default function Footer({ type, language = 'both' }: FooterProps) {
  const isQuote = type === 'quotation';

  const getCol1Heading = () => {
    if (isQuote) {
      if (language === 'de') return 'NÄCHSTE SCHRITTE';
      if (language === 'en') return 'NEXT STEPS';
      return 'NÄCHSTE SCHRITTE / NEXT STEPS';
    } else {
      if (language === 'de') return 'ZAHLUNGSBEDINGUNGEN';
      if (language === 'en') return 'PAYMENT TERMS';
      return 'ZAHLUNGSBEDINGUNGEN / TERMS';
    }
  };

  const getCol2Heading = () => {
    if (language === 'de') return 'VIELEN DANK';
    if (language === 'en') return 'THANK YOU';
    return 'VIELEN DANK / THANK YOU';
  };

  const getCol3Heading = () => {
    if (language === 'de') return 'KONTAKT & FIRMENANGABEN';
    if (language === 'en') return 'CONTACT & COMPANY';
    return 'KONTAKT / CONTACT';
  };

  return (
    <div className="space-y-3">
      {/* Three Columns Section */}
      <div className="grid grid-cols-3 gap-5 text-[8.5px] font-mono text-slate-600 border-t border-slate-200 pt-2.5 leading-snug">
        {/* Column 1: Next Steps / Payment Terms */}
        <div>
          <h5 className="font-heading font-black text-[#2E4036] tracking-wider uppercase text-[10px] mb-1">
            {getCol1Heading()}
          </h5>
          {isQuote ? (
            <p>
              Um dieses Angebot anzunehmen, antworten Sie bitte per E-Mail oder rufen Sie uns an. Nach Bestätigung stimmen wir den genauen Termin mit Ihnen ab.
            </p>
          ) : (
            <p>
              Bitte überweisen Sie den ausstehenden Betrag innerhalb von 14 Tagen auf das angegebene Bankkonto unter Angabe der Rechnungsnummer.
            </p>
          )}
        </div>

        {/* Column 2: Thank You */}
        <div>
          <h5 className="font-heading font-black text-[#2E4036] tracking-wider uppercase text-[10px] mb-1">
            {getCol2Heading()}
          </h5>
          <p>
            Vielen Dank für Ihren geschätzten Auftrag und das Vertrauen in unsere Dienstleistungen. Wir freuen uns darauf, Sie zu begleiten!
          </p>
        </div>

        {/* Column 3: Contact details */}
        <div>
          <h5 className="font-heading font-black text-[#2E4036] tracking-wider uppercase text-[10px] mb-1">
            {getCol3Heading()}
          </h5>
          <p className="space-y-0.5">
            <strong>Izz & Hameed Dienstleistung, (haftungsbeschränkt)</strong><br />
            Geschäftsführer: Hameed Khan, Izzatullah Safi<br />
            Alt-Moabit 58, 10555 Berlin<br />
            IBAN: DE08 1005 0000 0191 3380 36<br />
            BIC: COBADEFFXXX
          </p>
        </div>
      </div>

      {/* Full-width Moss Green Strip */}
      <div className="bg-[#2E4036] text-white text-[9px] font-mono py-2 px-5 rounded-xl flex justify-between items-center shadow-xs">
        <span className="font-bold tracking-wider uppercase text-[#CC5833]">Sauber. Sicher. Stressfrei.</span>
        <span>Ihr Partner für Umzüge & Reinigungsservices in Berlin.</span>
      </div>
    </div>
  );
}
