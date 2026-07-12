import 'server-only';

import { randomUUID } from 'node:crypto';
import { findIsoApplication, toIsoQuoteInput } from './isoApplications';
import { getIsoJson, listIsoJson, setIsoJson } from './isoStorage';
import type { IsoQuoteDraft, IsoQuoteDraftStatus, IsoQuoteInput } from './isoTypes';

const STORE = 'iso-quote-drafts';
const keyFor = (id: string) => `drafts/${id}.json`;

export async function createIsoQuoteDraft(applicationId: string, username: string) {
  const application = await findIsoApplication(applicationId);
  if (!application) return null;
  const now = new Date().toISOString();
  const draft: IsoQuoteDraft = {
    id: `QD-${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`,
    applicationId,
    status: 'draft',
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: username,
    quoteInput: toIsoQuoteInput(application),
  };
  await setIsoJson(STORE, keyFor(draft.id), draft);
  return draft;
}

export const getIsoQuoteDraft = (draftId: string) => getIsoJson<IsoQuoteDraft>(STORE, keyFor(draftId));

export async function updateIsoQuoteDraft(
  draftId: string,
  quoteInput: IsoQuoteInput,
  status: IsoQuoteDraftStatus,
) {
  const current = await getIsoQuoteDraft(draftId);
  if (!current) return null;
  const next: IsoQuoteDraft = {
    ...current,
    status,
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
    quoteInput,
  };
  await setIsoJson(STORE, keyFor(draftId), next);
  return next;
}

export async function listIsoQuoteDrafts(applicationId?: string) {
  const drafts = await listIsoJson<IsoQuoteDraft>(STORE, 'drafts');
  return drafts
    .filter((draft) => !applicationId || draft.applicationId === applicationId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
