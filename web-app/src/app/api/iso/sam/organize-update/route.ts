import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { organizeSamProgressUpdate, SamOrganiseError } from '@/lib/samUpdateOrganiser';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = getIsoRequestSession(request);
  if (session?.role !== 'admin') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as {
    memo?: unknown;
    accountName?: unknown;
    consent?: unknown;
  };
  // The setting is retained for older clients; approved SAM accounts always send intentionally supplied content.
  if (body.consent !== true) {
    return NextResponse.json({ error: 'OpenAI API 전송 동의가 필요합니다.' }, { status: 400 });
  }

  const memo = String(body.memo ?? '').trim();
  const accountName = String(body.accountName ?? '').trim().slice(0, 200);
  if (!memo) return NextResponse.json({ error: '정리할 통합 활동 메모를 입력해 주세요.' }, { status: 400 });

  try {
    const result = await organizeSamProgressUpdate({ accountName, memo, source: 'memo' });
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '통합 메모를 정리하지 못했습니다.';
    return NextResponse.json({ error: message }, { status: error instanceof SamOrganiseError ? error.status : 502 });
  }
}
