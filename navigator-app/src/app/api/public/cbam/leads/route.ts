import { NextRequest } from 'next/server';
import { parseLead } from '@/shared/cbam-lead';
import { signIntake } from '@/shared/cbam-intake-signature';
import { body, sameOrigin, requireSession, rateLimit, json, failure, HttpError } from '@/lib/server';
export async function GET() {
  return json({ retention:process.env.NAVIGATOR_PRIVACY_RETENTION || '', processors:process.env.NAVIGATOR_PRIVACY_PROCESSORS || '', contact:process.env.NAVIGATOR_PRIVACY_CONTACT || '' });
}
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request); const id = requireSession(request);
    await rateLimit(request,'leads-ip',20); await rateLimit(request,'leads-session',12,3600,id);
    if (!process.env.NAVIGATOR_PRIVACY_RETENTION || !process.env.NAVIGATOR_PRIVACY_PROCESSORS || !process.env.NAVIGATOR_PRIVACY_CONTACT) throw new HttpError(503,'접수 서비스를 준비 중입니다. 잠시 후 다시 이용해 주세요.');
    let parsed; try { parsed = parseLead(await body(request)); } catch(e) { throw new HttpError(400,e instanceof Error ? e.message : '입력값을 확인해 주세요.'); }
    if (parsed.navigatorData.sessionId !== id) throw new HttpError(400,'진단 세션을 확인해 주세요.');
    const secret = process.env.NAVIGATOR_INTAKE_SECRET, endpoint = process.env.NAVIGATOR_INTAKE_URL;
    if (!secret || secret.length < 32 || !endpoint) throw new HttpError(503,'접수 서비스를 준비 중입니다.');
    const url = new URL('navigator-leads',endpoint);
    if (url.protocol !== 'https:' && !(url.hostname === 'localhost' && process.env.NAVIGATOR_LOCAL_PREVIEW === '1' && request.nextUrl.hostname === 'localhost')) throw new HttpError(503,'접수 서비스를 준비 중입니다.');
    const payload = JSON.stringify(parsed), timestamp = String(Date.now());
    const response = await fetch(url,{ method:'POST', headers:{ 'Content-Type':'application/json', 'x-navigator-timestamp':timestamp, 'x-navigator-signature':signIntake(payload,timestamp,secret) }, body:payload, cache:'no-store', redirect:'error', signal:AbortSignal.timeout(25000) });
    if (!response.ok) throw new HttpError(503,'접수 확인이 지연되고 있습니다. 입력 내용을 유지한 채 다시 시도해 주세요.');
    const result = await response.json(); if (!/^CBAM-L-[A-F0-9]{24}$/.test(result.reference || '')) throw new HttpError(503,'접수 결과를 확인하지 못했습니다.');
    return json({ reference:result.reference },201);
  } catch(e) { return failure(e); }
}
