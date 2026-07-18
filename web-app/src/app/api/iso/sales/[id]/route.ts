import { NextResponse } from 'next/server';
import { deleteSalesRecord, updateSalesRecord } from '@/lib/salesRecords';
import { getIsoRequestSession } from '@/lib/isoAuth';
import type { SalesRecordInput } from '@/lib/salesTypes';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = getIsoRequestSession(request);
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as Partial<SalesRecordInput>;
  const record = await updateSalesRecord(id, body, session.username);
  return record
    ? NextResponse.json({ record })
    : NextResponse.json({ error: '세일즈 데이터를 찾을 수 없습니다.' }, { status: 404 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!getIsoRequestSession(request)) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const { id } = await params;
  await deleteSalesRecord(id);
  return NextResponse.json({ success: true });
}
