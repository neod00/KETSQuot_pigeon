import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { fetchIsoApplications } from '@/lib/isoApplications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!getIsoRequestSession(request)) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const applications = await fetchIsoApplications();
    return NextResponse.json({ applications, total: applications.length });
  } catch (error) {
    console.error('ISO applications fetch failed', error);
    return NextResponse.json({ error: '신청서 데이터를 불러오지 못했습니다.' }, { status: 502 });
  }
}
