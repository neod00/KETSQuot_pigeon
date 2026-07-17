import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE = 'lrqa_iso_admin';

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

export function hasValidInternalSession(request: Request) {
  const secret = process.env.ISO_SESSION_SECRET || '';
  if (!secret) return false;

  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  if (!token) return false;

  const [payload, signature] = decodeURIComponent(token).split('.');
  if (!payload || !signature) return false;

  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  if (!safeEqual(signature, expected)) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      username?: string;
      expiresAt?: number;
    };
    return Boolean(session.username && session.expiresAt && session.expiresAt > Date.now());
  } catch {
    return false;
  }
}

export const privateJsonHeaders = {
  'Cache-Control': 'private, no-store',
  'Content-Type': 'application/json',
  'Vary': 'Cookie',
};

export const unauthorizedResponse = () => new Response(
  JSON.stringify({ error: '로그인이 필요합니다.' }),
  { status: 401, headers: privateJsonHeaders },
);
