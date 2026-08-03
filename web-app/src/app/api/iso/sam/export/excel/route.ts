import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { listSamAccounts, saveSamDocument } from '@/lib/samRecords';
import { buildSamExcel } from '@/lib/samWorkbook';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = getIsoRequestSession(request);
  if (session?.role !== 'admin') return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const accounts = await listSamAccounts();
  const template = new Uint8Array(await readFile(path.join(process.cwd(), 'templates', 'sam', 'Account_Update_Tracker_v2_Korea_DK.xlsx')));
  const bytes = await buildSamExcel(accounts, template);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `Account_Update_Tracker_Korea_EN_${date}.xlsx`;
  const document = await saveSamDocument(bytes, {
    accountName: 'Korea Strategic Accounts',
    kind: 'excel',
    fileName,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
