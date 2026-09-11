import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getDocumentJob } from '@/lib/documents/job-manager';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const { jobId } = await params;
    const job = getDocumentJob(jobId);

    if (!job) {
      return NextResponse.json({ success: false, error: 'Document job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (err: any) {
    console.error('Error fetching job status:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch job status.' }, { status: 500 });
  }
}
