import { createHmac, timingSafeEqual } from 'node:crypto';

const PURPOSE = 'sam-outlook-v1';
export const SAM_OUTLOOK_TOKEN_MS = 60 * 60 * 1000;
type SamOutlookIdentity = { username: string; role: 'admin'; expiresAt: number };
const signature = (payload: string, secret: string) => createHmac('sha256', secret).update(`${PURPOSE}:${payload}`).digest('base64url');

export function issueSamOutlookToken(identity: { username: string; role: string }, secret: string, now = Date.now()) {
  if (!secret || identity.role !== 'admin' || !identity.username) throw new Error('SAM 관리자 로그인이 필요합니다.');
  const expiresAt = now + SAM_OUTLOOK_TOKEN_MS;
  const payload = Buffer.from(JSON.stringify({ purpose: PURPOSE, username: identity.username, role: 'admin', issuedAt: now, expiresAt })).toString('base64url');
  return { token: `${payload}.${signature(payload, secret)}`, expiresAt };
}

export function readSamOutlookToken(token: string, secret: string, now = Date.now()): SamOutlookIdentity | null {
  if (!secret || token.length > 4096) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts.every(part => /^[\w-]+$/.test(part))) return null;
  const [payload, sig] = parts;
  const expected = Buffer.from(signature(payload, secret));
  const supplied = Buffer.from(sig);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (value.purpose !== PURPOSE || value.role !== 'admin' || typeof value.username !== 'string' || !value.username ||
      !Number.isFinite(value.issuedAt) || !Number.isFinite(value.expiresAt) || value.issuedAt > now + 60_000 ||
      value.expiresAt <= now || value.expiresAt > value.issuedAt + SAM_OUTLOOK_TOKEN_MS) return null;
    return { username: value.username, role: 'admin', expiresAt: value.expiresAt };
  } catch { return null; }
}
