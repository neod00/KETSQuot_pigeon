import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import { CBAM_SCOPE_SOURCE, TARIC_SOURCE } from '../src/shared/cbam-cn';
import { REGULATIONS } from '../src/shared/cbam-regulatory';

const base = 'http://localhost:3112';
const out = path.resolve('..', 'tmp', 'navigator-priority-fixes');
await mkdir(out, { recursive: true });
const env: NodeJS.ProcessEnv = { ...process.env, NAVIGATOR_SESSION_SECRET: randomBytes(32).toString('hex'), NAVIGATOR_LOCAL_PREVIEW: '1' };
delete env.OPENAI_API_KEY;
delete env.NETLIFY;
delete env.NETLIFY_BLOBS_CONTEXT;
delete env.NETLIFY_SITE_ID;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', '3112', '--hostname', 'localhost'], {
  cwd: process.cwd(), env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
server.stdout!.on('data', chunk => { log += chunk; });
server.stderr!.on('data', chunk => { log += chunk; });
let browser;
try {
  let started = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base)).ok) { started = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(started, log);
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'ko-KR' });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await expect(page.getByRole('button', { name: 'CBAM 대상 확인' })).toBeEnabled();
  let searches = 0;
  page.on('request', request => { if (request.url().endsWith('/cn-search') && request.method() === 'POST') searches++; });
  let response = page.waitForResponse(r => r.url().endsWith('/cn-search') && r.request().method() === 'POST');
  await page.getByLabel('제품명 또는 CN 코드', { exact: true }).fill('볼트');
  await page.getByRole('button', { name: 'CBAM 대상 확인' }).click();
  const product = await (await response).json();
  assert.ok(product.candidates.length);
  await expect(page.locator('.result').first()).toBeVisible();
  await expect(page.locator('.result').first()).toContainText('분류 후보 · 확인 필요');
  assert.equal(searches, 1, 'home must perform exactly one search');
  console.log('PASS: home product search runs once without a second click; candidate classification is explicit');

  const result = page.locator('.result').first();
  await expect(result.getByRole('link', { name: /Annex I 7318/ })).toHaveAttribute('href', CBAM_SCOPE_SOURCE);
  await expect(result.getByRole('link', { name: /2025\/2547/ })).toHaveAttribute('href', REGULATIONS[2].sourceUrl);
  assert.equal(product.candidates[0].assessment.sourceUrl, CBAM_SCOPE_SOURCE);
  assert.equal(product.candidates[0].assessment.calculationSourceUrl, REGULATIONS[2].sourceUrl);
  console.log('PASS: product results preserve separate scope and calculation references');

  await page.getByPlaceholder('예: 스테인리스 선재').fill('플라스틱 볼트');
  await page.getByLabel('재질 (선택)', { exact: true }).fill('폴리프로필렌');
  response = page.waitForResponse(r => r.url().endsWith('/cn-search') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'CN 코드 후보 찾기', exact: true }).click();
  const plastic = await (await response).json();
  assert.equal(plastic.candidates.length, 0);
  await expect(page.locator('.result')).toHaveCount(0);
  await expect(page.locator('main')).toContainText('후보를 찾지 못했습니다');
  console.log('PASS: plastic/polypropylene bolts do not display a steel scope result');

  await page.getByRole('button', { name: 'CN 코드로 검색', exact: true }).click();
  await page.getByPlaceholder('예: 7318 15 90').fill('99999999, 73181590');
  response = page.waitForResponse(r => r.url().endsWith('/cn-search') && r.request().method() === 'POST');
  await page.getByRole('button', { name: '대상 여부 확인', exact: true }).click();
  const codes = await (await response).json();
  assert.ok(codes.assessments.every((a: { codeValidity: string; sourceUrl: string }) => a.codeValidity === 'unverified' && a.sourceUrl === CBAM_SCOPE_SOURCE));
  await expect(page.locator('.result')).toHaveCount(2);
  await expect(page.locator('.result').first().locator('.badge')).toHaveText('CN 코드 유효성 미확인');
  await expect(page.locator('.result').first()).not.toContainText('CBAM 비대상');
  await expect(page.locator('.result').first().getByRole('link', { name: /EU TARIC/ })).toHaveAttribute('href', TARIC_SOURCE);
  await page.screenshot({ path: path.join(out, 'code-validity-and-references.png'), fullPage: true });
  console.log('PASS: unknown codes show unverified validity with TARIC access, not a definitive out-of-scope badge');

  await page.locator('.result').nth(1).getByRole('button', { name: '이 코드로 계속하기' }).click();
  await expect(page).toHaveURL(base + '/applicability');
  await expect(page.getByLabel('검토할 CN 코드', { exact: true })).toHaveValue('73181590');
  console.log('PASS: continue selects the chosen code and navigates to applicability');

  await page.getByRole('navigation').getByRole('link', { name: /검증 준비도/ }).click();
  await page.locator('input[type="radio"]').first().check();
  await page.getByRole('navigation').getByRole('link', { name: /증빙자료/ }).click();
  const card = page.locator('.evidence-grid article').filter({ has: page.getByRole('heading', { name: 'CN 코드 목록', exact: true }) });
  await expect(card).toContainText('자가진단 응답: 준비됨');
  await card.getByRole('combobox').selectOption('missing');
  await page.getByLabel('미확보·확인 전 자료만 보기', { exact: true }).check();
  await expect(card).toBeVisible();
  await card.getByRole('combobox').selectOption('partial');
  await expect(card).toBeVisible();
  await page.screenshot({ path: path.join(out, 'actual-evidence-filter.png'), fullPage: true });
  await card.getByRole('combobox').selectOption('ready');
  await expect(card).toHaveCount(0);
  await page.getByLabel('미확보·확인 전 자료만 보기', { exact: true }).uncheck();
  await card.getByRole('combobox').selectOption('not_applicable');
  await page.getByLabel('미확보·확인 전 자료만 보기', { exact: true }).check();
  await expect(card).toHaveCount(0);
  console.log('PASS: actual missing/partial evidence remains visible despite ready self-assessment; confirmed and N/A evidence are filtered out');

  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto(base);
    await expect(page.getByRole('button', { name: 'CBAM 대상 확인' })).toBeEnabled();
    const before = searches;
    response = page.waitForResponse(r => r.url().endsWith('/cn-search') && r.request().method() === 'POST');
    await page.getByLabel('제품명 또는 CN 코드', { exact: true }).fill('7318 15 90');
    await page.getByRole('button', { name: 'CBAM 대상 확인' }).click();
    assert.equal((await (await response).json()).assessments[0].normalized, '73181590');
    await expect(page.locator('.result').first()).toBeVisible();
    assert.equal(searches, before + 1);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(out, `home-code-search-${viewport.width}.png`), fullPage: true });
  }
  assert.deepEqual(errors, []);
  console.log('PASS: desktop/mobile home code search runs once; no page errors or document overflow');
  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill();
}
