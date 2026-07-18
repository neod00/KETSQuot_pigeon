import { NextResponse } from 'next/server';
import { createSalesRecord, importSalesRecords, listSalesRecords } from '@/lib/salesRecords';
import { getIsoRequestSession } from '@/lib/isoAuth';
import type { SalesRecordInput } from '@/lib/salesTypes';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!getIsoRequestSession(request)) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  return NextResponse.json({ records: await listSalesRecords() });
}

export async function POST(request: Request) {
  const session = getIsoRequestSession(request);
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const body = await request.json() as { record?: Partial<SalesRecordInput>; records?: Partial<SalesRecordInput>[] };
  if (Array.isArray(body.records)) {
    const records = await importSalesRecords(body.records, session.username);
    return NextResponse.json({ records, imported: records.length });
  }
  if (!body.record) return NextResponse.json({ error: '저장할 세일즈 데이터가 없습니다.' }, { status: 400 });
  return NextResponse.json({ record: await createSalesRecord(body.record, session.username) }, { status: 201 });
}
