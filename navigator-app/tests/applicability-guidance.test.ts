import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApplicabilityGuidance, type ApplicabilityInput } from '../src/lib/applicability-guidance';
import { REGULATIONS } from '../src/shared/cbam-regulatory';

const input: ApplicabilityInput = { euExport: 'yes', cnCode: '73181590', origin: 'KR', importer: 'operator', mass: '20000', allImports: true };

test('a broad steel code identifies the actual blocker even with 20,000t entered', () => {
  const result = buildApplicabilityGuidance({ ...input, cnCode: '72' });
  assert.deepEqual(result.issues.map(i => i.field), ['cnCode']);
  assert.match(result.issues[0].title, /72/);
  assert.match(result.issues[0].detail, /대상·비대상/);
  assert.match(result.issues[0].action, /8자리/);
  assert.ok(result.references.some(r => r.label.includes('Annex I')));
  assert.ok(result.references.every(r => !r.label.includes('Annex VII')));
});

test('all missing basic inputs are reported together with field-specific next actions', () => {
  const result = buildApplicabilityGuidance({ ...input, euExport: '', cnCode: '', origin: '', importer: '' });
  assert.deepEqual(result.issues.map(i => i.field), ['euExport', 'cnCode', 'origin', 'importer']);
  for (const issue of result.issues) assert.ok(issue.title && issue.detail && issue.action);
  assert.equal(new Set(result.references.map(r => r.label)).size, result.references.length);
});

test('unknown EU entry, invalid and attribute-dependent codes explain distinct causes', () => {
  assert.match(buildApplicabilityGuidance({ ...input, euExport: 'unknown' }).issues[0].detail, /확인 필요/);
  assert.match(buildApplicabilityGuidance({ ...input, cnCode: '7318159000' }).issues[0].action, /HSK/);
  const clay = buildApplicabilityGuidance({ ...input, cnCode: '25070080' });
  assert.match(clay.issues[0].detail, /소성/);
  assert.match(clay.issues[0].action, /다시 입력해도/);
  const unknownCode = buildApplicabilityGuidance({ ...input, cnCode: '99999999' });
  assert.match(unknownCode.issues[0].action, /비대상으로 확정하지/);
});

test('unknown quantity and unconfirmed aggregation are separate follow-up tasks', () => {
  const blank = buildApplicabilityGuidance({ ...input, mass: '', allImports: false });
  assert.deepEqual(blank.issues.map(i => i.field), ['mass', 'allImports']);
  assert.match(blank.issues[0].detail, /생산량·수출량/);
  assert.deepEqual(buildApplicabilityGuidance({ ...input, allImports: false }).issues.map(i => i.field), ['allImports']);
  for (const mass of ['-1', 'NaN', 'Infinity']) assert.equal(buildApplicabilityGuidance({ ...input, mass }).issues[0].field, 'mass');
  assert.ok(blank.references.every(r => r.label.includes('Annex VII')));
});

test('applicable quantity summaries explain both sides of the 50t boundary using the amended base regulation', () => {
  for (const [mass, text] of [['0', '초과하지'], ['50', '초과하지'], ['50.1', '초과합니다'], ['20000', '20,000t']]) {
    const result = buildApplicabilityGuidance({ ...input, mass });
    assert.deepEqual(result.issues, []);
    assert.ok(result.summary.includes(text));
    const threshold = result.references.find(r => r.label.includes('Annex VII'))!;
    assert.match(threshold.label, /2023\/956 제2a조/);
    assert.equal(threshold.url, REGULATIONS[0].sourceUrl);
  }
});

test('non-EU, origin exclusion and electricity/hydrogen outcomes use only relevant references', () => {
  const outside = buildApplicabilityGuidance({ ...input, euExport: 'no', cnCode: '', origin: '', importer: '' });
  assert.deepEqual(outside.issues, []);
  assert.ok(outside.references.every(r => !r.label.includes('50톤')));
  const origin = buildApplicabilityGuidance({ ...input, origin: 'NO', mass: '', allImports: false });
  assert.deepEqual(origin.issues.map(i => i.field), ['origin']);
  assert.ok(origin.references.every(r => r.label.includes('Annex III')));
  for (const cnCode of ['27160000', '28041000']) {
    const exemptFromThreshold = buildApplicabilityGuidance({ ...input, cnCode, mass: '', allImports: false });
    assert.deepEqual(exemptFromThreshold.issues, []);
    assert.match(exemptFromThreshold.summary, /면제가 적용되지/);
    assert.ok(exemptFromThreshold.references.every(r => !r.label.includes('Annex VII')));
  }
});
