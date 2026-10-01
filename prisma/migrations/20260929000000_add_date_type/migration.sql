-- Adds the Date Type feature (Single Date / Contract Period) to quotations and invoices.
-- Written idempotently so it is safe on databases that were synced with `prisma db push`.
-- Existing rows are preserved: they receive dateType = SINGLE_DATE and toDate = NULL.

DO $$
BEGIN
  CREATE TYPE "DateType" AS ENUM ('SINGLE_DATE', 'CONTRACT_PERIOD');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Quotation"
  ADD COLUMN IF NOT EXISTS "dateType" "DateType" NOT NULL DEFAULT 'SINGLE_DATE',
  ADD COLUMN IF NOT EXISTS "toDate" TIMESTAMP(3);

ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "dateType" "DateType" NOT NULL DEFAULT 'SINGLE_DATE',
  ADD COLUMN IF NOT EXISTS "toDate" TIMESTAMP(3);
