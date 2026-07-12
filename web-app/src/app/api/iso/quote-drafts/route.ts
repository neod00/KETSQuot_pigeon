import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { createIsoQuoteDraft, listIsoQuoteDrafts } from '@/lib/isoQuoteDrafts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!getIsoRequestSession(request)) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  const applicationId = new URL(request.url).searchParams.get('applicationId') || undefined;
  return NextResponse.json({ drafts: await listIsoQuoteDrafts(applicationId) });
}

export async function POST(request: Request) {
  const session = getIsoRequestSession(request);
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { applicationId?: string };
  if (!body.applicationId) return NextResponse.json({ error: '신청서 ID가 필요합니다.' }, { status: 400 });
  const draft = await createIsoQuoteDraft(body.applicationId, session.username);
  if (!draft) return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 });
  return NextResponse.json({ draft }, { status: 201 });
}
