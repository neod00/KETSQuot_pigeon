import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const ISO_ADMIN_COOKIE = 'lrqa_iso_admin';
export type IsoSessionRole = 'admin' | 'member';
export interface IsoSession { username: string; role: IsoSessionRole; expiresAt: number }
const SESSION_SECONDS = 8 * 60 * 60;

const base64Url = (value: string) => Buffer.from(value, 'utf8').toString('base64url');
const sessionSecret = () => process.env.ISO_SESSION_SECRET || '';

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

export const isIsoAuthConfigured = () => Boolean(
  process.env.ISO_ADMIN_USERNAME &&
  process.env.ISO_ADMIN_PASSWORD_SHA256 &&
  process.env.ISO_SESSION_SECRET,
);

export const verifyIsoAdminCredentials = (username: string, password: string) => {
  if (!isIsoAuthConfigured()) return false;
  const passwordHash = createHash('sha256').update(password, 'utf8').digest('hex');
  return safeEqual(username, process.env.ISO_ADMIN_USERNAME || '') &&
    safeEqual(passwordHash, process.env.ISO_ADMIN_PASSWORD_SHA256 || '');
};

export const createIsoSession = (username: string, role: IsoSessionRole = 'admin') => {
  const payload = base64Url(JSON.stringify({ username, role, expiresAt: Date.now() + SESSION_SECONDS * 1000 }));
  const signature = createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

export const readIsoSession = (token?: string | null) => {
  if (!token || !sessionSecret()) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  if (!safeEqual(signature, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { username?: string; role?: IsoSessionRole; expiresAt?: number };
    if (!parsed.username || !parsed.expiresAt || parsed.expiresAt < Date.now()) return null;
    return { username: parsed.username, role: parsed.role === 'member' ? 'member' : 'admin', expiresAt: parsed.expiresAt } satisfies IsoSession;
  } catch {
    return null;
  }
};

export const getIsoRequestSession = (request: Request) => {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieValue = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ISO_ADMIN_COOKIE}=`))
    ?.slice(ISO_ADMIN_COOKIE.length + 1);
  return readIsoSession(cookieValue ? decodeURIComponent(cookieValue) : null);
};

export async function requireIsoAdmin(returnTo: string) {
  const cookieStore = await cookies();
  const session = readIsoSession(cookieStore.get(ISO_ADMIN_COOKIE)?.value);
  if (!session) redirect(`/iso/login?returnTo=${encodeURIComponent(returnTo)}`);
  return session;
}

export const isoSessionMaxAge = SESSION_SECONDS;
