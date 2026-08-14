import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { buildAdjWorkbook, type AdjWorkbookRequest } from '@/lib/adjWorkbookTemplate';
import { getIsoRequestSession } from '@/lib/isoAuth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!getIsoRequestSession(request)) {
    return NextResponse.json({ error: 'Login is required.' }, { status: 401 });
  }
  const requestBody = await request.json().catch(() => null) as AdjWorkbookRequest | null;
  if (!requestBody || !Array.isArray(requestBody.standards) || !requestBody.auditInput || !requestBody.auditResult) {
    return NextResponse.json({ error: 'The audit calculation data is incomplete.' }, { status: 400 });
  }
  try {
    const template = new Uint8Array(await readFile(path.join(process.cwd(), 'templates', 'ADJ_v3.xlsx')));
    const { bytes, fileName } = buildAdjWorkbook(template, requestBody);
    const fileBody = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return new Response(fileBody, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'ADJ workbook could not be created.' }, { status: 500 });
  }
}
