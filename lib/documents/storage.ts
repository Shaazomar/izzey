/**
 * Object storage for generated documents.
 *
 * Production: Supabase Storage (private bucket, service-role key, server side only).
 * Documents are NEVER written to the application directory, /public or /var/task: those are read-only
 * (and ephemeral) on serverless hosts. Bytes go from memory straight to the bucket.
 *
 * Required environment variables (production):
 *   SUPABASE_URL                  e.g. https://<project>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY     server-side secret, never exposed to the browser
 *   SUPABASE_DOCUMENTS_BUCKET     optional, defaults to "documents"
 */
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

export interface DocumentStorage {
  readonly provider: string;
  upload(objectPath: string, bytes: Uint8Array, contentType: string): Promise<void>;
  download(objectPath: string): Promise<Uint8Array>;
  remove(objectPath: string): Promise<void>;
}

export class StorageError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'StorageError';
  }
}

export class StorageNotConfiguredError extends StorageError {
  constructor(message: string) {
    super(message);
    this.name = 'StorageNotConfiguredError';
  }
}

const DEFAULT_BUCKET = 'documents';
const REQUEST_TIMEOUT_MS = 20_000;

/** Encodes each path segment but keeps "/" separators. */
const encodePath = (p: string) => p.split('/').map(encodeURIComponent).join('/');

export class SupabaseDocumentStorage implements DocumentStorage {
  readonly provider = 'supabase';
  private bucketReady = false;
  private readonly baseUrl: string;

  constructor(
    url: string,
    private readonly serviceKey: string,
    private readonly bucket: string = DEFAULT_BUCKET
  ) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  private headers(extra: Record<string, string> = {}) {
    return { Authorization: `Bearer ${this.serviceKey}`, apikey: this.serviceKey, ...extra };
  }

  private async request(input: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(input, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (e: any) {
      throw new StorageError(`Cloud storage is unreachable: ${e?.message || 'network error'}`);
    }
  }

  private async errorFrom(res: Response, action: string): Promise<StorageError> {
    let detail = '';
    try {
      const body: any = await res.json();
      detail = body?.message || body?.error || '';
    } catch {}
    return new StorageError(`Cloud storage ${action} failed (${res.status})${detail ? `: ${detail}` : ''}`, res.status);
  }

  /** Creates the private bucket on first use if it does not exist yet. */
  private async ensureBucket(): Promise<void> {
    if (this.bucketReady) return;
    const get = await this.request(`${this.baseUrl}/storage/v1/bucket/${encodeURIComponent(this.bucket)}`, {
      headers: this.headers(),
    });
    if (get.ok) {
      this.bucketReady = true;
      return;
    }
    // Supabase answers a missing bucket with 404 (older versions: 400 "Bucket not found").
    if (get.status !== 404 && get.status !== 400) throw await this.errorFrom(get, 'bucket lookup');

    const create = await this.request(`${this.baseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        id: this.bucket,
        name: this.bucket,
        public: false,
        allowed_mime_types: ['application/pdf'],
        file_size_limit: 10 * 1024 * 1024,
      }),
    });
    // 409 = created concurrently by another request.
    if (!create.ok && create.status !== 409) throw await this.errorFrom(create, 'bucket creation');
    this.bucketReady = true;
  }

  async upload(objectPath: string, bytes: Uint8Array, contentType: string): Promise<void> {
    await this.ensureBucket();
    const res = await this.request(
      `${this.baseUrl}/storage/v1/object/${encodeURIComponent(this.bucket)}/${encodePath(objectPath)}`,
      {
        method: 'POST',
        headers: this.headers({ 'Content-Type': contentType, 'x-upsert': 'false', 'cache-control': 'max-age=3600' }),
        body: Buffer.from(bytes),
      }
    );
    if (!res.ok) throw await this.errorFrom(res, 'upload');
  }

  async download(objectPath: string): Promise<Uint8Array> {
    const res = await this.request(
      `${this.baseUrl}/storage/v1/object/${encodeURIComponent(this.bucket)}/${encodePath(objectPath)}`,
      { headers: this.headers() }
    );
    if (!res.ok) throw await this.errorFrom(res, 'download');
    return new Uint8Array(await res.arrayBuffer());
  }

  async remove(objectPath: string): Promise<void> {
    const res = await this.request(`${this.baseUrl}/storage/v1/object/${encodeURIComponent(this.bucket)}`, {
      method: 'DELETE',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ prefixes: [objectPath] }),
    });
    if (!res.ok && res.status !== 404) throw await this.errorFrom(res, 'delete');
  }
}

/**
 * Development-only fallback (never used when NODE_ENV=production). Files go to the OS temp directory,
 * not the project, and are NOT persistent. Production must use Supabase.
 */
export class TempDirDocumentStorage implements DocumentStorage {
  readonly provider = 'tmp-dev';
  private readonly root = path.join(os.tmpdir(), 'izzey-documents-dev');

  private resolve(objectPath: string) {
    const full = path.resolve(this.root, objectPath);
    if (!full.startsWith(this.root + path.sep)) throw new StorageError('Invalid storage path.');
    return full;
  }

  async upload(objectPath: string, bytes: Uint8Array): Promise<void> {
    const full = this.resolve(objectPath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, bytes, { flag: 'wx' });
  }

  async download(objectPath: string): Promise<Uint8Array> {
    try {
      return new Uint8Array(await fs.readFile(this.resolve(objectPath)));
    } catch {
      throw new StorageError('Stored file not found.', 404);
    }
  }

  async remove(objectPath: string): Promise<void> {
    await fs.rm(this.resolve(objectPath), { force: true });
  }
}

let cached: DocumentStorage | null = null;
let override: DocumentStorage | null = null;

/** Test hook. */
export function setDocumentStorageForTests(storage: DocumentStorage | null) {
  override = storage;
}

export function getDocumentStorage(): DocumentStorage {
  if (override) return override;
  if (cached) return cached;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && key) {
    cached = new SupabaseDocumentStorage(url, key, process.env.SUPABASE_DOCUMENTS_BUCKET || DEFAULT_BUCKET);
    return cached;
  }

  if (process.env.NODE_ENV !== 'production') {
    cached = new TempDirDocumentStorage();
    return cached;
  }

  throw new StorageNotConfiguredError(
    'Document storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (and optionally SUPABASE_DOCUMENTS_BUCKET) in the production environment.'
  );
}
