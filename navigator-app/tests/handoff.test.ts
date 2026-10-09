import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeHandoff, decodeHandoff, handoffUrl, type NavigatorHandoff } from '../src/shared/cbam-handoff';
import { QUESTIONS } from '../src/shared/cbam-navigator';

function fixture(): NavigatorHandoff {
  return { version: 1, createdAt: Date.now(), prefill: { companyName: '시험 제조 주식회사', contactName: '시험 담당자', phone: '010-0000-0000', country: '대한민국', sites: '서울 공장', cnCodes: '73181590', email: 'private@example.invalid', consent: true, serviceType: 'verification', notes: '자료 준비 협조 요청' }, navigatorData: { sessionId: 'NAV-12345678-1234-4234-8234-123456789012', productName: '철강 볼트', readinessAnswers: Object.fromEntries(QUESTIONS.map(q => [q.id, 'missing'])), readinessScore: 100 } };
}
test('handoff carries applicant fields and diagnosis, strips consent and other application choices, and recomputes score', () => {
  const data = fixture(), decoded = decodeHandoff(encodeHandoff(data));
  assert.equal(decoded.prefill.sites, '서울 공장');
  assert.equal(decoded.prefill.companyName, '시험 제조 주식회사');
  assert.equal(decoded.prefill.contactName, '시험 담당자');
  assert.equal(decoded.prefill.phone, '010-0000-0000');
  assert.equal(decoded.prefill.email, 'private@example.invalid');
  assert.equal(decoded.prefill.consent, undefined);
  assert.equal(decoded.prefill.serviceType, undefined);
  assert.equal(decoded.prefill.notes, '자료 준비 협조 요청');
  assert.equal(decoded.navigatorData.productName, '철강 볼트');
  assert.equal(decoded.navigatorData.readinessScore, 0);
  assert.equal(decoded.navigatorData.gapCodes?.length, 24);
  const url = new URL(handoffUrl(data));
  assert.equal(url.origin + url.pathname, 'https://ketsquot-pigeon.netlify.app/cbam');
  assert.equal(url.search, '');
  assert.ok(url.hash.startsWith('#navigator='));
});
test('partial and old handoffs remain compatible; applicant values are trimmed and bounded', () => {
  const data = fixture();
  const decoded = decodeHandoff(encodeHandoff({ ...data, prefill: { companyName: '  시험 회사  ', contactName: ' '.repeat(4), email: 'x'.repeat(255), phone: '1'.repeat(41), sites: '서울 공장' } }));
  assert.equal(decoded.prefill.companyName, '시험 회사');
  assert.equal(decoded.prefill.contactName, undefined);
  assert.equal(decoded.prefill.email, undefined);
  assert.equal(decoded.prefill.phone, undefined);
  assert.equal(decoded.prefill.sites, '서울 공장');
  const old = decodeHandoff(encodeHandoff({ ...data, prefill: { cnCodes: '73181590' } }));
  assert.equal(old.prefill.companyName, undefined);
  assert.equal(old.prefill.cnCodes, '73181590');
});
test('handoff rejects malformed, oversized, expired and future payloads', () => {
  assert.throws(() => decodeHandoff('!invalid'));
  assert.throws(() => decodeHandoff('x'.repeat(24001)));
  const data = fixture(), encoded = encodeHandoff(data);
  assert.throws(() => decodeHandoff(encoded, data.createdAt + 31 * 60000));
  assert.throws(() => decodeHandoff(encoded, data.createdAt - 120000));
});
