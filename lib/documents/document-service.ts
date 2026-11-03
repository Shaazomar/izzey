/**
 * Document generation workflow (stateless, serverless-safe, database-backed):
 *
 *   1 validate input -> 2 load template + fill fields -> 3 generate PDF Buffer in memory -> 4 verify PDF + size limit
 *   -> 5 insert ONE row holding metadata AND the PDF bytes (PostgreSQL BYTEA).
 *
 * Nothing touches the filesystem and no external storage is used. The single INSERT is atomic, so a failed
 * generation never leaves an incomplete record behind: either a COMPLETED document with its bytes exists, or nothing.
 */
import crypto from 'crypto';
import { Prisma, DocumentStatus } from '@prisma/client';
import prisma from '../prisma';
import { generateWohnungsgeberPDF, WohnungsgeberData } from './template-engine';
import { verifyPDF } from './pdf-verifier';
import { wohnungsgeberSchema } from './schema';

export const TEMPLATE_ID = 'wohnungsgeberbestaetigung';
export const TEMPLATE_NAME = 'Wohnungsgeberbestätigung (§ 19 BMG)';
export const DOCUMENT_TYPE = 'WOHNUNGSGEBERBESTAETIGUNG';

/** Hard upper limit for one stored PDF. Generated documents are ~10-50 KB; this guards against runaway output. */
export const MAX_PDF_BYTES = 5 * 1024 * 1024;

/** A request with identical content from the same user inside this window is treated as a double submit. */
const DUPLICATE_WINDOW_MS = 10_000;
/** A PROCESSING record older than this belongs to a worker that died (timeout/restart). */
const STALE_PROCESSING_MS = 5 * 60_000;

export class DocumentError extends Error {
  constructor(message: string, public readonly status = 500) {
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

/** Metadata columns only. `fileData` (the PDF bytes) and `inputData` are never part of list/detail responses. */
const META_SELECT = {
  id: true,
  documentNumber: true,
  templateId: true,
  templateName: true,
  documentType: true,
  fileName: true,
  mimeType: true,
  fileSize: true,
  status: true,
  errorMessage: true,
  customerName: true,
  createdById: true,
  createdByName: true,
  regeneratedFromId: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
} satisfies Prisma.GeneratedDocumentSelect;

export type DocumentRecord = Prisma.GeneratedDocumentGetPayload<{ select: typeof META_SELECT }>;

/** DOC-<year>-<6 digit counter> from a database sequence (unique across instances). */
async function nextDocumentNumber(): Promise<string> {
  const year = new Date().getUTCFullYear();
  try {
    const rows = await prisma.$queryRaw<{ n: bigint }[]>`SELECT nextval('"GeneratedDocument_number_seq"') AS n`;
    return `DOC-${year}-${String(rows[0].n).padStart(6, '0')}`;
  } catch {
    // Sequence missing (schema created with `db push`): fall back to a collision-resistant suffix.
    return `DOC-${year}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }
}

const PROGRESS: Record<DocumentStatus, number> = { PROCESSING: 55, COMPLETED: 100, FAILED: 0 };

/** Shape consumed by the Documents UI (history rows). */
export function toHistoryRecord(r: DocumentRecord) {
  return {
    id: r.id,
    documentId: r.id,
    documentNumber: r.documentNumber,
    templateId: r.templateId,
    templateName: r.templateName,
    documentType: r.documentType,
    fileName: r.fileName,
    fileSize: r.fileSize,
    status: r.status,
    errorMessage: r.errorMessage ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    completedAt: r.completedAt?.toISOString(),
    downloadUrl: downloadUrlFor(r.id),
    previewUrl: previewUrlFor(r.id),
    customerName: r.customerName ?? undefined,
    createdByName: r.createdByName ?? undefined,
    mimeType: r.mimeType,
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
    documentNumber: r.documentNumber,
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
    downloadUrl: done ? downloadUrlFor(r.id) : undefined,
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

  // Prevent duplicate records: same idempotency key, or an identical double-submit within seconds.
  if (opts.requestId) {
    const existing = await prisma.generatedDocument.findUnique({ where: { requestId: opts.requestId }, select: META_SELECT });
    if (existing) return { record: existing, duplicate: true };
  }
  if (!opts.allowDuplicate) {
    const recent = await prisma.generatedDocument.findFirst({
      where: {
        inputHash,
        createdById: actorId,
        status: 'COMPLETED',
        createdAt: { gt: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
      orderBy: { createdAt: 'desc' },
      select: META_SELECT,
    });
    if (recent) return { record: recent, duplicate: true };
  }

  // 2 + 3. Load template, populate fields, generate the PDF entirely in memory.
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateWohnungsgeberPDF(input);
  } catch (e: any) {
    console.error('PDF generation failed:', e);
    throw new DocumentError(`PDF generation failed: ${e?.message || 'unknown error'}`, 500);
  }

  // 4. Verify integrity and size before anything is stored.
  const verification = await verifyPDF(pdfBytes, 1);
  if (!verification.isValid) {
    throw new DocumentError(`PDF integrity check failed: ${verification.error || 'invalid PDF'}`, 500);
  }
  if (pdfBytes.length > MAX_PDF_BYTES) {
    throw new DocumentError(`The generated PDF is too large (${pdfBytes.length} bytes, limit ${MAX_PDF_BYTES}).`, 413);
  }

  // 5. Persist metadata + PDF bytes in ONE atomic insert. If it fails, no record exists.
  const firstPerson = input.persons[0];
  try {
    const documentNumber = await nextDocumentNumber();
    const record = await prisma.generatedDocument.create({
      data: {
        documentNumber,
        templateId: TEMPLATE_ID,
        templateName: TEMPLATE_NAME,
        documentType: DOCUMENT_TYPE,
        fileName: fileNameFor(input),
        mimeType: 'application/pdf',
        fileSize: pdfBytes.length,
        fileData: Buffer.from(pdfBytes),
        status: 'COMPLETED',
        completedAt: new Date(),
        customerName: firstPerson ? `${firstPerson.firstName} ${firstPerson.lastName}` : 'Client',
        inputData: input as unknown as Prisma.InputJsonValue,
        inputHash,
        requestId: opts.requestId || null,
        createdById: actorId,
        createdByName: opts.actor?.name ?? null,
        regeneratedFromId: opts.regeneratedFromId ?? null,
      },
      select: META_SELECT,
    });
    return { record, duplicate: false };
  } catch (e: any) {
    // A concurrent request with the same idempotency key won the race: return its record.
    if (e?.code === 'P2002' && opts.requestId) {
      const existing = await prisma.generatedDocument.findUnique({ where: { requestId: opts.requestId }, select: META_SELECT });
      if (existing) return { record: existing, duplicate: true };
    }
    console.error('Document could not be saved to the database:', e);
    throw new DocumentError('The document could not be saved to the database. Please try again.', 500);
  }
}

export async function getDocument(id: string) {
  await failStaleProcessing().catch(() => {});
  return prisma.generatedDocument.findUnique({ where: { id }, select: META_SELECT });
}

export interface ListFilters {
  q?: string;
  status?: string;
  type?: string;
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
  if (filters.type?.trim()) where.documentType = filters.type.trim();
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { documentNumber: { contains: q, mode: 'insensitive' } },
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

  // META_SELECT deliberately excludes fileData: list responses never carry PDF binary.
  return prisma.generatedDocument.findMany({
    where,
    select: META_SELECT,
    orderBy: { createdAt: 'desc' },
    take: Math.min(filters.limit ?? 200, 500),
  });
}

/** Reads the stored PDF bytes from the database for download/preview/print. */
export async function readDocumentFile(id: string): Promise<{ record: DocumentRecord; bytes: Uint8Array }> {
  const row = await prisma.generatedDocument.findUnique({ where: { id }, select: { ...META_SELECT, fileData: true } });
  if (!row) throw new DocumentError('Document not found.', 404);
  const { fileData, ...record } = row;
  if (record.status !== 'COMPLETED') {
    throw new DocumentError(
      record.status === 'FAILED' ? 'This document failed to generate and has no file.' : 'This document is still being generated.',
      409
    );
  }
  if (!fileData || fileData.length === 0) {
    throw new DocumentError('The stored file is missing. Please regenerate the document.', 404);
  }
  return { record, bytes: new Uint8Array(fileData) };
}

export async function regenerateDocument(id: string, actor: Actor) {
  const source = await prisma.generatedDocument.findUnique({ where: { id }, select: { id: true, inputData: true } });
  if (!source) throw new DocumentError('Document not found.', 404);
  if (!source.inputData || Object.keys(source.inputData as object).length === 0) {
    throw new DocumentError('This document has no saved input data and cannot be regenerated.', 422);
  }
  return generateDocument(source.inputData, { actor, regeneratedFromId: source.id, allowDuplicate: true });
}

export async function deleteDocument(id: string): Promise<boolean> {
  const { count } = await prisma.generatedDocument.deleteMany({ where: { id } });
  return count > 0;
}
