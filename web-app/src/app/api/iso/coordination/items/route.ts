import { NextResponse } from 'next/server';
import { getIsoRequestSession, isCoordinationOwner } from '@/lib/isoAuth';
import { listCoordinationItems, updateCoordinationItemStatus } from '@/lib/coordinationRecords';
import type { CoordinationItemStatus } from '@/lib/coordinationTypes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const owner = (request: Request) => {
  const session = getIsoRequestSession(request);
  return isCoordinationOwner(session) ? session! : null;
};

const noStore = { 'Cache-Control': 'private, no-store, max-age=0' };

export async function GET(request: Request) {
  if (!owner(request)) return NextResponse.json({ error: '개인 조정 에이전트 접근 권한이 필요합니다.' }, { status: 403 });
  return NextResponse.json({ items: await listCoordinationItems() }, { headers: noStore });
}

export async function PATCH(request: Request) {
  if (!owner(request)) return NextResponse.json({ error: '개인 조정 에이전트 접근 권한이 필요합니다.' }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { id?: unknown; status?: unknown };
  const id = String(body.id || '').trim();
  const status = String(body.status || '') as CoordinationItemStatus;
  if (!id || !['new', 'reviewed', 'done', 'ignored'].includes(status)) {
    return NextResponse.json({ error: '올바른 항목과 상태가 필요합니다.' }, { status: 400 });
  }
  const item = await updateCoordinationItemStatus(id, status);
  if (!item) return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 });
  return NextResponse.json({ item }, { headers: noStore });
}
