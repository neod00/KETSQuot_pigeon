import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';
import { issueSamOutlookToken, readSamOutlookToken, SAM_OUTLOOK_TOKEN_MS } from '../src/lib/samOutlookToken';
import { samOfficeDroppedFiles, readSamOutlookDialogMessage } from '../src/lib/samOfficeBridge';
import { parseSamMailFile } from '../src/lib/samMailFiles';

test('Outlook connection tokens expire, detect tampering and require admin identity', () => {
  const secret = 'sam-outlook-test-only';
  const now = 100_000;
  const { token, expiresAt } = issueSamOutlookToken({ username: 'qa', role: 'admin' }, secret, now);
  assert.deepEqual(readSamOutlookToken(token, secret, now), { username: 'qa', role: 'admin', expiresAt });
  assert.equal(readSamOutlookToken(token, secret, now + SAM_OUTLOOK_TOKEN_MS), null);
  assert.equal(readSamOutlookToken(token, 'wrong-secret', now), null);
  assert.equal(readSamOutlookToken(token + 'a', secret, now), null);
  assert.equal(readSamOutlookToken(token + '.ignored', secret, now), null);
  assert.throws(() => issueSamOutlookToken({ username: 'qa', role: 'member' }, secret, now));
  assert.throws(() => issueSamOutlookToken({ username: 'qa', role: 'admin' }, '', now));
});

test('Outlook tokens and portal cookies cannot be substituted; token bypass is limited to three API operations', async () => {
  const previous = process.env.ISO_SESSION_SECRET;
  const secret = 'sam-outlook-gate-test';
  process.env.ISO_SESSION_SECRET = secret;
  try {
    const { token } = issueSamOutlookToken({ username: 'qa', role: 'admin' }, secret);
    const payload = Buffer.from(JSON.stringify({ username: 'qa', role: 'admin', expiresAt: Date.now() + 60_000 })).toString('base64url');
    const cookie = `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
    assert.equal(readSamOutlookToken(cookie, secret), null);
    const req = (path: string, method = 'GET', cookieToken?: string) => new NextRequest(`https://example.invalid${path}`, {
      method, headers: cookieToken ? { cookie: `lrqa_iso_admin=${cookieToken}` } : { Authorization: `Bearer ${token}` },
    });
    assert.equal((await middleware(req('/api/iso/sam/accounts', 'GET', token))).status, 401);
    for (const [path, method] of [['/api/iso/sam/mail', 'GET'], ['/api/iso/sam/mail', 'PUT'], ['/api/iso/sam/outlook/accounts', 'GET']]) {
      assert.equal((await middleware(req(path, method))).headers.get('x-middleware-next'), '1');
    }
    for (const [path, method] of [['/api/iso/sam/mail', 'POST'], ['/api/iso/sam/mail', 'DELETE'], ['/api/iso/sam/outlook/session', 'POST'], ['/api/iso/sam/outlook/accounts', 'PUT'], ['/api/iso/sam/accounts', 'GET'], ['/api/iso/users', 'GET']]) {
      assert.equal((await middleware(req(path, method))).status, 401);
    }
    for (const path of ['/outlook/sam', '/outlook/sam/connect', '/outlook/sam-outlook.xml', '/outlook/commands.html', '/outlook/icon-128.png']) {
      assert.equal((await middleware(new NextRequest(`https://example.invalid${path}`))).headers.get('x-middleware-next'), '1');
    }
    assert.equal((await middleware(new NextRequest('https://example.invalid/iso/sam'))).status, 307);
  } finally {
    if (previous === undefined) delete process.env.ISO_SESSION_SECRET;
    else process.env.ISO_SESSION_SECRET = previous;
  }
});

test('Office dropped Blob passes Korean message content to the existing EML parser', async () => {
  const raw = 'From: sender@example.test\r\nTo: sam@example.test\r\nSubject: SAM test\r\nMessage-ID: <office-drop@test>\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n견적서를 보내 주세요.';
  const event = { dragAndDropEventData: { type: 'drop', dataTransfer: { files: [
    { name: 'SAM test.eml', type: 'message/rfc822', fileContent: new Blob([raw]) },
  ] } } } as unknown as Office.DragAndDropEventArgs;
  const files = samOfficeDroppedFiles(event);
  const parsed = await parseSamMailFile(files[0]);
  assert.equal(parsed.id, '<office-drop@test>');
  assert.equal(parsed.body, '견적서를 보내 주세요.');
  assert.deepEqual(samOfficeDroppedFiles({ dragAndDropEventData: { type: 'dragover' } } as Office.DragAndDropEventArgs), []);
  assert.throws(() => samOfficeDroppedFiles({ dragAndDropEventData: { type: 'drop', dataTransfer: { files: [{ name: 'bad.eml', fileContent: 'not-a-blob' }] } } } as unknown as Office.DragAndDropEventArgs));
});

test('login dialog accepts only its own origin, nonce and nonexpired connection', () => {
  const origin = 'https://example.invalid';
  const data = { type: 'sam-outlook-connected', nonce: 'test-nonce', token: 'signed-token', username: 'qa', expiresAt: Date.now() + 60_000 };
  const message = JSON.stringify(data);
  assert.ok(readSamOutlookDialogMessage(message, origin, origin, data.nonce));
  assert.equal(readSamOutlookDialogMessage(message, 'https://attacker.invalid', origin, data.nonce), null);
  assert.equal(readSamOutlookDialogMessage(message, undefined, origin, data.nonce), null);
  assert.equal(readSamOutlookDialogMessage(message, origin, origin, 'other-dialog'), null);
  assert.equal(readSamOutlookDialogMessage(JSON.stringify({ ...data, expiresAt: 0 }), origin, origin, data.nonce), null);
  assert.equal(readSamOutlookDialogMessage('not JSON', origin, origin, data.nonce), null);
});
