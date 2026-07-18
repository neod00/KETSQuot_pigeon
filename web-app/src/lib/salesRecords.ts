import 'server-only';

import { randomUUID } from 'node:crypto';
import { getIsoJson, updateIsoJson } from '@/lib/isoStorage';
import type { D365Fields, SalesRecord, SalesRecordInput, SalesStage } from '@/lib/salesTypes';

const STORE = 'sales-records';
const COLLECTION_KEY = 'records.json';
const VALID_STAGES: SalesStage[] = ['new', 'quote-preparing', 'quote-sent', 'follow-up', 'won', 'lost', 'on-hold'];

const text = (value: unknown) => String(value ?? '').trim();
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

const inferStage = (input: Partial<SalesRecordInput>): SalesStage => {
  if (input.stage && VALID_STAGES.includes(input.stage)) return input.stage;
  if (input.won) return 'won';
  const source = `${input.quoteReviewResult || ''} ${input.contactHistory || ''}`.toLowerCase();
  if (source.includes('lost') || source.includes('실주') || source.includes('탈락')) return 'lost';
  if (source.includes('보류')) return 'on-hold';
  if (source.includes('후속') || source.includes('검토중') || source.includes('검토 중')) return 'follow-up';
  if (source.includes('발송')) return 'quote-sent';
  if (input.quoteNumber) return 'quote-preparing';
  return 'new';
};

const defaultD365 = (input: Partial<SalesRecordInput>): D365Fields => ({
  status: 'not-ready',
  accountMode: input.category === '신규' ? 'new' : 'existing',
  accountUrl: '',
  firstName: '',
  lastName: text(input.contactName),
  leadSource: text(input.leadSource) || 'Client meeting',
  areaOfInterest: 'Request Quote/Transfer to LRQA',
  primaryBusinessStream: 'Assessment',
  primaryService: 'Management System Solutions',
  closeDate: '',
  country: 'South Korea',
  opportunityRecordType: 'LRQA BOS Opportunity',
  opportunityType: 'New',
  forecastCategory: 'Pipeline',
  clientFacingOffice: 'Seoul',
  assignTo: '',
  street1: '',
  city: '',
  postalCode: '',
});

const normalizeInput = (input: Partial<SalesRecordInput>): SalesRecordInput => {
  const normalized = {
    innovation: text(input.innovation),
    product: text(input.product),
    category: text(input.category),
    sf: text(input.sf),
    quotedAt: text(input.quotedAt),
    quoteNumber: text(input.quoteNumber),
    deadline: text(input.deadline),
    companyName: text(input.companyName),
    accountName: text(input.accountName),
    opportunityName: text(input.opportunityName),
    contactName: text(input.contactName),
    telephone: text(input.telephone),
    mobile: text(input.mobile),
    email: text(input.email),
    contactHistory: text(input.contactHistory),
    nextAction: text(input.nextAction),
    consultingFollowUp: text(input.consultingFollowUp),
    leadSource: text(input.leadSource),
    contract: text(input.contract),
    mpApproval: text(input.mpApproval),
    quoteMandays: number(input.quoteMandays),
    application6sv: text(input.application6sv),
    amountExcludingExpenses: number(input.amountExcludingExpenses),
    amountIncludingExpenses: number(input.amountIncludingExpenses),
    quoteReviewResult: text(input.quoteReviewResult),
    originalOwner: text(input.originalOwner),
    won: Boolean(input.won),
    d365Matched: Boolean(input.d365Matched),
    retentionExpansion: text(input.retentionExpansion),
    stage: inferStage(input),
    d365: { ...defaultD365(input), ...(input.d365 || {}) },
  } satisfies SalesRecordInput;

  return input.id ? { ...normalized, id: input.id } : normalized;
};

const readCollection = async () => await getIsoJson<SalesRecord[]>(STORE, COLLECTION_KEY) || [];

export async function listSalesRecords() {
  const records = await readCollection();
  return records.sort((left, right) => (right.quotedAt || right.createdAt).localeCompare(left.quotedAt || left.createdAt));
}

export async function createSalesRecord(input: Partial<SalesRecordInput>, username: string) {
  const now = new Date().toISOString();
  const normalized = normalizeInput(input);
  const record: SalesRecord = {
    ...normalized,
    id: normalized.id || randomUUID(),
    createdAt: now,
    updatedAt: now,
    createdBy: username,
    updatedBy: username,
  };
  await updateIsoJson<SalesRecord[]>(STORE, COLLECTION_KEY, (records) => [record, ...(records || [])]);
  return record;
}

export async function importSalesRecords(inputs: Partial<SalesRecordInput>[], username: string) {
  let saved: SalesRecord[] = [];
  const now = new Date().toISOString();

  await updateIsoJson<SalesRecord[]>(STORE, COLLECTION_KEY, (existing) => {
    const bySignature = new Map((existing || []).map((record) => [salesSignature(record), record]));
    saved = [];

    for (const input of inputs.slice(0, 1500)) {
      const normalized = normalizeInput(input);
      if (!normalized.companyName && !normalized.quoteNumber) continue;
      const matched = bySignature.get(salesSignature(normalized));
      const record: SalesRecord = matched ? {
        ...matched,
        ...normalized,
        id: matched.id,
        d365: input.d365 ? { ...matched.d365, ...normalized.d365 } : matched.d365,
        d365Matched: matched.d365Matched || normalized.d365Matched,
        won: matched.won || normalized.won,
        stage: input.stage ? normalized.stage : matched.stage,
        updatedAt: now,
        updatedBy: username,
      } : {
        ...normalized,
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        createdBy: username,
        updatedBy: username,
      };
      bySignature.set(salesSignature(record), record);
      saved.push(record);
    }

    return Array.from(bySignature.values());
  });
  return saved;
}

export async function updateSalesRecord(id: string, input: Partial<SalesRecordInput>, username: string) {
  let updated: SalesRecord | null = null;
  await updateIsoJson<SalesRecord[]>(STORE, COLLECTION_KEY, (records) => {
    const collection = records || [];
    const current = collection.find((record) => record.id === id);
    if (!current) return collection;
    const normalized = normalizeInput({ ...current, ...input, id });
    updated = {
      ...current,
      ...normalized,
      id,
      d365: { ...current.d365, ...(input.d365 || {}) },
      updatedAt: new Date().toISOString(),
      updatedBy: username,
    };
    return [updated, ...collection.filter((item) => item.id !== id)];
  });
  return updated;
}

export async function deleteSalesRecord(id: string) {
  await updateIsoJson<SalesRecord[]>(STORE, COLLECTION_KEY, (records) =>
    (records || []).filter((record) => record.id !== id));
}

export const salesSignature = (record: Pick<SalesRecordInput, 'quoteNumber' | 'companyName' | 'product' | 'quotedAt'>) =>
  [record.quoteNumber, record.companyName, record.product, record.quotedAt].map((value) => text(value).toLowerCase()).join('|');
