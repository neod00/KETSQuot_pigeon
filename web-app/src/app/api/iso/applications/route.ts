import { NextResponse } from 'next/server';
import { deleteIsoApplicationsFromInbox } from '@/lib/isoApplicationInbox';
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

export async function DELETE(request: Request) {
  const session = getIsoRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as { applicationIds?: unknown };
  const applicationIds = Array.isArray(body.applicationIds)
    ? [...new Set(body.applicationIds.map((value) => String(value)).filter((value) => /^APP-[A-F0-9]{16}$/.test(value)))].slice(0, 100)
    : [];

  if (applicationIds.length === 0) {
    return NextResponse.json({ error: '삭제할 신청서를 선택해주세요.' }, { status: 400 });
  }

  try {
    await deleteIsoApplicationsFromInbox(applicationIds, session.username);
    return NextResponse.json({ success: true, deletedIds: applicationIds, deletedCount: applicationIds.length });
  } catch (error) {
    console.error('ISO applications delete failed', error);
    return NextResponse.json({ error: '신청서를 삭제하지 못했습니다.' }, { status: 500 });
  }
}