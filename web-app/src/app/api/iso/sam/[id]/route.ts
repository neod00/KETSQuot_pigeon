import { NextResponse } from 'next/server';
import { deleteSamAccount, findSamAccount, updateSamAccount } from '@/lib/samRecords';
import { getIsoRequestSession } from '@/lib/isoAuth';
import type { SamAccountInput } from '@/lib/samTypes';

export const runtime = 'nodejs';

const admin = (request: Request) => {
  const session = getIsoRequestSession(request);
  return session?.role === 'admin' ? session : null;
};

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!admin(request)) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const account = await findSamAccount((await context.params).id);
  return account
    ? NextResponse.json({ account })
    : NextResponse.json({ error: 'Account를 찾을 수 없습니다.' }, { status: 404 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = admin(request);
  if (!session) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { account?: SamAccountInput };
  const account = await updateSamAccount((await context.params).id, body.account || {}, session.username);
  return account
    ? NextResponse.json({ account })
    : NextResponse.json({ error: 'Account를 찾을 수 없습니다.' }, { status: 404 });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!admin(request)) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  return await deleteSamAccount((await context.params).id)
    ? NextResponse.json({ deleted: true })
    : NextResponse.json({ error: 'Account를 찾을 수 없습니다.' }, { status: 404 });
}
