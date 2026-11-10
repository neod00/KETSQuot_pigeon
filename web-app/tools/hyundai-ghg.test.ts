import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import PizZip from 'pizzip';
import { DOMParser as XmlDomParser, XMLSerializer as XmlSerializer } from '@xmldom/xmldom';
import { createHyundaiGhgInput, parseHyundaiGhgInput, getTargetYears, targetYearsLabel, targetYearsOverlap } from '../src/lib/hyundai-ghg';
import { createDefaultP827Application } from '../src/lib/p827-application';
import { parseP827Intake } from '../src/lib/p827-intake';
import { P827_GENERATOR_DEFAULTS, formatP827PrintValue, p827DocumentError, parseP827GeneratorDraft, parseVerificationYears, verificationPeriodFull } from '../src/lib/p827-generator-data';
import { buildP827QuoteHtml, patchP827QuoteDocumentXml, type P827QuoteOutputData } from '../src/utils/p827QuoteGenerator';

function existing() {
  return { ...createHyundaiGhgInput('existing'), companyName: '[TEST] 기존 협력사', contactName: '테스트 담당자', phone: '010-0000-0000', email: 'qa@example.invalid', targetYear: '2025', targetYears: ['2025'], changeStatus: 'none' as const, consent: true };
}
function newcomer() {
  return { ...existing(), customerType: 'new' as const, address: '테스트시 테스트로 1', sites: '테스트공장 / 테스트시', activities: '자동차 부품 제조' };
}

function newP827() {
  return { ...createDefaultP827Application(), organisationName: '[TEST] P827 신규 협력사', contactName: '신규 담당자', phone: '010-0000-0000', email: 'new@example.invalid', consent: true,
    contactAddress: '본사 주소', objective: '현대차 제출용 온실가스 검증', organisationBoundary: '국내 법인과 공장', legalOwnership: '100% 지분', financialBoundary: '연결재무제표 기준',
    scope3: true, scope3Categories: Array.from({ length: 15 }, (_, index) => [0, 6].includes(index)), geographicalBoundary: '대한민국', locations: '본사\n제1공장', exclusions: '해외 법인 제외',
    activitiesProcesses: '부품 제조와 조립', criteria: 'ISO 14064-3', sourcesSinks: 'GHG Source only', inventorySize: '125,000 tCO2e', reportTitle: '2026 온실가스 배출량 보고서',
    reportingPeriod: '2026년 1월 1일~12월 31일', intendedUsers: '현대자동차 및 이해관계자', deadline: '2027-06-30', additionalInfo: '관련 인증 및 이전 보고서 정보' };
}

test('full P827 intake preserves every field and derives only the management summary', () => {
  const raw = newP827();
  const result = parseHyundaiGhgInput({ customerType: 'new', p827Application: { ...raw, status: '계약 완료', quotedDays: 3 }, targetYear: '1999', companyName: 'forged' });
  assert.deepEqual(result.p827Application, raw);
  assert.equal(result.companyName, raw.organisationName);
  assert.equal(result.targetYear, '2026');
  assert.deepEqual(result.scope3Categories, [1, 7]);
  assert.equal('quotedDays' in result.p827Application!, false);
  // Optional P827 fields must stay optional; do not reapply the former simplified-new requirements.
  const minimal = { ...createDefaultP827Application(), organisationName: '업체', contactName: '담당자', phone: '000', email: 'qa@example.invalid', consent: true };
  const projected = parseHyundaiGhgInput({ customerType: 'new', p827Application: minimal });
  assert.equal(projected.targetYear, ''); assert.equal(projected.address, ''); assert.equal(projected.sites, '');
  assert.throws(() => parseP827Intake({ ...raw, consent: false }), /동의/);
  assert.throws(() => parseP827Intake({ ...raw, scope3Categories: [true] }), /카테고리/);
});

test('minimal existing applications need no new-company fields; internal properties are excluded', () => {
  const input = parseHyundaiGhgInput({ ...existing(), status: '계약 완료', internalNotes: 'forged', reference: 'forged', originalSubmission: {} });
  assert.equal(input.companyName, '[TEST] 기존 협력사');
  assert.equal(input.address, '');
  for (const key of ['status', 'internalNotes', 'reference', 'originalSubmission']) assert.equal(key in input, false);
});

test('multi-year applications retain all years and legacy single-year records remain readable', () => {
  const input = parseHyundaiGhgInput({ ...existing(), targetYears: ['2026', '2024', '2025', '2024'] });
  assert.deepEqual(getTargetYears(input), ['2024', '2025', '2026']);
  assert.equal(input.targetYear, '2024');
  assert.equal(targetYearsLabel(input), '2024년, 2025년, 2026년 (3개년)');
  assert.equal(targetYearsOverlap(input, { targetYear: '2025' }), true);
  assert.equal(targetYearsOverlap(input, { targetYear: '2023' }), false);
  const legacy: Record<string, unknown> = { ...existing() };
  delete legacy.targetYears;
  assert.deepEqual(parseHyundaiGhgInput(legacy).targetYears, ['2025']);
  assert.deepEqual(getTargetYears({ targetYear: '2024' }), ['2024']);
  for (const targetYears of [[], ['3026'], [2025], ['2025', 'invalid']]) assert.throws(() => parseHyundaiGhgInput({ ...existing(), targetYears }), /검증대상년도/);
});

test('changed and unknown are distinct; new-company fields are conditionally required', () => {
  assert.throws(() => parseHyundaiGhgInput({ ...existing(), changeStatus: 'changed' }), /변동 유형/);
  assert.throws(() => parseHyundaiGhgInput({ ...existing(), changeStatus: 'changed', changeTypes: ['기타'] }), /변동 내용/);
  assert.equal(parseHyundaiGhgInput({ ...existing(), changeStatus: 'unknown' }).changeStatus, 'unknown');
  assert.throws(() => parseHyundaiGhgInput({ ...existing(), customerType: 'new' }), /회사 주소/);
  const input = parseHyundaiGhgInput(newcomer());
  assert.equal(input.changeStatus, '');
  assert.equal(input.activities, '자동차 부품 제조');
});

test('Scope 3 requires valid category IDs and never persists stale selections when excluded', () => {
  assert.throws(() => parseHyundaiGhgInput({ ...existing(), scopes: [3] }), /카테고리/);
  assert.throws(() => parseHyundaiGhgInput({ ...existing(), scopes: [1, 3], scope3Categories: [16] }), /카테고리/);
  assert.deepEqual(parseHyundaiGhgInput({ ...existing(), scopes: [3, 2, 3], scope3Categories: [15, 1, 15] }).scope3Categories, [1, 15]);
  assert.deepEqual(parseHyundaiGhgInput({ ...existing(), scope3Categories: [1] }).scope3Categories, []);
});

test('missing scope, consent, year, or malformed and oversized contact information is rejected', () => {
  for (const patch of [{ scopes: [] }, { scopes: ['1'] }, { consent: false }, { consent: 'true' }, { targetYears: ['3026'] }, { email: 'invalid' }, { companyName: ' ' }, { contactName: null }, { email: 'a'.repeat(301) }]) {
    assert.throws(() => parseHyundaiGhgInput({ ...existing(), ...patch }));
  }
});

test('document drafts validate numeric and category values and drop unrecognized fields', () => {
  assert.deepEqual(parseP827GeneratorDraft({ s1Days: 2.5, extra: 'ignore' }), { s1Days: 2.5 });
  for (const value of [{ s1Days: -1 }, { auditRate: '100' }, { expenses: Infinity }, { scope3Categories: [1] }, { verificationStandard: 'invented' }]) assert.throws(() => parseP827GeneratorDraft(value));
});

test('customer-provided markup is printed as text, while preserving line breaks', () => {
  const value = formatP827PrintValue('<img src=x onerror=alert(1)>\nA & B');
  assert.ok(!value.includes('<img'));
  assert.ok(value.includes('&lt;img'));
  assert.ok(value.includes('<br/>'));
  assert.ok(value.includes('&amp;'));
});

test('documents require a deliberate price and days; contracts require a representative and address', () => {
  const draft = { ...P827_GENERATOR_DEFAULTS, companyName: '테스트 업체', targetSites: '공장', proposalDate: '2026-10-27', proposalNo: 'QR.TEST', manualFinalCost: 1000000 };
  assert.equal(p827DocumentError(draft, 'quote'), '');
  assert.match(p827DocumentError({ ...draft, s1Days: 0, s2Days: 0, s3Days: 0 }, 'quote'), /검증일수/);
  assert.match(p827DocumentError({ ...draft, manualFinalCost: 0 }, 'quote'), /금액/);
  assert.match(p827DocumentError({ ...draft, expenses: -1 }, 'quote'), /음수/);
  assert.match(p827DocumentError(draft, 'contract'), /대표자명/);
  assert.equal(p827DocumentError({ ...draft, clientRepName: '대표자', hqAddress: '주소' }, 'contract'), '');
  assert.equal(p827DocumentError({ ...draft, vYear: '2024, 2026' }, 'quote'), '');
  assert.deepEqual(parseVerificationYears('2026, 2024, 2026'), ['2024', '2026']);
  assert.equal(verificationPeriodFull('2025'), '2025년 1월 ~ 12월 (12개월)');
  assert.equal(verificationPeriodFull('2024, 2026'), '2024년 1월 ~ 12월; 2026년 1월 ~ 12월 (총 24개월)');
});

test('actual Word template and PDF HTML reflect the selected scopes, year, categories and price', () => {
  const saved = { DOMParser: globalThis.DOMParser, XMLSerializer: globalThis.XMLSerializer, Node: globalThis.Node };
  Object.assign(globalThis, { DOMParser: XmlDomParser, XMLSerializer: XmlSerializer, Node: { ELEMENT_NODE: 1 } });
  try {
    const quote: P827QuoteOutputData = {
      scopes: [2], companyName: '[TEST] 협력사 <script>', serviceDescription: 'Scope 2 검증', proposalDateLong: '2026년 10월 27일', proposalNo: 'QR.TEST',
      contactName: '담당자', contactTitle: '심사원', contactPhone: '000', contactMobile: '000', contactEmail: 'qa@example.invalid',
      verificationYear: '2026', verificationStandard: 'iso14064', assuranceLevel: '제한적 보증', materialityLevel: '전문적 판단', targetSites: '공장\n본사',
      scope3Categories: Array(15).fill(false), applicationFeeText: '면제', stage1Days: '1', stage1Cost: '1,000,000', stage2Days: '2', stage2Cost: '2,000,000',
      stage3Days: '0.5', stage3Cost: '500,000', expenses: '200,000', totalDays: '3.5', totalCost: '3,700,000', finalCost: '3,600,000', vatType: '별도', auditRate: '1,000,000', quoteValidityDays: '90',
    };
    const zip = new PizZip(readFileSync('public/templates/LRQA_P827_GHG_Quote_Template.docx'));
    const template = zip.file('word/document.xml')!.asText();
    const patched = patchP827QuoteDocumentXml(template, quote);
    const xml = new XmlDomParser().parseFromString(patched, 'application/xml');
    const paragraphs = Array.from(xml.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'p'));
    assert.match(paragraphs[6].textContent || '', /\[TEST\] 협력사 <script>/);
    assert.equal(paragraphs[76].textContent, '2026년도 온실가스 Scope 2 제3자 검증(1년)');
    assert.match(paragraphs[96].textContent || '', /미포함/);
    assert.equal(paragraphs[165].textContent, '3,600,000');
    const html = buildP827QuoteHtml(quote);
    assert.equal((html.match(/<section class="page">/g) || []).length, 9);
    assert.ok(html.includes('2026년도 온실가스 Scope 2'));
    assert.ok(html.includes('&lt;script&gt;'));
    const scope3 = { ...quote, scopes: [1, 2, 3], scope3Categories: Array.from({ length: 15 }, (_, index) => [0, 14].includes(index)) };
    const scopeXml = new XmlDomParser().parseFromString(patchP827QuoteDocumentXml(template, scope3), 'application/xml');
    const checked = Array.from(scopeXml.getElementsByTagNameNS('http://schemas.microsoft.com/office/word/2010/wordml', 'checked')).map(node => node.getAttributeNS('http://schemas.microsoft.com/office/word/2010/wordml', 'val'));
    assert.deepEqual(checked, scope3.scope3Categories.map(value => value ? '1' : '0'));
    assert.ok(buildP827QuoteHtml(scope3).includes('총 2개 카테고리'));
    const multiYear = { ...quote, verificationYear: '2024, 2026' };
    const multiYearXml = new XmlDomParser().parseFromString(patchP827QuoteDocumentXml(template, multiYear), 'application/xml');
    const multiParagraphs = Array.from(multiYearXml.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'p'));
    assert.equal(multiParagraphs[76].textContent, '2024, 2026년도 온실가스 Scope 2 제3자 검증(2개년)');
    assert.ok(buildP827QuoteHtml(multiYear).includes('2024, 2026년도 온실가스 Scope 2 제3자 검증(2개년)'));
  } finally { Object.assign(globalThis, saved); }
});

const origin = process.env.GHG_TEST_ORIGIN;
test('local HTTP flow: public forms, protected management, isolated storage, updates and conflicts', { skip: !origin }, async () => {
  assert.ok(origin && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin), 'Live tests may only target a local test server.');
  const secret = process.env.GHG_TEST_SECRET;
  assert.ok(secret, 'GHG_TEST_SECRET is required for local session signing.');
  const payload = Buffer.from(JSON.stringify({ username: 'hyundai-ghg-test', role: 'admin', expiresAt: Date.now() + 60_000 })).toString('base64url');
  const cookie = `lrqa_iso_admin=${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
  const api = `${origin}/api/hyundai-ghg/applications`;
  const post = (body: unknown) => fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const update = (body: unknown) => fetch(api, { method: 'PUT', headers: { 'Content-Type': 'application/json', cookie, origin: origin! }, body: JSON.stringify(body) });
  const originalPage = await fetch(`${origin}/p827`);
  const newPage = await fetch(`${origin}/hyundai-ghg/new`);
  assert.equal(originalPage.status, 200); assert.equal(newPage.status, 200);
  const originalHtml = await originalPage.text(); const newHtml = await newPage.text();
  const originalForm = originalHtml.match(/<form\b[\s\S]*?<\/form>/)?.[0];
  const newForm = newHtml.match(/<form\b[\s\S]*?<\/form>/)?.[0];
  assert.ok(originalForm); assert.equal(newForm, originalForm, 'The new-customer form must have exactly the P827 form markup.');
  const existingPage = await fetch(`${origin}/hyundai-ghg/existing`);
  assert.equal(existingPage.status, 200);
  assert.ok(!(await existingPage.text()).includes('aria-label="신청서 유형"'));
  const login = await fetch(`${origin}/hyundai-ghg/admin`, { redirect: 'manual' });
  assert.equal(login.status, 307);
  assert.match(login.headers.get('location') || '', /iso\/login/);
  assert.equal((await fetch(api)).status, 401);
  assert.equal((await fetch(api, { method: 'PUT', body: '{}' })).status, 401);
  assert.equal((await post({ ...existing(), consent: false })).status, 400);
  assert.equal((await post({ ...existing(), scopes: [3], scope3Categories: [] })).status, 400);
  const created = await post({ ...existing(), internalNotes: 'forged', status: '계약 완료' });
  assert.equal(created.status, 201);
  const receipt = await created.json();
  assert.match(receipt.reference, /^HGHG-\d{8}-[A-F0-9]{8}$/);
  assert.deepEqual(Object.keys(receipt).sort(), ['reference', 'submittedAt']);
  assert.equal((await post(newcomer())).status, 400, 'New public intake must use the complete P827 form.');
  const originalStoreCount = (await (await fetch(`${origin}/api/p827/applications`, { headers: { cookie } })).json()).applications.length;
  const createdNew = await post({ customerType: 'new', p827Application: newP827() });
  assert.equal(createdNew.status, 201);
  const newReceipt = await createdNew.json();
  const all = await (await fetch(api, { headers: { cookie } })).json();
  assert.ok(all.applications.some((item: { customerType: string }) => item.customerType === 'new'));
  const fullNew = all.applications.find((item: { reference: string }) => item.reference === newReceipt.reference);
  assert.deepEqual(fullNew.p827Application, newP827());
  assert.deepEqual(fullNew.originalSubmission.p827Application, newP827());
  assert.equal((await (await fetch(`${origin}/api/p827/applications`, { headers: { cookie } })).json()).applications.length, originalStoreCount, 'Hyundai submissions must not enter the original P827 inbox.');
  const newUpdate = await update({ reference: fullNew.reference, version: fullNew.version, application: { ...fullNew, p827Application: { ...fullNew.p827Application, legalOwnership: '수정된 지분 경계' } }, status: '검토 중', internalNotes: '신규 상세 검토', documentDraft: null });
  assert.equal(newUpdate.status, 200);
  const newSaved = (await newUpdate.json()).application;
  assert.equal(newSaved.p827Application.legalOwnership, '수정된 지분 경계');
  assert.equal(newSaved.originalSubmission.p827Application.legalOwnership, newP827().legalOwnership);
  assert.equal(newSaved.p827Application.intendedUsers, newP827().intendedUsers);
  const current = all.applications.find((item: { reference: string }) => item.reference === receipt.reference);
  assert.equal(current.status, '접수'); assert.equal(current.internalNotes, '');
  const body = { reference: current.reference, version: current.version, application: { ...existing(), contactName: '변경된 담당자' }, status: '검토 중', internalNotes: '범위 검토', documentDraft: { s1Days: 1, auditRate: 1000000, vYear: '2025' } };
  const saved = await update(body);
  assert.equal(saved.status, 200);
  const next = (await saved.json()).application;
  assert.equal(next.version, 2); assert.equal(next.contactName, '변경된 담당자');
  assert.equal(next.originalSubmission.contactName, '테스트 담당자');
  assert.equal(next.events.length, 2); assert.equal(next.events[1].actor, 'hyundai-ghg-test');
  assert.equal(next.documentDraft.auditRate, 1000000);
  assert.equal((await fetch(api, { method: 'PUT', headers: { 'Content-Type': 'application/json', cookie, origin: 'https://untrusted.example' }, body: JSON.stringify({ ...body, version: 2 }) })).status, 403);
  assert.equal((await update(body)).status, 409);
  assert.equal((await update({ ...body, version: 2, documentDraft: { s1Days: -1 } })).status, 400);
  assert.equal((await update({ ...body, version: 2, status: 'invented' })).status, 400);
  assert.equal((await fetch(`${api}?ref=${current.reference}`)).status, 401);
  const reloaded = (await (await fetch(`${api}?ref=${current.reference}`, { headers: { cookie } })).json()).application;
  assert.equal(reloaded.status, '검토 중'); assert.equal(reloaded.internalNotes, '범위 검토');
  const yearsReceipt = await post({ ...existing(), companyName: '[TEST] 3개년 협력사', targetYears: ['2026', '2024', '2025'] });
  assert.equal(yearsReceipt.status, 201);
  const yearsReference = (await yearsReceipt.json()).reference;
  const yearsStored = (await (await fetch(`${api}?ref=${yearsReference}`, { headers: { cookie } })).json()).application;
  assert.deepEqual(yearsStored.targetYears, ['2024', '2025', '2026']);
  assert.deepEqual(yearsStored.originalSubmission.targetYears, ['2024', '2025', '2026']);
  const changedYearsResponse = await update({ reference: yearsReference, version: yearsStored.version, application: { ...yearsStored, targetYears: ['2024', '2026'] }, status: '검토 중', internalNotes: '', documentDraft: null });
  assert.equal(changedYearsResponse.status, 200);
  const changedYears = (await changedYearsResponse.json()).application;
  assert.deepEqual(changedYears.targetYears, ['2024', '2026']);
  assert.deepEqual(changedYears.originalSubmission.targetYears, ['2024', '2025', '2026']);
  assert.equal((await post({ ...existing(), targetYears: [] })).status, 400);
});
