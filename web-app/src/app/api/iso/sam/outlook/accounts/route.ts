import { NextResponse } from 'next/server';
import { getSamOutlookSession } from '@/lib/samOutlookAuth';
import { listSamAccounts } from '@/lib/samRecords';

export const runtime = 'nodejs';
export async function GET(request: Request) {
  if (!getSamOutlookSession(request)) return NextResponse.json({ error: 'SAM 연결이 만료되었습니다. 다시 연결해 주세요.' }, { status: 401 });
  const accounts = (await listSamAccounts()).map(({ id, name }) => ({ id, name }));
  return NextResponse.json({ accounts }, { headers: { 'Cache-Control': 'no-store' } });
}
