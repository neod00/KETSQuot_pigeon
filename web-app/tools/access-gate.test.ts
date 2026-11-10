import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';

test('Edge access gate preserves public intake and signed-session protection', async () => {
  const previous = process.env.ISO_SESSION_SECRET;
  const secret = 'access-gate-test-only';
  process.env.ISO_SESSION_SECRET = secret;
  const request = (path: string, method = 'GET', token = '') => new NextRequest(`https://example.invalid${path}`, { method, headers: token ? { cookie: `lrqa_iso_admin=${token}` } : {} });
  const sign = (expiresAt: number) => {
    const payload = Buffer.from(JSON.stringify({ username: 'test-user', expiresAt })).toString('base64url');
    return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
  };
  try {
    for (const path of ['/p827', '/p827/lca-apply', '/hyundai-ghg/existing', '/hyundai-ghg/new', '/iso/login', '/iso/apply']) assert.equal((await middleware(request(path))).headers.get('x-middleware-next'), '1');
    for (const path of ['/api/p827/applications', '/api/hyundai-ghg/applications', '/api/iso/compliance-applications']) {
      assert.equal((await middleware(request(path, 'POST'))).headers.get('x-middleware-next'), '1');
      assert.equal((await middleware(request(path))).status, 401);
      assert.equal((await middleware(request(path, 'PUT'))).status, 401);
    }
    for (const path of ['/hyundai-ghg/admin', '/p827/admin', '/system', '/iso/users']) {
      const response = await middleware(request(path));
      assert.equal(response.status, 307); assert.match(response.headers.get('location') || '', /\/iso\/login\?/);
    }
    const valid = sign(Date.now() + 60_000);
    assert.equal((await middleware(request('/hyundai-ghg/admin', 'GET', valid))).headers.get('x-middleware-next'), '1');
    assert.equal((await middleware(request('/api/hyundai-ghg/applications', 'PUT', valid))).headers.get('x-middleware-next'), '1');
    assert.equal((await middleware(request('/api/hyundai-ghg/applications', 'GET', `${valid}bad`))).status, 401);
    assert.equal((await middleware(request('/api/hyundai-ghg/applications', 'GET', sign(Date.now() - 1000)))).status, 401);
    process.env.ISO_SESSION_SECRET = '';
    assert.equal((await middleware(request('/api/hyundai-ghg/applications', 'GET', valid))).status, 401);
  } finally { if (previous === undefined) delete process.env.ISO_SESSION_SECRET; else process.env.ISO_SESSION_SECRET = previous; }
});
