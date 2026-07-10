import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { generateAdjWorkbook } from '@/lib/adj-workbook';

export const runtime = 'nodejs';
export const maxDuration = 26;

const safePart = (value: unknown, fallback: string) => String(value || fallback)
  .replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || fallback;

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const template = await readFile(path.join(process.cwd(), 'templates', 'ADJ_v3.xlsx'));
    const workbook = await generateAdjWorkbook(template, data);
    const client = safePart(data?.client?.name, 'Client');
    const standards = safePart((data?.standards || []).join('-'), 'Standards');
    const date = safePart(data?.client?.createdDate, new Date().toISOString().slice(0, 10));
    const fileName = `ADJ_${client}_${standards}_${date}.xlsx`;
    return new Response(new Uint8Array(workbook), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Cache-Control': 'no-store',
        'X-ADJ-Filename': encodeURIComponent(fileName),
      },
    });
  } catch (error) {
    return Response.json({
      error: 'ADJ export failed',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
