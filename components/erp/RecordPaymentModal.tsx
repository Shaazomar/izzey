'use client';

import React, { useState } from 'react';
import { X, CreditCard, Banknote, Calendar, CheckCircle2 } from 'lucide-react';
import { recordPayment } from '@/app/actions/invoices';

interface RecordPaymentModalProps {
  invoice: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amountPaid: number) => void;
}

export default function RecordPaymentModal({ invoice, isOpen, onClose, onSuccess }: RecordPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !invoice) return null;

  const outstanding = Number(invoice.grandTotal) - Number(invoice.amountPaid);
  const defaultDate = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const payload = {
      invoiceId: invoice.id,
      amount: Number(data.amount),
      paymentDate: new Date(data.paymentDate as string),
      paymentMethod: data.paymentMethod as string,
      notes: (data.notes as string) || undefined,
    };

    const res = await recordPayment(payload);
    setLoading(false);

    if (res.success) {
      onSuccess(payload.amount);
      onClose();
    } else {
      setError(res.error || 'Failed to record payment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-body">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative space-y-6 text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2E4036] text-white flex items-center justify-center">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg leading-tight text-slate-900">Record Payment</h3>
            <p className="text-xs text-slate-500 font-mono">Log transaction against invoice balance.</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice Number:</span>
              <span className="font-bold text-[#CC5833]">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Client:</span>
              <span className="font-bold text-slate-900">{invoice.customer?.name}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-body">
              <span className="font-bold text-slate-700">Remaining Balance:</span>
              <span className="font-extrabold text-red-600">
                €{outstanding.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-bold uppercase mb-1">Payment Amount (€) *</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              max={outstanding}
              defaultValue={outstanding}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#2E4036] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold uppercase mb-1">Payment Method</label>
              <select
                name="paymentMethod"
                defaultValue="BANK_TRANSFER"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:bg-white focus:border-[#2E4036] cursor-pointer"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase mb-1">Payment Date</label>
              <input
                name="paymentDate"
                type="date"
                defaultValue={defaultDate}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:bg-white focus:border-[#2E4036]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-bold uppercase mb-1">Reference / Note</label>
            <input
              name="notes"
              type="text"
              placeholder="e.g. Bank Ref: #TRX-9842"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:bg-white focus:border-[#2E4036]"
            />
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
              <span>{loading ? 'Recording...' : 'Record Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
