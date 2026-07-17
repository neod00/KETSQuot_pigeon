import { NextResponse } from 'next/server';
import { completeInternalInvitation } from '@/lib/internalUsers';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { token?: string; password?: string };
  try {
    const account = await completeInternalInvitation(String(body.token || ''), String(body.password || ''));
    return NextResponse.json({ success: true, email: account.email });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '계정을 설정하지 못했습니다.' }, { status: 400 });
  }
}
