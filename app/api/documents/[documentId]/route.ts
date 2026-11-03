import { NextRequest, NextResponse } from 'next/server';
import { DocumentError, deleteDocument, getDocument, toHistoryRecord } from '@/lib/documents/document-service';
import { DOCUMENT_DELETE_ROLES, errorResponse, requireSession } from '@/lib/documents/route-helpers';

export const runtime = 'nodejs';

/** Document details (metadata only, never the PDF bytes). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { denied } = await requireSession();
    if (denied) return denied;

    const { documentId } = await params;
    const record = await getDocument(documentId);
    if (!record) throw new DocumentError('Document not found.', 404);
    return NextResponse.json({ success: true, document: toHistoryRecord(record) });
  } catch (err) {
    return errorResponse(err, 'Failed to load document details.');
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { denied } = await requireSession(DOCUMENT_DELETE_ROLES);
    if (denied) return denied;

    const { documentId } = await params;
    const deleted = await deleteDocument(documentId);
    if (!deleted) throw new DocumentError('Document not found or already deleted.', 404);
    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    return errorResponse(err, 'Failed to delete document.');
  }
}
