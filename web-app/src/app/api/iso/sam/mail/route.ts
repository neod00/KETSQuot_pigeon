import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import {
  createSamMailDraft,
  findSamAccount,
  hasNewSamMailMessageRefs,
  hasSamMailSyncKey,
  issueSamMailSyncKey,
  listSamAccounts,
  listSamMailDrafts,
  listSamMailSyncStatuses,
  recordSamMailSyncStatus,
  verifySamMailSyncKey,
} from '@/lib/samRecords';
import { organizeSamProgressUpdate, SamOrganiseError } from '@/lib/samUpdateOrganiser';
import type { SamMailMessageRef } from '@/lib/samTypes';

export const runtime = 'nodejs';

const clientSession = (request: Request) => getIsoRequestSession(request)?.role === 'admin'
  ? getIsoRequestSession(request)!
  : null;

const syncKey = (request: Request) => request.headers.get('x-sam-sync-key');

const trimRef = (value: unknown): SamMailMessageRef | null => {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const id = String(record.id ?? '').trim().slice(0, 500);
  if (!id) return null;
  return {
    id,
    conversationId: String(record.conversationId ?? '').trim().slice(0, 500) || undefined,
    subject: String(record.subject ?? '').trim().slice(0, 1000),
    from: String(record.from ?? '').trim().slice(0, 500),
    to: String(record.to ?? '').trim().slice(0, 1000),
    receivedAt: String(record.receivedAt ?? '').trim().slice(0, 100),
    webLink: String(record.webLink ?? '').trim().slice(0, 2000) || undefined,
  };
};

export async function GET(request: Request) {
  const session = clientSession(request);
  const isSyncRequest = await verifySamMailSyncKey(syncKey(request));
  if (!session && !isSyncRequest) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  if (isSyncRequest && !session) {
    const accounts = await listSamAccounts();
    return NextResponse.json({
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        terms: [
          account.name.ko,
          account.name.en,
          ...account.affiliates.flatMap((affiliate) => [affiliate.nameKo, affiliate.nameEn, ...affiliate.aliases]),
        ].filter(Boolean),
      })),
    });
  }
  const accountId = new URL(request.url).searchParams.get('accountId') || '';
  if (!accountId) {
    const [syncConfigured, statuses] = await Promise.all([hasSamMailSyncKey(), listSamMailSyncStatuses()]);
    return NextResponse.json({ syncConfigured, statuses });
  }
  const [drafts, statuses, syncConfigured] = await Promise.all([
    listSamMailDrafts(accountId),
    listSamMailSyncStatuses(),
    hasSamMailSyncKey(),
  ]);
  return NextResponse.json({
    drafts,
    syncConfigured,
    status: statuses.find((item) => item.accountId === accountId) || null,
  });
}

export async function POST(request: Request) {
  const session = clientSession(request);
  if (!session) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { action?: unknown };
  if (body.action !== 'issue-sync-key') return NextResponse.json({ error: '지원하지 않는 요청입니다.' }, { status: 400 });
  const issued = await issueSamMailSyncKey();
  return NextResponse.json(issued, { status: 201 });
}

export async function PUT(request: Request) {
  const isSyncRequest = await verifySamMailSyncKey(syncKey(request));
  const session = clientSession(request);
  if (!session && !isSyncRequest) return NextResponse.json({ error: '권한이 필요합니다.' }, { status: 403 });

  const body = await request.json().catch(() => ({})) as {
    accountId?: unknown;
    source?: unknown;
    messages?: unknown;
    content?: unknown;
  };
  const accountId = String(body.accountId ?? '').trim();
  const source = body.source === 'outlook-web' ? 'outlook-web' : 'eml-upload';
  if (isSyncRequest && source !== 'outlook-web') {
    return NextResponse.json({ error: '로컬 수집기는 Outlook Web 메일 초안만 만들 수 있습니다.' }, { status: 400 });
  }
  const messages = Array.isArray(body.messages) ? body.messages.map(trimRef).filter((item): item is SamMailMessageRef => Boolean(item)) : [];
  const content = String(body.content ?? '').trim().slice(0, 24000);
  const account = accountId ? await findSamAccount(accountId) : null;
  if (!account) return NextResponse.json({ error: 'Account를 찾을 수 없습니다.' }, { status: 404 });
  if (!messages.length || !content) return NextResponse.json({ error: '분석할 메일 내용이 없습니다.' }, { status: 400 });
  if (!await hasNewSamMailMessageRefs(messages)) {
    await recordSamMailSyncStatus({
      accountId,
      source,
      attemptedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      relatedMessages: messages.length,
      draftsCreated: 0,
    });
    return NextResponse.json({ draft: null, duplicate: true });
  }

  try {
    const analysis = await organizeSamProgressUpdate({
      accountName: account.name.ko || account.name.en,
      memo: content,
      source,
    });
    const created = await createSamMailDraft({
      accountId,
      source,
      messageRefs: messages,
      analysis,
      username: session?.username || 'outlook-sync',
    });
    await recordSamMailSyncStatus({
      accountId,
      source,
      attemptedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      relatedMessages: messages.length,
      draftsCreated: created.draft ? 1 : 0,
    });
    return NextResponse.json(created, { status: created.draft ? 201 : 200 });
  } catch (error) {
    await recordSamMailSyncStatus({
      accountId,
      source,
      attemptedAt: new Date().toISOString(),
      relatedMessages: messages.length,
      draftsCreated: 0,
      error: error instanceof Error ? error.message : '메일 분석에 실패했습니다.',
    });
    const message = error instanceof Error ? error.message : '메일 분석에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: error instanceof SamOrganiseError ? error.status : 502 });
  }
}
