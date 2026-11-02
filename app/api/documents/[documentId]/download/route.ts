import { NextRequest } from 'next/server';
import { readDocumentFile } from '@/lib/documents/document-service';
import { errorResponse, pdfResponse, requireSession } from '@/lib/documents/route-helpers';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { denied } = await requireSession();
    if (denied) return denied;

    const { documentId } = await params;
    const { record, bytes } = await readDocumentFile(documentId);
    return pdfResponse(bytes, record.fileName, 'attachment');
  } catch (err) {
    return errorResponse(err, 'Failed to download document.');
  }
}
