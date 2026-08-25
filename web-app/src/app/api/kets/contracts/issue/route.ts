import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';

export const runtime = 'nodejs';
export const maxDuration = 45;

export async function POST(request: Request) {
  if (!getIsoRequestSession(request)) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const origin = (process.env.CONTRACT_DOWNLOAD_ORIGIN || '').replace(/\/$/, '');
  const secret = process.env.CONTRACT_ISSUE_SECRET || '';
  if (!origin || !secret) {
    return NextResponse.json({ message: '계약서 다운로드 서비스 환경설정이 필요합니다.' }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  try {
    const response = await fetch(`${origin}/.netlify/functions/issue`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-contract-issue-secret': secret,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const result = await response.json().catch(() => ({ message: '다운로드 서비스 응답을 확인할 수 없습니다.' }));
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('Contract link issuance failed', error);
    return NextResponse.json({ message: '계약서 PDF 링크 발급에 실패했습니다.' }, { status: 502 });
  }
}
