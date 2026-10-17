-- Adds persisted, editable document fields to Invoice. All columns are nullable or defaulted,
-- so existing invoices, items and payments are untouched. Idempotent for databases synced via db push.
ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "reference" TEXT,
  ADD COLUMN IF NOT EXISTS "serviceDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT,
  ADD COLUMN IF NOT EXISTS "bankDetails" TEXT,
  ADD COLUMN IF NOT EXISTS "footerText" TEXT,
  ADD COLUMN IF NOT EXISTS "billingDetails" JSONB,
  ADD COLUMN IF NOT EXISTS "companyDetails" JSONB;

ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "position" INTEGER NOT NULL DEFAULT 0;
