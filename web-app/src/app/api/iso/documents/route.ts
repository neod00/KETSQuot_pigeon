import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { listIsoDocuments, saveIsoDocument } from '@/lib/isoDocuments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!getIsoRequestSession(request)) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  return NextResponse.json({ documents: await listIsoDocuments() });
}

export async function POST(request: Request) {
  const session = getIsoRequestSession(request);
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const form = await request.formData();
  const file = form.get('file');
  const documentType = String(form.get('documentType') || '');
  if (!(file instanceof File) || !['quote', 'contract'].includes(documentType)) {
    return NextResponse.json({ error: 'Word 파일과 문서 종류가 필요합니다.' }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: '문서 크기는 20MB 이하여야 합니다.' }, { status: 413 });
  }

  let standards: string[] = [];
  try {
    standards = JSON.parse(String(form.get('standards') || '[]')) as string[];
  } catch {
    standards = [];
  }

  const metadata = await saveIsoDocument(file, {
    applicationId: String(form.get('applicationId') || ''),
    draftId: String(form.get('draftId') || ''),
    documentType: documentType as 'quote' | 'contract',
    version: Number(form.get('version') || 1),
    fileName: file.name,
    companyName: String(form.get('companyName') || ''),
    standards,
    createdBy: session.username,
  });
  return NextResponse.json({ document: metadata }, { status: 201 });
}
