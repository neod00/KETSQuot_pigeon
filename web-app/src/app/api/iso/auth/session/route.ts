import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = getIsoRequestSession(request);
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  return NextResponse.json({ username: session.username, role: session.role });
}
