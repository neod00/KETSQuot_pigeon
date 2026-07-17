import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'lrqa_iso_admin';

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

async function hasValidSession(token?: string) {
  const secret = process.env.ISO_SESSION_SECRET || '';
  if (!token || !secret) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const signatureValid = await crypto.subtle.verify(
      'HMAC',
      key,
      decodeBase64Url(signature),
      new TextEncoder().encode(payload),
    );
    if (!signatureValid) return false;

    const session = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload))) as {
      username?: string;
      expiresAt?: number;
    };
    return Boolean(session.username && session.expiresAt && session.expiresAt > Date.now());
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const publicPath = pathname === '/iso/login' || pathname === '/iso/setup' || pathname.startsWith('/api/iso/auth/');
  if (publicPath) return NextResponse.next();

  const validSession = await hasValidSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (validSession) return NextResponse.next();

  if (pathname.startsWith('/api/') || pathname.startsWith('/.netlify/functions/')) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/iso/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('returnTo', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
