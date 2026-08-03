import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { buildSamPptx } from '@/lib/samPptx';
import { findSamAccount, saveSamDocument } from '@/lib/samRecords';

export const runtime = 'nodejs';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = getIsoRequestSession(request);
  if (session?.role !== 'admin') return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const account = await findSamAccount((await context.params).id);
  if (!account) return NextResponse.json({ error: 'Account를 찾을 수 없습니다.' }, { status: 404 });
  const template = new Uint8Array(await readFile(path.join(process.cwd(), 'templates', 'sam', 'Selling LRQA ACCOUNT PLAN template_HMC_DK.pptx')));
  const bytes = await buildSamPptx(account, template);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const safeName = account.name.en.replace(/[\\/:*?"<>|]/g, '_');
  const fileName = `Selling LRQA ACCOUNT PLAN_${safeName}_${date}.pptx`;
  const document = await saveSamDocument(bytes, {
    accountId: account.id,
    accountName: account.name.en,
    kind: 'pptx',
    fileName,
    contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    createdBy: session.username,
  });
  return new NextResponse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, {
    headers: {
      'Content-Type': document.contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'X-SAM-Document-Id': document.id,
    },
  });
}
