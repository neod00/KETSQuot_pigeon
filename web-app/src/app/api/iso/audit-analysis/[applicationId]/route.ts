import { NextResponse } from 'next/server';
import { analyseIsoApplication, approveIsoAuditAnalysis, getIsoAuditAnalysis, IsoAuditAnalysisError } from '@/lib/isoAuditAnalysis';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { findIsoApplication, toAuditDurationInput } from '@/lib/isoApplications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const unauthorized = () => NextResponse.json({ error: 'Login is required.' }, { status: 401 });

export async function GET(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  if (!getIsoRequestSession(request)) return unauthorized();
  const { applicationId } = await params;
  return NextResponse.json({ analysis: await getIsoAuditAnalysis(applicationId) });
}

export async function POST(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  const session = getIsoRequestSession(request);
  if (!session) return unauthorized();
  const { applicationId } = await params;
  const application = await findIsoApplication(applicationId);
  if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  try {
    const analysis = await analyseIsoApplication({ application, auditInput: toAuditDurationInput(application), username: session.username });
    return NextResponse.json({ analysis }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI application analysis failed.';
    return NextResponse.json({ error: message }, { status: error instanceof IsoAuditAnalysisError ? error.status : 502 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  if (!getIsoRequestSession(request)) return unauthorized();
  const body = await request.json().catch(() => ({})) as { status?: string };
  if (body.status !== 'approved') return NextResponse.json({ error: 'Unsupported status.' }, { status: 400 });
  const { applicationId } = await params;
  const analysis = await approveIsoAuditAnalysis(applicationId);
  if (!analysis) return NextResponse.json({ error: 'AI analysis not found.' }, { status: 404 });
  return NextResponse.json({ analysis });
}
