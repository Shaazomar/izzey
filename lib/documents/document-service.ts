/**
 * Document generation workflow (stateless, serverless-safe):
 *
 *   1 validate input -> 2 create DB record (PROCESSING) -> 3 load template + fill fields -> 4 generate PDF in memory
 *   -> 5 verify PDF integrity -> 6 upload bytes to cloud storage -> 7 mark COMPLETED in the DB.
 *
 * A record is COMPLETED only after BOTH the upload and the database write succeeded. Every failure marks the
 * record FAILED with a readable message and removes any object that was already uploaded.
 * All state lives in Postgres + object storage, so it survives restarts and works across serverless instances.
 */
import crypto from 'crypto';
import { Prisma, DocumentStatus } from '@prisma/client';
import prisma from '../prisma';
import { generateWohnungsgeberPDF, WohnungsgeberData } from './template-engine';
import { verifyPDF } from './pdf-verifier';
import { getDocumentStorage, StorageError } from './storage';
import { wohnungsgeberSchema } from './schema';

export const TEMPLATE_ID = 'wohnungsgeberbestaetigung';
export const TEMPLATE_NAME = 'Wohnungsgeberbestätigung (§ 19 BMG)';
export const DOCUMENT_TYPE = 'WOHNUNGSGEBERBESTAETIGUNG';

/** A request with identical content from the same user inside this window is treated as a double submit. */
const DUPLICATE_WINDOW_MS = 10_000;
/** A PROCESSING record older than this belongs to a worker that died (timeout/restart). */
const STALE_PROCESSING_MS = 5 * 60_000;

export class DocumentError extends Error {
  constructor(message: string, public readonly status = 500, public readonly documentId?: string) {
    super(message);
    this.name = 'DocumentError';
  }
}

export interface Actor {
  id?: string | null;
  name?: string | null;
}

const downloadUrlFor = (id: string) => `/api/documents/${id}/download`;
const previewUrlFor = (id: string) => `/api/documents/${id}/preview`;

/** Canonical JSON (sorted keys) so equal content always hashes equally. */
function canonicalize(value: any): any {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc: any, k) => {
        if (value[k] !== undefined) acc[k] = canonicalize(value[k]);
        return acc;
      }, {});
  }
  return value;
}

const hashInput = (data: unknown) =>
  crypto.createHash('sha256').update(JSON.stringify(canonicalize(data))).digest('hex');

function fileNameFor(data: WohnungsgeberData): string {
  const p = data.persons?.[0];
  const personName = p?.lastName ? `${p.lastName}_${p.firstName}`.replace(/[^a-zA-Z0-9]/g, '_') : 'Document';
  return `Wohnungsgeberbestaetigung_${personName}.pdf`;
}

/** Unique, collision-free object path: <template>/<yyyy>/<mm>/<uuid>.pdf */
function storagePathFor(id: string, now = new Date()): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${TEMPLATE_ID}/${yyyy}/${mm}/${id}.pdf`;
}

export type DocumentRecord = NonNullable<Awaited<ReturnType<typeof prisma.generatedDocument.findUnique>>>;

const PROGRESS: Record<DocumentStatus, number> = { PROCESSING: 55, COMPLETED: 100, FAILED: 0 };

/** Shape consumed by the Documents UI (history rows). */
export function toHistoryRecord(r: DocumentRecord) {
  return {
    id: r.id,
    documentId: r.id,
    templateId: r.templateId,
    templateName: r.templateName,
    documentType: r.documentType,
    fileName: r.fileName,
    fileSize: r.fileSize,
    status: r.status,
    errorMessage: r.errorMessage ?? undefined,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString(),
    downloadUrl: r.fileUrl || downloadUrlFor(r.id),
    previewUrl: previewUrlFor(r.id),
    customerName: r.customerName ?? undefined,
    createdByName: r.createdByName ?? undefined,
    regeneratedFromId: r.regeneratedFromId ?? undefined,
  };
}

/** Shape consumed by the live job panel. The document record IS the job, so polling survives restarts. */
export function toJob(r: DocumentRecord) {
  const done = r.status === 'COMPLETED';
  const failed = r.status === 'FAILED';
  const at = (r.completedAt || r.updatedAt).toISOString();
  const steps = [
    'Input data validated',
    'Preparing template configuration',
    'Filling document fields',
    'Generating PDF document',
    'Verifying PDF structural integrity',
    'Document finalized & saved',
  ].map((step, i) => ({ step, timestamp: at, completed: done || (!failed && i < 1) }));
  return {
    id: r.id,
    documentId: r.id,
    templateId: r.templateId,
    templateName: r.templateName,
    status: r.status,
    progress: PROGRESS[r.status],
    stepMessage: done
      ? 'Document generated, stored and verified successfully!'
      : failed
        ? `Generation failed: ${r.errorMessage || 'Unknown error'}`
        : 'Generating document...',
    steps,
    errorMessage: r.errorMessage ?? undefined,
    downloadUrl: done ? r.fileUrl || downloadUrlFor(r.id) : undefined,
    previewUrl: done ? previewUrlFor(r.id) : undefined,
    fileName: r.fileName,
    fileSize: r.fileSize,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString(),
  };
}

/** Marks records whose worker died mid-way as FAILED so the UI never spins forever. */
async function failStaleProcessing() {
  const cutoff = new Date(Date.now() - STALE_PROCESSING_MS);
  await prisma.generatedDocument.updateMany({
    where: { status: 'PROCESSING', createdAt: { lt: cutoff } },
    data: { status: 'FAILED', errorMessage: 'Generation did not finish (the server stopped or timed out). Please regenerate.' },
  });
}

export interface GenerateOptions {
  actor?: Actor;
  /** Idempotency key supplied by the client for one submit action. */
  requestId?: string | null;
  regeneratedFromId?: string | null;
  /** Skip the content-based double-submit guard (explicit "Regenerate"). */
  allowDuplicate?: boolean;
}

export async function generateDocument(rawInput: unknown, opts: GenerateOptions = {}) {
  // 1. Validate input
  const parsed = wohnungsgeberSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new DocumentError(parsed.error.errors[0]?.message || 'Validation failed', 400);
  }
  const input = parsed.data as WohnungsgeberData;
  const inputHash = hashInput(input);
  const actorId = opts.actor?.id ?? null;

  // Fail early (before creating any record) if storage is not configured.
  let storage;
  try {
    storage = getDocumentStorage();
  } catch (e: any) {
    throw new DocumentError(e?.message || 'Document storage is not configured.', 503);
  }

  // Prevent duplicate records: same idempotency key, or an identical double-submit within seconds.
  if (opts.requestId) {
    const existing = await prisma.generatedDocument.findUnique({ where: { requestId: opts.requestId } });
    if (existing) return { record: existing, duplicate: true };
  }
  if (!opts.allowDuplicate) {
    const recent = await prisma.generatedDocument.findFirst({
      where: {
        inputHash,
        createdById: actorId,
        status: { in: ['PROCESSING', 'COMPLETED'] },
        createdAt: { gt: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) return { record: recent, duplicate: true };
  }

  // 2. Create the record first so every outcome (including failure) is visible and auditable.
  const id = crypto.randomUUID();
  const firstPerson = input.persons[0];
  let record: DocumentRecord;
  try {
    record = await prisma.generatedDocument.create({
      data: {
        id,
        templateId: TEMPLATE_ID,
        templateName: TEMPLATE_NAME,
        documentType: DOCUMENT_TYPE,
        fileName: fileNameFor(input),
        status: 'PROCESSING',
        customerName: firstPerson ? `${firstPerson.firstName} ${firstPerson.lastName}` : 'Client',
        inputData: input as unknown as Prisma.InputJsonValue,
        inputHash,
        requestId: opts.requestId || null,
        createdById: actorId,
        createdByName: opts.actor?.name ?? null,
        regeneratedFromId: opts.regeneratedFromId ?? null,
      },
    });
  } catch (e: any) {
    if (e?.code === 'P2002' && opts.requestId) {
      const existing = await prisma.generatedDocument.findUnique({ where: { requestId: opts.requestId } });
      if (existing) return { record: existing, duplicate: true };
    }
    console.error('Document record could not be created:', e);
    throw new DocumentError('The document could not be saved to the database. Please try again.', 500);
  }

  const fail = async (message: string, status: number, uploadedPath?: string): Promise<never> => {
    if (uploadedPath) await storage.remove(uploadedPath).catch((err) => console.error('Orphan cleanup failed:', err));
    await prisma.generatedDocument
      .update({ where: { id }, data: { status: 'FAILED', errorMessage: message, storagePath: null, fileUrl: null } })
      .catch((err) => console.error('Could not mark document as FAILED:', err));
    throw new DocumentError(message, status, id);
  };

  // 3 + 4. Load template, populate fields, generate the PDF in memory (no filesystem).
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateWohnungsgeberPDF(input);
  } catch (e: any) {
    console.error('PDF generation failed:', e);
    return fail(`PDF generation failed: ${e?.message || 'unknown error'}`, 500);
  }

  // 5. Verify integrity before anything is stored.
  const verification = await verifyPDF(pdfBytes, 1);
  if (!verification.isValid) {
    return fail(`PDF integrity check failed: ${verification.error || 'invalid PDF'}`, 500);
  }

  // 6. Upload buffer to cloud storage.
  const storagePath = storagePathFor(id);
  try {
    await storage.upload(storagePath, pdfBytes, 'application/pdf');
  } catch (e: any) {
    console.error('Document upload failed:', e);
    const msg = e instanceof StorageError ? e.message : 'Cloud storage upload failed.';
    return fail(`The PDF could not be uploaded to cloud storage. ${msg}`, 502);
  }

  // 7. Persist metadata. COMPLETED is set only here, after the upload succeeded.
  try {
    record = await prisma.generatedDocument.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        storagePath,
        fileUrl: downloadUrlFor(id),
        fileSize: verification.fileSize,
        errorMessage: null,
        completedAt: new Date(),
      },
    });
  } catch (e: any) {
    console.error('Document metadata could not be saved:', e);
    return fail('The PDF was created but its record could not be saved to the database. Please try again.', 500, storagePath);
  }

  return { record, duplicate: false };
}

export async function getDocument(id: string) {
  await failStaleProcessing().catch(() => {});
  return prisma.generatedDocument.findUnique({ where: { id } });
}

export interface ListFilters {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export async function listDocuments(filters: ListFilters = {}) {
  await failStaleProcessing().catch(() => {});
  const where: Prisma.GeneratedDocumentWhereInput = {};
  if (filters.status && ['PROCESSING', 'COMPLETED', 'FAILED'].includes(filters.status)) {
    where.status = filters.status as DocumentStatus;
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { fileName: { contains: q, mode: 'insensitive' } },
      { customerName: { contains: q, mode: 'insensitive' } },
      { templateName: { contains: q, mode: 'insensitive' } },
      { createdByName: { contains: q, mode: 'insensitive' } },
    ];
  }
  const createdAt: Prisma.DateTimeFilter = {};
  if (filters.from && !isNaN(Date.parse(filters.from))) createdAt.gte = new Date(filters.from);
  if (filters.to && !isNaN(Date.parse(filters.to))) {
    const end = new Date(filters.to);
    end.setUTCHours(23, 59, 59, 999);
    createdAt.lte = end;
  }
  if (createdAt.gte || createdAt.lte) where.createdAt = createdAt;

  return prisma.generatedDocument.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Math.min(filters.limit ?? 200, 500),
  });
}

/** Reads the stored PDF bytes (from cloud storage) for download/preview. */
export async function readDocumentFile(id: string): Promise<{ record: DocumentRecord; bytes: Uint8Array }> {
  const record = await getDocument(id);
  if (!record) throw new DocumentError('Document not found.', 404);
  if (record.status !== 'COMPLETED' || !record.storagePath) {
    throw new DocumentError(
      record.status === 'FAILED' ? 'This document failed to generate and has no file.' : 'This document is still being generated.',
      409
    );
  }
  try {
    const bytes = await getDocumentStorage().download(record.storagePath);
    return { record, bytes };
  } catch (e: any) {
    console.error('Document download failed:', e);
    if (e instanceof StorageError && e.status === 404) throw new DocumentError('The stored file is missing. Please regenerate the document.', 404);
    throw new DocumentError('The document could not be retrieved from cloud storage. Please try again.', 502);
  }
}

export async function regenerateDocument(id: string, actor: Actor) {
  const source = await prisma.generatedDocument.findUnique({ where: { id } });
  if (!source) throw new DocumentError('Document not found.', 404);
  return generateDocument(source.inputData, { actor, regeneratedFromId: source.id, allowDuplicate: true });
}

export async function deleteDocument(id: string): Promise<boolean> {
  const record = await prisma.generatedDocument.findUnique({ where: { id } });
  if (!record) return false;
  if (record.storagePath) {
    try {
      await getDocumentStorage().remove(record.storagePath);
    } catch (e: any) {
      // Keep the record so the file is never orphaned; the user can retry.
      console.error('Document file could not be deleted:', e);
      throw new DocumentError('The stored file could not be deleted from cloud storage. Please try again.', 502);
    }
  }
  await prisma.generatedDocument.delete({ where: { id } });
  return true;
}
