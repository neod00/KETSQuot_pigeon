import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { APPLICATION_STATUSES, parseHyundaiGhgInput, type ApplicationStatus, type HyundaiGhgApplication } from '@/lib/hyundai-ghg';
import { ApplicationConflict, createHyundaiApplication, getHyundaiApplication, listHyundaiApplications, updateHyundaiApplication } from '@/lib/hyundai-ghg-store';
import { parseP827GeneratorDraft } from '@/lib/p827-generator-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

async function readBody(request: NextRequest): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (Buffer.byteLength(text, 'utf8') > 80_000) throw new Error('입력 내용이 너무 깁니다.');
  let body: unknown;
  try { body = JSON.parse(text); } catch { throw new Error('요청 형식을 확인해 주세요.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('요청 형식을 확인해 주세요.');
  return body as Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  if (!getIsoRequestSession(request)) return json({ message: '로그인이 필요합니다.' }, 401);
  try {
    const reference = request.nextUrl.searchParams.get('ref');
    if (reference) {
      const application = await getHyundaiApplication(reference);
      return application ? json({ application }) : json({ message: '신청서를 찾을 수 없습니다.' }, 404);
    }
    return json({ applications: await listHyundaiApplications() });
  } catch (error) {
    console.error('Hyundai GHG application read failed.', error);
    return json({ message: '신청서를 불러오지 못했습니다. 다시 시도해 주세요.' }, 502);
  }
}

export async function POST(request: NextRequest) {
  let input;
  try {
    const body = await readBody(request);
    if (body.customerType === 'new' && !body.p827Application) throw new Error('신규 고객은 P827 신청서로 접수해 주세요.');
    input = parseHyundaiGhgInput(body);
  }
  catch (error) { return json({ message: error instanceof Error ? error.message : '입력값을 확인해 주세요.' }, 400); }
  try {
    const now = new Date().toISOString();
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).replaceAll('-', '');
    const reference = `HGHG-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const application: HyundaiGhgApplication = { ...input, reference, submittedAt: now, updatedAt: now, version: 1, status: '접수', internalNotes: '', originalSubmission: structuredClone(input), documentDraft: null, events: [{ at: now, actor: '고객', action: '신청서 접수' }] };
    await createHyundaiApplication(application);
    return json({ reference, submittedAt: now }, 201);
  } catch (error) {
    console.error('Hyundai GHG application save failed.', error);
    return json({ message: '신청서가 저장되지 않았습니다. 잠시 후 다시 제출해 주세요.' }, 503);
  }
}

export async function PUT(request: NextRequest) {
  const session = getIsoRequestSession(request);
  if (!session) return json({ message: '로그인이 필요합니다.' }, 401);
  const origin = request.headers.get('origin');
  // Next may normalize the internal request URL to localhost behind a proxy.
  // Compare against the incoming Host so same-origin clients retain their public hostname.
  if (origin) {
    try {
      if (new URL(origin).host.toLowerCase() !== (request.headers.get('host') || request.nextUrl.host).toLowerCase()) return json({ message: '허용되지 않은 요청입니다.' }, 403);
    } catch { return json({ message: '허용되지 않은 요청입니다.' }, 403); }
  }
  let payload;
  let input;
  let documentDraft;
  try {
    payload = await readBody(request);
    if (typeof payload.reference !== 'string' || !/^HGHG-\d{8}-[A-F0-9]{8}$/.test(payload.reference) || !Number.isInteger(payload.version) || Number(payload.version) < 1) throw new Error('접수번호와 수정 버전을 확인해 주세요.');
    if (!APPLICATION_STATUSES.includes(payload.status as ApplicationStatus)) throw new Error('처리상태를 확인해 주세요.');
    if (typeof payload.internalNotes !== 'string' || payload.internalNotes.length > 10_000) throw new Error('내부 메모는 10,000자 이내로 입력해 주세요.');
    input = parseHyundaiGhgInput(payload.application);
    documentDraft = parseP827GeneratorDraft(payload.documentDraft);
  } catch (error) { return json({ message: error instanceof Error ? error.message : '수정 내용을 확인해 주세요.' }, 400); }
  try {
    const now = new Date().toISOString();
    const status = payload.status as ApplicationStatus;
    const application = await updateHyundaiApplication(payload.reference as string, payload.version as number, current => ({
      ...current, ...input, status, internalNotes: (payload.internalNotes as string).trim(), documentDraft,
      updatedAt: now, version: current.version + 1,
      events: [...current.events, { at: now, actor: session.username, action: current.status !== status ? `상태 변경: ${current.status} → ${status} · 검토 내용 저장` : '신청 내용·내부 메모·견적 조건 저장' }],
    }));
    return application ? json({ application }) : json({ message: '신청서를 찾을 수 없습니다.' }, 404);
  } catch (error) {
    if (error instanceof ApplicationConflict) return json({ message: error.message }, 409);
    console.error('Hyundai GHG application update failed.', error);
    return json({ message: '저장하지 못했습니다. 입력 내용을 유지한 채 다시 시도해 주세요.' }, 503);
  }
}
