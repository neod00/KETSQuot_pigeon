import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import {
  finalizeIsoDocumentUpload,
  listIsoDocuments,
  saveIsoDocument,
  saveIsoDocumentPart,
} from '@/lib/isoDocuments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PART_BYTES = 3 * 1024 * 1024;
const isUploadId = (value: string) => /^UP-[A-Z0-9]{16,64}$/.test(value);
const isPartCount = (value: number) => Number.isInteger(value) && value >= 1 && value <= 20;

const parseStandards = (value: unknown) => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean).slice(0, 20) : [];
  } catch {
    return [];
  }
};

const documentInput = (source: Record<string, unknown>, createdBy: string, fileName: string) => ({
  applicationId: String(source.applicationId || ''),
  draftId: String(source.draftId || ''),
  documentType: String(source.documentType || '') as 'quote' | 'contract',
  version: Math.max(1, Number(source.version) || 1),
  fileName,
  companyName: String(source.companyName || ''),
  standards: parseStandards(source.standards),
  createdBy,
});

export async function GET(request: Request) {
  if (!getIsoRequestSession(request)) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  return NextResponse.json({ documents: await listIsoDocuments() });
}

export async function POST(request: Request) {
  const session = getIsoRequestSession(request);
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  if (request.headers.get('content-type')?.includes('application/json')) {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const uploadId = String(body.uploadId || '');
    const partCount = Number(body.partCount);
    const documentType = String(body.documentType || '');
    const fileName = String(body.fileName || '');
    if (body.mode !== 'finalize' || !isUploadId(uploadId) || !isPartCount(partCount) ||
        !['quote', 'contract'].includes(documentType) || !fileName.toLowerCase().endsWith('.docx')) {
      return NextResponse.json({ error: '문서 업로드 완료 정보가 올바르지 않습니다.' }, { status: 400 });
    }

    try {
      const metadata = await finalizeIsoDocumentUpload(
        uploadId,
        partCount,
        String(body.contentType || ''),
        documentInput(body, session.username, fileName),
      );
      return NextResponse.json({ document: metadata }, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : '문서를 결합하지 못했습니다.' }, { status: 400 });
    }
  }

  const form = await request.formData();
  const mode = String(form.get('mode') || 'direct');
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Word 파일이 필요합니다.' }, { status: 400 });

  if (mode === 'chunk') {
    const uploadId = String(form.get('uploadId') || '');
    const partIndex = Number(form.get('partIndex'));
    const partCount = Number(form.get('partCount'));
    if (!isUploadId(uploadId) || !isPartCount(partCount) || !Number.isInteger(partIndex) || partIndex < 0 || partIndex >= partCount) {
      return NextResponse.json({ error: '문서 조각 정보가 올바르지 않습니다.' }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_PART_BYTES) {
      return NextResponse.json({ error: '문서 조각은 3MB 이하여야 합니다.' }, { status: 413 });
    }
    await saveIsoDocumentPart(uploadId, partIndex, file);
    return NextResponse.json({ uploaded: partIndex + 1, partCount });
  }

  const documentType = String(form.get('documentType') || '');
  if (!['quote', 'contract'].includes(documentType)) {
    return NextResponse.json({ error: '문서 종류가 필요합니다.' }, { status: 400 });
  }
  if (file.size > MAX_PART_BYTES) {
    return NextResponse.json({ error: '큰 문서는 분할 업로드가 필요합니다.' }, { status: 413 });
  }

  const source = Object.fromEntries(form.entries()) as Record<string, unknown>;
  const metadata = await saveIsoDocument(file, documentInput(source, session.username, file.name));
  return NextResponse.json({ document: metadata }, { status: 201 });
}