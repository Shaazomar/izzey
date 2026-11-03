import { NextRequest, NextResponse } from 'next/server';
import { generateDocument, toJob } from '@/lib/documents/document-service';
import { actorFrom, errorResponse, requireSession } from '@/lib/documents/route-helpers';

export const runtime = 'nodejs';
// Generation + database insert run inside this request (nothing is left to a background worker that serverless would kill).
export const maxDuration = 60;
const MAX_BODY_BYTES = 100 * 1024;

export async function POST(req: NextRequest) {
  try {
    const { session, denied } = await requireSession();
    if (denied) return denied;

    // Upload limit: the form payload is a few hundred bytes; reject anything abusive before parsing.
    if (Number(req.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, error: 'Request body is too large.' }, { status: 413 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    const { requestId, ...input } = body || {};
    const { record, duplicate } = await generateDocument(input, {
      actor: actorFrom(session),
      requestId: typeof requestId === 'string' && requestId.length <= 100 ? requestId : null,
    });

    const job = toJob(record);
    return NextResponse.json({
      success: true,
      jobId: record.id,
      documentId: record.id,
      status: record.status,
      message: job.stepMessage,
      duplicate,
      job,
    });
  } catch (err) {
    return errorResponse(err, 'Failed to generate the document.');
  }
}
