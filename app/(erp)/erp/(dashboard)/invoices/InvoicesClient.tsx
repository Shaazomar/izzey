'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Filter, CreditCard, Banknote, Eye, 
  Trash2, Copy, FileText
} from 'lucide-react';
import { deleteInvoice } from '@/app/actions/invoices';
import StatusBadge from '@/components/erp/StatusBadge';
import ActionMenu, { ActionMenuItem } from '@/components/erp/ActionMenu';
import InvoiceBuilder from '@/components/erp/InvoiceBuilder';
import RecordPaymentModal from '@/components/erp/RecordPaymentModal';

interface InvoicesClientProps {
  initialInvoices: any[];
  customers: any[];
}

export default function InvoicesClient({ initialInvoices, customers }: InvoicesClientProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState(initialInvoices);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');

  // Full-Screen Builder & Modals
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Filter logic
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customer?.companyName && inv.customer.companyName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesCustomer = customerFilter === 'ALL' || inv.customerId === customerFilter;

    return matchesSearch && matchesStatus && matchesCustomer;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    const res = await deleteInvoice(id);
    if (res.success) {
      setInvoices(invoices.filter((inv) => inv.id !== id));
    }
  };

  const getInvoiceActionItems = (inv: any): ActionMenuItem[] => {
    const items: ActionMenuItem[] = [
      {
        label: 'Preview PDF',
        icon: Eye,
        onClick: () => router.push(`/erp/invoices/${inv.id}/preview`),
      },
      {
        label: 'Edit Invoice',
        icon: FileText,
        onClick: () => {
          setEditingInvoice(inv);
          setBuilderOpen(true);
        },
      },
    ];

    const outstanding = Number(inv.grandTotal) - Number(inv.amountPaid);
    if (outstanding > 0) {
      items.push({
        label: 'Record Payment',
        icon: CreditCard,
        onClick: () => {
          setSelectedInvoice(inv);
          setPaymentModalOpen(true);
        },
      });
    }

    items.push({
      label: 'Delete Invoice',
      icon: Trash2,
      variant: 'danger',
      onClick: () => handleDelete(inv.id),
    });

    return items;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Fast Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl text-[#071938]">Invoices & Billing Hub</h1>
          <p className="text-xs text-slate-500 font-mono">Create, track payments, and issue official billing receipts.</p>
        </div>

        <button
          onClick={() => {
            setEditingInvoice(null);
            setBuilderOpen(true);
          }}
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-2xl text-xs font-bold font-body flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Invoice</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs font-mono shadow-2xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoices by number, client, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:bg-white focus:border-emerald-600"
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
              <option value="PAID">PAID</option>
              <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="CANCELLED">CANCELLED</option>
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

      {/* Main Invoices Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto min-h-[350px] pb-24">
          <table className="w-full text-left text-xs font-mono select-none">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-3 px-3">INVOICE NUMBER</th>
                <th className="pb-3 px-3">CUSTOMER</th>
                <th className="pb-3 px-3">TOTAL / PAID</th>
                <th className="pb-3 px-3">STATUS</th>
                <th className="pb-3 px-3">ISSUE DATE</th>
                <th className="pb-3 px-3">DUE DATE</th>
                <th className="pb-3 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const outstanding = Number(inv.grandTotal) - Number(inv.amountPaid);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-3 font-bold text-sm text-[#071938]">{inv.invoiceNumber}</td>
                    <td className="py-4 px-3">
                      <div className="font-bold text-slate-900 font-body text-xs">{inv.customer?.name}</div>
                      {inv.customer?.companyName && (
                        <div className="text-[10px] text-slate-500">{inv.customer.companyName}</div>
                      )}
                    </td>
                    <td className="py-4 px-3">
                      <div className="font-bold text-slate-900 text-sm">
                        €{Number(inv.grandTotal).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] flex gap-2">
                        <span className="text-emerald-700 font-bold">Paid: €{Number(inv.amountPaid).toFixed(2)}</span>
                        {outstanding > 0 && (
                          <span className="text-rose-600 font-bold">Due: €{outstanding.toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-4 px-3 text-slate-500">
                      {new Date(inv.issueDate).toLocaleDateString('de-DE')}
                    </td>
                    <td className="py-4 px-3 text-slate-500">
                      {new Date(inv.dueDate).toLocaleDateString('de-DE')}
                    </td>
                     <td className="py-4 px-3 text-right shrink-0">
                      <div className="flex items-center justify-end gap-2">
                        {outstanding > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentModalOpen(true);
                            }}
                            className="bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 font-bold px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1 text-[10px] uppercase tracking-wider cursor-pointer"
                            title="Record Payment"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Pay</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push(`/erp/invoices/${inv.id}/preview`)}
                            className="bg-slate-50 hover:bg-[#102B6A] hover:text-white text-[#102B6A] font-bold px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1 text-[10px] uppercase tracking-wider cursor-pointer"
                            title="Preview PDF"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        )}

                        <ActionMenu items={getInvoiceActionItems(inv)} />
                      </div>
                    </td>
                  </tr>
                );
              })} {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                    No invoices match the active criteria. Click "+ New Invoice" to launch the builder.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-Screen Interactive Invoice Builder */}
      <InvoiceBuilder
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        invoiceToEdit={editingInvoice}
        customers={customers}
        onSuccess={(saved) => {
          if (editingInvoice) {
            setInvoices(invoices.map((item) => (item.id === saved.id ? saved : item)));
          } else {
            setInvoices([saved, ...invoices]);
          }
        }}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        invoice={selectedInvoice}
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={(amountPaid) => {
          setInvoices(invoices.map((inv) => {
            if (inv.id === selectedInvoice.id) {
              const newAmountPaid = Number(inv.amountPaid) + amountPaid;
              const total = Number(inv.grandTotal);
              const newStatus = newAmountPaid >= total ? 'PAID' : 'PARTIALLY_PAID';
              return {
                ...inv,
                amountPaid: newAmountPaid,
                status: newStatus
              };
            }
            return inv;
          }));
          router.refresh();
        }}
      />

    </div>
  );
}
