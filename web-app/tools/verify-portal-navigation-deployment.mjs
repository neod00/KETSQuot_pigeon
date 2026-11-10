import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const origin = new URL(process.argv[2] || 'https://lrqa-korea-portal.netlify.app');
assert.equal(origin.protocol, 'https:');
assert.ok(origin.hostname === 'lrqa-korea-portal.netlify.app' || origin.hostname.endsWith('--lrqa-korea-portal.netlify.app'));
const checks = [];
async function get(route, expected) {
  const response = await fetch(new URL(route, origin), { redirect: 'manual', signal: AbortSignal.timeout(30_000) });
  assert.equal(response.status, expected, route);
  checks.push({ path: route, status: response.status });
  return response;
}

await Promise.all(['/iso/login', '/p827', '/hyundai-ghg/existing', '/hyundai-ghg/new', '/cbam'].map(route => get(route, 200)));
await Promise.all(['/api/iso/auth/session', '/api/cbam/applications'].map(route => get(route, 401)));
for (const route of ['/', '/iso', '/cbam/admin?view=cn-checker', '/cbam/admin?view=leads']) {
  const response = await get(route, 307);
  const redirect = new URL(response.headers.get('location'), origin);
  assert.equal(redirect.pathname, '/iso/login');
  assert.equal(redirect.searchParams.get('returnTo'), route);
}

const staticRoot = path.resolve('web-app/.next/static');
const files = await readdir(staticRoot, { recursive: true });
const menuBundles = [];
for (const file of files.filter(file => file.endsWith('.js'))) {
  const bytes = await readFile(path.join(staticRoot, file));
  if (!bytes.toString('utf8').includes('전략고객 관리 (SAM)')) continue;
  const url = `/_next/static/${file.replaceAll('\\', '/')}`;
  const response = await get(url, 200);
  const remote = Buffer.from(await response.arrayBuffer());
  const sha256 = value => createHash('sha256').update(value).digest('hex');
  assert.equal(sha256(remote), sha256(bytes), `Deployed navigation bundle differs: ${url}`);
  menuBundles.push(url);
}
assert.ok(menuBundles.length > 0, 'Could not identify the new navigation bundle');
console.log(JSON.stringify({ origin: origin.origin, checks, menuBundlesMatch: true, productionDataWritten: false }, null, 2));
