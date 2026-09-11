'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, Copy, Sparkles, CheckCircle2, 
  FileText, ArrowRight, UserPlus, Eye, Download, Save
} from 'lucide-react';
import { createQuotation, updateQuotation } from '@/app/actions/quotes';
import ServiceTemplatesBar, { ServiceTemplate } from './ServiceTemplatesBar';
import CustomerModal from './CustomerModal';
import { useRouter } from 'next/navigation';

interface QuoteItemInput {
  serviceName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  vatPercent: number;
}

interface QuotationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  quoteToEdit?: any | null;
  customers: any[];
  onSuccess: (savedQuote: any) => void;
  onOpenConvertModal?: (quote: any) => void;
}

export default function QuotationDrawer({
  isOpen,
  onClose,
  quoteToEdit,
  customers: initialCustomers,
  onSuccess,
  onOpenConvertModal,
}: QuotationDrawerProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(() => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string>('DRAFT');
  const [items, setItems] = useState<QuoteItemInput[]>([
    {
      serviceName: 'Grundreinigung / Deep Cleaning',
      description: 'Intensivreinigung aller Oberflächen und Sanitärräume.',
      quantity: 8,
      unit: 'Std.',
      unitPrice: 35,
      discount: 0,
      vatPercent: 19,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hydrate form on edit or reset on create
  useEffect(() => {
    setCustomers(initialCustomers);
    if (quoteToEdit) {
      setSelectedCustomerId(quoteToEdit.customerId);
      setSelectedPropertyId(quoteToEdit.propertyId || '');
      setDate(new Date(quoteToEdit.date).toISOString().split('T')[0]);
      setValidUntil(new Date(quoteToEdit.validUntil).toISOString().split('T')[0]);
      setNotes(quoteToEdit.notes || '');
      setStatus(quoteToEdit.status || 'DRAFT');
      setItems(
        quoteToEdit.items.map((it: any) => ({
          serviceName: it.serviceName,
          description: it.description || '',
          quantity: Number(it.quantity),
          unit: it.unit || 'Std.',
          unitPrice: Number(it.unitPrice),
          discount: Number(it.discount),
          vatPercent: Number(it.vatPercent),
        }))
      );
    } else {
      setSelectedCustomerId(initialCustomers[0]?.id || '');
      setSelectedPropertyId(initialCustomers[0]?.properties?.[0]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setValidUntil(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setNotes('');
      setStatus('DRAFT');
      setItems([
        {
          serviceName: 'Grundreinigung / Deep Cleaning',
          description: 'Intensivreinigung aller Oberflächen und Sanitärräume.',
          quantity: 8,
          unit: 'Std.',
          unitPrice: 35,
          discount: 0,
          vatPercent: 19,
        },
      ]);
    }
  }, [quoteToEdit, isOpen, initialCustomers]);

  // When customer selection changes, auto-pick property
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const customerProperties = selectedCustomer?.properties || [];

  useEffect(() => {
    if (customerProperties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(customerProperties[0].id);
    }
  }, [selectedCustomerId, customerProperties]);

  // Keyboard Shortcuts (Ctrl+S, Ctrl+P, Ctrl+Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave('DRAFT');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (quoteToEdit?.id) {
          router.push(`/erp/quotes/${quoteToEdit.id}/preview`);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave('SENT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedCustomerId, items, quoteToEdit]);

  // Handle line item mutations
  const handleAddItemRow = () => {
    setItems([
      ...items,
      { serviceName: '', description: '', quantity: 1, unit: 'Flat', unitPrice: 0, discount: 0, vatPercent: 0 },
    ]);
  };

  const handleDuplicateRow = (idx: number) => {
    const itemToCopy = { ...items[idx] };
    const updated = [...items];
    updated.splice(idx + 1, 0, itemToCopy);
    setItems(updated);
  };

  const handleRemoveRow = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof QuoteItemInput, val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    setItems(updated);
  };

  // Presets insertion
  const handleApplyPreset = (template: ServiceTemplate) => {
    // Map preset template items to default Qty=1, Unit=Flat, VAT=0
    const mappedItems = template.items.map(it => ({
      ...it,
      quantity: 1,
      unit: 'Flat',
      vatPercent: 0
    }));
    setItems([...items, ...mappedItems]);
  };

  // Live calculation
  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;

    items.forEach((item) => {
      const itemSub = item.unitPrice;
      const disc = itemSub * (item.discount / 100);

      subtotal += itemSub;
      totalDiscount += disc;
    });

    return {
      subtotal,
      discount: totalDiscount,
      vat: 0,
      grandTotal: subtotal - totalDiscount,
    };
  };

  const totals = calculateTotals();

  // Submit action
  const handleSave = async (targetStatus?: string) => {
    setLoading(true);
    setError('');

    if (!selectedCustomerId) {
      setError('Please select a customer.');
      setLoading(false);
      return;
    }

    const payload = {
      customerId: selectedCustomerId,
      propertyId: selectedPropertyId || customerProperties[0]?.id,
      date: new Date(date),
      validUntil: new Date(validUntil),
      status: targetStatus || status,
      items: items.map((it) => ({
        ...it,
        quantity: 1,
        unit: 'Flat',
        unitPrice: Number(it.unitPrice),
        discount: Number(it.discount),
        vatPercent: 0,
      })),
      notes,
    };

    let res;
    if (quoteToEdit?.id) {
      res = await updateQuotation(quoteToEdit.id, payload);
    } else {
      res = await createQuotation(payload);
    }

    setLoading(false);

    if (res.success && res.data) {
      onSuccess(res.data);
      onClose();
    } else {
      setError(res.error || 'Failed to save quotation.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      
      {/* Slide-over Drawer Pane */}
      <div className="bg-[#EAE8E2] border-l border-black/10 w-full max-w-3xl h-full shadow-2xl flex flex-col justify-between text-dark animate-slide-left overflow-y-auto">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-black/10 bg-[#EAE8E2] sticky top-0 z-20 flex justify-between items-center shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#102B6A] uppercase">
                GUIDED QUOTATION WORKFLOW
              </span>
              <span className="text-[10px] bg-black/5 text-dark/60 font-mono px-2 py-0.5 rounded-full">
                Ctrl+S to save
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-xl">
              {quoteToEdit ? `Edit Quotation ${quoteToEdit.quoteNumber}` : 'Create New Quotation'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-black/5 text-dark/50 hover:text-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Form */}
        <div className="p-6 space-y-8 flex-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-700 px-4 py-3 rounded-2xl text-xs font-mono">
              {error}
            </div>
          )}

          {/* STEP 1: Select Customer & Property */}
          <div className="bg-white border border-black/10 p-5 rounded-2xl space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-sm text-[#102B6A] uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#102B6A] text-white flex items-center justify-center text-[10px]">1</span>
                <span>Select Customer & Coordinates</span>
              </h3>

              <button
                type="button"
                onClick={() => setCustomerModalOpen(true)}
                className="text-xs font-mono font-bold text-[#CC5833] hover:underline flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ New Client</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block text-dark/60 font-bold uppercase mb-1">Customer *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-[#EAE8E2] border border-black/10 rounded-xl px-3 py-2.5 font-bold text-xs focus:outline-none focus:border-[#102B6A]"
                >
                  <option value="">Select a customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-dark/60 font-bold uppercase mb-1">Property Address</label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full bg-[#EAE8E2] border border-black/10 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#102B6A]"
                >
                  {customerProperties.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.address}, {p.city}
                    </option>
                  ))}
                  {customerProperties.length === 0 && <option value="">Default Address</option>}
                </select>
              </div>
            </div>
          </div>

          {/* STEP 2: Quotation Details */}
          <div className="bg-white border border-black/10 p-5 rounded-2xl space-y-4 shadow-xs">
            <h3 className="font-heading font-bold text-sm text-[#102B6A] uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#102B6A] text-white flex items-center justify-center text-[10px]">2</span>
              <span>Quotation Details</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <label className="block text-dark/60 font-bold uppercase mb-1">Quote Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setDate(newDate);
                    if (newDate) {
                      const d = new Date(newDate);
                      if (!isNaN(d.getTime())) {
                        const validDate = new Date(d.getTime() + 14 * 24 * 60 * 60 * 1000);
                        setValidUntil(validDate.toISOString().split('T')[0]);
                      }
                    }
                  }}
                  className="w-full bg-[#EAE8E2] border border-black/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#102B6A]"
                />
              </div>

              <div>
                <label className="block text-dark/60 font-bold uppercase mb-1">Valid Until</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full bg-[#EAE8E2] border border-black/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#102B6A]"
                />
              </div>

              <div>
                <label className="block text-dark/60 font-bold uppercase mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#EAE8E2] border border-black/10 rounded-xl px-3 py-2 font-bold text-xs focus:outline-none focus:border-[#102B6A]"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SENT">SENT</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>
            </div>
          </div>

          {/* STEP 3: Add Services & Presets */}
          <div className="bg-white border border-black/10 p-5 rounded-2xl space-y-4 shadow-xs">
            <h3 className="font-heading font-bold text-sm text-[#102B6A] uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#102B6A] text-white flex items-center justify-center text-[10px]">3</span>
              <span>Services & Line Items</span>
            </h3>

            {/* Service Presets */}
            <ServiceTemplatesBar onApplyTemplate={handleApplyPreset} />

            {/* Line Items List */}
            <div className="space-y-3 pt-2">
              {items.map((item, idx) => {
                const lineTotal = item.unitPrice * (1 - item.discount / 100);
                return (
                  <div key={idx} className="bg-[#EAE8E2]/60 border border-black/5 p-4 rounded-2xl space-y-3 relative group">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <input
                          type="text"
                          placeholder="Service Name (e.g. Grundreinigung)"
                          value={item.serviceName}
                          onChange={(e) => handleItemChange(idx, 'serviceName', e.target.value)}
                          className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 font-bold text-xs focus:outline-none focus:border-[#102B6A]"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Description (Optional notes)"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#102B6A]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs font-mono items-center">
                      <div>
                        <span className="text-[9px] text-dark/40 uppercase">Price (€)</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full bg-white border border-black/10 rounded-xl px-2 py-1.5 text-xs text-right font-bold"
                        />
                      </div>

                      <div>
                        <span className="text-[9px] text-dark/40 uppercase">Discount %</span>
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => handleItemChange(idx, 'discount', Number(e.target.value))}
                          className="w-full bg-white border border-black/10 rounded-xl px-2 py-1.5 text-xs text-center"
                        />
                      </div>

                      <div className="flex justify-between items-center pt-3 sm:pt-0">
                        <div className="text-right flex-1">
                          <span className="text-[9px] text-dark/40 uppercase block">Total</span>
                          <span className="font-bold text-[#102B6A]">€{lineTotal.toFixed(2)}</span>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => handleDuplicateRow(idx)}
                            className="p-1.5 rounded-lg hover:bg-black/5 text-dark/40 hover:text-dark"
                            title="Duplicate Line"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            disabled={items.length === 1}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500/50 hover:text-red-600 disabled:opacity-30"
                            title="Delete Line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddItemRow}
              className="w-full border-2 border-dashed border-black/15 hover:border-[#102B6A] py-3 rounded-2xl text-xs font-mono font-bold text-[#102B6A] hover:bg-[#102B6A]/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Service Line</span>
            </button>
          </div>

          {/* STEP 4: Live Summary */}
          <div className="bg-[#102B6A] text-white p-6 rounded-3xl shadow-lg space-y-3 font-mono">
            <h3 className="font-heading font-black text-xs uppercase tracking-widest text-white/60">
              Live Total Calculations
            </h3>

            <div className="space-y-1.5 text-xs border-b border-white/10 pb-3">
              <div className="flex justify-between text-white/80">
                <span>Subtotal:</span>
                <span>€{totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-amber-300">
                  <span>Total Discount:</span>
                  <span>-€{totals.discount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-lg font-heading font-black">
              <span>GRAND TOTAL:</span>
              <span className="text-xl">€{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes Input */}
          <div className="bg-white border border-black/10 p-5 rounded-2xl space-y-2 shadow-xs text-xs font-mono">
            <label className="block font-bold text-dark/60 uppercase">Notes & Conditions</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dieses Angebot ist freibleibend..."
              className="w-full bg-[#EAE8E2] border border-black/10 rounded-xl p-3 text-xs focus:outline-none focus:border-[#102B6A]"
            />
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-6 border-t border-black/10 bg-[#EAE8E2] sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave('DRAFT')}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-black/10 hover:bg-black/5 text-xs font-bold text-dark/80 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>

            {quoteToEdit?.id && (
              <button
                type="button"
                onClick={() => router.push(`/erp/quotes/${quoteToEdit.id}/preview`)}
                className="px-4 py-2.5 rounded-xl border border-[#102B6A]/30 hover:bg-[#102B6A]/5 text-[#102B6A] text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Preview PDF</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {quoteToEdit?.id && onOpenConvertModal && (
              <button
                type="button"
                onClick={() => onOpenConvertModal(quoteToEdit)}
                className="bg-[#CC5833] hover:bg-[#CC5833]/90 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Convert to Invoice</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSave('APPROVED')}
              disabled={loading}
              className="bg-[#102B6A] hover:bg-[#102B6A]/90 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save & Approve'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Inline Customer Modal */}
      <CustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSuccess={(newCust) => {
          setCustomers([newCust, ...customers]);
          setSelectedCustomerId(newCust.id);
          if (newCust.properties?.[0]?.id) {
            setSelectedPropertyId(newCust.properties[0].id);
          }
        }}
      />
    </div>
  );
}
