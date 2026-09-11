import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getStoredDocumentPath, getDocumentHistory } from '@/lib/documents/job-manager';
import fs from 'fs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const { documentId } = await params;
    const filePath = getStoredDocumentPath(documentId);

    if (!filePath) {
      return NextResponse.json({ success: false, error: 'Requested document file does not exist or has expired.' }, { status: 404 });
    }

    const history = getDocumentHistory();
    const record = history.find(r => r.documentId === documentId);
    const fileName = record?.fileName || `Document_${documentId}.pdf`;

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (err: any) {
    console.error('Error serving document download:', err);
    return NextResponse.json({ success: false, error: 'Failed to download document.' }, { status: 500 });
  }
}
