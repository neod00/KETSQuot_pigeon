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
  await page.goto(base + '/evidence');
  await expect(page).toHaveURL(base + '/readiness?view=results#required-materials');
  const card = page.locator('.material-item[data-question="S1"]');
  await expect(card).toHaveCount(0);
  await expect(page.locator('.required-materials select')).toHaveCount(0);
  await page.getByLabel('준비됨 항목까지 전체 자료 보기', { exact: true }).check();
  await expect(card).toContainText('준비됨');
  await card.getByRole('button', { name: '진단 응답 수정' }).click();
  await page.getByRole('radio', { name: /일부 준비/ }).check();
  await page.getByRole('button', { name: '현재 응답으로 자료 준비 목록 보기' }).click();
  await expect(card).toContainText('일부 준비');
  await expect(page.getByRole('navigation', { name: '주요 기능' }).getByRole('link', { name: /증빙자료/ })).toHaveCount(0);
  await page.screenshot({ path: path.join(out, 'unified-preparation-list.png'), fullPage: true });
  console.log('PASS: old evidence route redirects to unified results; preparation follows original answers without a second status check');

  await page.goto(base + '/applicability');
  await page.getByLabel('EU로 반입되는 거래인가요?').selectOption('yes');
  await page.getByLabel('검토할 CN 코드', { exact: true }).fill('72');
  await page.getByLabel('관세 원산지').selectOption('KR');
  await page.getByLabel('귀사의 역할').selectOption('operator');
  await page.getByLabel('EU 수입자별 연간 대상 수입량 합계(t)').fill('20000');
  await page.getByLabel('입력량은 해당 수입자의').check();
  await page.getByRole('button', { name: '적용 가능성 확인', exact: true }).click();
  await expect(page.locator('.applicability-issues li')).toHaveCount(1);
  await expect(page.locator('.applicability-result')).toContainText('CN 코드 72만으로는 대상 여부를 구분할 수 없습니다');
  await expect(page.locator('.applicability-result')).toContainText('실제 8자리 CN 코드');
  await expect(page.locator('.applicability-references')).not.toContainText('Annex VII');
  await page.getByRole('button', { name: 'CN 코드 확인·수정' }).click();
  await expect(page.getByLabel('검토할 CN 코드', { exact: true })).toBeFocused();
  await page.screenshot({ path: path.join(out, 'applicability-cn-blocker.png'), fullPage: true });
  await page.getByLabel('검토할 CN 코드', { exact: true }).fill('73181590');
  await expect(page.locator('.applicability-result')).toHaveCount(0);
  await page.getByRole('button', { name: '적용 가능성 확인', exact: true }).click();
  await expect(page.locator('.applicability-issues li')).toHaveCount(0);
  await expect(page.locator('.applicability-result')).toContainText('20,000t은 50t 기준을 초과합니다');
  await expect(page.getByRole('link', { name: /근거: 2023\/956 제2a조 · Annex VII/ })).toHaveAttribute('href', REGULATIONS[0].sourceUrl);
  console.log('PASS: applicability identifies code 72 as the blocker, focuses its input, clears stale results, and explains the corrected 20,000t outcome');

  await page.getByLabel('EU로 반입되는 거래인가요?').selectOption('unknown');
  await page.getByLabel('검토할 CN 코드', { exact: true }).fill('72');
  await page.getByRole('button', { name: '적용 가능성 확인', exact: true }).click();
  await expect(page.locator('.applicability-issues li')).toHaveCount(2);
  await page.getByRole('button', { name: 'EU 반입 여부 확인·수정' }).click();
  await expect(page.getByLabel('EU로 반입되는 거래인가요?')).toBeFocused();
  await page.getByLabel('EU로 반입되는 거래인가요?').selectOption('yes');
  await page.getByLabel('검토할 CN 코드', { exact: true }).fill('73181590');
  await page.getByLabel('EU 수입자별 연간 대상 수입량 합계(t)').fill('-1');
  await page.getByRole('button', { name: '적용 가능성 확인', exact: true }).click();
  await expect(page.locator('.applicability-issues li')).toHaveCount(1);
  await expect(page.locator('.applicability-result')).toContainText('0 이상의 유한한 숫자');
  await page.getByLabel('EU 수입자별 연간 대상 수입량 합계(t)').fill('20000');
  await page.getByLabel('입력량은 해당 수입자의').uncheck();
  await page.getByRole('button', { name: '적용 가능성 확인', exact: true }).click();
  await expect(page.locator('.applicability-result')).toContainText('전체 합계인지 확인되지 않았습니다');
  await page.getByRole('button', { name: '수입량 합산 여부 확인·수정' }).click();
  await expect(page.getByLabel('입력량은 해당 수입자의')).toBeFocused();
  console.log('PASS: unknown entry, invalid mass and unconfirmed aggregation show specific actions and accessible focus targets');

  await page.getByLabel('EU로 반입되는 거래인가요?').selectOption('');
  await page.getByLabel('검토할 CN 코드', { exact: true }).fill('');
  await page.getByLabel('관세 원산지').selectOption('');
  await page.getByLabel('귀사의 역할').selectOption('');
  await page.getByRole('button', { name: '적용 가능성 확인', exact: true }).click();
  await expect(page.locator('.applicability-issues li')).toHaveCount(4);
  await page.getByRole('button', { name: '관세 원산지 확인·수정' }).click();
  await expect(page.getByLabel('관세 원산지')).toBeFocused();
  console.log('PASS: empty required fields show all four follow-up tasks instead of a generic or native validation message');

  await page.getByLabel('EU로 반입되는 거래인가요?').selectOption('yes');
  await page.getByLabel('관세 원산지').selectOption('KR');
  await page.getByLabel('귀사의 역할').selectOption('operator');
  await page.getByLabel('입력량은 해당 수입자의').check();
  await page.getByLabel('검토할 CN 코드', { exact: true }).fill('72');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole('button', { name: '적용 가능성 확인', exact: true }).click();
    await expect(page.locator('.applicability-result')).toContainText('실제 8자리 CN 코드');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('button', { name: 'CN 코드 확인·수정' }).click();
    await expect(page.getByLabel('검토할 CN 코드', { exact: true })).toBeFocused();
    await page.screenshot({ path: path.join(out, `applicability-guidance-${width}.png`), fullPage: true });
  }
  console.log('PASS: applicability reasons, actions and input focus work at 320px and 390px without overflow');

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
