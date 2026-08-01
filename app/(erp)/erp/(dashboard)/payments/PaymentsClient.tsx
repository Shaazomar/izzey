'use client';

import React, { useState } from 'react';
import { 
  Landmark, Search, Banknote, CreditCard, DollarSign, Calendar, ArrowUpRight 
} from 'lucide-react';
import StatusBadge from '@/components/erp/StatusBadge';
import { useRouter } from 'next/navigation';

interface PaymentsClientProps {
  initialPayments: any[];
}

export default function PaymentsClient({ initialPayments }: PaymentsClientProps) {
  const router = useRouter();
  const [payments, setPayments] = useState(initialPayments);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    const invNumber = p.invoice?.invoiceNumber || '';
    const custName = p.invoice?.customer?.name || '';
    const matchesSearch =
      invNumber.toLowerCase().includes(search.toLowerCase()) ||
      custName.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;

    return matchesSearch && matchesMethod;
  });

  // Calculate totals
  const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const bankTransferTotal = payments
    .filter((p) => p.paymentMethod === 'BANK_TRANSFER')
    .reduce((acc, p) => acc + Number(p.amount), 0);
  const cashTotal = payments
    .filter((p) => p.paymentMethod === 'CASH')
    .reduce((acc, p) => acc + Number(p.amount), 0);
  const cardTotal = payments
    .filter((p) => p.paymentMethod === 'CARD' || p.paymentMethod === 'ONLINE')
    .reduce((acc, p) => acc + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl text-[#2E4036]">Financial Payments Ledger</h1>
          <p className="text-xs text-dark/60 font-mono">Track recorded payment receipts across all client invoices.</p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-[#2E4036] text-white p-5 rounded-3xl shadow-sm space-y-1">
          <div className="text-[10px] uppercase font-bold text-white/60">Total Collected Revenue</div>
          <div className="text-2xl font-heading font-extrabold">€{totalRevenue.toFixed(2)}</div>
          <div className="text-[10px] text-white/50">{payments.length} Transactions Recorded</div>
        </div>

        <div className="bg-[#EAE8E2] border border-black/10 p-5 rounded-3xl shadow-sm space-y-1 text-dark">
          <div className="text-[10px] uppercase font-bold text-dark/40">Bank Transfer</div>
          <div className="text-xl font-heading font-extrabold text-[#2E4036]">€{bankTransferTotal.toFixed(2)}</div>
          <div className="text-[10px] text-dark/50">Direct Bank Receipts</div>
        </div>

        <div className="bg-[#EAE8E2] border border-black/10 p-5 rounded-3xl shadow-sm space-y-1 text-dark">
          <div className="text-[10px] uppercase font-bold text-dark/40">Cash Collection</div>
          <div className="text-xl font-heading font-extrabold text-amber-700">€{cashTotal.toFixed(2)}</div>
          <div className="text-[10px] text-dark/50">On-Site Cash</div>
        </div>

        <div className="bg-[#EAE8E2] border border-black/10 p-5 rounded-3xl shadow-sm space-y-1 text-dark">
          <div className="text-[10px] uppercase font-bold text-dark/40">Card / Online</div>
          <div className="text-xl font-heading font-extrabold text-[#CC5833]">€{cardTotal.toFixed(2)}</div>
          <div className="text-[10px] text-dark/50">Stripe / Card Terminal</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-[#EAE8E2] border border-black/10 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs font-mono">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-dark/40" />
          <input
            type="text"
            placeholder="Search payments by invoice or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#2E4036]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-black/10 rounded-xl px-3 py-1.5">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Methods</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-[#EAE8E2] border border-black/10 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono select-none">
            <thead>
              <tr className="border-b border-black/10 text-dark/50 font-bold uppercase tracking-wider">
                <th className="pb-3 px-3">PAYMENT DATE</th>
                <th className="pb-3 px-3">INVOICE</th>
                <th className="pb-3 px-3">CUSTOMER</th>
                <th className="pb-3 px-3">AMOUNT</th>
                <th className="pb-3 px-3">METHOD</th>
                <th className="pb-3 px-3">REFERENCE</th>
                <th className="pb-3 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-black/5 transition-colors">
                  <td className="py-4 px-3 font-bold text-dark">
                    {new Date(p.paymentDate).toLocaleDateString('de-DE')}
                  </td>
                  <td className="py-4 px-3 font-bold text-[#CC5833]">
                    {p.invoice?.invoiceNumber}
                  </td>
                  <td className="py-4 px-3 font-body text-xs font-bold text-dark">
                    {p.invoice?.customer?.name}
                  </td>
                  <td className="py-4 px-3 font-bold text-[#2E4036] text-sm">
                    +€{Number(p.amount).toFixed(2)}
                  </td>
                  <td className="py-4 px-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/5 text-dark/80 border border-black/10">
                      {p.paymentMethod.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-dark/60 italic">
                    {p.notes || '—'}
                  </td>
                  <td className="py-4 px-3 text-right">
                    {p.invoiceId && (
                      <button
                        onClick={() => router.push(`/erp/invoices/${p.invoiceId}/preview`)}
                        className="p-1.5 rounded-lg hover:bg-black/5 text-[#CC5833] font-bold transition-all inline-flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        <span>View Invoice</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-dark/40 font-mono">
                    No payment records found. Payments are recorded from invoice viewings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
