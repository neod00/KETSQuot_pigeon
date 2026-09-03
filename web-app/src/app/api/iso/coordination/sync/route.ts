import { NextResponse } from 'next/server';
import { getIsoRequestSession, isCoordinationOwner } from '@/lib/isoAuth';
import { analyseCoordinationMessages, CoordinationAnalysisError } from '@/lib/coordinationAnalysis';
import {
  filterNewCoordinationMessages,
  getCoordinationSyncStatus,
  hasCoordinationSyncKey,
  issueCoordinationSyncKey,
  recordCoordinationSyncStatus,
  saveCoordinationItems,
  verifyCoordinationSyncKey,
} from '@/lib/coordinationRecords';
import type { CoordinationMessageInput } from '@/lib/coordinationTypes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ownerSession = (request: Request) => {
  const session = getIsoRequestSession(request);
  return isCoordinationOwner(session) ? session! : null;
};

const suppliedSyncKey = (request: Request) => request.headers.get('x-coordination-sync-key');
const noStore = { 'Cache-Control': 'private, no-store, max-age=0' };
const compact = (value: unknown, maximum: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maximum);

const messageInput = (value: unknown): CoordinationMessageInput | null => {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const id = compact(record.id, 500);
  const content = compact(record.content, 8000);
  if (!id || !content) return null;
  const webLink = compact(record.webLink, 2000);
  return {
    id,
    conversationId: compact(record.conversationId, 500) || undefined,
    subject: compact(record.subject, 1000),
    from: compact(record.from, 500),
    receivedAt: compact(record.receivedAt, 100),
    webLink: /^https:\/\/(?:outlook\.office\.com|outlook\.cloud\.microsoft)\//i.test(webLink) ? webLink : undefined,
    content,
  };
};

export async function GET(request: Request) {
  const session = ownerSession(request);
  const syncRequest = await verifyCoordinationSyncKey(suppliedSyncKey(request));
  if (!session && !syncRequest) return NextResponse.json({ error: '조정 에이전트 권한이 필요합니다.' }, { status: 403 });
  if (syncRequest && !session) return NextResponse.json({ ok: true }, { headers: noStore });
  return NextResponse.json({
    syncConfigured: await hasCoordinationSyncKey(),
    status: await getCoordinationSyncStatus(),
  }, { headers: noStore });
}

export async function POST(request: Request) {
  if (!ownerSession(request)) return NextResponse.json({ error: '개인 조정 에이전트 접근 권한이 필요합니다.' }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { action?: unknown };
  if (body.action !== 'issue-sync-key') return NextResponse.json({ error: '지원하지 않는 요청입니다.' }, { status: 400 });
  return NextResponse.json(await issueCoordinationSyncKey(), { status: 201, headers: noStore });
}

export async function PUT(request: Request) {
  const session = ownerSession(request);
  const syncRequest = await verifyCoordinationSyncKey(suppliedSyncKey(request));
  if (!session && !syncRequest) return NextResponse.json({ error: '조정 에이전트 권한이 필요합니다.' }, { status: 403 });

  const attemptedAt = new Date().toISOString();
  const body = await request.json().catch(() => ({})) as { messages?: unknown };
  const values = Array.isArray(body.messages) ? body.messages.slice(0, 40) : [];
  const messages = values.map(messageInput).filter((message): message is CoordinationMessageInput => Boolean(message));
  if (!values.length) {
    await recordCoordinationSyncStatus({
      attemptedAt,
      completedAt: new Date().toISOString(),
      messagesSeen: 0,
      itemsCreated: 0,
    });
    return NextResponse.json({ empty: true, created: 0 }, { headers: noStore });
  }
  if (!messages.length) return NextResponse.json({ error: '올바른 Outlook 메일 데이터가 없습니다.' }, { status: 400 });

  const freshMessages = await filterNewCoordinationMessages(messages);
  if (!freshMessages.length) {
    await recordCoordinationSyncStatus({
      attemptedAt,
      completedAt: new Date().toISOString(),
      messagesSeen: messages.length,
      itemsCreated: 0,
    });
    return NextResponse.json({ duplicate: true, created: 0 }, { headers: noStore });
  }

  try {
    const analyses = await analyseCoordinationMessages(freshMessages);
    const created = await saveCoordinationItems({
      messages: freshMessages,
      analyses,
      username: session?.username || 'outlook-coordination-sync',
    });
    await recordCoordinationSyncStatus({
      attemptedAt,
      completedAt: new Date().toISOString(),
      messagesSeen: messages.length,
      itemsCreated: created.length,
    });
    return NextResponse.json({ duplicate: false, created: created.length }, { status: created.length ? 201 : 200, headers: noStore });
  } catch (error) {
    const message = error instanceof Error ? error.message : '메일 분석에 실패했습니다.';
    await recordCoordinationSyncStatus({
      attemptedAt,
      messagesSeen: messages.length,
      itemsCreated: 0,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: error instanceof CoordinationAnalysisError ? error.status : 502 });
  }
}
