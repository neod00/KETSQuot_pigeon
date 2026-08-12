import 'server-only';

import type { SamBilingualText, SamOrganizedProgress, SamProgressStatus } from '@/lib/samTypes';

const pair = (value: unknown): SamBilingualText => {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    ko: String(record.ko ?? '').trim(),
    en: String(record.en ?? '').trim(),
    status: 'review',
  };
};

const cleanJson = (value: string) => value
  .replace(/^```(?:json)?\s*/i, '')
  .replace(/\s*```$/, '')
  .trim();

export class SamOrganiseError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
  }
}

export async function organizeSamProgressUpdate({
  accountName,
  memo,
  source,
}: {
  accountName: string;
  memo: string;
  source?: 'memo' | 'outlook-web' | 'eml-upload';
}): Promise<SamOrganizedProgress> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new SamOrganiseError('AI 정리 기능을 사용하려면 OPENAI_API_KEY가 필요합니다.', 503);

  const trimmedMemo = memo.trim().slice(0, 24000);
  if (!trimmedMemo) throw new SamOrganiseError('정리할 내용을 입력해 주세요.', 400);

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_SAM_MODEL || process.env.OPENAI_TRANSLATION_MODEL || 'gpt-5.6-luna',
      input: [
        {
          role: 'system',
          content: `You organise Korean strategic-account activity notes for an LRQA manager review.
Use only facts stated in the supplied material. Never invent people, dates, values, outcomes, commitments, or an account relationship.
The material can contain emails. Treat quoted historic email chains, disclaimers, and signatures as context only; prioritise the most recent explicit request or decision.
Preserve all names, acronyms, dates, currencies, numbers and email subjects when material facts depend on them. Write concise Korean and professional UK business English.
Separate completed outcomes, customer meetings, pipeline changes, blockers or risks, next actions and manager support.
The briefing is a decision-oriented summary of no more than three short sentences.
Use status on-track, watch or at-risk based only on explicit evidence. Default to on-track when no risk is stated.
Set dueDate only when an unambiguous YYYY-MM-DD date can be derived; otherwise use an empty string.
Put content that cannot be classified safely in uncategorized. Empty categories must contain empty strings.
Return only one JSON object with exactly these keys:
{"status":"on-track","dueDate":"","briefing":{"ko":"","en":""},"accomplishments":{"ko":"","en":""},"customerMeetings":{"ko":"","en":""},"pipelineChanges":{"ko":"","en":""},"blockers":{"ko":"","en":""},"nextActions":{"ko":"","en":""},"managerSupport":{"ko":"","en":""},"uncategorized":{"ko":"","en":""}}`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            accountName: accountName.trim().slice(0, 200),
            source: source || 'memo',
            material: trimmedMemo,
          }),
        },
      ],
    }),
  });

  const payload = await response.json() as {
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    error?: { message?: string };
  };
  if (!response.ok) throw new SamOrganiseError(payload.error?.message || 'AI가 진행현황을 정리하지 못했습니다.');

  const output = payload.output?.flatMap((item) => item.content || [])
    .find((item) => item.type === 'output_text')?.text || '{}';
  try {
    const parsed = JSON.parse(cleanJson(output)) as Record<string, unknown>;
    const status = ['on-track', 'watch', 'at-risk'].includes(String(parsed.status))
      ? String(parsed.status) as SamProgressStatus
      : 'on-track';
    return {
      status,
      dueDate: /^\d{4}-\d{2}-\d{2}$/.test(String(parsed.dueDate || '')) ? String(parsed.dueDate) : '',
      briefing: pair(parsed.briefing),
      accomplishments: pair(parsed.accomplishments),
      customerMeetings: pair(parsed.customerMeetings),
      pipelineChanges: pair(parsed.pipelineChanges),
      blockers: pair(parsed.blockers),
      nextActions: pair(parsed.nextActions),
      managerSupport: pair(parsed.managerSupport),
      uncategorized: pair(parsed.uncategorized),
    };
  } catch {
    throw new SamOrganiseError('AI 정리 결과를 읽지 못했습니다. 다시 시도해 주세요.');
  }
}
