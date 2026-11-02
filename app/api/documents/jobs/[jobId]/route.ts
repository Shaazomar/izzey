import { NextRequest, NextResponse } from 'next/server';
import { getDocument, toJob } from '@/lib/documents/document-service';
import { errorResponse, requireSession } from '@/lib/documents/route-helpers';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { denied } = await requireSession();
    if (denied) return denied;

    const { jobId } = await params;
    const record = await getDocument(jobId);
    if (!record) {
      return NextResponse.json({ success: false, error: 'Document job not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, job: toJob(record) });
  } catch (err) {
    return errorResponse(err, 'Failed to fetch job status.');
  }
}
