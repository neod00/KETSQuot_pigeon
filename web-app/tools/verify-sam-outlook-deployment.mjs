import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base = (process.argv[2] || '').replace(/\/$/, '');
assert.match(base, /^https:\/\/[\w.-]+$/);
const request = (endpoint, options = {}) => fetch(base + endpoint, { ...options, redirect: 'manual', signal: AbortSignal.timeout(30_000) });
const xml = await request('/outlook/sam-outlook.xml');
assert.equal(xml.status, 200);
assert.match(xml.headers.get('content-type') || '', /xml/);
assert.match(xml.headers.get('content-disposition') || '', /sam-outlook\.xml/);
assert.equal(await xml.text(), await readFile(new URL('../public/outlook/sam-outlook.xml', import.meta.url), 'utf8'));
for (const endpoint of ['/outlook/sam', '/outlook/sam/connect', '/outlook/commands.html']) {
  const response = await request(endpoint);
  assert.equal(response.status, 200, endpoint);
  assert.equal(response.headers.get('x-frame-options'), null, `${endpoint} must allow Outlook's task-pane frame`);
  assert.doesNotMatch(response.headers.get('content-security-policy') || '', /frame-ancestors\s+(?:'none'|'self')(?:;|$)/);
  assert.match(await response.text(), /SAM/);
}
for (const size of [16, 32, 64, 80, 128]) {
  const response = await request(`/outlook/icon-${size}.png`);
  assert.equal(response.status, 200);
  const png = Buffer.from(await response.arrayBuffer());
  assert.equal(png.readUInt32BE(16), size);
  assert.equal(png.readUInt32BE(20), size);
}
assert.equal((await request('/iso/sam')).status, 307);
assert.equal((await request('/api/iso/sam/outlook/session', { method: 'POST' })).status, 401);
assert.equal((await request('/api/iso/sam/outlook/accounts')).status, 401);
const headers = { Authorization: 'Bearer deployment-invalid-token' };
assert.equal((await request('/api/iso/sam/outlook/accounts', { headers })).status, 401);
for (const method of ['GET', 'PUT']) assert.equal((await request('/api/iso/sam/mail', { method, headers })).status, 403);
assert.equal((await request('/api/iso/sam/mail', { method: 'POST', headers })).status, 401);
console.log(`PASS ${base}: exact XML download, 3 public add-in pages, 5 icon sizes, and 7 protected access checks.`);
