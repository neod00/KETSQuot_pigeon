import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { getIsoQuoteDraft, updateIsoQuoteDraft } from '@/lib/isoQuoteDrafts';
import type { IsoQuoteDraftStatus, IsoQuoteInput } from '@/lib/isoTypes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const allowedStatuses = new Set<IsoQuoteDraftStatus>(['draft', 'review_requested', 'approved']);

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!getIsoRequestSession(request)) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  const { id } = await context.params;
  const draft = await getIsoQuoteDraft(id);
  if (!draft) return NextResponse.json({ error: '견적 초안을 찾을 수 없습니다.' }, { status: 404 });
  return NextResponse.json({ draft });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!getIsoRequestSession(request)) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  const { id } = await context.params;
  const body = await request.json().catch(() => ({})) as { quoteInput?: IsoQuoteInput; status?: IsoQuoteDraftStatus };
  if (!body.quoteInput || !body.status || !allowedStatuses.has(body.status)) {
    return NextResponse.json({ error: '저장할 견적 데이터와 상태를 확인해주세요.' }, { status: 400 });
  }
  const draft = await updateIsoQuoteDraft(id, body.quoteInput, body.status);
  if (!draft) return NextResponse.json({ error: '견적 초안을 찾을 수 없습니다.' }, { status: 404 });
  return NextResponse.json({ draft });
}
