import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac } from 'node:crypto';
import { verifyIntake } from '@/lib/cbam-intake-signature';
import { parseIntake } from '@/lib/cbam-intake-schema';
import { calculateCbamDays, estimateCbamCost, type StoredCbamApplication } from '@/lib/cbam';
import { createApplicationOnce } from '@/lib/cbam-store';
import { linkLeadApplication } from '@/lib/cbam-lead-store';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  const json = (data: unknown, status: number) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
  try {
    if (Number(request.headers.get('content-length')) > 32_000) return json({ message: '요청 크기 초과' }, 413);
    const reader = request.body?.getReader(); if (!reader) return json({ message: '잘못된 요청' }, 400);
    let size = 0; const chunks: Uint8Array[] = [];
    while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > 32_000) { await reader.cancel(); return json({ message: '요청 크기 초과' }, 413); } chunks.push(part.value); }
    const raw = Buffer.concat(chunks).toString('utf8');
    const secret = process.env.NAVIGATOR_INTAKE_SECRET || '';
    if (!verifyIntake(raw, request.headers.get('x-navigator-timestamp') || '', request.headers.get('x-navigator-signature') || '', secret)) return json({ message: '인증 실패' }, 401);
    let parsed, requestId: string;
    try { const value = JSON.parse(raw); parsed = parseIntake(value); requestId = value.requestId; if (!/^[0-9a-f-]{36}$/.test(requestId)) throw new Error('Invalid request'); }
    catch { return json({ message: '입력값 오류' }, 400); }
    const digest = createHash('sha256').update(JSON.stringify(parsed)).digest('hex');
    const reference = `CBAM-N-${createHmac('sha256', secret).update(`${parsed.navigatorData.sessionId}:${requestId}`).digest('hex').slice(0,24).toUpperCase()}`;
    const calculated = calculateCbamDays(parsed.application);
    const now = new Date().toISOString();
    const application: StoredCbamApplication = {
      ...parsed.application, ...calculated, reference, submittedAt: now, status: '신규 접수',
      estimatedCost: estimateCbamCost(calculated.quotedDays), source: 'NAVIGATOR', leadStage: 'APPLICATION_SUBMITTED',
      navigatorSessionId: parsed.navigatorData.sessionId, navigatorData: parsed.navigatorData,
      marketingConsent: parsed.marketingConsent, privacyNoticeVersion: parsed.privacyNoticeVersion, consentedAt: now, intakeDigest: digest,
    };
    const saved = await createApplicationOnce(application);
    if (saved.intakeDigest !== digest) return json({ message: '동일 접수 요청의 내용이 변경되었습니다.' }, 409);
    try { await linkLeadApplication(parsed.navigatorData.sessionId, parsed.application.email, saved.reference); }
    catch { console.error('Navigator lead application link failed'); }
    return json({ reference: saved.reference }, 201);
  } catch { return json({ message: '신청을 저장하지 못했습니다.' }, 503); }
}
