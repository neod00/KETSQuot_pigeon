import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, createHmac } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SAM_PLAYWRIGHT_MODULE || 'playwright');
const base = 'http://localhost:3186';
const out = path.resolve('../tmp/sam-outlook-qa');
await mkdir(out, { recursive: true });
const env = {
  ...process.env,
  ISO_SESSION_SECRET: 'sam-outlook-local-browser-test-only',
  ISO_ADMIN_USERNAME: 'sam-browser-qa',
  ISO_ADMIN_PASSWORD_SHA256: createHash('sha256').update('sam-browser-test-password').digest('hex'),
};
for (const name of ['NETLIFY', 'NETLIFY_BLOBS_CONTEXT', 'NETLIFY_SITE_ID', 'SITE_ID']) delete env[name];
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', 'localhost', '--port', '3186'], {
  env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', chunk => { serverLog += chunk; });
server.stderr.on('data', chunk => { serverLog += chunk; });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try { const response = await fetch(base + '/outlook/sam'); if (response.ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, serverLog);
  const cookie = (role) => {
    const payload = Buffer.from(JSON.stringify({ username: 'qa', role, expiresAt: Date.now() + 60_000 })).toString('base64url');
    return `lrqa_iso_admin=${payload}.${createHmac('sha256', env.ISO_SESSION_SECRET).update(payload).digest('base64url')}`;
  };
  const nonce = '12345678-1234-1234-1234-123456789abc';
  const connectRequest = (headers = {}, body = { nonce }) => fetch(base + '/api/iso/sam/outlook/session', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
  assert.equal((await connectRequest()).status, 401);
  assert.equal((await connectRequest({ cookie: cookie('member') })).status, 403);
  assert.equal((await connectRequest({ cookie: cookie('admin') }, null)).status, 400);
  const connected = await connectRequest({ cookie: cookie('admin') });
  assert.equal(connected.status, 200);
  assert.equal(connected.headers.get('cache-control'), 'no-store');
  const connectionPayload = await connected.json();
  assert.equal(connectionPayload.nonce, nonce);
  assert.equal(connectionPayload.username, 'qa');
  for (const [endpoint, method, expected] of [['/api/iso/sam/outlook/accounts', 'GET', 401], ['/api/iso/sam/mail', 'GET', 403], ['/api/iso/sam/mail', 'PUT', 403]]) {
    assert.equal((await fetch(base + endpoint, { method, headers: { Authorization: 'Bearer tampered' } })).status, expected);
  }
  const headers = { Authorization: `Bearer ${connectionPayload.token}`, 'Content-Type': 'application/json' };
  assert.equal((await fetch(base + '/api/iso/sam/mail', { method: 'POST', headers, body: JSON.stringify({ action: 'issue-sync-key' }) })).status, 401);
  assert.equal((await connectRequest(headers)).status, 401);
  assert.equal((await fetch(base + '/api/iso/sam/mail', { method: 'PUT', headers, body: '{}' })).status, 400);
  console.log('PASS: actual HTTP routes require admin login, reject tampered tokens, and limit valid tokens to the scoped mail API.');
  browser = await chromium.launch({ headless: true, ...(process.env.SAM_CHROMIUM_PATH ? { executablePath: process.env.SAM_CHROMIUM_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 400, height: 900 } });
  const errors = [];
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  await context.addInitScript(() => {
    const officeHandlers = {};
    const dialogHandlers = {};
    window.__samOfficeHandlers = officeHandlers;
    window.addEventListener('message', event => {
      dialogHandlers.DialogMessageReceived?.({ message: event.data, origin: event.origin });
    });
    window.Office = {
      EventType: { DragAndDropEvent: 'DragAndDropEvent', ItemChanged: 'ItemChanged', DialogMessageReceived: 'DialogMessageReceived', DialogEventReceived: 'DialogEventReceived' },
      AsyncResultStatus: { Succeeded: 'succeeded', Failed: 'failed' },
      onReady(callback) { callback({ host: 'Outlook' }); return Promise.resolve(); },
      context: {
        mailbox: {
          addHandlerAsync(type, handler, callback) { officeHandlers[type] = handler; callback?.({ status: 'succeeded' }); },
          removeHandlerAsync(type) { delete officeHandlers[type]; },
        },
        ui: {
          displayDialogAsync(url, options, callback) {
            const popup = window.open(url, '_blank');
            callback({ status: 'succeeded', value: { close() { popup.close(); }, addEventHandler(type, handler) { dialogHandlers[type] = handler; } } });
          },
          messageParent(message, options) { window.opener.postMessage(message, options.targetOrigin); },
        },
      },
    };
  });
  const accounts = [{ id: 'qa-alpha', name: { ko: '테스트 고객 A', en: 'Test A' } }, { id: 'qa-beta', name: { ko: '테스트 고객 B', en: 'Test B' } }];
  await context.route('**/api/iso/sam/outlook/accounts', route => {
    assert.match(route.request().headers().authorization, /^Bearer /);
    return route.fulfill({ json: { accounts } });
  });
  let uploaded = [];
  let drafts = [];
  await context.route('**/api/iso/sam/mail**', async route => {
    assert.match(route.request().headers().authorization, /^Bearer /);
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON();
      uploaded.push(body);
      drafts = [{ id: 'qa-draft', accountId: body.accountId, status: 'pending', messageRefs: body.messages, analysis: { briefing: { ko: '테스트 견적 요청 초안', en: '' }, nextActions: { ko: '', en: '' } } }];
      await route.fulfill({ status: 201, json: { draft: drafts[0], duplicate: false } });
    } else await route.fulfill({ json: { drafts } });
  });
  const page = await context.newPage();
  await page.goto(base + '/outlook/sam');
  await page.getByText('Outlook 드래그 연결 준비 완료', { exact: true }).waitFor();
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'SAM 연결', exact: true }).click();
  const popup = await popupPromise;
  await popup.getByLabel('LRQA 이메일 또는 관리자 ID').fill('sam-browser-qa');
  await popup.getByLabel('비밀번호', { exact: true }).fill('sam-browser-test-password');
  await popup.getByRole('button', { name: '로그인', exact: true }).click();
  await page.getByText('sam-browser-qa · 연결됨', { exact: true }).waitFor();
  await page.getByLabel('메일을 등록할 Account').selectOption('qa-alpha');
  await page.evaluate(() => {
    const raw = 'From: sender@example.test\r\nTo: sam@example.test\r\nSubject: SAM browser test\r\nMessage-ID: <sam-browser@test>\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n견적서를 보내 주세요.';
    window.__samOfficeHandlers.DragAndDropEvent({ dragAndDropEventData: { type: 'drop', dataTransfer: { files: [{ name: 'test.eml', type: 'message/rfc822', fileContent: new Blob([raw]) }] } } });
  });
  await page.getByRole('button', { name: '선택한 메일 1개 AI로 정리', exact: true }).waitFor();
  assert.equal(uploaded.length, 0, 'mail contents must wait for the user to click AI processing');
  await page.getByRole('button', { name: '선택한 메일 1개 AI로 정리', exact: true }).click();
  await page.getByText('테스트 견적 요청 초안', { exact: true }).waitFor();
  assert.equal(uploaded.length, 1);
  assert.equal(uploaded[0].accountId, 'qa-alpha');
  assert.match(uploaded[0].content, /견적서를 보내 주세요/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, '400px Outlook pane must not overflow');
  await page.screenshot({ path: path.join(out, 'sam-pane.png'), fullPage: true });
  await page.getByLabel('메일을 등록할 Account').selectOption('qa-beta');
  assert.equal(await page.getByText('선택한 메일 1개', { exact: false }).count(), 0, 'changing Account clears queued mail');
  await page.getByRole('button', { name: '연결 해제', exact: true }).click();
  await page.getByRole('button', { name: 'SAM 연결', exact: true }).waitFor();
  assert.equal(await page.getByLabel('메일을 등록할 Account').count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: real portal login -> Office dialog message -> Account -> Blob drop -> preview -> mocked AI upload -> draft summary -> disconnect; no browser errors or 400px overflow.');
  console.log('Office host and AI response were mocked; no company email or production data was read or written.');
} finally {
  await browser?.close();
  server.kill();
}
