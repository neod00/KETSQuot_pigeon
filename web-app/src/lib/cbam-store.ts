import { getStore } from '@netlify/blobs';
import type { StoredCbamApplication } from './cbam';
type ApplicationStore = { list: StoredCbamApplication[] };
const globalStore = globalThis as typeof globalThis & { __cbamApplications?: ApplicationStore };

function getMemoryStore() {
  if (!globalStore.__cbamApplications) globalStore.__cbamApplications = { list: [] };
  return globalStore.__cbamApplications;
}

function hasNetlifyBlobContext() {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY_SITE_ID);
}

export async function listApplications() {
  if (!hasNetlifyBlobContext()) return getMemoryStore().list;
  const store = getStore({ name: 'cbam-applications', consistency: 'strong' });
  const listed = await store.list();
  const records = await Promise.all(listed.blobs.map(blob => store.get(blob.key, { type: 'json' }) as Promise<StoredCbamApplication | null>));
  return records.filter((record): record is StoredCbamApplication => Boolean(record)).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function saveApplication(application: StoredCbamApplication) {
  if (!hasNetlifyBlobContext()) {
    const memory = getMemoryStore();
    memory.list = [application, ...memory.list.filter(item => item.reference !== application.reference)];
    return;
  }
  const store = getStore({ name: 'cbam-applications', consistency: 'strong' });
  await store.setJSON(application.reference, application);
}

export async function createApplicationOnce(application: StoredCbamApplication) {
  if (!hasNetlifyBlobContext()) {
    const memory = getMemoryStore();
    const existing = memory.list.find(item => item.reference === application.reference);
    if (existing) return existing;
    memory.list.unshift(application);
    return application;
  }
  const store = getStore({ name: 'cbam-applications', consistency: 'strong' });
  await store.setJSON(application.reference, application, { onlyIfNew: true });
  const saved = await store.get(application.reference, { type: 'json' }) as StoredCbamApplication | null;
  if (!saved) throw new Error('Intake persistence failed');
  return saved;
}
