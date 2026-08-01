'use client';

import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle2, Calendar, FileText } from 'lucide-react';
import { convertQuoteToInvoice } from '@/app/actions/quotes';

interface ConvertInvoiceModalProps {
  quote: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newInvoice: any) => void;
}

export default function ConvertInvoiceModal({ quote, isOpen, onClose, onSuccess }: ConvertInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  if (!isOpen || !quote) return null;

  const handleConvert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await convertQuoteToInvoice(quote.id, {
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
    });
    
    setLoading(false);

    if (res.success && res.data) {
      onSuccess(res.data);
      onClose();
    } else {
      setError(res.error || 'Failed to convert quotation.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-body">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative space-y-6 text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2E4036] text-white flex items-center justify-center font-bold">
            <ArrowRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg leading-tight text-slate-900">Convert Quotation to Invoice</h3>
            <p className="text-xs text-slate-500 font-mono">Auto-copies client, line items, and totals.</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleConvert} className="space-y-4 text-xs font-mono">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Quotation:</span>
              <span className="font-bold text-[#CC5833]">{quote.quoteNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Client:</span>
              <span className="font-bold text-slate-900">{quote.customer?.name}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-body text-sm">
              <span className="font-bold text-slate-700">Total Amount:</span>
              <span className="font-extrabold text-[#2E4036]">
                €{Number(quote.grandTotal).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold uppercase mb-1">Invoice Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:bg-white focus:border-[#2E4036]"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:bg-white focus:border-[#2E4036]"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 font-body">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#2E4036] hover:bg-[#1E2E25] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Converting...' : 'Generate Official Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
