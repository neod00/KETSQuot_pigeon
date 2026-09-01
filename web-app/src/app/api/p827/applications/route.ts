import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@netlify/blobs';
import { getIsoRequestSession } from '@/lib/isoAuth';
import {
  calculateP827Days, DEFAULT_P827_APPLICATION_FEE, DEFAULT_P827_DAY_RATE, DEFAULT_P827_EXPENSES, estimateP827Cost,
  type P827ApplicationInput, type P827RiskAssessment, type StoredP827Application,
} from '@/lib/p827-application';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type MemoryStore = { list: StoredP827Application[] };
const globalStore = globalThis as typeof globalThis & { __p827Applications?: MemoryStore };
const memoryStore = () => globalStore.__p827Applications ||= { list: [] };
const hasBlobContext = () => Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY_SITE_ID);

async function listApplications() {
  if (!hasBlobContext()) return memoryStore().list;
  const store = getStore({ name: 'p827-applications', consistency: 'strong' });
  const listed = await store.list();
  const records = await Promise.all(listed.blobs.map(blob => store.get(blob.key, { type: 'json' }) as Promise<StoredP827Application | null>));
  return records.filter((item): item is StoredP827Application => Boolean(item)).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

async function saveApplication(application: StoredP827Application) {
  if (!hasBlobContext()) {
    const list = memoryStore().list;
    const index = list.findIndex(item => item.reference === application.reference);
    if (index >= 0) list[index] = application;
    else list.unshift(application);
    return;
  }
  await getStore({ name: 'p827-applications', consistency: 'strong' }).setJSON(application.reference, application);
}

const isValid = (input: Partial<P827ApplicationInput>) => Boolean(input.organisationName?.trim() && input.contactName?.trim() && input.email?.trim() && input.phone?.trim() && input.consent);
const defaultRisk = (): P827RiskAssessment => ({ commercialLevel: 'unassessed', commercialReason: '', reputationalLevel: 'unassessed', reputationalReason: '', liabilityLevel: 'unassessed', liabilityReason: '' });

export async function GET(request: NextRequest) {
  if (!getIsoRequestSession(request)) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  try {
    const applications = await listApplications();
    const reference = request.nextUrl.searchParams.get('ref');
    if (!reference) return NextResponse.json({ applications });
    const application = applications.find(item => item.reference === reference);
    return application ? NextResponse.json({ application }) : NextResponse.json({ message: '신청서를 찾을 수 없습니다.' }, { status: 404 });
  } catch (error) {
    console.error('P827 application read failed.', error);
    return NextResponse.json({ message: 'P827 신청서를 불러오지 못했습니다.' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as P827ApplicationInput;
    if (!isValid(input)) return NextResponse.json({ message: '회사명, 담당자, 이메일, 전화번호와 동의를 확인해 주세요.' }, { status: 400 });
    const calculation = calculateP827Days(input);
    const now = new Date();
    const reference = `P827-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const application: StoredP827Application = {
      ...input, ...defaultRisk(), ...calculation, reference, submittedAt: now.toISOString(), status: '신규 접수',
      dayRate: DEFAULT_P827_DAY_RATE, applicationFee: DEFAULT_P827_APPLICATION_FEE, expenses: DEFAULT_P827_EXPENSES, pricingAdjustmentReason: '',
      estimatedCost: estimateP827Cost(calculation.quotedDays),
    };
    await saveApplication(application);
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('P827 application save failed.', error);
    return NextResponse.json({ message: 'P827 신청서를 저장하지 못했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!getIsoRequestSession(request)) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  try {
    const payload = await request.json() as {
      reference?: string; application?: P827ApplicationInput; risk?: P827RiskAssessment;
      pricing?: { quotedDays?: number; dayRate?: number; applicationFee?: number; expenses?: number; reason?: string };
    };
    if (!payload.reference || !payload.application || !isValid(payload.application)) return NextResponse.json({ message: '수정할 신청서와 필수 입력값을 확인해 주세요.' }, { status: 400 });
    const current = (await listApplications()).find(item => item.reference === payload.reference);
    if (!current) return NextResponse.json({ message: '신청서를 찾을 수 없습니다.' }, { status: 404 });
    const calculation = calculateP827Days(payload.application);
    const finalDays = payload.pricing?.quotedDays ?? current.manualQuotedDays ?? calculation.quotedDays;
    const dayRate = payload.pricing?.dayRate ?? current.dayRate;
    const applicationFee = payload.pricing?.applicationFee ?? current.applicationFee;
    const expenses = payload.pricing?.expenses ?? current.expenses;
    if (![finalDays, dayRate, applicationFee, expenses].every(value => Number.isFinite(value) && value >= 0) || finalDays <= 0) return NextResponse.json({ message: '심사일수와 비용 조건을 확인해 주세요.' }, { status: 400 });
    const application: StoredP827Application = {
      ...current, ...payload.application, ...calculation, ...(payload.risk || {}),
      automaticQuotedDays: calculation.quotedDays,
      manualQuotedDays: payload.pricing?.quotedDays ?? current.manualQuotedDays,
      quotedDays: finalDays, dayRate, applicationFee, expenses,
      pricingAdjustmentReason: payload.pricing?.reason ?? current.pricingAdjustmentReason,
      estimatedCost: estimateP827Cost(finalDays, dayRate, applicationFee, expenses),
    };
    await saveApplication(application);
    return NextResponse.json({ application });
  } catch (error) {
    console.error('P827 application update failed.', error);
    return NextResponse.json({ message: 'P827 신청서를 수정하지 못했습니다.' }, { status: 500 });
  }
}
