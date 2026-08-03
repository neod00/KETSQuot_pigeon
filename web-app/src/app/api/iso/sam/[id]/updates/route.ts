import { NextResponse } from 'next/server';
import { addSamProgressUpdate } from '@/lib/samRecords';
import { getIsoRequestSession } from '@/lib/isoAuth';
import type { SamProgressUpdate } from '@/lib/samTypes';

export const runtime = 'nodejs';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = getIsoRequestSession(request);
  if (session?.role !== 'admin') return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { update?: Partial<SamProgressUpdate> };
  const update = await addSamProgressUpdate((await context.params).id, body.update || {}, session.username);
  return update
    ? NextResponse.json({ update }, { status: 201 })
    : NextResponse.json({ error: 'Account를 찾을 수 없습니다.' }, { status: 404 });
}
