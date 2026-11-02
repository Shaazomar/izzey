import { NextRequest, NextResponse } from 'next/server';
import { regenerateDocument, toJob } from '@/lib/documents/document-service';
import { actorFrom, errorResponse, requireSession } from '@/lib/documents/route-helpers';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { session, denied } = await requireSession();
    if (denied) return denied;

    const { documentId } = await params;
    const { record } = await regenerateDocument(documentId, actorFrom(session));
    const job = toJob(record);
    return NextResponse.json({ success: true, jobId: record.id, documentId: record.id, status: record.status, message: job.stepMessage, job });
  } catch (err) {
    return errorResponse(err, 'Failed to regenerate the document.');
  }
}
