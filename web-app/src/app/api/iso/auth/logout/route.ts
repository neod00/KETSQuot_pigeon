import { NextResponse } from 'next/server';
import { ISO_ADMIN_COOKIE } from '@/lib/isoAuth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/iso/login', request.url), 303);
  response.cookies.set(ISO_ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
