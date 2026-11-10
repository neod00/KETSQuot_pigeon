import { P827_SCOPE3_CATEGORIES, type P827ApplicationInput } from './p827-application';
import { parseP827Intake } from './p827-intake';

export const SCOPE3_CATEGORIES = P827_SCOPE3_CATEGORIES.map((label, index) => ({ id: index + 1, label }));
export const CHANGE_TYPES = ['조직·사업장', '설비·공정·배출원', '검증범위', '산정방법·데이터', '기타'] as const;
export const APPLICATION_STATUSES = ['접수', '검토 중', '보완 요청', '견적 생성', '계약 완료'] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];
export type CustomerType = 'existing' | 'new';
export type HyundaiGhgInput = {
  customerType: CustomerType;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  targetYear: string;
  targetYears?: string[];
  scopes: number[];
  scope3Categories: number[];
  changeStatus: '' | 'none' | 'changed' | 'unknown';
  changeTypes: string[];
  changeDetails: string;
  sites: string;
  activities: string;
  additionalNotes: string;
  consent: boolean;
  p827Application?: P827ApplicationInput;
};
export type ProcessingEvent = { at: string; actor: string; action: string };
export type HyundaiGhgApplication = HyundaiGhgInput & {
  reference: string;
  submittedAt: string;
  updatedAt: string;
  version: number;
  status: ApplicationStatus;
  internalNotes: string;
  originalSubmission: HyundaiGhgInput;
  documentDraft: Record<string, unknown> | null;
  events: ProcessingEvent[];
};

export const customerTypeLabel = (value: CustomerType) => value === 'existing' ? '기존 고객' : '신규 협력사';
export const scopeLabel = (scopes: number[]) => scopes.map(scope => `Scope ${scope}`).join(' · ');
export const changeStatusLabel = (value: HyundaiGhgInput['changeStatus']) => ({ '': '미선택', none: '변동 없음', changed: '변동 있음', unknown: '확인 필요' }[value]);
export const formatGhgDate = (value: string) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export function createHyundaiGhgInput(customerType: CustomerType): HyundaiGhgInput {
  return { customerType, companyName: '', contactName: '', phone: '', email: '', address: '', targetYear: '', targetYears: [], scopes: [1, 2], scope3Categories: [], changeStatus: '', changeTypes: [], changeDetails: '', sites: '', activities: '', additionalNotes: '', consent: false };
}

export function hyundaiInputFromP827(input: P827ApplicationInput): HyundaiGhgInput {
  const year = input.reportingPeriod.match(/20\d{2}/)?.[0] || '';
  return { ...createHyundaiGhgInput('new'), companyName: input.organisationName, contactName: input.contactName, phone: input.phone, email: input.email,
    address: input.contactAddress, targetYear: year, targetYears: year ? [year] : [],
    scopes: [input.scope1 ? 1 : 0, input.scope2 ? 2 : 0, input.scope3 ? 3 : 0].filter(Boolean),
    scope3Categories: input.scope3 ? input.scope3Categories.flatMap((selected, index) => selected ? [index + 1] : []) : [],
    sites: input.locations, activities: input.activitiesProcesses, additionalNotes: input.additionalInfo, consent: input.consent, p827Application: input };
}

export const targetYearLabel = (year: string) => year ? `${year}년` : '대상년도 미입력';

// Keep legacy single-year records readable without changing their saved originals.
export function getTargetYears(input: Pick<HyundaiGhgInput, 'targetYear' | 'targetYears'>): string[] {
  return [...new Set(input.targetYears?.length ? input.targetYears : input.targetYear ? [input.targetYear] : [])].sort();
}

export function targetYearsLabel(input: Pick<HyundaiGhgInput, 'targetYear' | 'targetYears'>) {
  const years = getTargetYears(input);
  return years.length ? `${years.map(year => `${year}년`).join(', ')}${years.length > 1 ? ` (${years.length}개년)` : ''}` : '대상년도 미입력';
}

export function targetYearsOverlap(left: Pick<HyundaiGhgInput, 'targetYear' | 'targetYears'>, right: Pick<HyundaiGhgInput, 'targetYear' | 'targetYears'>) {
  return getTargetYears(left).some(year => getTargetYears(right).includes(year));
}

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));

// Both public submissions and internal edits pass through this allowlist.
export function parseHyundaiGhgInput(value: unknown): HyundaiGhgInput {
  if (!isObject(value) || !['existing', 'new'].includes(String(value.customerType))) throw new Error('신청 유형을 확인해 주세요.');
  const customerType = value.customerType as CustomerType;
  if (customerType === 'new' && value.p827Application !== undefined) return hyundaiInputFromP827(parseP827Intake(value.p827Application));
  const input = createHyundaiGhgInput(customerType);
  const textKeys = ['companyName', 'contactName', 'phone', 'email', 'address', 'changeDetails', 'sites', 'activities', 'additionalNotes'] as const;
  for (const key of textKeys) {
    if (typeof value[key] !== 'string' || value[key].length > (['changeDetails', 'sites', 'activities', 'additionalNotes'].includes(key) ? 5000 : 300)) throw new Error('입력값의 형식과 길이를 확인해 주세요.');
    input[key] = value[key].trim();
  }
  if (![input.companyName, input.contactName, input.phone, input.email].every(Boolean)) throw new Error('회사명, 담당자명, 연락처, 이메일을 입력해 주세요.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new Error('이메일 형식을 확인해 주세요.');
  const rawYears = value.targetYears === undefined ? [value.targetYear] : value.targetYears;
  if (!Array.isArray(rawYears) || !rawYears.length || !rawYears.every(year => typeof year === 'string' && /^\d{4}$/.test(year) && Number(year) >= 2000 && Number(year) <= new Date().getFullYear() + 1)) throw new Error('검증대상년도를 하나 이상 선택해 주세요.');
  input.targetYears = [...new Set(rawYears as string[])].sort();
  input.targetYear = input.targetYears[0];
  if (!Array.isArray(value.scopes) || !value.scopes.length || !value.scopes.every(scope => Number.isInteger(scope) && [1, 2, 3].includes(scope))) throw new Error('검증 범위를 하나 이상 선택해 주세요.');
  input.scopes = [...new Set(value.scopes as number[])].sort();
  if (!Array.isArray(value.scope3Categories) || !value.scope3Categories.every(id => Number.isInteger(id) && id >= 1 && id <= 15)) throw new Error('Scope 3 카테고리를 확인해 주세요.');
  input.scope3Categories = input.scopes.includes(3) ? [...new Set(value.scope3Categories as number[])].sort((a, b) => a - b) : [];
  if (input.scopes.includes(3) && !input.scope3Categories.length) throw new Error('이번 검증에 포함할 Scope 3 카테고리를 선택해 주세요.');
  if (customerType === 'existing') {
    if (!['none', 'changed', 'unknown'].includes(String(value.changeStatus))) throw new Error('전년 대비 변경 여부를 선택해 주세요.');
    input.changeStatus = value.changeStatus as HyundaiGhgInput['changeStatus'];
    if (input.changeStatus === 'changed') {
      if (!Array.isArray(value.changeTypes) || !value.changeTypes.length || !value.changeTypes.every(item => CHANGE_TYPES.includes(item))) throw new Error('변동 유형을 선택해 주세요.');
      input.changeTypes = [...new Set(value.changeTypes as string[])];
      if (!input.changeDetails) throw new Error('변동 내용을 입력해 주세요.');
    } else if (input.changeStatus === 'none') input.changeDetails = '';
    input.address = ''; input.sites = ''; input.activities = '';
  } else {
    if (!input.address || !input.sites || !input.activities) throw new Error('회사 주소, 대상 사업장·소재지, 주요 제품 및 공정을 입력해 주세요.');
    input.changeDetails = '';
  }
  if (value.consent !== true) throw new Error('정보 수집·이용에 동의해 주세요.');
  input.consent = true;
  return input;
}
