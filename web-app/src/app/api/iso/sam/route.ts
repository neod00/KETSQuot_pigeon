import { NextResponse } from 'next/server';
import { createSamAccount, listSamAccountsWithPipeline, listSamDocuments } from '@/lib/samRecords';
import { getIsoRequestSession } from '@/lib/isoAuth';
import type { SamAccountInput } from '@/lib/samTypes';

export const runtime = 'nodejs';

const admin = (request: Request) => {
  const session = getIsoRequestSession(request);
  return session?.role === 'admin' ? session : null;
};

export async function GET(request: Request) {
  const session = admin(request);
  if (!session) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const [accounts, documents] = await Promise.all([listSamAccountsWithPipeline(), listSamDocuments()]);
  return NextResponse.json({ accounts, documents, viewer: session.username });
}

export async function POST(request: Request) {
  const session = admin(request);
  if (!session) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { account?: SamAccountInput };
  if (!body.account?.name?.ko && !body.account?.name?.en) {
    return NextResponse.json({ error: 'Account 이름을 입력해 주세요.' }, { status: 400 });
  }
  const account = await createSamAccount(body.account, session.username);
  return NextResponse.json({ account }, { status: 201 });
}
