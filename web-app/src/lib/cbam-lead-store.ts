import { getStore } from '@netlify/blobs';
import { mergeLead, type NavigatorLead, type NavigatorLeadInput } from './cbam-lead';
const globalStore = globalThis as typeof globalThis & { __navigatorLeads?: Map<string, NavigatorLead> };
const memory = () => globalStore.__navigatorLeads ||= new Map();
const remote = () => Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY_SITE_ID);
export async function mutateLead(reference: string, transform: (value: NavigatorLead | null) => NavigatorLead | null) {
  if (!remote()) { const next = transform(memory().get(reference) || null); if (next) memory().set(reference, next); return next; }
  const store = getStore({ name: 'cbam-navigator-leads', consistency: 'strong' });
  for (let i = 0; i < 8; i++) {
    const old = await store.getWithMetadata(reference, { type: 'json' });
    const next = transform(old?.data as NavigatorLead || null); if (!next) return null;
    const result = await store.setJSON(reference, next, old?.etag ? { onlyIfMatch: old.etag } : { onlyIfNew: true });
    if (result.modified) return next;
  }
  throw new Error('Lead update contention');
}
export async function upsertLead(input: NavigatorLeadInput, reference: string) { return (await mutateLead(reference, old => mergeLead(old, input, reference)))!; }
export async function listLeads() {
  if (!remote()) return [...memory().values()].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
  const store = getStore({ name:'cbam-navigator-leads', consistency:'strong' });
  const blobs = []; for await (const page of store.list({ paginate: true })) blobs.push(...page.blobs);
  const values = await Promise.all(blobs.map(blob => store.get(blob.key, { type:'json' }) as Promise<NavigatorLead | null>));
  return values.filter((x): x is NavigatorLead => Boolean(x)).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function linkLeadApplication(sessionId: string, email: string, applicationReference: string) {
  const matching = (await listLeads()).filter(x => x.navigatorData.sessionId === sessionId && x.email.toLowerCase() === email.trim().toLowerCase());
  for (const lead of matching) await mutateLead(lead.reference, old => old ? { ...old, applicationReference, status:'정식 신청', updatedAt:new Date().toISOString() } : null);
}
