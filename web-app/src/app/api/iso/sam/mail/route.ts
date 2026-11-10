import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { getSamOutlookSession } from '@/lib/samOutlookAuth';
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
import { parseSamMailInput, SamMailInputError } from '@/lib/samMailUpload';

export const runtime = 'nodejs';

const clientSession = (request: Request) => getIsoRequestSession(request)?.role === 'admin'
  ? getIsoRequestSession(request)!
  : null;

const syncKey = (request: Request) => request.headers.get('x-sam-sync-key');

export async function GET(request: Request) {
  const session = clientSession(request);
  const outlookSession = getSamOutlookSession(request);
  if (outlookSession && !session) {
    const accountId = new URL(request.url).searchParams.get('accountId');
    if (!accountId) return NextResponse.json({ error: 'Account를 선택해 주세요.' }, { status: 400 });
    return NextResponse.json({ drafts: await listSamMailDrafts(accountId) }, { headers: { 'Cache-Control': 'no-store' } });
  }
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
  const session = clientSession(request) || getSamOutlookSession(request);
  if (!session && !isSyncRequest) return NextResponse.json({ error: '권한이 필요합니다.' }, { status: 403 });

  let input: ReturnType<typeof parseSamMailInput>;
  try {
    input = parseSamMailInput(await request.json().catch(() => null));
  } catch (error) {
    const message = error instanceof Error ? error.message : '메일 요청 형식이 올바르지 않습니다.';
    return NextResponse.json({ error: message }, { status: error instanceof SamMailInputError ? error.status : 400 });
  }
  const { accountId, source, messages, content } = input;
  if (isSyncRequest && source !== 'outlook-web') {
    return NextResponse.json({ error: '로컬 수집기는 Outlook Web 메일 초안만 만들 수 있습니다.' }, { status: 400 });
  }
  const account = await findSamAccount(accountId);
  if (!account) return NextResponse.json({ error: 'Account를 찾을 수 없습니다.' }, { status: 404 });
  if (!await hasNewSamMailMessageRefs(messages, source === 'eml-upload' ? accountId : undefined)) {
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
