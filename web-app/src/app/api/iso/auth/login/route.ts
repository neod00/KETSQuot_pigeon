import { NextResponse } from 'next/server';
import {
  createIsoSession,
  isIsoAuthConfigured,
  ISO_ADMIN_COOKIE,
  isoSessionMaxAge,
  verifyIsoAdminCredentials,
} from '@/lib/isoAuth';
import { verifyInternalUserCredentials } from '@/lib/internalUsers';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isIsoAuthConfigured()) {
    return NextResponse.json({ error: '내부 로그인 환경변수가 설정되지 않았습니다.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({})) as { username?: string; password?: string; returnTo?: string };
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const adminLogin = verifyIsoAdminCredentials(username, password);
  const memberLogin = adminLogin ? null : await verifyInternalUserCredentials(username, password);
  if (!adminLogin && !memberLogin) {
    return NextResponse.json({ error: '이메일 또는 비밀번호를 확인해주세요.' }, { status: 401 });
  }
  const identity = adminLogin ? { username, role: 'admin' as const } : memberLogin!;

  const requestedReturnTo = String(body.returnTo || '');
  const returnTo = requestedReturnTo.startsWith('/') &&
    !requestedReturnTo.startsWith('//') &&
    !requestedReturnTo.startsWith('/iso/login') &&
    !requestedReturnTo.startsWith('/api/')
    ? requestedReturnTo
    : '/';
  const response = NextResponse.json({ success: true, returnTo });
  response.cookies.set(ISO_ADMIN_COOKIE, createIsoSession(identity.username, identity.role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: isoSessionMaxAge,
  });
  return response;
}
