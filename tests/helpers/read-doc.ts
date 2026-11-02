// Runs in a separate process to prove stored documents do not depend on in-memory server state.
import prisma from '../../lib/prisma';
import { readDocumentFile } from '../../lib/documents/document-service';

(async () => {
  try {
    const r = await readDocumentFile(process.env.DOC_ID as string);
    process.stdout.write(JSON.stringify({ n: r.bytes.length, head: Buffer.from(r.bytes.slice(0, 5)).toString(), name: r.record.fileName }) + '\n');
  } catch (e: any) {
    process.stdout.write('ERR ' + e.message + '\n');
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
