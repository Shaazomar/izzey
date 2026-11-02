-- Idempotent: safe if the table was previously created through `prisma db push`.
DO $$
BEGIN
  CREATE TYPE "DocumentStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT,
    "fileUrl" TEXT,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "status" "DocumentStatus" NOT NULL DEFAULT 'PROCESSING',
    "errorMessage" TEXT,
    "customerName" TEXT,
    "inputData" JSONB NOT NULL,
    "inputHash" TEXT NOT NULL,
    "requestId" TEXT,
    "createdById" TEXT,
    "createdByName" TEXT,
    "regeneratedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "GeneratedDocument_storagePath_key" ON "GeneratedDocument"("storagePath");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "GeneratedDocument_requestId_key" ON "GeneratedDocument"("requestId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GeneratedDocument_createdAt_idx" ON "GeneratedDocument"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GeneratedDocument_status_idx" ON "GeneratedDocument"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GeneratedDocument_createdById_inputHash_idx" ON "GeneratedDocument"("createdById", "inputHash");

