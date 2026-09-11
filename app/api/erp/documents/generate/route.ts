import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createDocumentJob } from '@/lib/documents/job-manager';
import { z } from 'zod';

const generateSchema = z.object({
  wohnungsgeber: z.object({
    name: z.string().min(1, 'Wohnungsgeber name is required'),
    street: z.string().min(1, 'Wohnungsgeber street is required'),
    zip: z.string().min(1, 'Wohnungsgeber PLZ is required'),
    city: z.string().min(1, 'Wohnungsgeber city is required'),
  }),
  owner: z.object({
    name: z.string().optional(),
  }).optional(),
  moveInDate: z.string().min(1, 'Einzugsdatum is required'),
  property: z.object({
    street: z.string().min(1, 'Wohnung street is required'),
    additionalInfo: z.string().optional(),
    zip: z.string().min(1, 'Wohnung PLZ is required'),
    city: z.string().min(1, 'Wohnung city is required'),
  }),
  persons: z.array(
    z.object({
      lastName: z.string().min(1, 'Familienname is required'),
      firstName: z.string().min(1, 'Vorname is required'),
    })
  ).min(1, 'At least one person must be entered'),
  issueDate: z.string().min(1, 'Datum is required'),
  issuePlace: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await req.json();
    const result = generateSchema.safeParse(body);
    
    if (!result.success) {
      const firstError = result.error.errors[0]?.message || 'Validation failed';
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const validatedData = result.data;

    // Create document generation job
    const job = createDocumentJob('wohnungsgeberbestaetigung', validatedData);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      documentId: job.documentId,
      status: job.status,
      message: job.stepMessage,
    });

  } catch (err: any) {
    console.error('Error in PDF generation route:', err);
    return NextResponse.json({ success: false, error: 'Failed to queue document job.' }, { status: 500 });
  }
}
