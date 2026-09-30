import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeHandoff, decodeHandoff, handoffUrl, type NavigatorHandoff } from '../src/shared/cbam-handoff';
import { QUESTIONS } from '../src/shared/cbam-navigator';

function fixture(): NavigatorHandoff {
  return { version: 1, createdAt: Date.now(), prefill: { country: '대한민국', sites: '서울 공장', cnCodes: '73181590', email: 'private@example.invalid', consent: true }, navigatorData: { sessionId: 'NAV-12345678-1234-4234-8234-123456789012', productName: '철강 볼트', readinessAnswers: Object.fromEntries(QUESTIONS.map(q => [q.id, 'missing'])), readinessScore: 100 } };
}
test('handoff preserves Korean diagnostic data, strips contacts/consent and recomputes score', () => {
  const data = fixture(), decoded = decodeHandoff(encodeHandoff(data));
  assert.equal(decoded.prefill.sites, '서울 공장');
  assert.equal(decoded.prefill.email, undefined);
  assert.equal(decoded.prefill.consent, undefined);
  assert.equal(decoded.navigatorData.productName, '철강 볼트');
  assert.equal(decoded.navigatorData.readinessScore, 0);
  assert.equal(decoded.navigatorData.gapCodes?.length, 24);
  const url = new URL(handoffUrl(data));
  assert.equal(url.origin + url.pathname, 'https://ketsquot-pigeon.netlify.app/cbam');
  assert.equal(url.search, '');
  assert.ok(url.hash.startsWith('#navigator='));
});
test('handoff rejects malformed, oversized, expired and future payloads', () => {
  assert.throws(() => decodeHandoff('!invalid'));
  assert.throws(() => decodeHandoff('x'.repeat(24001)));
  const data = fixture(), encoded = encodeHandoff(data);
  assert.throws(() => decodeHandoff(encoded, data.createdAt + 31 * 60000));
  assert.throws(() => decodeHandoff(encoded, data.createdAt - 120000));
});
