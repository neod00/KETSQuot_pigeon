import type { CbamApplicationInput } from './cbam-input';
import { QUESTIONS, scoreReadiness, PRIVACY_VERSION, type CbamNavigatorData, type ReadinessAnswer, type EvidenceStatus } from './cbam-navigator';

export const TEXT_FIELDS = {
  companyName: '회사명', contactName: '담당자', email: '이메일', phone: '전화번호', address: '회사 주소', country: '생산국', sites: '검증대상 사업장', cnCodes: 'CN 코드', operatorCount: '관련 사업자 수', processCount: '생산공정 수', goodsCount: '제품 수', dataLocation: '자료 보관 위치', dataPersonnel: '데이터 담당자 수', embeddedEmissionsKt: '내재배출량(천 tCO₂e)', productionProcesses: '생산공정', fuelStreams: '연료 종류', notes: '추가 전달사항',
};
export const CHOICE_FIELDS = {
  clientType: { label: '신청자 역할', options: { importer: 'EU 수입자/신고자', operator: '제3국 제조사업자' } },
  serviceType: { label: '요청 서비스', options: { verification: 'CBAM 검증', pre_verification: '검증 준비상태 검토' } },
  remoteAccess: { label: '자료 원격 접근', options: { yes: '가능', partial: '일부 가능', no: '불가능' } },
  communicationTemplate: { label: 'EU 수입자와의 공통 자료양식 사용', options: { all: '전체 사용', partial: '일부 사용', none: '미사용' } },
  mmdStatus: { label: '모니터링 방법 문서 준비상태', options: { clear: '명확하게 준비', complex: '복잡하거나 설명 보완 필요', none: '미준비', not_applicable: '해당 없음' } },
  carbonPrice: { label: '제3국 탄소가격 정보 검토 필요', options: { yes: '있음', no: '없음' } },
  previouslyVerified: { label: '내재배출량의 기존 제3자 검증', options: { yes: '있음', no: '없음' } },
  goodsComplexity: { label: '제품 구성', options: { simple: '관련 전구물질을 사용하지 않는 제품', complex: '관련 전구물질을 사용하는 제품', both: '두 유형 모두' } },
  biomass: { label: '바이오매스 사용', options: { none: '없음', used_red_compliant: '사용·지속가능성 기준 충족 확인', used_review_needed: '사용·기준 검토 필요' } },
};
export const REQUIRED_TEXT = ['companyName', 'contactName', 'email', 'phone', 'country', 'sites'];
export const GOODS = ['시멘트', '비료', '알루미늄', '철강', '수소', '전력'];
export const SYSTEMS = ['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 50001', 'ISO 27001'];
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('입력 형식을 확인해 주세요.');
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 500) {
  if (typeof value !== 'string' || value.length > max) throw new Error('입력값의 형식과 길이를 확인해 주세요.');
  return value.trim();
}
export function parseApplication(value: unknown, legacy = false): CbamApplicationInput {
  const v = object(value), out: Record<string, unknown> = {};
  for (const key of Object.keys(TEXT_FIELDS)) out[key] = text(v[key] ?? '', key === 'notes' ? 2000 : 500);
  for (const key of (legacy ? REQUIRED_TEXT.slice(0, 4) : REQUIRED_TEXT)) if (!out[key]) throw new Error('회사명, 담당자, 이메일, 전화번호, 생산국과 사업장을 확인해 주세요.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email as string)) throw new Error('이메일 주소를 확인해 주세요.');
  for (const [key, spec] of Object.entries(CHOICE_FIELDS)) {
    if (legacy && key === 'serviceType' && v[key] === 'other') { out[key] = 'other'; continue; }
    if (typeof v[key] !== 'string' || !Object.keys(spec.options).includes(v[key] as string)) throw new Error(`${spec.label} 항목을 선택해 주세요.`);
    out[key] = v[key];
  }
  for (const key of ['operatorCount', 'processCount', 'goodsCount', 'dataPersonnel', 'embeddedEmissionsKt']) {
    if (out[key] !== '' && !/^\d+(\.\d+)?$/.test(out[key] as string)) throw new Error('수량은 0 이상의 숫자로 입력해 주세요.');
  }
  for (const key of ['verificationYears', 'cbamGoods', 'managementSystems']) {
    if (!Array.isArray(v[key]) || (v[key] as unknown[]).length > 10) throw new Error('선택 목록을 확인해 주세요.');
    const values = (v[key] as unknown[]).map(x => text(x, 40));
    if (key === 'verificationYears' && ((!legacy && !values.length) || values.some(x => !/^20\d{2}$/.test(x) || (!legacy && +x < 2026)))) throw new Error('검증대상연도를 확인해 주세요.');
    if (key === 'cbamGoods' && values.some(x => !GOODS.includes(x))) throw new Error('품목 분야를 확인해 주세요.');
    if (key === 'managementSystems' && values.some(x => !SYSTEMS.includes(x))) throw new Error('경영시스템 항목을 확인해 주세요.');
    out[key] = [...new Set(values)];
  }
  for (const key of ['chp', 'knownClient', 'consent']) {
    if (typeof v[key] !== 'boolean') throw new Error('확인 항목을 선택해 주세요.');
    out[key] = v[key];
  }
  if (out.consent !== true) throw new Error('개인정보 수집·이용 동의가 필요합니다.');
  return out as CbamApplicationInput;
}
export function parseNavigator(value: unknown): CbamNavigatorData {
  const v = object(value);
  const sessionId = text(v.sessionId, 40);
  if (!/^NAV-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) throw new Error('진단 세션을 다시 시작해 주세요.');
  const data: CbamNavigatorData = { sessionId, productName: text(v.productName ?? '', 200) };
  if (Array.isArray(v.searchedCnCodes)) data.searchedCnCodes = v.searchedCnCodes.slice(0, 20).map(x => text(x, 20)).filter(x => /^\d{2,8}$/.test(x));
  const answers: Record<string, ReadinessAnswer> = {};
  const raw = v.readinessAnswers ? object(v.readinessAnswers) : {};
  for (const q of QUESTIONS) if (['ready','partial','missing'].includes(String(raw[q.id]))) answers[q.id] = raw[q.id] as ReadinessAnswer;
  data.readinessAnswers = answers;
  const scored = scoreReadiness(answers);
  if (scored.complete) { data.readinessScore = scored.readinessScore; data.readinessCategories = scored.readinessCategories; data.gapCodes = scored.gapCodes; }
  const evidence = v.evidenceStatus ? object(v.evidenceStatus) : {};
  data.evidenceStatus = {};
  for (const q of QUESTIONS) if (['ready','partial','missing','not_applicable'].includes(String(evidence[q.id]))) data.evidenceStatus[q.id] = evidence[q.id] as EvidenceStatus;
  for (const key of ['startedAt','completedAt'] as const) if (typeof v[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v[key] as string) && Number.isFinite(Date.parse(v[key] as string))) data[key] = new Date(v[key] as string).toISOString();
  return data;
}
export function parseIntake(value: unknown) {
  const v = object(value);
  if (v.privacyNoticeVersion !== PRIVACY_VERSION) throw new Error('최신 개인정보 안내를 확인해 주세요.');
  if (typeof v.marketingConsent !== 'boolean') throw new Error('선택 동의 항목을 확인해 주세요.');
  return { application: parseApplication(v.application), navigatorData: parseNavigator(v.navigatorData), marketingConsent: v.marketingConsent, privacyNoticeVersion: PRIVACY_VERSION };
}
