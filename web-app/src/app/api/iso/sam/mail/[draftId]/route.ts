import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { addSamProgressUpdate, findSamMailDraft, setSamMailDraftStatus } from '@/lib/samRecords';
import type { SamMailDraft, SamProgressUpdate } from '@/lib/samTypes';

export const runtime = 'nodejs';

const updateFromDraft = (draft: SamMailDraft): Partial<SamProgressUpdate> => ({
  date: draft.createdAt.slice(0, 10),
  status: draft.analysis.status,
  sourceMemo: `Outlook AI 초안 · ${draft.messageRefs.length}건\n${draft.messageRefs.map((message) => `- ${message.receivedAt || '-'} | ${message.from || '-'} | ${message.subject || '(제목 없음)'}`).join('\n')}`,
  briefing: draft.analysis.briefing,
  accomplishments: draft.analysis.accomplishments,
  customerMeetings: draft.analysis.customerMeetings,
  pipelineChanges: draft.analysis.pipelineChanges,
  blockers: draft.analysis.blockers,
  nextActions: draft.analysis.nextActions,
  owner: '',
  dueDate: draft.analysis.dueDate,
  managerSupport: draft.analysis.managerSupport,
  uncategorized: draft.analysis.uncategorized,
});

export async function PATCH(request: Request, context: { params: Promise<{ draftId: string }> }) {
  const session = getIsoRequestSession(request);
  if (session?.role !== 'admin') return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });

  const body = await request.json().catch(() => ({})) as {
    accountId?: unknown;
    action?: unknown;
    update?: Partial<SamProgressUpdate>;
  };
  const accountId = String(body.accountId ?? '').trim();
  const draftId = (await context.params).draftId;
  if (!accountId) return NextResponse.json({ error: 'Account 정보가 필요합니다.' }, { status: 400 });

  if (body.action === 'discard') {
    const draft = await setSamMailDraftStatus({ accountId, draftId, status: 'discarded' });
    return draft ? NextResponse.json({ draft }) : NextResponse.json({ error: '초안을 찾을 수 없습니다.' }, { status: 404 });
  }

  if (body.action !== 'approve') return NextResponse.json({ error: '지원하지 않는 요청입니다.' }, { status: 400 });
  const draft = await findSamMailDraft(accountId, draftId);
  if (!draft) return NextResponse.json({ error: '초안을 찾을 수 없습니다.' }, { status: 404 });
  if (draft.status !== 'pending') return NextResponse.json({ error: '이미 처리된 초안입니다.' }, { status: 409 });
  const update = await addSamProgressUpdate(accountId, body.update || updateFromDraft(draft), session.username);
  if (!update) return NextResponse.json({ error: '진행현황을 저장하지 못했습니다.' }, { status: 404 });
  const savedDraft = await setSamMailDraftStatus({ accountId, draftId, status: 'approved', updateId: update.id });
  return NextResponse.json({ draft: savedDraft, update }, { status: 201 });
}
