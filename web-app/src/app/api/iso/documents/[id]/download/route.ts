import { getIsoRequestSession } from '@/lib/isoAuth';
import { getIsoDocument, getIsoDocumentBinary } from '@/lib/isoDocuments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!getIsoRequestSession(request)) {
    return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  const { id } = await context.params;
  const metadata = await getIsoDocument(id);
  if (!metadata) return Response.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 });
  const binary = await getIsoDocumentBinary(metadata.storageKey);
  if (!binary) return Response.json({ error: '문서 파일을 찾을 수 없습니다.' }, { status: 404 });

  const body = binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      'Content-Type': metadata.contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(metadata.fileName)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
