import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSavedDraft, serializeDraft, DEVICE_RETENTION } from '../src/lib/draft-storage';
import { buildChecklistCsv, recommendedActions, needsPreparation } from '../src/lib/readiness-guidance';
import type { Draft } from '../src/components/NavigatorContext';
import { createPublicCbamApplication } from '../../web-app/src/lib/cbam-application-draft';
import { parseApplication } from '../src/shared/cbam-intake-schema';
import { fixture } from './fixture';

const draft: Draft = {
  sessionId: fixture().navigatorData.sessionId, startedAt: '2026-10-03T00:00:00Z',
  productName: '철강 볼트', cnCode: '73181590', sector: '철강', searchedCnCodes: ['73181590'],
  productionProcesses: '냉간단조 → 열처리', productionRoute: '경로 A', precursors: '철강 선재',
  country: 'KR', sites: '시험 사업장', euExport: 'yes', importer: 'operator', mass: '200', allImports: true,
  answers: { S1: 'ready', M1: 'partial', R3: 'missing' }, evidence: { S1: 'ready' }, readinessIndex: 14,
};

test('saved drafts restore free text, applicability, answers and question position; expired data is ignored', () => {
  const raw = serializeDraft({ ...draft, contactName: 'must not persist', consent: true } as Draft, DEVICE_RETENTION, 1000);
  const restored = readSavedDraft(raw, 2000)?.draft;
  assert.equal(restored?.productName, draft.productName);
  assert.equal(restored?.sites, draft.sites);
  assert.equal(restored?.productionProcesses, draft.productionProcesses);
  assert.equal(restored?.mass, '200');
  assert.equal(restored?.readinessIndex, 14);
  assert.deepEqual(restored?.answers, draft.answers);
  assert.ok(!raw.includes('contactName') && !raw.includes('consent'));
  assert.equal(readSavedDraft(raw, 1000 + DEVICE_RETENTION), undefined);
  assert.equal(readSavedDraft('{broken'), undefined);
  assert.equal(readSavedDraft(JSON.stringify({ ...draft, readinessIndex: 100 }))?.draft.readinessIndex, 0);
});

test('an applicant cannot submit unchecked choice fields through either intake parser mode', () => {
  const blank = createPublicCbamApplication();
  const input = { ...fixture().application, ...Object.fromEntries(Object.entries(blank).filter(([key]) => ['clientType','serviceType','mmdStatus','remoteAccess','communicationTemplate','goodsComplexity','biomass','carbonPrice','previouslyVerified'].includes(key))) };
  for (const legacy of [false, true]) assert.throws(() => parseApplication(input, legacy), /선택/);
  assert.equal(parseApplication(fixture().application, true).serviceType, 'verification');
});

test('CSV preserves Korean, quotes and line breaks while neutralizing untrusted spreadsheet formulas', () => {
  const csv = buildChecklistCsv({ ...draft, productName: ' =HYPERLINK("bad")', sites: 'A,"B"\nC' }, new Date('2026-10-02T16:00:00Z'));
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\' =HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('"A,""B""\nC"'));
  assert.ok(csv.includes('2026-10-03'));
  assert.ok(csv.includes('담당자 (작성)') && csv.includes('기한 (작성)'));
  assert.equal(csv.split('\r\n').filter(line => /^"[SMPRDV][1-4]",/.test(line)).length, 24);
});

test('preparation tasks use diagnosis answers once and exclude ready answers without a second confirmation', () => {
  const actions = recommendedActions(draft);
  assert.ok(!actions.some(action => action.id === 'S1'));
  assert.ok(actions.some(action => action.id === 'R3'));
  assert.ok(actions.some(action => action.id === 'M1'));
  assert.equal(recommendedActions({ answers: { S1: 'ready' } }).some(action => action.id === 'S1'), false);
});

test('legacy evidence records do not contradict current diagnosis answers or hide preparation tasks', () => {
  assert.equal(needsPreparation('missing'), true);
  assert.equal(needsPreparation('partial'), true);
  assert.equal(needsPreparation(undefined), true);
  assert.equal(needsPreparation('ready'), false);
  const existing = { answers: { S1: 'ready', R3: 'missing' } as Draft['answers'], evidence: { S1: 'missing', R3: 'ready' } as Draft['evidence'] };
  const actions = recommendedActions(existing);
  assert.ok(!actions.some(q => q.id === 'S1'));
  assert.ok(actions.some(q => q.id === 'R3'));
  assert.deepEqual(readSavedDraft(serializeDraft({ ...draft, ...existing }, DEVICE_RETENTION))?.draft.evidence, existing.evidence);
  assert.ok(!buildChecklistCsv({ ...draft, ...existing }).includes('자료 확보상태'));
});
