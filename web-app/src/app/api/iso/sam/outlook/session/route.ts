import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { issueSamOutlookToken } from '@/lib/samOutlookToken';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  const session = getIsoRequestSession(request);
  if (session?.role !== 'admin') return NextResponse.json({ error: 'SAM 관리자 계정으로 로그인해 주세요.' }, { status: session ? 403 : 401 });
  const body = await request.json().catch(() => ({}));
  if (typeof body?.nonce !== 'string' || !/^[\w-]{32,64}$/.test(body.nonce)) return NextResponse.json({ error: 'Outlook 패널에서 연결을 다시 시작해 주세요.' }, { status: 400 });
  return NextResponse.json({ ...issueSamOutlookToken(session, process.env.ISO_SESSION_SECRET || ''), username: session.username, nonce: body.nonce }, { headers: { 'Cache-Control': 'no-store' } });
}
