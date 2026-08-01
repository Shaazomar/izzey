import React from 'react';

interface NotesProps {
  notes?: string | null;
  language?: 'de' | 'en' | 'both';
}

export default function Notes({ notes, language = 'both' }: NotesProps) {
  if (!notes) return null;

  const getNotesTitle = () => {
    if (language === 'de') return 'HINWEISE & BEDINGUNGEN';
    if (language === 'en') return 'NOTES & CONDITIONS';
    return 'HINWEISE & BEDINGUNGEN / NOTES';
  };

  return (
    <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/80 text-[10px] leading-snug text-slate-700 shadow-2xs">
      <h4 className="font-heading font-black text-[#2E4036] text-[11px] tracking-wider uppercase mb-1">
        {getNotesTitle()}
      </h4>
      <p className="font-mono whitespace-pre-wrap leading-snug text-slate-600">
        {notes}
      </p>
    </div>
  );
}
