import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { createInternalInvitation, listInternalInvitations } from '@/lib/internalUsers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requireAdmin = (request: Request) => {
  const session = getIsoRequestSession(request);
  return session?.role === 'admin' ? session : null;
};

export async function GET(request: Request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  return NextResponse.json({ invitations: await listInternalInvitations() });
}

export async function POST(request: Request) {
  const session = requireAdmin(request);
  if (!session) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { email?: string };
  try {
    const result = await createInternalInvitation(String(body.email || ''), session.username);
    const setupUrl = new URL('/iso/setup', request.url);
    setupUrl.searchParams.set('token', result.token);
    return NextResponse.json({ invitation: result.invitation, setupUrl: setupUrl.toString() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '초대를 만들지 못했습니다.' }, { status: 400 });
  }
}
