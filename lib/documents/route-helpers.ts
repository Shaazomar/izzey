import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { DocumentError } from './document-service';

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) return { session: null as null, denied: NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 }) };
  return { session, denied: null as null };
}

export const actorFrom = (session: any) => ({ id: session?.user?.id ?? null, name: session?.user?.name ?? session?.user?.email ?? null });

export function errorResponse(err: unknown, fallback: string) {
  if (err instanceof DocumentError) {
    return NextResponse.json({ success: false, error: err.message, documentId: err.documentId }, { status: err.status });
  }
  console.error(fallback, err);
  return NextResponse.json({ success: false, error: fallback }, { status: 500 });
}

export function pdfResponse(bytes: Uint8Array, fileName: string, disposition: 'inline' | 'attachment') {
  const safe = fileName.replace(/[^\w.\-]+/g, '_');
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(bytes.length),
      'Content-Disposition': `${disposition}; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
