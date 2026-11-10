import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createIsoComplianceApplication, createIsoSupplement, isoComplianceSourceFields,
  parseIsoComplianceApplication, personnelTotals, ISO_COMMON_SECTIONS, fieldIsVisible,
  type IsoComplianceApplicationInput,
} from '../src/lib/isoComplianceApplication';
import { normalizeLegacyApplication, toIsoQuoteInput } from '../src/lib/isoApplications';

function fixture(): IsoComplianceApplicationInput {
  return {
    ...createIsoComplianceApplication(), standards: ['ISO 37001', 'ISO 37301'],
    common: { companyNameKo: '[TEST] 규격 신청', companyNameEn: 'Test Company', contactName: '담당자', contactPhone: '02-000-0000', contactEmail: 'qa@example.invalid', scopeKo: '제품 제조', author: '작성자', signatureDate: '2026-11-09' },
    sites: [{ address: '본사 주소', totalEmployees: '10', postalCode: '12345' }, { address: '공장 주소', totalEmployees: '20' }],
    antiBribery: { ...createIsoSupplement(2), fields: { briberyIssues: '해당되는 이슈가 없었음', exports: '수출하고 있음', exportCountries: '독일, 일본', industry: '제조업', agents: '있음', agentCount: '2', publicOfficials: '예 (비정기적)' } },
    compliance: { ...createIsoSupplement(2), fields: { violations: '년 1건 있었음', monitoring: '일부 있음', riskAssessment: '있음', internalControls: '없음' } },
    consent: true,
  };
}

test('both standards retain separate supplements, per-site personnel and source aliases', () => {
  const raw = fixture();
  raw.antiBribery!.personnel[0] = { counts: ['1', '2', '', '', ''], note: '뇌물 리스크' };
  raw.compliance!.personnel[0] = { counts: ['3', '4', '', '', ''], note: '준법 리스크' };
  const parsed = parseIsoComplianceApplication(raw);
  assert.deepEqual(parsed.antiBribery, raw.antiBribery && { ...raw.antiBribery, fields: { ...raw.antiBribery.fields, integrityGrade: '' } });
  assert.deepEqual(parsed.compliance, raw.compliance);
  const fields = isoComplianceSourceFields(parsed, '2026-11-09T00:00:00Z');
  const application = normalizeLegacyApplication(fields);
  assert.equal(application.quoteReady, true);
  assert.equal(application.employeeCount, 30);
  assert.equal(application.siteCount, 2);
  assert.equal(application.siteAddress, '본사 주소');
  assert.equal(application.dataConsent, true);
  assert.equal(application.scope, '제품 제조');
  assert.deepEqual(application.standards, ['ISO 37001', 'ISO 37301']);
  const quote = toIsoQuoteInput(application);
  assert.deepEqual(quote.standards, ['ISO 37001', 'ISO 37301']);
  assert.equal(quote.customStandard, undefined);
  assert.equal(quote.standardCosts?.length, 2);
  assert.ok(quote.standardCosts?.every(cost => cost.stage1Days === 0 && cost.stage2Days === 0));
  assert.equal(quote.auditCalculation?.result.perStandard.length, 0);
  assert.ok(quote.auditCalculation?.result.warnings.some(warning => warning.includes('별도 절차')));
});

test('single-standard submissions drop the other supplement and hidden dependent answers', () => {
  for (const standard of ['ISO 37001', 'ISO 37301'] as const) {
    const raw = fixture(); raw.standards = [standard];
    raw.antiBribery!.fields.exports = '수출하지 않음'; raw.antiBribery!.fields.agents = '없음';
    const result = parseIsoComplianceApplication(raw);
    if (standard === 'ISO 37001') {
      assert.equal(result.compliance, undefined);
      assert.equal(result.antiBribery!.fields.exportCountries, '');
      assert.equal(result.antiBribery!.fields.agentCount, '');
    } else assert.equal(result.antiBribery, undefined);
  }
  const definitions = ISO_COMMON_SECTIONS.flatMap(section => section.fields);
  const fields = { integratedAudit: '아니요', integrationLevel: '기타', integrationOther: 'stale' };
  assert.equal(fieldIsVisible(definitions.find(field => field.key === 'integrationOther')!, fields, definitions), false);
});

test('required supplement answers and conditional export and agent details are validated', () => {
  const cases = [
    (raw: IsoComplianceApplicationInput) => { raw.antiBribery = undefined; },
    (raw: IsoComplianceApplicationInput) => { raw.compliance = undefined; },
    (raw: IsoComplianceApplicationInput) => { raw.antiBribery!.fields.exportCountries = ''; },
    (raw: IsoComplianceApplicationInput) => { raw.antiBribery!.fields.agentCount = ''; },
    (raw: IsoComplianceApplicationInput) => { raw.compliance!.fields.monitoring = '任意'; },
    (raw: IsoComplianceApplicationInput) => { raw.common.signatureDate = '2026-02-30'; },
  ];
  for (const change of cases) { const raw = fixture(); change(raw); assert.throws(() => parseIsoComplianceApplication(raw)); }
});

test('untrusted fields cannot set internal status or bypass consent, field sizes and counts', () => {
  const result = parseIsoComplianceApplication({ ...fixture(), status: 'completed', reference: 'forged', common: { ...fixture().common, secret: 'ignored' } });
  assert.equal('status' in result, false); assert.equal('secret' in result.common, false);
  for (const patch of [{ consent: 'true' }, { consent: false }, { standards: ['ISO 9001'] }, { standards: [] }, { sites: [] }, { sites: Array(21).fill({}) }]) assert.throws(() => parseIsoComplianceApplication({ ...fixture(), ...patch }));
  for (const count of ['-1', '1.5', 'NaN', '1000001']) {
    const raw = fixture(); raw.antiBribery!.personnel[0].counts[0] = count;
    assert.throws(() => parseIsoComplianceApplication(raw));
  }
  for (const patch of [{ contactEmail: 'invalid' }, { contactName: 'x'.repeat(501) }, { scopeKo: 'x'.repeat(6001) }]) assert.throws(() => parseIsoComplianceApplication({ ...fixture(), common: { ...fixture().common, ...patch } }));
});

test('personnel sums preserve blanks, explicit zero and independent site columns', () => {
  const supplement = createIsoSupplement();
  assert.deepEqual(personnelTotals(supplement.personnel, 5), ['', '', '', '', '']);
  supplement.personnel[0].counts = ['1', '0', '', '', ''];
  supplement.personnel[1].counts = ['2', '', '', '', ''];
  assert.deepEqual(personnelTotals(supplement.personnel, 5), ['3', '0', '', '', '']);
  const raw = fixture(); raw.antiBribery!.personnel[0].counts[4] = '12';
  assert.equal(parseIsoComplianceApplication(raw).antiBribery!.personnel[0].counts[4], '');
});

test('existing ISO quote calculations and custom standards keep their existing mapping', () => {
  const application = normalizeLegacyApplication({ ...isoComplianceSourceFields(parseIsoComplianceApplication(fixture()), '2026-11-09T00:00:00Z'), isoStandards: 'ISO 9001, ISO 27001, ISO 50001, ISO 21001' });
  const quote = toIsoQuoteInput(application);
  assert.deepEqual(quote.standards, ['ISO 9001', 'ISO 27001', 'ISO 50001']);
  assert.equal(quote.customStandard, 'ISO 21001');
  assert.equal(quote.standardCosts?.length, 1);
  assert.equal(quote.standardCosts?.[0].standard, 'ISO 9001');
  assert.ok(quote.standardCosts![0].stage1Days > 0);
});
