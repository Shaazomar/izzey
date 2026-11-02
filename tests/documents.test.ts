// Run with: DB_URL=postgresql://... npm test   (needs a migrated, disposable database)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);
import type { AddressInfo } from 'node:net';
import prisma from '../lib/prisma';
import {
  generateDocument,
  regenerateDocument,
  readDocumentFile,
  deleteDocument,
  listDocuments,
  getDocument,
  DocumentError,
} from '../lib/documents/document-service';
import { verifyPDF } from '../lib/documents/pdf-verifier';

// ---- Minimal Supabase Storage mock (bucket + object endpoints) ----
const objects = new Map<string, Buffer>();
const buckets = new Map<string, any>();
const faults = { upload: 0, download: 0, remove: 0 };
let server: http.Server;
const KEY = 'service-role-test-key';

function startMock(): Promise<string> {
  server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const url = new URL(req.url || '', 'http://x');
      const send = (code: number, json?: any, raw?: Buffer) => {
        res.statusCode = code;
        if (raw) return res.end(raw);
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(json ?? {}));
      };
      if (req.headers.authorization !== `Bearer ${KEY}` || req.headers.apikey !== KEY) return send(401, { message: 'bad key' });

      let m = url.pathname.match(/^\/storage\/v1\/bucket\/([^/]+)$/);
      if (m && req.method === 'GET') return buckets.has(m[1]) ? send(200, buckets.get(m[1])) : send(404, { message: 'Bucket not found' });
      if (url.pathname === '/storage/v1/bucket' && req.method === 'POST') {
        const b = JSON.parse(body.toString());
        buckets.set(b.id, b);
        return send(200, { name: b.name });
      }
      m = url.pathname.match(/^\/storage\/v1\/object\/([^/]+)\/(.+)$/);
      if (m) {
        const key = `${m[1]}/${decodeURIComponent(m[2])}`;
        if (req.method === 'POST') {
          if (faults.upload > 0) { faults.upload--; return send(500, { message: 'storage exploded' }); }
          if (objects.has(key)) return send(409, { message: 'exists' });
          objects.set(key, body);
          return send(200, { Key: key });
        }
        if (req.method === 'GET') {
          if (faults.download > 0) { faults.download--; return send(503, { message: 'down' }); }
          return objects.has(key) ? send(200, undefined, objects.get(key)) : send(404, { message: 'Object not found' });
        }
      }
      m = url.pathname.match(/^\/storage\/v1\/object\/([^/]+)$/);
      if (m && req.method === 'DELETE') {
        if (faults.remove > 0) { faults.remove--; return send(500, { message: 'cannot delete' }); }
        for (const p of JSON.parse(body.toString()).prefixes) objects.delete(`${m[1]}/${p}`);
        return send(200, []);
      }
      send(404, { message: 'no route' });
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`)));
}

const uniq = Date.now().toString(36);
const input = (over: any = {}) => ({
  wohnungsgeber: { name: 'Izz & Hameed', street: 'Moabit 58', zip: '10555', city: 'Berlin' },
  owner: { name: 'Max Eigentümer' },
  moveInDate: '2026-11-01',
  property: { street: 'Warschauer Str. 46', additionalInfo: 'Hinterhaus', zip: '10234', city: 'Berlin' },
  persons: [{ lastName: `Test${uniq}`, firstName: 'Anna' }],
  issueDate: '2026-11-02',
  issuePlace: 'Berlin',
  ...over,
});
const actor = { id: `user-${uniq}`, name: 'Test User' };
let mockUrl = '';
const legacyDir = path.join(process.cwd(), 'storage', 'documents');
const listLegacy = () => (fs.existsSync(legacyDir) ? fs.readdirSync(legacyDir).sort() : []);

before(async () => {
  mockUrl = await startMock();
});

after(async () => {
  await prisma.generatedDocument.deleteMany({ where: { OR: [{ createdById: actor.id }, { createdById: null, customerName: { contains: uniq } }] } });
  await prisma.$disconnect();
  server.close();
});

test('production without storage credentials fails clearly and creates no record', async () => {
  delete process.env.SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  (process.env as any).NODE_ENV = 'production';
  const before = await prisma.generatedDocument.count();
  await assert.rejects(() => generateDocument(input(), { actor }), (e: any) => e instanceof DocumentError && e.status === 503 && /not configured/i.test(e.message));
  assert.equal(await prisma.generatedDocument.count(), before);
  (process.env as any).NODE_ENV = 'test';
  process.env.SUPABASE_URL = mockUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = KEY;
});

test('happy path: PDF is uploaded to the cloud bucket, metadata saved, nothing written to the app directory', async () => {
  const legacyBefore = listLegacy();
  const { record, duplicate } = await generateDocument(input(), { actor });
  assert.equal(duplicate, false);
  assert.equal(record.status, 'COMPLETED');
  assert.ok(record.storagePath && /^wohnungsgeberbestaetigung\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.pdf$/.test(record.storagePath));
  assert.equal(record.fileUrl, `/api/documents/${record.id}/download`);
  assert.equal(record.createdById, actor.id);
  assert.equal(record.documentType, 'WOHNUNGSGEBERBESTAETIGUNG');
  assert.ok(record.completedAt);

  // bucket was created private, with the PDF object inside
  assert.equal(buckets.get('documents').public, false);
  const stored = objects.get(`documents/${record.storagePath}`);
  assert.ok(stored, 'object exists in the bucket');
  assert.equal(stored!.length, record.fileSize);
  assert.equal(stored!.subarray(0, 5).toString(), '%PDF-');
  assert.equal((await verifyPDF(new Uint8Array(stored!), 1)).isValid, true);

  // no files created inside the application directory
  assert.deepEqual(listLegacy(), legacyBefore);
});

test('document stays accessible after a server restart (fresh process, nothing in memory)', async () => {
  const { record } = await generateDocument(input({ persons: [{ lastName: `Restart${uniq}`, firstName: 'Bob' }] }), { actor });
  const { stdout } = await execFileAsync('npx', ['tsx', '--tsconfig', 'tests/tsconfig.json', 'tests/helpers/read-doc.ts'], {
    env: { ...process.env, DOC_ID: record.id, SUPABASE_URL: mockUrl, SUPABASE_SERVICE_ROLE_KEY: KEY },
    encoding: 'utf8',
  });
  const out = stdout.trim().split('\n').pop()!;
  const parsed = JSON.parse(out);
  assert.equal(parsed.head, '%PDF-');
  assert.equal(parsed.n, record.fileSize);
  assert.match(parsed.name, /^Wohnungsgeberbestaetigung_Restart/);
});

test('validation errors are meaningful and create no record', async () => {
  const before = await prisma.generatedDocument.count();
  await assert.rejects(() => generateDocument(input({ persons: [] }), { actor }), (e: any) => e.status === 400 && /at least one person/i.test(e.message));
  await assert.rejects(() => generateDocument(input({ property: { street: '', zip: '1', city: 'B' } }), { actor }), (e: any) => e.status === 400 && /street/i.test(e.message));
  await assert.rejects(() => generateDocument('garbage', { actor }), (e: any) => e.status === 400);
  assert.equal(await prisma.generatedDocument.count(), before);
});

test('cloud upload failure marks the record FAILED and never COMPLETED', async () => {
  faults.upload = 1;
  const objectsBefore = objects.size;
  await assert.rejects(
    () => generateDocument(input({ persons: [{ lastName: `UpFail${uniq}`, firstName: 'C' }] }), { actor }),
    (e: any) => e instanceof DocumentError && e.status === 502 && /uploaded to cloud storage/i.test(e.message) && !!e.documentId
  );
  const failed = await prisma.generatedDocument.findFirstOrThrow({ where: { customerName: { contains: `UpFail${uniq}` } } });
  assert.equal(failed.status, 'FAILED');
  assert.equal(failed.storagePath, null);
  assert.equal(failed.completedAt, null);
  assert.match(failed.errorMessage || '', /storage exploded/);
  assert.equal(objects.size, objectsBefore);
  await assert.rejects(() => readDocumentFile(failed.id), (e: any) => e.status === 409);
});

test('database failure after upload removes the uploaded file and never reports COMPLETED', async () => {
  const original = prisma.generatedDocument.update.bind(prisma.generatedDocument);
  let calls = 0;
  (prisma.generatedDocument as any).update = (args: any) => {
    calls++;
    if (calls === 1 && args.data.status === 'COMPLETED') return Promise.reject(new Error('db down'));
    return original(args);
  };
  const objectsBefore = objects.size;
  try {
    await assert.rejects(
      () => generateDocument(input({ persons: [{ lastName: `DbFail${uniq}`, firstName: 'D' }] }), { actor }),
      (e: any) => e instanceof DocumentError && /could not be saved to the database/i.test(e.message)
    );
  } finally {
    (prisma.generatedDocument as any).update = original;
  }
  const rec = await prisma.generatedDocument.findFirstOrThrow({ where: { customerName: { contains: `DbFail${uniq}` } } });
  assert.equal(rec.status, 'FAILED');
  assert.equal(rec.storagePath, null);
  assert.equal(objects.size, objectsBefore, 'orphaned upload was cleaned up');
});

test('duplicate protection: same requestId, identical double submit; regenerate creates a linked new record', async () => {
  const data = input({ persons: [{ lastName: `Dup${uniq}`, firstName: 'E' }] });
  const a = await generateDocument(data, { actor, requestId: `req-${uniq}` });
  const b = await generateDocument(data, { actor, requestId: `req-${uniq}` });
  assert.equal(b.duplicate, true);
  assert.equal(b.record.id, a.record.id);

  const c = await generateDocument(data, { actor }); // identical content, new request id, within seconds
  assert.equal(c.duplicate, true);
  assert.equal(c.record.id, a.record.id);

  // concurrent identical submits with the same key collapse to one record
  const key = `race-${uniq}`;
  const race = await Promise.all([1, 2, 3].map(() => generateDocument(input({ persons: [{ lastName: `Race${uniq}`, firstName: 'F' }] }), { actor, requestId: key })));
  assert.equal(new Set(race.map((r) => r.record.id)).size, 1);
  assert.equal(await prisma.generatedDocument.count({ where: { customerName: { contains: `Race${uniq}` } } }), 1);

  const regen = await regenerateDocument(a.record.id, actor);
  assert.notEqual(regen.record.id, a.record.id);
  assert.equal(regen.record.regeneratedFromId, a.record.id);
  assert.equal(regen.record.status, 'COMPLETED');
  assert.notEqual(regen.record.storagePath, a.record.storagePath);
});

test('listing: search, status filter, and failed records are visible', async () => {
  const byName = await listDocuments({ q: `dup${uniq}` });
  assert.ok(byName.length >= 2 && byName.every((r) => r.customerName?.includes(`Dup${uniq}`)));
  const failed = await listDocuments({ status: 'FAILED', q: uniq });
  assert.ok(failed.length >= 2 && failed.every((r) => r.status === 'FAILED'));
  const completed = await listDocuments({ status: 'COMPLETED', q: uniq });
  assert.ok(completed.every((r) => r.status === 'COMPLETED'));
  const none = await listDocuments({ q: 'no-such-client-xyz' });
  assert.equal(none.length, 0);
  const future = await listDocuments({ from: '2999-01-01', q: uniq });
  assert.equal(future.length, 0);
});

test('missing/unavailable stored files give clear errors; stale PROCESSING records are failed', async () => {
  const { record } = await generateDocument(input({ persons: [{ lastName: `Gone${uniq}`, firstName: 'G' }] }), { actor });
  faults.download = 1;
  await assert.rejects(() => readDocumentFile(record.id), (e: any) => e.status === 502 && /cloud storage/i.test(e.message));
  objects.delete(`documents/${record.storagePath}`);
  await assert.rejects(() => readDocumentFile(record.id), (e: any) => e.status === 404 && /regenerate/i.test(e.message));

  const stale = await prisma.generatedDocument.create({
    data: { templateId: 't', templateName: 't', documentType: 't', fileName: 'x.pdf', inputData: {}, inputHash: 'h', customerName: `Stale${uniq}`, createdById: actor.id, status: 'PROCESSING', createdAt: new Date(Date.now() - 10 * 60_000) },
  });
  assert.equal((await getDocument(stale.id))!.status, 'FAILED');
});

test('delete removes file and record; if cloud deletion fails the record is kept', async () => {
  const { record } = await generateDocument(input({ persons: [{ lastName: `Del${uniq}`, firstName: 'H' }] }), { actor });
  faults.remove = 1;
  await assert.rejects(() => deleteDocument(record.id), (e: any) => e.status === 502);
  assert.ok(await prisma.generatedDocument.findUnique({ where: { id: record.id } }), 'record kept');
  assert.ok(objects.has(`documents/${record.storagePath}`), 'file kept');

  assert.equal(await deleteDocument(record.id), true);
  assert.equal(await prisma.generatedDocument.findUnique({ where: { id: record.id } }), null);
  assert.equal(objects.has(`documents/${record.storagePath}`), false);
  assert.equal(await deleteDocument(record.id), false);
});

test('PDF integrity check rejects empty and corrupt buffers', async () => {
  assert.equal((await verifyPDF(new Uint8Array(0))).isValid, false);
  const bad = await verifyPDF(new Uint8Array([1, 2, 3, 4]));
  assert.equal(bad.isValid, false);
  assert.match(bad.error || '', /verification failed/i);
});
