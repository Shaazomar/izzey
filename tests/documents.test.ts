// Run with: DB_URL=postgresql://... npm test   (needs a migrated, disposable database)
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);
import prisma from '../lib/prisma';
import {
  generateDocument,
  regenerateDocument,
  readDocumentFile,
  deleteDocument,
  listDocuments,
  getDocument,
  toHistoryRecord,
  DocumentError,
} from '../lib/documents/document-service';
import { verifyPDF } from '../lib/documents/pdf-verifier';

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
const person = (name: string) => input({ persons: [{ lastName: `${name}${uniq}`, firstName: 'X' }] });
const legacyDir = path.join(process.cwd(), 'storage', 'documents');
const listLegacy = () => (fs.existsSync(legacyDir) ? fs.readdirSync(legacyDir).sort() : []);

after(async () => {
  await prisma.generatedDocument.deleteMany({ where: { createdById: actor.id } });
  await prisma.$disconnect();
});

test('happy path: PDF bytes are stored in the database row, metadata saved, nothing written to the app directory', async () => {
  const legacyBefore = listLegacy();
  const { record, duplicate } = await generateDocument(input(), { actor });
  assert.equal(duplicate, false);
  assert.equal(record.status, 'COMPLETED');
  assert.match(record.documentNumber, /^DOC-\d{4}-/);
  assert.equal(record.createdById, actor.id);
  assert.equal(record.documentType, 'WOHNUNGSGEBERBESTAETIGUNG');
  assert.equal(record.mimeType, 'application/pdf');
  assert.ok(record.completedAt);
  assert.ok(!('fileData' in record), 'returned record must not carry PDF binary');

  const row = await prisma.generatedDocument.findUniqueOrThrow({ where: { id: record.id } });
  assert.ok(row.fileData, 'bytes persisted in the database');
  assert.equal(row.fileData!.length, record.fileSize);
  assert.equal(Buffer.from(row.fileData!).subarray(0, 5).toString(), '%PDF-');
  assert.equal((await verifyPDF(new Uint8Array(row.fileData!), 1)).isValid, true);

  const read = await readDocumentFile(record.id);
  assert.deepEqual(Buffer.from(read.bytes), Buffer.from(row.fileData!));

  assert.deepEqual(listLegacy(), legacyBefore, 'no files created in the application directory');
});

test('document numbers are unique and sequential-looking', async () => {
  const a = await generateDocument(person('NumA'), { actor });
  const b = await generateDocument(person('NumB'), { actor });
  assert.notEqual(a.record.documentNumber, b.record.documentNumber);
});

test('list and history records never contain PDF binary', async () => {
  const { record } = await generateDocument(person('NoBin'), { actor });
  const rows = await listDocuments({ q: `nobin${uniq}` });
  assert.equal(rows.length, 1);
  assert.ok(!('fileData' in rows[0]) && !('inputData' in rows[0]));
  assert.ok(!('fileData' in (await getDocument(record.id))!));
  const json = JSON.stringify(toHistoryRecord(rows[0]));
  assert.ok(!json.includes('JVBERi'), 'no base64 PDF in the JSON');
  assert.equal(JSON.parse(json).documentNumber, record.documentNumber);
});

test('document stays accessible after a server restart (fresh process, nothing in memory)', async () => {
  const { record } = await generateDocument(person('Restart'), { actor });
  const { stdout } = await execFileAsync('npx', ['tsx', '--tsconfig', 'tests/tsconfig.json', 'tests/helpers/read-doc.ts'], {
    env: { ...process.env, DOC_ID: record.id },
    encoding: 'utf8',
    shell: true,
  });
  const parsed = JSON.parse(stdout.trim().split('\n').pop()!);
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

test('database failure during the insert leaves no record behind', async () => {
  const original = prisma.generatedDocument.create.bind(prisma.generatedDocument);
  (prisma.generatedDocument as any).create = () => Promise.reject(new Error('db down'));
  const before = await prisma.generatedDocument.count();
  try {
    await assert.rejects(
      () => generateDocument(person('DbFail'), { actor }),
      (e: any) => e instanceof DocumentError && e.status === 500 && /could not be saved to the database/i.test(e.message)
    );
  } finally {
    (prisma.generatedDocument as any).create = original;
  }
  assert.equal(await prisma.generatedDocument.count(), before);
  assert.equal(await prisma.generatedDocument.count({ where: { customerName: { contains: `DbFail${uniq}` } } }), 0);
});

test('duplicate protection: same requestId, identical double submit; regenerate creates a linked new record', async () => {
  const data = person('Dup');
  const a = await generateDocument(data, { actor, requestId: `req-${uniq}` });
  const b = await generateDocument(data, { actor, requestId: `req-${uniq}` });
  assert.equal(b.duplicate, true);
  assert.equal(b.record.id, a.record.id);

  const c = await generateDocument(data, { actor }); // identical content, new request id, within seconds
  assert.equal(c.duplicate, true);
  assert.equal(c.record.id, a.record.id);

  // concurrent identical submits with the same key collapse to one record
  const key = `race-${uniq}`;
  const race = await Promise.all([1, 2, 3].map(() => generateDocument(person('Race'), { actor, requestId: key })));
  assert.equal(new Set(race.map((r) => r.record.id)).size, 1);
  assert.equal(await prisma.generatedDocument.count({ where: { customerName: { contains: `Race${uniq}` } } }), 1);

  const regen = await regenerateDocument(a.record.id, actor);
  assert.notEqual(regen.record.id, a.record.id);
  assert.notEqual(regen.record.documentNumber, a.record.documentNumber);
  assert.equal(regen.record.regeneratedFromId, a.record.id);
  assert.equal(regen.record.status, 'COMPLETED');
  assert.equal((await readDocumentFile(regen.record.id)).bytes.length, regen.record.fileSize);
});

test('listing: search (incl. document number), status filter, type filter, dates', async () => {
  const { record } = await generateDocument(person('Find'), { actor });
  const byName = await listDocuments({ q: `find${uniq}` });
  assert.ok(byName.length === 1 && byName[0].customerName?.includes(`Find${uniq}`));
  const byNumber = await listDocuments({ q: record.documentNumber });
  assert.ok(byNumber.some((r) => r.id === record.id));
  assert.ok((await listDocuments({ type: 'WOHNUNGSGEBERBESTAETIGUNG', q: uniq })).length > 0);
  assert.equal((await listDocuments({ type: 'OTHER', q: uniq })).length, 0);
  assert.ok((await listDocuments({ status: 'COMPLETED', q: uniq })).every((r) => r.status === 'COMPLETED'));
  assert.equal((await listDocuments({ status: 'FAILED', q: uniq })).length, 0);
  assert.equal((await listDocuments({ q: 'no-such-client-xyz' })).length, 0);
  assert.equal((await listDocuments({ from: '2999-01-01', q: uniq })).length, 0);
});

test('missing file, failed and stale records give clear errors', async () => {
  const { record } = await generateDocument(person('Gone'), { actor });
  await prisma.generatedDocument.update({ where: { id: record.id }, data: { fileData: null } });
  await assert.rejects(() => readDocumentFile(record.id), (e: any) => e.status === 404 && /regenerate/i.test(e.message));
  await assert.rejects(() => readDocumentFile('00000000-0000-0000-0000-000000000000'), (e: any) => e.status === 404);

  const failed = await prisma.generatedDocument.create({
    data: { documentNumber: `T-F-${uniq}`, templateId: 't', templateName: 't', documentType: 't', fileName: 'x.pdf', inputData: {}, inputHash: 'h1', createdById: actor.id, status: 'FAILED', errorMessage: 'boom' },
  });
  await assert.rejects(() => readDocumentFile(failed.id), (e: any) => e.status === 409);
  await assert.rejects(() => regenerateDocument(failed.id, actor), (e: any) => e.status === 422);

  const stale = await prisma.generatedDocument.create({
    data: { documentNumber: `T-S-${uniq}`, templateId: 't', templateName: 't', documentType: 't', fileName: 'x.pdf', inputData: {}, inputHash: 'h2', createdById: actor.id, status: 'PROCESSING', createdAt: new Date(Date.now() - 10 * 60_000) },
  });
  assert.equal((await getDocument(stale.id))!.status, 'FAILED');
});

test('delete removes the row (and its PDF bytes); deleting twice reports not found', async () => {
  const { record } = await generateDocument(person('Del'), { actor });
  assert.equal(await deleteDocument(record.id), true);
  assert.equal(await prisma.generatedDocument.findUnique({ where: { id: record.id } }), null);
  assert.equal(await deleteDocument(record.id), false);
});

test('PDF integrity check rejects empty and corrupt buffers', async () => {
  assert.equal((await verifyPDF(new Uint8Array(0))).isValid, false);
  const bad = await verifyPDF(new Uint8Array([1, 2, 3, 4]));
  assert.equal(bad.isValid, false);
  assert.match(bad.error || '', /verification failed/i);
});
