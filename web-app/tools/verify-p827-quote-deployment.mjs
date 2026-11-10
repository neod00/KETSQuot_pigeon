import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const origin = new URL(process.argv[2]);
assert.equal(origin.protocol, 'https:');
assert.ok(origin.hostname === 'lrqa-korea-portal.netlify.app' || origin.hostname.endsWith('--lrqa-korea-portal.netlify.app'));
const root = path.resolve('web-app/.next/static');
let matches = 0;
for (const file of (await readdir(root, { recursive: true })).filter(name => name.endsWith('.js'))) {
    const bytes = await readFile(path.join(root, file));
    if (!bytes.toString('utf8').includes('quote-cost-cell')) continue;
    assert.ok(bytes.toString('utf8').includes('quote-contact'), 'Contact layout fix is missing');
    assert.ok(bytes.toString('utf8').includes('quote-remark'), 'Uniform remark typography is missing');
    const url = new URL(`/_next/static/${file.replaceAll('\\', '/')}`, origin);
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    assert.equal(response.status, 200);
    const remote = Buffer.from(await response.arrayBuffer());
    const hash = value => createHash('sha256').update(value).digest('hex');
    assert.equal(hash(remote), hash(bytes));
    matches++;
}
assert.ok(matches, 'Could not identify the fixed PDF generator bundle');
const admin = await fetch(new URL('/hyundai-ghg/admin', origin), { redirect: 'manual' });
assert.equal(admin.status, 307);
console.log(`PASS ${origin.origin}: ${matches} fixed quote bundle(s) match the tested build; admin access remains protected.`);
