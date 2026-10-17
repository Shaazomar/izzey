import { z } from 'zod';
import { Role, QuotationStatus, InvoiceStatus, PaymentMethod, ExpenseCategory, JobStatus, DateType } from '@prisma/client';

export const CustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  companyName: z.string().optional().nullable(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  address: z.string().min(3, 'Address must be at least 3 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  country: z.string().default('Germany'),
  notes: z.string().optional().nullable(),
});

export const PropertySchema = z.object({
  customerId: z.string().uuid(),
  address: z.string().min(3, 'Address must be at least 3 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  postalCode: z.string().min(3, 'Postal code must be at least 3 characters'),
  country: z.string().default('Germany'),
  notes: z.string().optional().nullable(),
});

export const QuotationItemSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  description: z.string().optional().nullable(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().default('Hour'),
  unitPrice: z.number().nonnegative('Price must be positive or 0'),
  discount: z.number().min(0).max(100).default(0),
  vatPercent: z.number().nonnegative().default(19),
});

export const QuotationSchema = z
  .object({
    customerId: z.string().uuid(),
    propertyId: z.string().optional().nullable(),
    dateType: z.nativeEnum(DateType).default(DateType.SINGLE_DATE),
    date: z.coerce.date().default(() => new Date()),
    toDate: z.coerce.date().optional().nullable(),
    validUntil: z.coerce.date(),
    status: z.nativeEnum(QuotationStatus).default(QuotationStatus.DRAFT),
    items: z.array(QuotationItemSchema).min(1, 'At least one item is required'),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => data.dateType !== DateType.CONTRACT_PERIOD || data.toDate != null,
    { message: 'To Date is required for a contract period.', path: ['toDate'] }
  )
  .refine(
    (data) => data.dateType !== DateType.CONTRACT_PERIOD || !data.toDate || data.toDate >= data.date,
    { message: 'From Date cannot be later than To Date.', path: ['toDate'] }
  );

export const InvoiceItemSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  description: z.string().optional().nullable(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().default('Hour'),
  unitPrice: z.number().nonnegative(),
  discount: z.number().min(0).max(100).default(0),
  vatPercent: z.number().nonnegative().default(19),
});

const optText = (max: number) => z.string().max(max).optional().nullable();

export const InvoiceBillingSchema = z.object({
  name: z.string().max(200).default(''),
  companyName: z.string().max(200).default(''),
  email: z.string().max(200).default(''),
  phone: z.string().max(100).default(''),
  address: z.string().max(500).default(''),
  vatNumber: z.string().max(100).default(''),
});

export const InvoiceCompanySchema = z.object({
  name: z.string().max(200).default(''),
  address: z.string().max(500).default(''),
  phone: z.string().max(100).default(''),
  email: z.string().max(200).default(''),
  website: z.string().max(200).default(''),
  vatNumber: z.string().max(100).default(''),
  logoUrl: z.string().max(500).default(''),
});

// Fields left out (undefined) are never written on update, so partial payloads cannot erase saved values.
export const InvoiceSchema = z
  .object({
    invoiceNumber: z
      .string()
      .trim()
      .min(1, 'Invoice number is required.')
      .max(50, 'Invoice number must be 50 characters or fewer.')
      .optional(),
    reference: optText(200),
    customerId: z.string().uuid(),
    quotationId: z.string().uuid().optional().nullable(),
    dateType: z.nativeEnum(DateType).default(DateType.SINGLE_DATE),
    issueDate: z.coerce.date().default(() => new Date()),
    toDate: z.coerce.date().optional().nullable(),
    serviceDate: z.coerce.date().optional().nullable(),
    dueDate: z.coerce.date(),
    status: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.DRAFT),
    currency: z.string().trim().length(3, 'Currency must be a 3-letter code.').optional(),
    language: z.enum(['de', 'en', 'both']).optional(),
    paymentTerms: optText(2000),
    paymentMethod: optText(200),
    bankDetails: optText(2000),
    footerText: optText(2000),
    billingDetails: InvoiceBillingSchema.optional().nullable(),
    companyDetails: InvoiceCompanySchema.optional().nullable(),
    items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
    notes: z.string().optional().nullable(),
    /** Optimistic-concurrency token: updatedAt of the version the user edited. */
    expectedUpdatedAt: z.string().optional().nullable(),
  })
  .refine(
    (data) => data.dateType !== DateType.CONTRACT_PERIOD || data.toDate != null,
    { message: 'To Date is required for a contract period.', path: ['toDate'] }
  )
  .refine(
    (data) => data.dateType !== DateType.CONTRACT_PERIOD || !data.toDate || data.toDate >= data.issueDate,
    { message: 'From Date cannot be later than To Date.', path: ['toDate'] }
  );


export const PaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.coerce.date().default(() => new Date()),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.BANK_TRANSFER),
  notes: z.string().optional().nullable(),
});

export const ExpenseSchema = z.object({
  vendor: z.string().min(1, 'Vendor is required'),
  category: z.nativeEnum(ExpenseCategory),
  amount: z.number().positive('Amount must be positive'),
  date: z.coerce.date().default(() => new Date()),
  paymentMethod: z.string().default('Bank Transfer'),
  receiptUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isOfficial: z.boolean().default(true),
});

export const ManagementCostSchema = z.object({
  jobId: z.string().uuid(),
  realLabourCost: z.number().nonnegative().default(0),
  bonuses: z.number().nonnegative().default(0),
  commission: z.number().nonnegative().default(0),
  materialCost: z.number().nonnegative().default(0),
  hiddenCosts: z.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
});

export const JobSchema = z.object({
  quotationId: z.string().uuid().optional().nullable(),
  invoiceId: z.string().uuid().optional().nullable(),
  status: z.nativeEnum(JobStatus).default(JobStatus.SCHEDULED),
  startDate: z.coerce.date(),
  completionDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  employeeIds: z.array(z.string().uuid()).default([]),
});

export const UserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role).default(Role.EMPLOYEE),
});
