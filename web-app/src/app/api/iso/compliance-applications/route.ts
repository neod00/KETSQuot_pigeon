import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isoComplianceSourceFields, parseIsoComplianceApplication } from '@/lib/isoComplianceApplication';
import { normalizeLegacyApplication } from '@/lib/isoApplications';
import { setIsoJson } from '@/lib/isoStorage';
import type { IsoApplication } from '@/lib/isoTypes';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 300_000) return NextResponse.json({ message: '신청서 크기가 너무 큽니다.' }, { status: 413 });
  let input;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 300_000) return NextResponse.json({ message: '신청서 크기가 너무 큽니다.' }, { status: 413 });
    input = parseIsoComplianceApplication(JSON.parse(raw));
  } catch (error) {
    return NextResponse.json({ message: error instanceof SyntaxError ? '신청서 형식을 확인해 주세요.' : error instanceof Error ? error.message : '신청정보를 확인해 주세요.' }, { status: 400 });
  }
  try {
    const submittedAt = new Date().toISOString();
    const application: IsoApplication = {
      ...normalizeLegacyApplication(isoComplianceSourceFields(input, submittedAt)),
      id: `APP-${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`,
      complianceApplication: input,
    };
    await setIsoJson('iso-applications', `applications/${application.id}.json`, application);
    return NextResponse.json({ reference: application.id }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('ISO compliance intake save failed', error);
    return NextResponse.json({ message: '신청서를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
  }
}
