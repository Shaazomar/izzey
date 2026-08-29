import React from 'react';
import DocumentGenerator from '@/components/documents/DocumentGenerator';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-3xl tracking-tight">DOCUMENT GENERATOR</h1>
        <p className="text-sm text-dark/60">
          Generate official German registration confirmation documents (Wohnungsgeberbestätigung) from templates.
        </p>
      </div>

      {/* Template selection bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <p className="font-bold text-slate-700 uppercase tracking-wide text-[10px] text-slate-400">Template Type</p>
          <span className="font-extrabold text-slate-800 text-xs">Wohnungsgeberbestätigung gemäß § 19 BMG</span>
        </div>
        <div className="flex gap-2">
          <span className="bg-[#2E4036]/10 text-[#2E4036] px-2.5 py-1 rounded-full font-bold text-[10px] uppercase font-mono">
            Active Template
          </span>
        </div>
      </div>

      <DocumentGenerator />
    </div>
  );
}
