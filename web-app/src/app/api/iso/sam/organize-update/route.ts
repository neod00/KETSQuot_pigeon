import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import type { SamBilingualText, SamProgressStatus } from '@/lib/samTypes';

export const runtime = 'nodejs';

type TextPair = Pick<SamBilingualText, 'ko' | 'en'>;
type OrganizedUpdate = {
  status: SamProgressStatus;
  dueDate: string;
  briefing: TextPair;
  accomplishments: TextPair;
  customerMeetings: TextPair;
  pipelineChanges: TextPair;
  blockers: TextPair;
  nextActions: TextPair;
  managerSupport: TextPair;
  uncategorized: TextPair;
};

const pair = (value: unknown): TextPair => {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return { ko: String(record.ko ?? '').trim(), en: String(record.en ?? '').trim() };
};

const cleanJson = (value: string) => value
  .replace(/^```(?:json)?\s*/i, '')
  .replace(/\s*```$/, '')
  .trim();

export async function POST(request: Request) {
  const session = getIsoRequestSession(request);
  if (session?.role !== 'admin') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: '통합 메모 정리를 사용하려면 OPENAI_API_KEY가 필요합니다.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({})) as {
    memo?: unknown;
    accountName?: unknown;
    consent?: unknown;
  };
  if (body.consent !== true) {
    return NextResponse.json({ error: 'OpenAI API 전송 동의가 필요합니다.' }, { status: 400 });
  }

  const memo = String(body.memo ?? '').trim().slice(0, 12000);
  const accountName = String(body.accountName ?? '').trim().slice(0, 200);
  if (!memo) return NextResponse.json({ error: '정리할 통합 활동 메모를 입력해 주세요.' }, { status: 400 });

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_SAM_MODEL || process.env.OPENAI_TRANSLATION_MODEL || 'gpt-5.6-luna',
      input: [
        {
          role: 'system',
          content: `You organise Korean strategic-account activity notes for an LRQA manager review.
Use only facts stated in the note. Never invent people, dates, values, outcomes or commitments.
Preserve all names, acronyms, dates, currencies and numbers. Write concise Korean and professional UK business English.
Separate completed outcomes, customer meetings, pipeline changes, blockers or risks, next actions and manager support.
The briefing is a decision-oriented summary of no more than three short sentences.
Use status on-track, watch or at-risk based only on explicit evidence. Default to on-track when no risk is stated.
Set dueDate only when an unambiguous YYYY-MM-DD date can be derived; otherwise use an empty string.
Put content that cannot be classified safely in uncategorized. Empty categories must contain empty strings.
Return only one JSON object with exactly these keys:
{"status":"on-track","dueDate":"","briefing":{"ko":"","en":""},"accomplishments":{"ko":"","en":""},"customerMeetings":{"ko":"","en":""},"pipelineChanges":{"ko":"","en":""},"blockers":{"ko":"","en":""},"nextActions":{"ko":"","en":""},"managerSupport":{"ko":"","en":""},"uncategorized":{"ko":"","en":""}}`,
        },
        { role: 'user', content: JSON.stringify({ accountName, memo }) },
      ],
    }),
  });

  const payload = await response.json() as {
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    error?: { message?: string };
  };
  if (!response.ok) {
    return NextResponse.json({ error: payload.error?.message || '통합 메모를 정리하지 못했습니다.' }, { status: 502 });
  }

  const output = payload.output?.flatMap((item) => item.content || [])
    .find((item) => item.type === 'output_text')?.text || '{}';
  try {
    const parsed = JSON.parse(cleanJson(output)) as Record<string, unknown>;
    const status = ['on-track', 'watch', 'at-risk'].includes(String(parsed.status))
      ? String(parsed.status) as SamProgressStatus
      : 'on-track';
    const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(String(parsed.dueDate || '')) ? String(parsed.dueDate) : '';
    const result: OrganizedUpdate = {
      status,
      dueDate,
      briefing: pair(parsed.briefing),
      accomplishments: pair(parsed.accomplishments),
      customerMeetings: pair(parsed.customerMeetings),
      pipelineChanges: pair(parsed.pipelineChanges),
      blockers: pair(parsed.blockers),
      nextActions: pair(parsed.nextActions),
      managerSupport: pair(parsed.managerSupport),
      uncategorized: pair(parsed.uncategorized),
    };
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: '통합 메모 정리 결과를 읽지 못했습니다. 다시 시도해 주세요.' }, { status: 502 });
  }
}
