'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Plus, Trash2, Copy, Sparkles, CheckCircle2, 
  FileCheck, ArrowRight, UserPlus, Save, Printer, ArrowUp, ArrowDown,
  Minus
} from 'lucide-react';
import { createInvoice, updateInvoice, deleteInvoice, getInvoiceForEdit, generateInvoiceNumber } from '@/app/actions/invoices';
import {
  CompanyDetails,
  DEFAULT_COMPANY,
  InvoiceFormValues,
  InvoiceLanguage,
  calcInvoiceTotals,
  formValuesToDocumentData,
  formValuesToPayload,
  invoiceToFormValues,
} from '@/lib/invoice';
import BaseTemplate, { DocumentData } from '../document/BaseTemplate';
import CustomerModal from './CustomerModal';

export interface InvoiceItemInput {
  serviceName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  vatPercent: number;
}

const SERVICE_PRESETS = [
  {
    name: 'Deep Cleaning Apartment',
    items: [
      {
        serviceName: 'Wohnungs-Tiefenreinigung / Deep Cleaning Apartment',
        description: 'Gründliche Tiefenreinigung aller Zimmer, Bäder und Küchenoberflächen.',
        quantity: 1,
        unit: 'Std.',
        unitPrice: 280,
        discount: 0,
        vatPercent: 19,
      },
    ],
  },
  {
    name: 'Move Out Cleaning',
    items: [
      {
        serviceName: 'Umzugsreinigung mit Übergabegarantie / Move-Out Cleaning',
        description: 'Endreinigung mit Abnahmegarantie für den Vermieter.',
        quantity: 1,
        unit: 'Std.',
        unitPrice: 456,
        discount: 0,
        vatPercent: 19,
      },
    ],
  },
  {
    name: 'Kitchen Cleaning',
    items: [
      {
        serviceName: 'Küchen-Intensivreinigung / Kitchen Cleaning',
        description: 'Entfettung von Dunstabzugshauben, Backofenreinigung und Desinfektion.',
        quantity: 1,
        unit: 'Std.',
        unitPrice: 160,
        discount: 0,
        vatPercent: 19,
      },
    ],
  },
  {
    name: 'Office Cleaning',
    items: [
      {
        serviceName: 'Büroreinigung / Office Cleaning',
        description: 'Unterhaltsreinigung von Arbeitsplätzen, Teeküchen und Sanitäranlagen.',
        quantity: 1,
        unit: 'Std.',
        unitPrice: 192,
        discount: 0,
        vatPercent: 19,
      },
    ],
  },
  {
    name: 'Window Cleaning',
    items: [
      {
        serviceName: 'Fensterreinigung / Window Cleaning',
        description: 'Reinigung von Glasflächen inkl. Rahmen und Fensterbänken.',
        quantity: 1,
        unit: 'Std.',
        unitPrice: 126,
        discount: 0,
        vatPercent: 19,
      },
    ],
  },
  {
    name: 'Packing Service',
    items: [
      {
        serviceName: 'Packservice / Packing Service',
        description: 'Systematisches Einpacken Ihres Hausstands in Umzugskartons.',
        quantity: 1,
        unit: 'Pauschale',
        unitPrice: 250,
        discount: 0,
        vatPercent: 19,
      },
    ],
  },
  {
    name: 'Moving Transport',
    items: [
      {
        serviceName: 'Umzugsservice / Moving Service',
        description: 'Transport Ihres Hab und Guts mit Möbelwagen inkl. Trageleistung.',
        quantity: 1,
        unit: 'Pauschale',
        unitPrice: 450,
        discount: 0,
        vatPercent: 19,
      },
    ],
  },
];

interface InvoiceBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToEdit?: any | null;
  customers: any[];
  companyDefaults?: CompanyDetails;
  onSuccess: (savedInvoice: any) => void;
}

export default function InvoiceBuilder({
  isOpen,
  onClose,
  invoiceToEdit,
  customers: initialCustomers,
  companyDefaults = DEFAULT_COMPANY,
  onSuccess,
}: InvoiceBuilderProps) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Form State (single editable copy; hydrated from the canonical DB record on open)
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Billing (customer) details printed on this invoice
  const [custName, setCustName] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custVatNumber, setCustVatNumber] = useState('');

  // Company (provider) details printed on this invoice
  const [company, setCompany] = useState<CompanyDetails>(companyDefaults);

  // Invoice Config
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [reference, setReference] = useState('');
  const [dateType, setDateType] = useState<'SINGLE_DATE' | 'CONTRACT_PERIOD'>('SINGLE_DATE');
  const [issueDate, setIssueDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [language, setLanguage] = useState<InvoiceLanguage>('both');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string>('DRAFT');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [footerText, setFooterText] = useState('');

  const [items, setItems] = useState<InvoiceItemInput[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(0.85);

  // Version of the record the form was loaded from (stale-write protection) and re-entrancy guards.
  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState<string | null>(null);
  const savingRef = useRef(false);
  const dueDateTouchedRef = useRef(false);
  const customersRef = useRef(initialCustomers);
  customersRef.current = customers;

  const applyValues = (v: InvoiceFormValues) => {
    setSelectedCustomerId(v.customerId);
    setCustName(v.billing.name);
    setCustCompany(v.billing.companyName);
    setCustPhone(v.billing.phone);
    setCustEmail(v.billing.email);
    setCustAddress(v.billing.address);
    setCustVatNumber(v.billing.vatNumber);
    setCompany(v.company);
    setInvoiceNumber(v.invoiceNumber);
    setReference(v.reference);
    setDateType(v.dateType);
    setIssueDate(v.issueDate);
    setToDate(v.toDate);
    setServiceDate(v.serviceDate);
    setDueDate(v.dueDate);
    setCurrency(v.currency);
    setLanguage(v.language);
    setStatus(v.status);
    setNotes(v.notes);
    setPaymentTerms(v.paymentTerms);
    setPaymentMethod(v.paymentMethod);
    setBankDetails(v.bankDetails);
    setFooterText(v.footerText);
    setItems(v.items);
  };

  const currentValues = (): InvoiceFormValues => ({
    invoiceNumber,
    reference,
    customerId: selectedCustomerId,
    billing: {
      name: custName,
      companyName: custCompany,
      email: custEmail,
      phone: custPhone,
      address: custAddress,
      vatNumber: custVatNumber,
    },
    company,
    dateType,
    issueDate,
    toDate,
    serviceDate,
    dueDate,
    currency,
    language,
    status,
    paymentTerms,
    paymentMethod,
    bankDetails,
    footerText,
    notes,
    items,
  });

  const billingFromCustomer = (c: any) => invoiceToFormValues({ customer: c, customerId: c.id }, companyDefaults).billing;

  const applyBilling = (b: ReturnType<typeof billingFromCustomer>) => {
    setCustName(b.name);
    setCustCompany(b.companyName);
    setCustPhone(b.phone);
    setCustEmail(b.email);
    setCustAddress(b.address);
    setCustVatNumber(b.vatNumber);
  };

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  // Hydrate ONLY when the editor opens (or switches invoice). Re-running on prop identity changes
  // (e.g. after router.refresh) would wipe what the user is typing.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setError('');
    setLoadedUpdatedAt(null);

    if (invoiceToEdit?.id) {
      dueDateTouchedRef.current = true;
      // Show the row we already have instantly, then replace it with the canonical DB record.
      applyValues(invoiceToFormValues(invoiceToEdit, companyDefaults));
      setLoadingRecord(true);
      getInvoiceForEdit(invoiceToEdit.id)
        .then((res: any) => {
          if (cancelled) return;
          if (res.success && res.data) {
            applyValues(invoiceToFormValues(res.data, companyDefaults));
            setLoadedUpdatedAt(res.data.updatedAt);
          } else {
            setError(res.error || 'Could not load the latest version of this invoice.');
          }
        })
        .catch(() => !cancelled && setError('Could not load the latest version of this invoice.'))
        .finally(() => !cancelled && setLoadingRecord(false));
    } else {
      dueDateTouchedRef.current = false;
      const today = new Date().toISOString().split('T')[0];
      const defaultCust = customersRef.current[0];
      const base = invoiceToFormValues(
        { customer: defaultCust, customerId: defaultCust?.id, issueDate: today, dueDate: new Date(Date.now() + 14 * 86400000), items: [] },
        companyDefaults
      );
      applyValues({
        ...base,
        invoiceNumber: '',
        currency: 'EUR',
        language: 'both',
        status: 'DRAFT',
        notes: 'Zahlbar innerhalb von 14 Tagen ohne Abzug. Vielen Dank für Ihren Auftrag!',
        items: [
          {
            serviceName: 'Wohnungs-Tiefenreinigung / Deep Cleaning Apartment',
            description: 'Intensivreinigung aller Oberflächen, Sanitärräume und Fensterbänke.',
            quantity: 1,
            unit: 'Std.',
            unitPrice: 280,
            discount: 0,
            vatPercent: 19,
          },
        ],
      });
      generateInvoiceNumber()
        .then((n) => !cancelled && setInvoiceNumber((cur) => cur || n))
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, invoiceToEdit?.id]);

  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    const cust = customers.find((c) => c.id === id);
    if (cust) applyBilling(billingFromCustomer(cust));
  };

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { serviceName: '', description: '', quantity: 1, unit: 'Std.', unitPrice: 0, discount: 0, vatPercent: 19 },
    ]);
  };

  const handleDuplicateRow = (idx: number) => {
    const copy = { ...items[idx] };
    const updated = [...items];
    updated.splice(idx + 1, 0, copy);
    setItems(updated);
  };

  const handleRemoveRow = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleMoveRow = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const updated = [...items];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setItems(updated);
  };

  const handleItemChange = (idx: number, field: keyof InvoiceItemInput, val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    setItems(updated);
  };

  const handleApplyPreset = (preset: typeof SERVICE_PRESETS[0]) => {
    setItems([...items, ...preset.items]);
  };

  // Live totals use the exact same function the server uses to compute the saved totals.
  const calc = calcInvoiceTotals(items);
  const totals = { subtotal: calc.subtotal, discount: calc.discount, vat: calc.vat, grandTotal: calc.grandTotal };


  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Delete Invoice Action
  const handleDeleteInvoice = async () => {
    if (!invoiceToEdit?.id) return;
    if (!confirm(`Are you sure you want to delete invoice ${invoiceToEdit.invoiceNumber || ''}?`)) return;
    setLoading(true);
    const res = await deleteInvoice(invoiceToEdit.id);
    setLoading(false);
    if (res.success) {
      onClose();
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } else {
      setError(res.error || 'Failed to delete invoice.');
    }
  };

  const validateForm = (v: InvoiceFormValues): string => {
    if (!v.customerId) return 'Please select a customer.';
    if (!v.invoiceNumber.trim()) return 'Invoice number is required.';
    if (!v.issueDate) return 'Invoice date is required.';
    if (!v.dueDate) return 'Due date is required.';
    if (v.dateType === 'CONTRACT_PERIOD') {
      if (!v.toDate) return 'To Date is required for a contract period.';
      if (new Date(v.toDate) < new Date(v.issueDate)) return 'From Date cannot be later than To Date.';
    }
    if (v.items.length === 0) return 'At least one item is required.';
    for (let i = 0; i < v.items.length; i++) {
      const it = v.items[i];
      if (!it.serviceName.trim()) return `Line ${i + 1}: service name is required.`;
      if (!(Number(it.quantity) > 0)) return `Line ${i + 1}: quantity must be greater than 0.`;
      if (!(Number(it.unitPrice) >= 0)) return `Line ${i + 1}: price cannot be negative.`;
      if (Number(it.discount) < 0 || Number(it.discount) > 100) return `Line ${i + 1}: discount must be between 0 and 100.`;
    }
    return '';
  };

  const handleSave = async (targetStatus?: string) => {
    // Ignore duplicate clicks while a save is in flight.
    if (savingRef.current || loadingRecord) return;

    const values = { ...currentValues(), status: targetStatus || status };
    const validationError = validateForm(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    savingRef.current = true;
    setLoading(true);
    setError('');

    try {
      const payload = formValuesToPayload(values);
      const res = invoiceToEdit?.id
        ? await updateInvoice(invoiceToEdit.id, { ...payload, expectedUpdatedAt: loadedUpdatedAt })
        : await createInvoice(payload);

      if (res.success && res.data) {
        // Replace the form with the canonical saved record, then let the parent update its list.
        applyValues(invoiceToFormValues(res.data, companyDefaults));
        setLoadedUpdatedAt((res.data as any).updatedAt ?? null);
        onSuccess(res.data);
        onClose();
      } else {
        setError(res.error || 'Failed to save invoice.');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to save invoice.');
    } finally {
      savingRef.current = false;
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  // Same mapper as the saved preview/PDF page: what you see here is what gets printed.
  const liveDocumentData: DocumentData = formValuesToDocumentData(currentValues());

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#F8FAFC] flex flex-col text-slate-900 overflow-hidden font-body animate-fade-in print:bg-white print:static print:h-auto print:overflow-visible">
      
      {/* Header Bar */}
      <div className="no-print h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-slate-900 leading-tight">
              {invoiceToEdit ? `Edit Invoice ${invoiceToEdit.invoiceNumber}` : 'New Invoice Builder'}
            </h1>
            <p className="text-[11px] text-slate-500 font-mono">
              Full-Screen Live Editor • Right-Side Sticky PDF Preview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {invoiceToEdit?.id && (
            <button
              type="button"
              onClick={handleDeleteInvoice}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Delete</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print PDF</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={loading || loadingRecord}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 text-slate-600" />
            <span>{loading ? 'Saving...' : loadingRecord ? 'Loading...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('PAID')}
            disabled={loading || loadingRecord}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Official Invoice'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Split Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 overflow-hidden">
        
        {/* LEFT PANEL */}
        <div className="no-print h-full overflow-y-auto p-6 space-y-6 bg-slate-50 border-r border-slate-200">
          
          {loadingRecord && (
            <div className="bg-slate-100 border border-slate-200 text-slate-600 px-4 py-2 rounded-2xl text-xs font-mono">
              Loading the latest saved version…
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-mono">
              {error}
            </div>
          )}

          {/* Section 1: Customer Details */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Customer Details</span>
              </h2>

              <button
                type="button"
                onClick={() => setCustomerModalOpen(true)}
                className="text-xs font-mono font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Create Customer</span>
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 font-mono">Customer Search</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all"
              >
                <option value="">Select an existing customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Company</label>
                <input
                  type="text"
                  value={custCompany}
                  onChange={(e) => setCustCompany(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">VAT Number (USt-IdNr.)</label>
                <input
                  type="text"
                  value={custVatNumber}
                  onChange={(e) => setCustVatNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white"
                  placeholder="DE..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Address</label>
                <textarea
                  rows={2}
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Invoice Details */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Invoice Config</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reference</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="PO / order / project ref."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Service Date</label>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date Type</label>
                <select
                  value={dateType}
                  onChange={(e) => setDateType(e.target.value as 'SINGLE_DATE' | 'CONTRACT_PERIOD')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 focus:outline-none"
                >
                  <option value="SINGLE_DATE">Single Date</option>
                  <option value="CONTRACT_PERIOD">Contract Period</option>
                </select>
              </div>

              {dateType === 'SINGLE_DATE' ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setIssueDate(newDate);
                      // Only suggest a due date until the user has chosen one themselves (never when editing a saved invoice).
                      if (newDate && !dueDateTouchedRef.current) {
                        const d = new Date(newDate);
                        if (!isNaN(d.getTime())) {
                          const nextDue = new Date(d.getTime() + 14 * 24 * 60 * 60 * 1000);
                          setDueDate(nextDue.toISOString().split('T')[0]);
                        }
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">From Date</label>
                    <input
                      type="date"
                      value={issueDate}
                      max={toDate || undefined}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">To Date</label>
                    <input
                      type="date"
                      value={toDate}
                      min={issueDate || undefined}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white"
                    />
                  </div>
                </>
              )}

              {dateType === 'CONTRACT_PERIOD' && new Date(toDate) < new Date(issueDate) && (
                <div className="col-span-2 sm:col-span-3 text-[10px] font-bold text-rose-600 -mt-1">
                  From Date cannot be later than To Date.
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    dueDateTouchedRef.current = true;
                    setDueDate(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">PDF Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 focus:outline-none"
                >
                  <option value="both">German + English</option>
                  <option value="de">German Only</option>
                  <option value="en">English Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 focus:outline-none"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SENT">SENT</option>
                  <option value="PAID">PAID</option>
                  <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                  <option value="OVERDUE">OVERDUE</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Service Templates */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Service Templates</span>
              </span>
              <span className="text-slate-400 text-[11px]">Click to auto-fill row</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {SERVICE_PRESETS.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(tmpl)}
                  className="bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-700 hover:text-emerald-700 transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-emerald-600" />
                  <span>{tmpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Editable Service Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                <span>Service Line Items</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-2 px-1 text-center w-8">Sl</th>
                    <th className="pb-2 px-2 min-w-[200px]">Service Name</th>
                    <th className="pb-2 px-2 min-w-[200px]">Description</th>
                    <th className="pb-2 px-1 text-center w-16">Qty</th>
                    <th className="pb-2 px-1 text-center w-20">Unit</th>
                    <th className="pb-2 px-2 text-right w-28">Price ({currency})</th>
                    <th className="pb-2 px-1 text-center w-16">Disc%</th>
                    <th className="pb-2 px-1 text-center w-16">VAT%</th>
                    <th className="pb-2 px-1 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-1 text-center font-bold text-slate-400">{idx + 1}</td>

                        <td className="py-2.5 px-2">
                          <input
                            type="text"
                            value={item.serviceName}
                            onChange={(e) => handleItemChange(idx, 'serviceName', e.target.value)}
                            placeholder="e.g. Endreinigung"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:bg-white focus:border-emerald-500"
                          />
                        </td>

                        <td className="py-2.5 px-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            placeholder="Subtitles & details..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
                          />
                        </td>

                        <td className="py-2.5 px-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value === '' ? ('' as any) : Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1 text-xs text-center focus:outline-none focus:bg-white focus:border-emerald-500"
                          />
                        </td>

                        <td className="py-2.5 px-1">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1 text-xs text-center focus:outline-none focus:bg-white focus:border-emerald-500"
                          />
                        </td>

                        {/* Unit price */}
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value === '' ? ('' as any) : Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-right font-bold focus:outline-none focus:bg-white focus:border-emerald-500"
                          />
                        </td>

                        {/* Discount % */}
                        <td className="py-2.5 px-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={item.discount}
                            onChange={(e) => handleItemChange(idx, 'discount', e.target.value === '' ? ('' as any) : Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1 text-xs text-center focus:outline-none focus:bg-white focus:border-emerald-500"
                          />
                        </td>

                        {/* VAT% */}
                        <td className="py-2.5 px-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.vatPercent}
                            onChange={(e) => handleItemChange(idx, 'vatPercent', e.target.value === '' ? ('' as any) : Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1 text-xs text-center focus:outline-none focus:bg-white focus:border-emerald-500"
                          />
                        </td>

                        {/* Actions (Move, Duplicate, Delete) */}
                        <td className="py-2.5 px-1 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveRow(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveRow(idx, 'down')}
                              disabled={idx === items.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateRow(idx)}
                              className="p-1 text-slate-400 hover:text-emerald-600"
                              title="Duplicate Row"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              disabled={items.length === 1}
                              className="p-1 text-rose-400 hover:text-rose-600 disabled:opacity-20"
                              title="Delete Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={handleAddItemRow}
              className="w-full border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 py-3 rounded-2xl text-xs font-mono font-bold text-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Service Row</span>
            </button>
          </div>

          {/* Section 5: Notes */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 text-xs font-mono">
            <label className="block font-bold text-slate-500 uppercase">Notes & Payment Conditions</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:bg-white"
            />
          </div>

          {/* Section 6: Payment & Footer */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 text-xs font-mono">
            <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Payment &amp; Footer</h2>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Terms (leave empty for the standard text)</label>
              <textarea rows={2} value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Method</label>
              <input type="text" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="e.g. Bank transfer" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bank Details (leave empty for the standard IBAN/BIC)</label>
              <textarea rows={3} value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Footer / Thank-you Text (leave empty for the standard text)</label>
              <textarea rows={2} value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white" />
            </div>
          </div>

          {/* Section 7: Company details */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 text-xs font-mono">
            <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Company Details (Provider)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                ['name', 'Company Name'],
                ['vatNumber', 'Tax / VAT Number'],
                ['phone', 'Phone'],
                ['email', 'Email'],
                ['website', 'Website'],
                ['logoUrl', 'Logo URL'],
              ] as [keyof CompanyDetails, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
                  <input type="text" value={company[key]} onChange={(e) => setCompany({ ...company, [key]: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white" />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Address</label>
                <textarea rows={2} value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white" />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Sticky Live PDF Preview (1/2 Grid) */}
        <div className="h-full overflow-y-auto overflow-x-auto p-6 bg-slate-200/70 flex flex-col items-center space-y-4 shadow-inner print:p-0 print:bg-white print:block print:w-full print:h-auto">
          
          <div className="no-print w-full max-w-[210mm] bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-bold text-slate-800">LIVE PREVIEW</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.05))}
                  className="p-1 hover:bg-white rounded-lg text-slate-600 transition-colors"
                  title="Zoom Out"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-[10px] font-mono font-bold px-1 text-slate-700 min-w-[32px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom(Math.min(1.5, zoom + 0.05))}
                  className="p-1 hover:bg-white rounded-lg text-slate-600 transition-colors"
                  title="Zoom In"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Scaled A4 Document Container */}
          <div 
            className="py-2 print:p-0 print:m-0 print:block print:w-full print:h-auto overflow-visible"
            style={{ 
              width: `calc(210mm * ${zoom})`,
              height: `calc(297mm * ${zoom} + 16px)` 
            }}
          >
            <div 
              className="bg-white shadow-2xl border border-slate-300 rounded-[1.5rem] overflow-hidden transform-gpu transition-all print:transform-none print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 print:w-full"
              style={{ 
                transform: `scale(${zoom})`, 
                transformOrigin: 'top left',
                width: '210mm',
                height: '297mm'
              }}
            >
              <BaseTemplate data={liveDocumentData} />
            </div>
          </div>

        </div>

      </div>

      <CustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSuccess={(newCust) => {
          setCustomers([newCust, ...customers]);
          setSelectedCustomerId(newCust.id);
          applyBilling(billingFromCustomer(newCust));
        }}
      />

    </div>,
    document.body
  );
}
