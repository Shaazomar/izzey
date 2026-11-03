-- Generated PDFs now live in the database (BYTEA) instead of external object storage.

-- Sequence used for human-readable document numbers (DOC-<year>-<6 digit counter>).
CREATE SEQUENCE IF NOT EXISTS "GeneratedDocument_number_seq";

ALTER TABLE "GeneratedDocument" ADD COLUMN IF NOT EXISTS "documentNumber" TEXT;
ALTER TABLE "GeneratedDocument" ADD COLUMN IF NOT EXISTS "fileData" BYTEA;

-- Backfill numbers for existing rows in creation order.
UPDATE "GeneratedDocument"
SET "documentNumber" = 'DOC-' || to_char("createdAt", 'YYYY') || '-' || lpad(nextval('"GeneratedDocument_number_seq"')::text, 6, '0')
WHERE "documentNumber" IS NULL;

ALTER TABLE "GeneratedDocument" ALTER COLUMN "documentNumber" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "GeneratedDocument_documentNumber_key" ON "GeneratedDocument"("documentNumber");

-- Rows whose PDF only exists in the retired external bucket cannot be served any more.
-- Mark them so the UI offers "Regenerate" (the original input data is kept) instead of broken downloads.
UPDATE "GeneratedDocument"
SET "status" = 'FAILED',
    "errorMessage" = 'The file was stored in the retired external storage. Please regenerate this document.'
WHERE "status" = 'COMPLETED' AND "fileData" IS NULL;

DROP INDEX IF EXISTS "GeneratedDocument_storagePath_key";
ALTER TABLE "GeneratedDocument" DROP COLUMN IF EXISTS "storagePath";
ALTER TABLE "GeneratedDocument" DROP COLUMN IF EXISTS "fileUrl";
