import { z } from 'zod';
import { Role, QuotationStatus, InvoiceStatus, PaymentMethod, ExpenseCategory, JobStatus } from '@prisma/client';

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

export const QuotationSchema = z.object({
  customerId: z.string().uuid(),
  propertyId: z.string().optional().nullable(),
  date: z.coerce.date().default(() => new Date()),
  validUntil: z.coerce.date(),
  status: z.nativeEnum(QuotationStatus).default(QuotationStatus.DRAFT),
  items: z.array(QuotationItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional().nullable(),
});

export const InvoiceItemSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  description: z.string().optional().nullable(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().default('Hour'),
  unitPrice: z.number().nonnegative(),
  discount: z.number().min(0).max(100).default(0),
  vatPercent: z.number().nonnegative().default(19),
});

export const InvoiceSchema = z.object({
  customerId: z.string().uuid(),
  quotationId: z.string().uuid().optional().nullable(),
  issueDate: z.coerce.date().default(() => new Date()),
  dueDate: z.coerce.date(),
  status: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.DRAFT),
  items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional().nullable(),
});

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
