// Single source of truth for invoice data shape, totals and document mapping.
// Pure module: safe to import from server actions, server components and client components.
import type { DocumentData } from '@/components/document/BaseTemplate';

export type InvoiceLanguage = 'de' | 'en' | 'both';
export type InvoiceDateType = 'SINGLE_DATE' | 'CONTRACT_PERIOD';

export interface CompanyDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  vatNumber: string;
  logoUrl: string;
}

export interface BillingDetails {
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  vatNumber: string;
}

export interface InvoiceItemValues {
  serviceName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  vatPercent: number;
}

export interface InvoiceFormValues {
  invoiceNumber: string;
  reference: string;
  customerId: string;
  billing: BillingDetails;
  company: CompanyDetails;
  dateType: InvoiceDateType;
  issueDate: string; // YYYY-MM-DD
  toDate: string;
  serviceDate: string; // '' = none
  dueDate: string;
  currency: string;
  language: InvoiceLanguage;
  status: string;
  paymentTerms: string;
  paymentMethod: string;
  bankDetails: string;
  footerText: string;
  notes: string;
  items: InvoiceItemValues[];
}

export const DEFAULT_COMPANY: CompanyDetails = {
  name: 'Izzey Clean & Move',
  address: 'Alt-Moabit 58\n10555 Berlin, Germany',
  phone: '+49 176 2170 9991',
  email: 'info@izzey.de',
  website: 'www.izzey.de',
  vatNumber: '1130/360/50274',
  logoUrl: '/logo.png',
};

export const DEFAULT_PAYMENT_TERMS = 'Bitte überweisen Sie den ausstehenden Betrag innerhalb von 14 Tagen auf das angegebene Bankkonto unter Angabe der Rechnungsnummer.';
export const DEFAULT_FOOTER_TEXT = 'Vielen Dank für Ihren geschätzten Auftrag und das Vertrauen in unsere Dienstleistungen. Wir freuen uns darauf, Sie zu begleiten!';
export const DEFAULT_BANK_DETAILS = 'IBAN: DE08 1005 0000 0191 3380 36\nBIC: BELADEBEXXX\nSteuernummer: 1130/360/50274';

/** Company defaults, honouring the saved system settings. */
export function resolveCompanyDefaults(settings?: { companyName?: string | null; vatNumber?: string | null; companyLogoUrl?: string | null } | null): CompanyDetails {
  return {
    ...DEFAULT_COMPANY,
    name: settings?.companyName || DEFAULT_COMPANY.name,
    vatNumber: settings?.vatNumber || DEFAULT_COMPANY.vatNumber,
    logoUrl: settings?.companyLogoUrl || DEFAULT_COMPANY.logoUrl,
  };
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface InvoiceTotals {
  lines: { gross: number; discount: number; net: number; vat: number }[];
  /** Sum of line amounts before discount. */
  subtotal: number;
  discount: number;
  /** Subtotal after discount, before VAT (what is stored as Invoice.subtotal). */
  netTotal: number;
  vat: number;
  grandTotal: number;
}

/** Cent-rounded per line, then summed, so displayed and stored totals always agree. */
export function calcInvoiceTotals(
  items: { quantity: number; unitPrice: number; discount: number; vatPercent: number }[]
): InvoiceTotals {
  const lines = items.map((it) => {
    const gross = round2((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0));
    const discount = round2(gross * ((Number(it.discount) || 0) / 100));
    const net = round2(gross - discount);
    const vat = round2(net * ((Number(it.vatPercent) || 0) / 100));
    return { gross, discount, net, vat };
  });
  const sum = (k: 'gross' | 'discount' | 'net' | 'vat') => round2(lines.reduce((a, l) => a + l[k], 0));
  const netTotal = sum('net');
  const vat = sum('vat');
  return { lines, subtotal: sum('gross'), discount: sum('discount'), netTotal, vat, grandTotal: round2(netTotal + vat) };
}

const toDay = (d: any): string => {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};

const str = (v: any) => (v == null ? '' : String(v));

/** Builds editable form values from a saved invoice (with customer + items included). */
export function invoiceToFormValues(invoice: any, companyDefaults: CompanyDetails = DEFAULT_COMPANY): InvoiceFormValues {
  const cust = invoice?.customer || {};
  const b = (invoice?.billingDetails || {}) as Partial<BillingDetails>;
  const c = (invoice?.companyDetails || {}) as Partial<CompanyDetails>;
  const customerAddress = cust.address ? `${cust.address}${cust.city ? `\n${cust.city}${cust.country ? `, ${cust.country}` : ''}` : ''}` : '';

  return {
    invoiceNumber: str(invoice?.invoiceNumber),
    reference: str(invoice?.reference),
    customerId: str(invoice?.customerId),
    billing: {
      name: b.name ?? str(cust.name),
      companyName: b.companyName ?? str(cust.companyName),
      email: b.email ?? str(cust.email),
      phone: b.phone ?? str(cust.phone),
      address: b.address ?? customerAddress,
      vatNumber: b.vatNumber ?? str(cust.vatNumber),
    },
    company: {
      name: c.name ?? companyDefaults.name,
      address: c.address ?? companyDefaults.address,
      phone: c.phone ?? companyDefaults.phone,
      email: c.email ?? companyDefaults.email,
      website: c.website ?? companyDefaults.website,
      vatNumber: c.vatNumber ?? companyDefaults.vatNumber,
      logoUrl: c.logoUrl ?? companyDefaults.logoUrl,
    },
    dateType: invoice?.dateType === 'CONTRACT_PERIOD' ? 'CONTRACT_PERIOD' : 'SINGLE_DATE',
    issueDate: toDay(invoice?.issueDate),
    toDate: toDay(invoice?.toDate) || toDay(invoice?.issueDate),
    serviceDate: toDay(invoice?.serviceDate),
    dueDate: toDay(invoice?.dueDate),
    currency: invoice?.currency || 'EUR',
    language: (['de', 'en', 'both'].includes(invoice?.language) ? invoice.language : 'both') as InvoiceLanguage,
    status: invoice?.status || 'DRAFT',
    paymentTerms: str(invoice?.paymentTerms),
    paymentMethod: str(invoice?.paymentMethod),
    bankDetails: str(invoice?.bankDetails),
    footerText: str(invoice?.footerText),
    notes: str(invoice?.notes),
    items: (invoice?.items || []).map((it: any) => ({
      serviceName: str(it.serviceName),
      description: str(it.description),
      quantity: Number(it.quantity),
      unit: str(it.unit) || 'Std.',
      unitPrice: Number(it.unitPrice),
      discount: Number(it.discount) || 0,
      vatPercent: Number(it.vatPercent),
    })),
  };
}

/** Maps form values to the printable document. Used by the live builder preview AND the saved preview/PDF. */
export function formValuesToDocumentData(v: InvoiceFormValues): DocumentData {
  const totals = calcInvoiceTotals(v.items);
  return {
    type: 'invoice',
    number: v.invoiceNumber,
    reference: v.reference || undefined,
    dateType: v.dateType,
    date: v.issueDate,
    toDate: v.dateType === 'CONTRACT_PERIOD' && v.toDate ? v.toDate : undefined,
    serviceDate: v.serviceDate || undefined,
    dueDate: v.dueDate || undefined,
    language: v.language,
    currency: v.currency,
    company: { ...v.company },
    logoUrl: v.company.logoUrl || undefined,
    customer: {
      name: v.billing.name,
      companyName: v.billing.companyName || undefined,
      propertyAddress: v.billing.address,
      email: v.billing.email,
      phone: v.billing.phone || undefined,
      vatNumber: v.billing.vatNumber || undefined,
      service: v.items[0]?.serviceName || undefined,
    },
    items: v.items.map((it, idx) => ({
      position: idx + 1,
      serviceName: it.serviceName,
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      discount: it.discount,
      vatPercent: it.vatPercent,
      total: totals.lines[idx].net,
    })),
    notes: v.notes || undefined,
    paymentTerms: v.paymentTerms || undefined,
    paymentMethod: v.paymentMethod || undefined,
    bankDetails: v.bankDetails || undefined,
    footerText: v.footerText || undefined,
    subtotal: totals.subtotal,
    discount: totals.discount,
    vat: totals.vat,
    total: totals.grandTotal,
  };
}

/** Payload sent to create/update. Totals are NOT sent: the server recomputes them with calcInvoiceTotals. */
export function formValuesToPayload(v: InvoiceFormValues) {
  return {
    invoiceNumber: v.invoiceNumber.trim(),
    reference: v.reference.trim() || null,
    customerId: v.customerId,
    billingDetails: v.billing,
    companyDetails: v.company,
    dateType: v.dateType,
    issueDate: v.issueDate,
    toDate: v.dateType === 'CONTRACT_PERIOD' ? v.toDate : null,
    serviceDate: v.serviceDate || null,
    dueDate: v.dueDate,
    currency: v.currency,
    language: v.language,
    status: v.status,
    paymentTerms: v.paymentTerms || null,
    paymentMethod: v.paymentMethod || null,
    bankDetails: v.bankDetails || null,
    footerText: v.footerText || null,
    notes: v.notes || null,
    items: v.items.map((it) => ({
      serviceName: it.serviceName,
      description: it.description,
      quantity: Number(it.quantity),
      unit: it.unit || 'Std.',
      unitPrice: Number(it.unitPrice),
      discount: Number(it.discount) || 0,
      vatPercent: Number(it.vatPercent),
    })),
  };
}
