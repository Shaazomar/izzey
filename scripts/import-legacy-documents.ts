/**
 * One-off import of documents created by the old filesystem-based generator
 * (storage/history.json + storage/documents/*.pdf) into the database.
 *
 *   DB_URL=... npm run documents:import-legacy -- ./storage
 *
 * Idempotent: records that already exist are skipped. The source files are left untouched.
 */
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import { verifyPDF } from '../lib/documents/pdf-verifier';

async function main() {
  const dir = path.resolve(process.argv[2] || 'storage');
  const historyFile = path.join(dir, 'history.json');
  if (!fs.existsSync(historyFile)) throw new Error(`No history.json found in ${dir}`);
  const history: any[] = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  let imported = 0;
  let skipped = 0;

  for (const h of history) {
    const id: string = h.documentId || h.id;
    const file = path.join(dir, 'documents', `${id}.pdf`);
    if (!id || !fs.existsSync(file)) {
      console.warn(`skip ${id}: PDF file missing`);
      skipped++;
      continue;
    }
    if (await prisma.generatedDocument.findUnique({ where: { id }, select: { id: true } })) {
      skipped++;
      continue;
    }
    const bytes = new Uint8Array(fs.readFileSync(file));
    const check = await verifyPDF(bytes, 1);
    if (!check.isValid) {
      console.warn(`skip ${id}: ${check.error}`);
      skipped++;
      continue;
    }
    const created = new Date(h.createdAt || Date.now());
    const [{ n }] = await prisma.$queryRaw<{ n: bigint }[]>`SELECT nextval('"GeneratedDocument_number_seq"') AS n`;
    await prisma.generatedDocument.create({
      data: {
        id,
        documentNumber: `DOC-${created.getUTCFullYear()}-${String(n).padStart(6, '0')}`,
        templateId: h.templateId || 'wohnungsgeberbestaetigung',
        templateName: h.templateName || 'Wohnungsgeberbestätigung (§ 19 BMG)',
        documentType: 'WOHNUNGSGEBERBESTAETIGUNG',
        fileName: h.fileName || `${id}.pdf`,
        fileData: Buffer.from(bytes),
        fileSize: check.fileSize,
        status: 'COMPLETED',
        customerName: h.customerName ?? null,
        inputData: {}, // original form data was never stored by the old system; such records cannot be regenerated
        inputHash: `legacy:${id}`,
        createdAt: created,
        completedAt: created,
      },
    });
    imported++;
    console.log(`imported ${id}`);
  }
  console.log(`Done. imported=${imported} skipped=${skipped}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
