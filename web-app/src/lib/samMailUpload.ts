import type { SamMailDraft, SamMailMessageRef } from './samTypes';

export const MAX_SAM_MAIL_CONTENT = 24_000;
const MAX_COLLECTOR_MESSAGES = 50;

export class SamMailInputError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = 'SamMailInputError';
  }
}

const recordValue = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SamMailInputError('메일 요청 형식이 올바르지 않습니다.');
  }
  return value as Record<string, unknown>;
};

const boundedText = (value: unknown, name: string, maxLength: number, required = false) => {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    throw new SamMailInputError(`${name}은(는) 문자열이어야 합니다.`);
  }
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length > maxLength) {
    throw new SamMailInputError(`${name}은(는) ${maxLength.toLocaleString('ko-KR')}자를 초과할 수 없습니다.`, 413);
  }
  if (required && !text) throw new SamMailInputError(`${name}이(가) 필요합니다.`);
  return text;
};

export function parseSamMailInput(value: unknown) {
  const body = recordValue(value);
  if (body.source !== 'eml-upload' && body.source !== 'outlook-web') {
    throw new SamMailInputError('지원하지 않는 메일 출처입니다.');
  }
  const source: 'eml-upload' | 'outlook-web' = body.source;
  const accountId = boundedText(body.accountId, 'Account ID', 200, true);
  if (!Array.isArray(body.messages) || !body.messages.length) {
    throw new SamMailInputError('분석할 메일 정보가 없습니다.');
  }
  if (source === 'eml-upload' && body.messages.length !== 1) {
    throw new SamMailInputError('메일 파일은 한 요청에 하나씩 분석해 주세요.');
  }
  if (body.messages.length > MAX_COLLECTOR_MESSAGES) {
    throw new SamMailInputError(`한 요청에 최대 ${MAX_COLLECTOR_MESSAGES}개의 메일을 분석할 수 있습니다.`, 413);
  }
  const messages: SamMailMessageRef[] = body.messages.map((value) => {
    const message = recordValue(value);
    return {
      id: boundedText(message.id, '메일 ID', 500, true),
      conversationId: boundedText(message.conversationId, '대화 ID', 500) || undefined,
      subject: boundedText(message.subject, '메일 제목', 1000),
      from: boundedText(message.from, '보낸 사람', 500),
      to: boundedText(message.to, '받는 사람', 1000),
      receivedAt: boundedText(message.receivedAt, '수신 시각', 100),
      webLink: boundedText(message.webLink, '메일 링크', 2000) || undefined,
    };
  });
  const content = boundedText(body.content, '분석할 메일 내용', MAX_SAM_MAIL_CONTENT, true);
  return { accountId, source, messages, content };
}

// Uploads may be relevant to several customers. The legacy collector keeps its
// global message-ID scope; uploads deduplicate against the selected account.
export function newSamMailMessageRefs(
  drafts: SamMailDraft[],
  messageRefs: SamMailMessageRef[],
  accountId?: string,
) {
  const knownIds = new Set(drafts
    .filter((draft) => accountId === undefined || draft.accountId === accountId)
    .flatMap((draft) => draft.messageRefs.map((message) => message.id)));
  return messageRefs.filter((message) => {
    if (!message.id || knownIds.has(message.id)) return false;
    knownIds.add(message.id);
    return true;
  });
}

type UpdateDrafts = (updater: (current: SamMailDraft[] | null) => SamMailDraft[]) => Promise<SamMailDraft[]>;

export async function persistUniqueSamMailDraft(draft: SamMailDraft, updateDrafts: UpdateDrafts) {
  const committed = await updateDrafts((current) => {
    const drafts = current || [];
    // Run within the storage transaction, including every optimistic-lock retry.
    const messageRefs = newSamMailMessageRefs(drafts, draft.messageRefs, draft.source === 'eml-upload' ? draft.accountId : undefined);
    return messageRefs.length ? [{ ...draft, messageRefs }, ...drafts] : drafts;
  });
  const saved = committed.find((item) => item.id === draft.id) || null;
  return { draft: saved, duplicate: !saved };
}
