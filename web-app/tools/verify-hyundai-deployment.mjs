import assert from 'node:assert/strict';

// Read-only deployment smoke test. Invalid intake checks stop before storage.
const origin = new URL(process.argv[2] || '');
assert.equal(origin.protocol, 'https:');
assert.ok(['lrqa-korea-portal.netlify.app', 'ketsquot-pigeon.netlify.app'].some(host => origin.hostname === host || origin.hostname.endsWith(`--${host}`)));
const results = [];
async function check(path, status, options = {}) {
  const response = await fetch(new URL(path, origin), { redirect: 'manual', signal: AbortSignal.timeout(30_000), ...options });
  results.push({ method: options.method || 'GET', path, status: response.status });
  assert.equal(response.status, status, `${options.method || 'GET'} ${path}`);
  return response;
}
const [existing, newcomer, original] = await Promise.all([
  check('/hyundai-ghg/existing', 200), check('/hyundai-ghg/new', 200), check('/p827', 200),
]);
const [existingHtml, newHtml, originalHtml] = await Promise.all([existing.text(), newcomer.text(), original.text()]);
assert.ok(existingHtml.includes('검증대상년도 추가'));
assert.ok(existingHtml.includes('전년 대비 변동사항'));
const originalForm = originalHtml.match(/<form\b[\s\S]*?<\/form>/)?.[0];
assert.ok(originalForm);
assert.equal(newHtml.match(/<form\b[\s\S]*?<\/form>/)?.[0], originalForm, 'New customer and original P827 forms differ.');
const admin = await check('/hyundai-ghg/admin', 307);
assert.match(admin.headers.get('location') || '', /\/iso\/login/);
await check('/api/hyundai-ghg/applications', 401);
await check('/api/hyundai-ghg/applications', 401, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
await check('/api/hyundai-ghg/applications', 400, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerType: 'existing' }) });
await check('/api/hyundai-ghg/applications', 400, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerType: 'new' }) });
await check('/system', 307);
await check('/lrqa-logo.png', 200, { method: 'HEAD' });
for (const path of ['/templates/LRQA_P827_GHG_Quote_Template.docx', '/templates/DataVerification_template.docx']) {
  const template = await check(path, 307, { method: 'HEAD' });
  assert.match(template.headers.get('location') || '', /\/iso\/login/);
}
console.log(JSON.stringify({ origin: origin.origin, checks: results, p827FormParity: true, productionDataWritten: false }, null, 2));
