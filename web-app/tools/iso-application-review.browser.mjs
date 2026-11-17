// Run from web-app against a local server using the same ISO_SESSION_SECRET.
// PLAYWRIGHT_MODULE may point to an installed Playwright module; otherwise install Playwright locally.
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = new URL(process.argv[2] || 'http://localhost:3088');
assert.ok(['localhost', '127.0.0.1'].includes(origin.hostname), 'This test writes fixtures and must only run locally');
assert.ok(process.env.ISO_SESSION_SECRET, 'Use the same local ISO_SESSION_SECRET as the server');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const root = path.resolve('.local-data/iso');
const files = [];
const personnel = Array.from({ length: 9 }, () => ({ counts: ['1', '', '', '', ''], note: '' }));
const input = {
  standards: ['ISO 37001', 'ISO 37301'],
  common: {
    companyNameKo: '[LOCAL TEST] 신청서 검토', contactName: '테스트', contactPhone: '010-0000-0000',
    contactEmail: 'local@example.invalid', scopeKo: '제품 제조 '.repeat(180) + 'END-OF-LONG-SCOPE',
    author: '테스트', signatureDate: '2026-11-17',
  },
  sites: [{ address: '로컬 테스트 주소', totalEmployees: '10' }],
  antiBribery: { fields: { briberyIssues: '해당되는 이슈가 없었음', exports: '수출하지 않음', industry: '제조업', agents: '없음', publicOfficials: '아니요' }, personnel },
  compliance: { fields: { violations: '없음', monitoring: '있음', riskAssessment: '있음', internalControls: '있음' }, personnel },
  consent: true,
};

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const intake = await context.request.post(new URL('/api/iso/compliance-applications', origin).href, { data: input });
  assert.equal(intake.status(), 201, await intake.text());
  const { reference } = await intake.json();
  assert.match(reference, /^APP-[A-F0-9]{16}$/);
  const applicationFile = path.join(root, 'iso-applications/applications', `${reference}.json`);
  files.push(applicationFile);
  const payload = Buffer.from(JSON.stringify({ username: 'local-review-test', role: 'admin', expiresAt: Date.now() + 3600000 })).toString('base64url');
  const signature = createHmac('sha256', process.env.ISO_SESSION_SECRET).update(payload).digest('base64url');
  await context.addCookies([{ name: 'lrqa_iso_admin', value: `${payload}.${signature}`, url: origin.origin }]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const tab = name => page.getByRole('tab', { name, exact: true });
  const form = page.locator('[role="tabpanel"][aria-labelledby$="-1"]');
  async function openApplication(id) {
    await page.goto(new URL(`/iso/applications/${id}`, origin).href);
    await page.waitForFunction(() => {
      const element = document.querySelector('[role="tab"]');
      return element && Object.keys(element).some(key => key.startsWith('__reactProps'));
    });
  }
  await openApplication(reference);
  assert.equal(await tab('접수 요약').getAttribute('aria-selected'), 'true');
  assert.equal(await form.isVisible(), false);
  assert.equal(await page.getByText('AI 신청서 검토', { exact: true }).count(), 0);
  const longAnswer = page.locator('details').filter({ hasText: 'END-OF-LONG-SCOPE' }).first();
  assert.equal(await longAnswer.getAttribute('open'), null);
  await longAnswer.locator('summary').click();
  assert.equal(await longAnswer.locator('p').isVisible(), true);
  await longAnswer.locator('summary').click();

  await tab('신청서 전체').click();
  await page.locator('#iso37001 > summary').click();
  assert.equal(await page.locator('#iso37001').getAttribute('open'), '');
  await page.getByRole('button', { name: '전체 펼치기', exact: true }).click();
  assert.equal(await form.locator('details:not([open])').count(), 0);
  await page.getByRole('button', { name: '전체 접기', exact: true }).click();
  await tab('심사일수·견적').click();
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await page.emulateMedia({ media: 'print' });
  assert.equal(await form.isVisible(), true);
  assert.equal(await form.locator('details:not([open])').count(), 0);
  assert.equal(await page.locator('#iso37001 input').first().isVisible(), true);
  assert.equal(await page.locator('#iso37301 input').first().isVisible(), true);
  assert.equal(await page.getByText('견적 초안 이력', { exact: true }).isVisible(), false);
  assert.equal(await page.getByRole('tablist').isVisible(), false);
  if (process.env.ISO_REVIEW_PRINT_PDF) await page.pdf({ path: process.env.ISO_REVIEW_PRINT_PDF, format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  assert.equal(await form.locator('details[open]').count(), 0);
  assert.equal(await tab('심사일수·견적').getAttribute('aria-selected'), 'true');
  await tab('심사일수·견적').focus();
  await page.keyboard.press('Home');
  assert.equal(await tab('접수 요약').getAttribute('aria-selected'), 'true');

  // An old approved AI record must no longer change a new quote.
  const aiFile = path.join(root, 'iso-audit-analysis/applications', `${reference}.json`);
  await mkdir(path.dirname(aiFile), { recursive: true });
  files.push(aiFile);
  await writeFile(aiFile, JSON.stringify({ applicationId: reference, status: 'approved', suggestedScope: 'OLD-AI-SCOPE', suggestedInput: { integration: { level: 100, teamAbility: 100 } } }));
  const quote = await context.request.post(new URL('/api/iso/quote-drafts', origin).href, { data: { applicationId: reference } });
  assert.equal(quote.status(), 201);
  const { draft } = await quote.json();
  assert.match(draft.id, /^QD-[A-F0-9]{16}$/);
  files.push(path.join(root, 'iso-quote-drafts/drafts', `${draft.id}.json`));
  assert.equal(draft.quoteInput.scope, input.common.scopeKo);
  assert.notEqual(draft.quoteInput.auditCalculation.input.integration?.level, 100);
  assert.equal((await context.request.get(new URL(`/api/iso/audit-analysis/${reference}`, origin).href)).status(), 404);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);

  // The legacy ISO 9001/14001/45001 replica must also print every page.
  const legacy = JSON.parse(await readFile(applicationFile, 'utf8'));
  delete legacy.complianceApplication;
  legacy.id = `APP-${randomBytes(8).toString('hex').toUpperCase()}`;
  legacy.standards = ['ISO 9001'];
  const legacyFile = path.join(root, 'iso-applications/applications', `${legacy.id}.json`);
  files.push(legacyFile);
  await writeFile(legacyFile, JSON.stringify(legacy));
  await page.evaluate(() => localStorage.setItem('lrqa_portal_design', 'legacy'));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openApplication(legacy.id);
  await page.waitForFunction(() => document.documentElement.dataset.portalDesign === 'legacy');
  await tab('신청서 전체').click();
  assert.equal(await form.locator('details').count(), 8);
  await page.getByRole('button', { name: '전체 접기', exact: true }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await page.emulateMedia({ media: 'print' });
  assert.equal(await form.locator('details:not([open])').count(), 0);
  assert.equal(await form.getByText('인증 심사 신청서 |8', { exact: true }).isVisible(), true);
  assert.equal(await page.locator('.portal-legacy-internal-header').isVisible(), false);
  assert.deepEqual(errors, []);
  console.log('PASS: review tabs, long answers, accordions, complete printing, state restoration, keyboard navigation, mobile, legacy form, and quotes without AI');
} finally {
  await browser.close();
  for (const file of files) await unlink(file).catch(() => {});
}
