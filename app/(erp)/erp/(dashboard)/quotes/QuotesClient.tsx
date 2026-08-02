'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Filter, FileText, ArrowRight, Eye, 
  Copy, Trash2
} from 'lucide-react';
import { duplicateQuotation, deleteQuotation } from '@/app/actions/quotes';
import StatusBadge from '@/components/erp/StatusBadge';
import ActionMenu, { ActionMenuItem } from '@/components/erp/ActionMenu';
import QuotationBuilder from '@/components/erp/QuotationBuilder';
import ConvertInvoiceModal from '@/components/erp/ConvertInvoiceModal';

interface QuotesClientProps {
  initialQuotes: any[];
  customers: any[];
}

export default function QuotesClient({ initialQuotes, customers }: QuotesClientProps) {
  const router = useRouter();
  const [quotes, setQuotes] = useState(initialQuotes);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');

  // Full-Screen Builder & Modals
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [quoteToConvert, setQuoteToConvert] = useState<any | null>(null);

  // Filter logic
  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      (q.customer?.companyName && q.customer.companyName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    const matchesCustomer = customerFilter === 'ALL' || q.customerId === customerFilter;

    return matchesSearch && matchesStatus && matchesCustomer;
  });

  const handleDuplicate = async (id: string) => {
    const res = await duplicateQuotation(id);
    if (res.success && res.data) {
      setQuotes([res.data, ...quotes]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    const res = await deleteQuotation(id);
    if (res.success) {
      setQuotes(quotes.filter((q) => q.id !== id));
    }
  };

  const getQuoteActionItems = (q: any): ActionMenuItem[] => {
    const items: ActionMenuItem[] = [
      {
        label: 'Preview PDF',
        icon: Eye,
        onClick: () => router.push(`/erp/quotes/${q.id}/preview`),
      },
      {
        label: 'Edit Quotation',
        icon: FileText,
        onClick: () => {
          setEditingQuote(q);
          setBuilderOpen(true);
        },
      },
      {
        label: 'Duplicate Quote',
        icon: Copy,
        onClick: () => handleDuplicate(q.id),
      },
    ];

    if (q.status !== 'INVOICED' && q.status !== 'DECLINED' && q.status !== 'CONVERTED') {
      items.push({
        label: 'Convert to Invoice',
        icon: ArrowRight,
        onClick: () => {
          setQuoteToConvert(q);
          setConvertModalOpen(true);
        },
      });
    }

    items.push({
      label: 'Delete Quote',
      icon: Trash2,
      variant: 'danger',
      onClick: () => handleDelete(q.id),
    });

    return items;
  };

  return (
    <>
      <div className="no-print space-y-6">
      
      {/* Top Header & Fast Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl text-[#071938]">Quotations Sales Hub</h1>
          <p className="text-xs text-slate-500 font-mono">Create, preview, and convert client estimates in under 2 minutes.</p>
        </div>

        <button
          onClick={() => {
            setEditingQuote(null);
            setBuilderOpen(true);
          }}
          className="bg-[#2E4036] hover:bg-[#1E2E25] text-white px-5 py-3 rounded-2xl text-xs font-bold font-body flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Quotation</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs font-mono shadow-2xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search quotes by number, client, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:bg-white focus:border-[#2E4036]"
          />
        </div>

        {/* Status & Customer Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SENT">SENT</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="CONVERTED">CONVERTED</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Quotations Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto min-h-[350px] pb-24">
          <table className="w-full text-left text-xs font-mono select-none">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-3 px-3">QUOTE NUMBER</th>
                <th className="pb-3 px-3">CUSTOMER</th>
                <th className="pb-3 px-3">SERVICE</th>
                <th className="pb-3 px-3">TOTAL</th>
                <th className="pb-3 px-3">STATUS</th>
                <th className="pb-3 px-3">DATE</th>
                <th className="pb-3 px-3">VALID UNTIL</th>
                <th className="pb-3 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-3 font-bold text-sm text-[#071938]">{q.quoteNumber}</td>
                  <td className="py-4 px-3">
                    <div className="font-bold text-slate-900 font-body text-xs">{q.customer?.name}</div>
                    {q.customer?.companyName && (
                      <div className="text-[10px] text-slate-500">{q.customer.companyName}</div>
                    )}
                  </td>
                  <td className="py-4 px-3 font-body text-xs text-slate-700">
                    {q.items?.[0]?.serviceName || 'Cleaning & Relocation'}
                    {q.items?.length > 1 && (
                      <span className="text-[10px] text-slate-400 font-mono ml-1">+{q.items.length - 1} more</span>
                    )}
                  </td>
                  <td className="py-4 px-3 font-bold text-slate-900 text-sm">
                    €{Number(q.grandTotal).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-3">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="py-4 px-3 text-slate-500">
                    {new Date(q.date).toLocaleDateString('de-DE')}
                  </td>
                  <td className="py-4 px-3 text-slate-500">
                    {new Date(q.validUntil).toLocaleDateString('de-DE')}
                  </td>
                  <td className="py-4 px-3 text-right shrink-0">
                      <div className="flex items-center justify-end gap-2">
                        {q.status !== 'INVOICED' && q.status !== 'DECLINED' && q.status !== 'CONVERTED' ? (
                          <button
                            onClick={() => {
                              setQuoteToConvert(q);
                              setConvertModalOpen(true);
                            }}
                            className="bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-700 font-bold px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1 text-[10px] uppercase tracking-wider cursor-pointer"
                            title="Convert to Invoice"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Convert</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push(`/erp/quotes/${q.id}/preview`)}
                            className="bg-slate-50 hover:bg-[#102B6A] hover:text-white text-[#102B6A] font-bold px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1 text-[10px] uppercase tracking-wider cursor-pointer"
                            title="Preview PDF"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        )}

                        <ActionMenu items={getQuoteActionItems(q)} />
                      </div>
                    </td>
                </tr>
              ))}

              {filteredQuotes.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                    No quotations match the active criteria. Click "+ New Quotation" to launch the builder.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Full-Screen Interactive Quotation Builder */}
      <QuotationBuilder
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        quoteToEdit={editingQuote}
        customers={customers}
        onSuccess={(saved) => {
          if (editingQuote) {
            setQuotes(quotes.map((item) => (item.id === saved.id ? saved : item)));
          } else {
            setQuotes([saved, ...quotes]);
          }
        }}
        onOpenConvertModal={(q) => {
          setQuoteToConvert(q);
          setConvertModalOpen(true);
        }}
      />

      {/* 1-Click Convert to Invoice Modal */}
      <ConvertInvoiceModal
        quote={quoteToConvert}
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        onSuccess={() => {
          setQuotes(
            quotes.map((item) =>
              item.id === quoteToConvert?.id ? { ...item, status: 'CONVERTED' } : item
            )
          );
          router.push('/erp/invoices');
        }}
      />

    </>
  );
}
