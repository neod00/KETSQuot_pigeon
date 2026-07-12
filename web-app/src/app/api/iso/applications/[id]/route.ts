import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { findIsoApplication } from '@/lib/isoApplications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!getIsoRequestSession(request)) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  const { id } = await context.params;
  const application = await findIsoApplication(id);
  if (!application) return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 });
  return NextResponse.json({ application });
}
