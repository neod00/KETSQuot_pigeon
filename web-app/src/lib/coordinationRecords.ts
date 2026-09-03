import 'server-only';

import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { getIsoJson, setIsoJson, updateIsoJson } from '@/lib/isoStorage';
import type {
  CoordinationAnalysis,
  CoordinationItem,
  CoordinationItemStatus,
  CoordinationMessageInput,
  CoordinationSyncStatus,
} from '@/lib/coordinationTypes';

const STORE = 'coordination-agent';
const ITEMS_KEY = 'items.json';
const SYNC_KEY = 'sync-key.json';
const SYNC_STATUS_KEY = 'sync-status.json';

interface CoordinationSyncCredential {
  secretHash: string;
  createdAt: string;
}

const hash = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
const identity = (message: CoordinationMessageInput) => message.id || [message.from, message.subject, message.receivedAt].join('|');

export async function issueCoordinationSyncKey() {
  const key = `coord_${randomBytes(32).toString('base64url')}`;
  const createdAt = new Date().toISOString();
  await setIsoJson(STORE, SYNC_KEY, { secretHash: hash(key), createdAt } satisfies CoordinationSyncCredential);
  return { key, createdAt };
}

export async function hasCoordinationSyncKey() {
  return Boolean(await getIsoJson<CoordinationSyncCredential>(STORE, SYNC_KEY));
}

export async function verifyCoordinationSyncKey(candidate?: string | null) {
  if (!candidate) return false;
  const credential = await getIsoJson<CoordinationSyncCredential>(STORE, SYNC_KEY);
  if (!credential?.secretHash) return false;
  const expected = Buffer.from(credential.secretHash, 'hex');
  const actual = Buffer.from(hash(candidate), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function listCoordinationItems() {
  return (await getIsoJson<CoordinationItem[]>(STORE, ITEMS_KEY) || [])
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function filterNewCoordinationMessages(messages: CoordinationMessageInput[]) {
  const known = new Set((await listCoordinationItems()).map((item) => item.messageIdHash));
  return messages.filter((message) => !known.has(hash(identity(message))));
}

export async function saveCoordinationItems({
  messages,
  analyses,
  username,
}: {
  messages: CoordinationMessageInput[];
  analyses: CoordinationAnalysis[];
  username: string;
}) {
  const bySource = new Map(analyses.map((analysis) => [analysis.sourceId, analysis]));
  const now = new Date().toISOString();
  const candidates = messages.flatMap((message): CoordinationItem[] => {
    const analysis = bySource.get(message.id);
    if (!analysis) return [];
    return [{
      id: randomUUID(),
      messageIdHash: hash(identity(message)),
      conversationIdHash: message.conversationId ? hash(message.conversationId) : undefined,
      subject: analysis.subject || message.subject || '(제목 없음)',
      sender: analysis.sender || message.from || '발신자 확인 필요',
      receivedAt: analysis.receivedAt || message.receivedAt,
      priority: analysis.priority,
      category: analysis.category,
      summary: analysis.summary,
      dueDate: analysis.dueDate,
      recommendedAction: analysis.recommendedAction,
      draftReply: analysis.draftReply,
      webLink: message.webLink,
      status: 'new',
      createdAt: now,
      updatedAt: now,
      createdBy: username,
    }];
  });

  let created: CoordinationItem[] = [];
  await updateIsoJson<CoordinationItem[]>(STORE, ITEMS_KEY, (current) => {
    const existing = current || [];
    const known = new Set(existing.map((item) => item.messageIdHash));
    created = candidates.filter((item) => !known.has(item.messageIdHash));
    return [...created, ...existing].slice(0, 2000);
  });
  return created;
}

export async function updateCoordinationItemStatus(id: string, status: CoordinationItemStatus) {
  let updated: CoordinationItem | null = null;
  await updateIsoJson<CoordinationItem[]>(STORE, ITEMS_KEY, (current) => (current || []).map((item) => {
    if (item.id !== id) return item;
    updated = { ...item, status, updatedAt: new Date().toISOString() };
    return updated;
  }));
  return updated;
}

export async function recordCoordinationSyncStatus(status: CoordinationSyncStatus) {
  await setIsoJson(STORE, SYNC_STATUS_KEY, status);
}

export async function getCoordinationSyncStatus() {
  return await getIsoJson<CoordinationSyncStatus>(STORE, SYNC_STATUS_KEY);
}
