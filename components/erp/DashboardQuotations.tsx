'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Filter, Eye, Trash2, ArrowRight, ChevronLeft, ChevronRight, FileText
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { deleteQuotation } from '@/app/actions/quotes';

interface DashboardQuotationsProps {
  initialQuotes: any[];
}

export default function DashboardQuotations({ initialQuotes }: DashboardQuotationsProps) {
  const router = useRouter();
  const [quotes, setQuotes] = useState(initialQuotes);
  
  // Filters and Search
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const tabs = ['All', 'Draft', 'Sent', 'Approved', 'Expired', 'Rejected'];

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    const res = await deleteQuotation(id);
    if (res.success) {
      setQuotes(quotes.filter((q) => q.id !== id));
    }
  };

  // Filter logic
  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      (q.customer?.companyName && q.customer.companyName.toLowerCase().includes(search.toLowerCase())) ||
      (q.items?.[0]?.serviceName && q.items[0].serviceName.toLowerCase().includes(search.toLowerCase()));

    const matchesTab = 
      activeTab === 'All' || 
      q.status.toLowerCase() === activeTab.toLowerCase();

    return matchesSearch && matchesTab;
  });

  // Pagination calculation
  const totalItems = filteredQuotes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentQuotes = filteredQuotes.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-extrabold text-lg text-slate-900">Quotations</h2>
        <a
          href="/erp/quotes"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E4036] hover:bg-[#1E2E25] text-white text-xs font-bold transition-all shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation</span>
        </a>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                isActive 
                  ? 'bg-[#2E4036] text-white font-bold' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>
        <div className="relative max-w-xs flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:bg-white focus:border-[#2E4036] transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono select-none">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-2">Quote Number</th>
              <th className="py-3 px-2">Customer</th>
              <th className="py-3 px-2">Service</th>
              <th className="py-3 px-2">Total</th>
              <th className="py-3 px-2">Status</th>
              <th className="py-3 px-2">Date</th>
              <th className="py-3 px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {currentQuotes.map((q) => (
              <tr key={q.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="py-3.5 px-2 font-bold text-slate-900">{q.quoteNumber}</td>
                <td className="py-3.5 px-2">
                  <div className="font-bold text-slate-900 font-body text-xs">{q.customer?.name}</div>
                  {q.customer?.companyName && (
                    <div className="text-[10px] text-slate-400 font-mono">{q.customer.companyName}</div>
                  )}
                </td>
                <td className="py-3.5 px-2 font-body text-[11px] text-slate-600">
                  {q.items?.[0]?.serviceName || 'Cleaning Services'}
                  {q.items?.length > 1 && ` (+${q.items.length - 1})`}
                </td>
                <td className="py-3.5 px-2 font-bold text-slate-900">
                  €{Number(q.grandTotal).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-2">
                  <StatusBadge status={q.status} />
                </td>
                <td className="py-3.5 px-2 text-slate-500">{new Date(q.date).toLocaleDateString('de-DE')}</td>
                <td className="py-3.5 px-2 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button 
                      onClick={() => router.push(`/erp/quotes/${q.id}/preview`)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#CC5833] transition-colors cursor-pointer"
                      title="Preview PDF"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(q.id)}
                      className="p-1 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                      title="Delete Quotation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {totalItems === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                  No quotations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
        <p>Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems} results</p>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              const isCurrent = currentPage === p;
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-colors ${
                    isCurrent 
                      ? 'bg-[#2E4036] text-white' 
                      : 'border border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
