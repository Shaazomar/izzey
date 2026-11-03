import { NextRequest, NextResponse } from 'next/server';
import { deleteDocument, listDocuments, toHistoryRecord } from '@/lib/documents/document-service';
import { DOCUMENT_DELETE_ROLES, errorResponse, requireSession } from '@/lib/documents/route-helpers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { denied } = await requireSession();
    if (denied) return denied;

    const sp = new URL(req.url).searchParams;
    const records = await listDocuments({
      q: sp.get('q') || undefined,
      status: sp.get('status') || undefined,
      type: sp.get('type') || undefined,
      from: sp.get('from') || undefined,
      to: sp.get('to') || undefined,
    });

    return NextResponse.json({ success: true, history: records.map(toHistoryRecord) });
  } catch (err) {
    return errorResponse(err, 'Failed to fetch document history.');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { denied } = await requireSession(DOCUMENT_DELETE_ROLES);
    if (denied) return denied;

    const documentId = new URL(req.url).searchParams.get('documentId');
    if (!documentId) {
      return NextResponse.json({ success: false, error: 'documentId parameter is required' }, { status: 400 });
    }

    const deleted = await deleteDocument(documentId);
    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Document deleted successfully' : 'Document not found or already deleted',
    });
  } catch (err) {
    return errorResponse(err, 'Failed to delete document.');
  }
}
