import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import {
  createInternalAccessRequest,
  listInternalAccessRequests,
  reviewInternalAccessRequest,
} from '@/lib/internalUsers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requireAdmin = (request: Request) => {
  const session = getIsoRequestSession(request);
  return session?.role === 'admin' ? session : null;
};

export async function GET(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }
  return NextResponse.json({ requests: await listInternalAccessRequests() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    email?: string;
    displayName?: string;
    password?: string;
  };
  try {
    const accessRequest = await createInternalAccessRequest(
      String(body.email || ''),
      String(body.displayName || ''),
      String(body.password || ''),
    );
    return NextResponse.json({ request: accessRequest }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : '사용 신청을 접수하지 못했습니다.',
    }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const session = requireAdmin(request);
  if (!session) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as {
    email?: string;
    action?: string;
  };
  if (body.action !== 'approve' && body.action !== 'reject') {
    return NextResponse.json({ error: '승인 또는 거절 작업을 선택해 주세요.' }, { status: 400 });
  }

  try {
    const result = await reviewInternalAccessRequest(
      String(body.email || ''),
      body.action,
      session.username,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : '신청을 처리하지 못했습니다.',
    }, { status: 400 });
  }
}
