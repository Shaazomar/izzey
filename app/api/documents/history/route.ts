import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getDocumentHistory, deleteDocumentRecord } from '@/lib/documents/job-manager';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const history = getDocumentHistory();

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (err: any) {
    console.error('Error fetching document history:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch document history.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ success: false, error: 'documentId parameter is required' }, { status: 400 });
    }

    const deleted = deleteDocumentRecord(documentId);

    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Document deleted successfully' : 'Document not found or already deleted',
    });
  } catch (err: any) {
    console.error('Error deleting document:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete document.' }, { status: 500 });
  }
}
