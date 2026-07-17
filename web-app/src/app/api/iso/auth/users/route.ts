import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { listInternalUsers, removeInternalUser } from '@/lib/internalUsers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const isAdmin = (request: Request) => getIsoRequestSession(request)?.role === 'admin';

export async function GET(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  return NextResponse.json({ users: await listInternalUsers() });
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { email?: string };
  try {
    await removeInternalUser(String(body.email || ''));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '사용자를 삭제하지 못했습니다.' }, { status: 400 });
  }
}
