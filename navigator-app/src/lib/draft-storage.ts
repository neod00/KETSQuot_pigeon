import { QUESTIONS } from '@/shared/cbam-navigator';
import type { Draft } from '@/components/NavigatorContext';

export const TAB_STORAGE = 'lrqa-cbam-navigator-v1';
export const DEVICE_STORAGE = 'lrqa-cbam-navigator-device-v1';
export const DEVICE_RETENTION = 7 * 24 * 60 * 60 * 1000;
const textKeys = ['sessionId', 'startedAt', 'productName', 'cnCode', 'sector', 'productionProcesses', 'productionRoute', 'precursors', 'country', 'sites', 'euExport', 'importer', 'mass'] as const;

export function readSavedDraft(raw: string | null, now = Date.now()): { draft: Partial<Draft>; savedAt: number } | undefined {
  try {
    const stored = JSON.parse(raw || 'null');
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return;
    if ('expiresAt' in stored && (!Number.isFinite(stored.expiresAt) || stored.expiresAt <= now)) return;
    const value = stored.draft || stored;
    const draft: Partial<Draft> = {};
    for (const key of textKeys) if (typeof value[key] === 'string') draft[key] = value[key].slice(0, key === 'productionProcesses' || key === 'precursors' || key === 'productionRoute' ? 2000 : 500);
    draft.answers = {};
    draft.evidence = {};
    for (const q of QUESTIONS) {
      const answer = value.answers?.[q.id];
      if (['ready', 'partial', 'missing'].includes(answer)) draft.answers[q.id] = answer;
      const evidence = value.evidence?.[q.id];
      if (['ready', 'partial', 'missing', 'not_applicable'].includes(evidence)) draft.evidence[q.id] = evidence;
    }
    if (Array.isArray(value.searchedCnCodes)) draft.searchedCnCodes = value.searchedCnCodes.filter((code: unknown) => typeof code === 'string' && /^\d{2,8}$/.test(code)).slice(0, 20);
    draft.allImports = value.allImports === true;
    draft.readinessIndex = Number.isInteger(value.readinessIndex) && value.readinessIndex >= 0 && value.readinessIndex < QUESTIONS.length ? value.readinessIndex : 0;
    return { draft, savedAt: Number.isFinite(stored.savedAt) ? stored.savedAt : 0 };
  } catch { return; }
}

export function serializeDraft(draft: Draft, retention: number, now = Date.now()) {
  // Whitelist only Navigator fields; no application contacts or consent.
  const clean = readSavedDraft(JSON.stringify(draft), now)?.draft || {};
  return JSON.stringify({ draft: clean, savedAt: now, expiresAt: now + retention });
}
