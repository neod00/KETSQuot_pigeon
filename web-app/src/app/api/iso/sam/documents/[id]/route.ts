import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { findSamDocument, getSamDocumentBytes } from '@/lib/samRecords';

export const runtime = 'nodejs';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = getIsoRequestSession(request);
  if (session?.role !== 'admin') return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const document = await findSamDocument((await context.params).id);
  if (!document) return NextResponse.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 });
  const bytes = await getSamDocumentBytes(document);
  if (!bytes) return NextResponse.json({ error: '문서 파일을 찾을 수 없습니다.' }, { status: 404 });
  return new NextResponse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, {
    headers: {
      'Content-Type': document.contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
    },
  });
}
