import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applicationHandoff, verificationYearsFromPeriod } from '../src/lib/application-handoff';
import { decodeHandoff, encodeHandoff } from '../src/shared/cbam-handoff';
import { EMPTY_REPORT_DETAILS } from '../src/lib/business-document-data';
import { parseApplication } from '../src/shared/cbam-intake-schema';
import type { Draft } from '../src/components/NavigatorContext';
import { fixture } from './fixture';

const draft: Draft = { sessionId:'NAV-11111111-1111-4111-8111-111111111111', startedAt:'', productName:'철강 볼트', cnCode:'73181590', sector:'철강', searchedCnCodes:['7318','73181590'], productionProcesses:'냉간단조 → 전조', productionRoute:'경로 A', precursors:'철강 선재', country:'KR', sites:'울산 공장', euExport:'yes', importer:'operator', mass:'20000', allImports:true, answers:{S1:'ready'}, evidence:{}, readinessIndex:0 };
test('handoff maps entered data to form fields and preserves unmapped workflow details as labelled notes', () => {
  const handoff = applicationHandoff(draft, {companyName:'시험 회사',contactName:'시험 담당자',email:'qa@example.invalid',phone:'010-0000-0000'}, {...EMPTY_REPORT_DETAILS,reportingPeriod:'2026.01.01 ~ 2026.12.31',recipient:'구매팀',deadline:'2026-10-20',decisionRequest:'공급업체 협조 요청'}, '자료 준비 상담', Date.now());
  const data = decodeHandoff(encodeHandoff(handoff));
  assert.equal(data.prefill.companyName,'시험 회사'); assert.equal(data.prefill.sites,'울산 공장');
  assert.equal(data.prefill.productionProcesses,'냉간단조 → 전조'); assert.equal(data.prefill.cnCodes,'73181590');
  assert.deepEqual(data.prefill.verificationYears,['2026']); assert.deepEqual(data.prefill.cbamGoods,['철강']);
  for (const text of ['생산경로: 경로 A','관련 전구물질: 철강 선재','회신 요청기한: 2026-10-20','보고 대상·수신 부서: 구매팀','지원·의사결정 요청: 공급업체 협조 요청','상담 요청 내용: 자료 준비 상담','연간 대상 수입량: 20000t']) assert.ok(data.prefill.notes?.includes(text));
  assert.equal(data.prefill.embeddedEmissionsKt, undefined, 'product mass must never fill emissions');
  assert.equal(data.prefill.consent,undefined); assert.equal(data.prefill.mmdStatus,undefined); assert.equal(data.prefill.serviceType,undefined);
});
test('only explicit valid years or date ranges preselect years; ambiguous or invalid periods stay editable as notes', () => {
  assert.deepEqual(verificationYearsFromPeriod('2026년'),['2026']);
  assert.deepEqual(verificationYearsFromPeriod('2026-06-01 ~ 2027-05-31'),['2026','2027']);
  for (const input of ['전년도','2026 예산 검토 2027','2026.02.30 ~ 2026.12.31','2026.12.31 ~ 2026.01.01','2023','2032']) assert.deepEqual(verificationYearsFromPeriod(input),[]);
  const handoff = applicationHandoff(draft,{}, {...EMPTY_REPORT_DETAILS,reportingPeriod:'전년도'},'',Date.now());
  assert.deepEqual(handoff.prefill.verificationYears,[]); assert.ok(handoff.prefill.notes?.includes('자료 대상기간: 전년도'));
});
test('long entered requests survive handoff and intake without truncating applicant workflow information', () => {
  const details = {...EMPTY_REPORT_DETAILS,decisionRequest:'가'.repeat(1500)};
  const handoff = applicationHandoff({...draft,productionRoute:'나'.repeat(500),precursors:'다'.repeat(500)}, {}, details, '라'.repeat(1500), Date.now());
  const decoded = decodeHandoff(encodeHandoff(handoff));
  assert.ok(decoded.prefill.notes!.length > 2000);
  assert.ok(decoded.prefill.notes!.includes('라'.repeat(1500)));
  const application = parseApplication({...fixture().application,notes:decoded.prefill.notes},true);
  assert.equal(application.notes, decoded.prefill.notes);
  assert.throws(() => parseApplication({...fixture().application,notes:'x'.repeat(8001)},true));
  assert.throws(() => applicationHandoff(draft,{}, {...details,decisionRequest:'x'.repeat(8001)},'',Date.now()), /너무 깁니다/);
});
