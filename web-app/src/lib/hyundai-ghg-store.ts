import 'server-only';
import { getStore } from '@netlify/blobs';
import type { HyundaiGhgApplication } from './hyundai-ghg';

const state = globalThis as typeof globalThis & { __hyundaiGhg?: Map<string, HyundaiGhgApplication> };
const memory = () => state.__hyundaiGhg ||= new Map();
function blobStore() {
  if (process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY_SITE_ID) return getStore({ name: 'hyundai-ghg-applications', consistency: 'strong' });
  if (process.env.NODE_ENV === 'production') throw new Error('Netlify Blobs context is required for durable application storage.');
  return null;
}

export class ApplicationConflict extends Error {}

export async function listHyundaiApplications() {
  const store = blobStore();
  if (!store) return [...memory().values()].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const records: HyundaiGhgApplication[] = [];
  for await (const page of store.list({ paginate: true })) {
    const items = await Promise.all(page.blobs.map(blob => store.get(blob.key, { type: 'json' }) as Promise<HyundaiGhgApplication | null>));
    records.push(...items.filter((item): item is HyundaiGhgApplication => Boolean(item)));
  }
  return records.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function getHyundaiApplication(reference: string) {
  const store = blobStore();
  return store ? await store.get(reference, { type: 'json' }) as HyundaiGhgApplication | null : memory().get(reference) || null;
}

export async function createHyundaiApplication(application: HyundaiGhgApplication) {
  const store = blobStore();
  if (store) {
    const result = await store.setJSON(application.reference, application, { onlyIfNew: true });
    if (!result.modified) throw new ApplicationConflict('접수번호가 중복되었습니다. 다시 제출해 주세요.');
  } else {
    if (memory().has(application.reference)) throw new ApplicationConflict('접수번호가 중복되었습니다.');
    memory().set(application.reference, application);
  }
}

export async function updateHyundaiApplication(reference: string, version: number, update: (current: HyundaiGhgApplication) => HyundaiGhgApplication) {
  const store = blobStore();
  if (store) {
    const current = await store.getWithMetadata(reference, { type: 'json' });
    if (!current) return null;
    const application = current.data as HyundaiGhgApplication;
    if (!current.etag) throw new Error('Application storage returned no ETag.');
    if (application.version !== version) throw new ApplicationConflict('다른 담당자가 수정했습니다. 새로고침 후 다시 확인해 주세요.');
    const next = update(application);
    const result = await store.setJSON(reference, next, { onlyIfMatch: current.etag });
    if (!result.modified) throw new ApplicationConflict('다른 담당자가 수정했습니다. 새로고침 후 다시 확인해 주세요.');
    return next;
  }
  const current = memory().get(reference);
  if (!current) return null;
  if (current.version !== version) throw new ApplicationConflict('다른 담당자가 수정했습니다. 새로고침 후 다시 확인해 주세요.');
  const next = update(current);
  memory().set(reference, next);
  return next;
}
