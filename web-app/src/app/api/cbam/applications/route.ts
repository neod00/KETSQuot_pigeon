import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@netlify/blobs';
import { calculateCbamDays, estimateCbamCost, type CbamApplicationInput, type StoredCbamApplication } from '@/lib/cbam';
import { getIsoRequestSession } from '@/lib/isoAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ApplicationStore = { list: StoredCbamApplication[] };
const globalStore = globalThis as typeof globalThis & { __cbamApplications?: ApplicationStore };

function getMemoryStore() {
  if (!globalStore.__cbamApplications) globalStore.__cbamApplications = { list: [] };
  return globalStore.__cbamApplications;
}

function hasNetlifyBlobContext() {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY_SITE_ID);
}

async function listApplications() {
  if (!hasNetlifyBlobContext()) return getMemoryStore().list;
  const store = getStore({ name: 'cbam-applications', consistency: 'strong' });
  const listed = await store.list();
  const records = await Promise.all(listed.blobs.map(blob => store.get(blob.key, { type: 'json' }) as Promise<StoredCbamApplication | null>));
  return records.filter((record): record is StoredCbamApplication => Boolean(record)).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

async function saveApplication(application: StoredCbamApplication) {
  if (!hasNetlifyBlobContext()) {
    getMemoryStore().list.unshift(application);
    return;
  }
  const store = getStore({ name: 'cbam-applications', consistency: 'strong' });
  await store.setJSON(application.reference, application);
}

function isValid(input: Partial<CbamApplicationInput>) {
  return Boolean(input.companyName?.trim() && input.contactName?.trim() && input.email?.trim() && input.phone?.trim() && input.consent);
}

export async function GET(request: NextRequest) {
  if (!getIsoRequestSession(request)) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  try {
    const applications = await listApplications();
    const reference = request.nextUrl.searchParams.get('ref');
    if (reference) {
      const application = applications.find(item => item.reference === reference);
      return application ? NextResponse.json({ application }) : NextResponse.json({ message: '해당 신청서를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ applications });
  } catch (error) {
    console.error('CBAM application read failed.', error);
    return NextResponse.json({ message: 'CBAM 신청서를 불러오지 못했습니다.' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as CbamApplicationInput;
    if (!isValid(input)) return NextResponse.json({ message: '회사명, 담당자, 이메일, 전화번호와 동의를 확인해 주세요.' }, { status: 400 });
    const calculated = calculateCbamDays(input);
    const date = new Date();
    const reference = `CBAM-${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const application: StoredCbamApplication = { ...input, ...calculated, reference, submittedAt: date.toISOString(), status: '신규 접수', estimatedCost: estimateCbamCost(calculated.quotedDays) };
    await saveApplication(application);
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('CBAM application save failed.', error);
    return NextResponse.json({ message: '신청서를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!getIsoRequestSession(request)) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  try {
    const payload = await request.json() as { reference?: string; application?: CbamApplicationInput };
    if (!payload.reference || !payload.application || !isValid(payload.application)) return NextResponse.json({ message: '수정할 신청서와 필수 입력값을 확인해 주세요.' }, { status: 400 });
    const current = (await listApplications()).find(item => item.reference === payload.reference);
    if (!current) return NextResponse.json({ message: '해당 신청서를 찾을 수 없습니다.' }, { status: 404 });
    const calculated = calculateCbamDays(payload.application);
    const application: StoredCbamApplication = {
      ...payload.application,
      ...calculated,
      reference: current.reference,
      submittedAt: current.submittedAt,
      status: current.status,
      estimatedCost: estimateCbamCost(calculated.quotedDays),
    };
    await saveApplication(application);
    return NextResponse.json({ application });
  } catch (error) {
    console.error('CBAM application update failed.', error);
    return NextResponse.json({ message: '신청서를 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
  }
}
