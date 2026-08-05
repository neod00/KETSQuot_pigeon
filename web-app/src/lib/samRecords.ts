import 'server-only';

import { randomUUID } from 'node:crypto';
import { getIsoBinary, getIsoJson, setIsoBinary, updateIsoJson } from '@/lib/isoStorage';
import { initialSamAccounts } from '@/lib/samSeed';
import { mergeOfficialAffiliateCatalog } from '@/lib/samAffiliateCatalog';
import { listSalesRecords } from '@/lib/salesRecords';
import type {
  SamAccount,
  SamAccountInput,
  SamAccountView,
  SamBilingualText,
  SamDocument,
  SamPipelineRecord,
  SamProgressUpdate,
} from '@/lib/samTypes';

const STORE = 'sam-business';
const ACCOUNT_KEY = 'accounts.json';
const DOCUMENT_KEY = 'documents.json';

const text = (value: unknown) => String(value ?? '').trim();
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const normalizeCompany = (value: string) => value
  .normalize('NFKC')
  .toLowerCase()
  .replace(/주식회사|㈜|co\.?[,]?\s*ltd\.?|corporation|corp\.?|limited|ltd\.?/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, '');

const bilingual = (value?: Partial<SamBilingualText>, fallback = ''): SamBilingualText => ({
  ko: text(value?.ko || fallback),
  en: text(value?.en),
  status: value?.status === 'approved' ? 'approved' : 'review',
});

const readAccounts = async () => {
  const saved = await getIsoJson<SamAccount[]>(STORE, ACCOUNT_KEY);
  const accounts = saved?.length ? saved : initialSamAccounts();
  return accounts.map(mergeOfficialAffiliateCatalog);
};

const defaultAccount = (input: SamAccountInput, username: string): SamAccount => {
  const now = new Date().toISOString();
  const name = bilingual(input.name, '신규 Account');
  return {
    id: randomUUID(),
    name,
    sector: bilingual(input.sector),
    country: text(input.country || 'Korea'),
    manager: text(input.manager || username),
    internalSponsor: bilingual(input.internalSponsor),
    clientSponsor: bilingual(input.clientSponsor),
    lastQbrDate: text(input.lastQbrDate),
    qbrOutcome: bilingual(input.qbrOutcome),
    nextQbrDate: text(input.nextQbrDate),
    lastVisitDate: text(input.lastVisitDate),
    attendees: bilingual(input.attendees),
    visitOutcome: bilingual(input.visitOutcome),
    opportunity: bilingual(input.opportunity),
    dealStage: bilingual(input.dealStage),
    estimatedCloseDate: text(input.estimatedCloseDate),
    dealValueUsd: Math.max(0, number(input.dealValueUsd)),
    dealValueNote: bilingual(input.dealValueNote),
    atRisk: Boolean(input.atRisk),
    risk: bilingual(input.risk),
    growthStrategy: bilingual(input.growthStrategy),
    crossSell: bilingual(input.crossSell),
    notes: bilingual(input.notes),
    reviewCadence: input.reviewCadence || 'biweekly',
    nextReviewDate: text(input.nextReviewDate),
    affiliates: Array.isArray(input.affiliates) ? input.affiliates : [],
    manualSalesRecordIds: Array.isArray(input.manualSalesRecordIds) ? input.manualSalesRecordIds : [],
    contacts: Array.isArray(input.contacts) ? input.contacts : [],
    team: Array.isArray(input.team) ? input.team : [],
    actions: Array.isArray(input.actions) ? input.actions : [],
    updates: Array.isArray(input.updates) ? input.updates : [],
    createdAt: now,
    updatedAt: now,
    createdBy: username,
    updatedBy: username,
  };
};

const companyMatchers = (account: SamAccount) => {
  const map = new Map<string, {
    matchedBy: SamPipelineRecord['matchedBy'];
    matchedAffiliateId?: string;
    matchedEntityName: string;
  }>();
  const addMatcher = (name: string, match: {
    matchedBy: SamPipelineRecord['matchedBy'];
    matchedAffiliateId?: string;
    matchedEntityName: string;
  }) => {
    const key = normalizeCompany(name);
    if (key && !map.has(key)) map.set(key, match);
  };
  const accountName = account.name.ko || account.name.en;
  [account.name.ko, account.name.en].forEach((name) => {
    addMatcher(name, { matchedBy: 'account', matchedEntityName: accountName });
  });
  account.affiliates.forEach((affiliate) => {
    const affiliateName = affiliate.nameKo || affiliate.nameEn;
    [affiliate.nameKo, affiliate.nameEn].forEach((name) => {
      addMatcher(name, {
        matchedBy: 'affiliate',
        matchedAffiliateId: affiliate.id,
        matchedEntityName: affiliateName,
      });
    });
    affiliate.aliases.forEach((alias) => {
      addMatcher(alias, {
        matchedBy: 'alias',
        matchedAffiliateId: affiliate.id,
        matchedEntityName: affiliateName,
      });
    });
  });
  return map;
};

export async function listSamAccounts(): Promise<SamAccount[]> {
  return (await readAccounts()).sort((left, right) => left.name.en.localeCompare(right.name.en));
}

export async function listSamAccountsWithPipeline(): Promise<SamAccountView[]> {
  const [accounts, sales] = await Promise.all([
    listSamAccounts(),
    listSalesRecords({ username: 'sam-admin', role: 'admin' }),
  ]);
  return accounts.map((account) => {
    const matchers = companyMatchers(account);
    const manual = new Set(account.manualSalesRecordIds);
    const pipeline = sales.flatMap((record): SamPipelineRecord[] => {
      const candidates = [record.companyName, record.accountName].map(normalizeCompany).filter(Boolean);
      const matched = candidates.map((candidate) => matchers.get(candidate)).find((value) => Boolean(value));
      const matchedBy = manual.has(record.id) ? 'manual' : matched?.matchedBy;
      if (!matchedBy) return [];
      return [{
        id: record.id,
        companyName: record.companyName || record.accountName,
        opportunityName: record.opportunityName,
        product: record.product,
        stage: record.stage,
        amount: record.amountIncludingExpenses,
        quotedAt: record.quotedAt,
        matchedBy,
        matchedAffiliateId: matched?.matchedAffiliateId,
        matchedEntityName: matched?.matchedEntityName || account.name.ko || account.name.en,
      }];
    });
    const activePipelineUsd = pipeline
      .filter((record) => !['won', 'lost'].includes(record.stage))
      .reduce((sum, record) => sum + record.amount, 0);
    return { ...account, pipeline, activePipelineUsd };
  });
}

export async function findSamAccount(id: string) {
  return (await readAccounts()).find((account) => account.id === id) || null;
}

export async function createSamAccount(input: SamAccountInput, username: string) {
  const account = defaultAccount(input, username);
  await updateIsoJson<SamAccount[]>(STORE, ACCOUNT_KEY, (current) => [account, ...(current?.length ? current : initialSamAccounts())]);
  return account;
}

export async function updateSamAccount(id: string, input: SamAccountInput, username: string) {
  let updated: SamAccount | null = null;
  await updateIsoJson<SamAccount[]>(STORE, ACCOUNT_KEY, (current) => {
    const accounts = current?.length ? current : initialSamAccounts();
    const existing = accounts.find((account) => account.id === id);
    if (!existing) return accounts;
    updated = {
      ...existing,
      ...input,
      id: existing.id,
      name: input.name ? bilingual(input.name) : existing.name,
      sector: input.sector ? bilingual(input.sector) : existing.sector,
      dealValueUsd: input.dealValueUsd === undefined ? existing.dealValueUsd : Math.max(0, number(input.dealValueUsd)),
      updatedAt: new Date().toISOString(),
      updatedBy: username,
    };
    return accounts.map((account) => account.id === id ? updated! : account);
  });
  return updated;
}

export async function deleteSamAccount(id: string) {
  let deleted = false;
  await updateIsoJson<SamAccount[]>(STORE, ACCOUNT_KEY, (current) => {
    const accounts = current?.length ? current : initialSamAccounts();
    deleted = accounts.some((account) => account.id === id);
    return accounts.filter((account) => account.id !== id);
  });
  return deleted;
}

export async function addSamProgressUpdate(
  accountId: string,
  input: Partial<SamProgressUpdate>,
  username: string,
) {
  let saved: SamProgressUpdate | null = null;
  await updateIsoJson<SamAccount[]>(STORE, ACCOUNT_KEY, (current) => {
    const accounts = current?.length ? current : initialSamAccounts();
    return accounts.map((account) => {
      if (account.id !== accountId) return account;
      const now = new Date().toISOString();
      saved = {
        id: randomUUID(),
        date: text(input.date) || now.slice(0, 10),
        status: input.status || 'on-track',
        sourceMemo: text(input.sourceMemo),
        briefing: bilingual(input.briefing),
        accomplishments: bilingual(input.accomplishments),
        customerMeetings: bilingual(input.customerMeetings),
        pipelineChanges: bilingual(input.pipelineChanges),
        blockers: bilingual(input.blockers),
        nextActions: bilingual(input.nextActions),
        owner: text(input.owner || account.manager),
        dueDate: text(input.dueDate),
        managerSupport: bilingual(input.managerSupport),
        uncategorized: bilingual(input.uncategorized),
        createdAt: now,
        createdBy: username,
      };
      return { ...account, updates: [saved, ...account.updates], updatedAt: now, updatedBy: username };
    });
  });
  return saved;
}

export async function saveSamDocument(
  bytes: Uint8Array,
  input: Omit<SamDocument, 'id' | 'storageKey' | 'version' | 'createdAt'>,
) {
  const documents = await listSamDocuments();
  const version = documents.filter((item) => item.kind === input.kind && item.accountId === input.accountId).length + 1;
  const id = randomUUID();
  const storageKey = `files/${id}`;
  const document: SamDocument = { ...input, id, storageKey, version, createdAt: new Date().toISOString() };
  await setIsoBinary(STORE, storageKey, bytes);
  await updateIsoJson<SamDocument[]>(STORE, DOCUMENT_KEY, (current) => [document, ...(current || [])]);
  return document;
}

export async function listSamDocuments() {
  return (await getIsoJson<SamDocument[]>(STORE, DOCUMENT_KEY) || [])
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function findSamDocument(id: string) {
  return (await listSamDocuments()).find((document) => document.id === id) || null;
}

export async function getSamDocumentBytes(document: SamDocument) {
  return await getIsoBinary(STORE, document.storageKey);
}

export const translationReviewCount = (account: SamAccount) => [
  account.name, account.sector, account.internalSponsor, account.clientSponsor, account.qbrOutcome,
  account.attendees, account.visitOutcome, account.opportunity, account.dealStage, account.dealValueNote,
  account.risk, account.growthStrategy, account.crossSell, account.notes,
].filter((field) => !field.en || field.status !== 'approved').length
