export type CbamClientType = 'importer' | 'operator';
export type CbamComplexity = 'simple' | 'medium' | 'complex' | 'very_complex';

export type CbamApplicationInput = {
  clientType: CbamClientType;
  serviceType: 'pre_verification' | 'verification' | 'other';
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  sites: string;
  verificationYears: string[];
  cbamGoods: string[];
  cnCodes: string;
  operatorCount: string;
  processCount: string;
  goodsCount: string;
  dataLocation: string;
  remoteAccess: 'yes' | 'partial' | 'no';
  managementSystems: string[];
  dataPersonnel: string;
  communicationTemplate: 'all' | 'partial' | 'none';
  mmdStatus: 'clear' | 'complex' | 'none' | 'not_applicable';
  carbonPrice: 'yes' | 'no';
  previouslyVerified: 'yes' | 'no';
  embeddedEmissionsKt: string;
  productionProcesses: string;
  fuelStreams: string;
  goodsComplexity: 'simple' | 'complex' | 'both';
  biomass: 'none' | 'used_red_compliant' | 'used_review_needed';
  chp: boolean;
  knownClient: boolean;
  notes: string;
  consent: boolean;
};

export type CbamCalculation = {
  complexity: CbamComplexity;
  saraDays: number;
  verificationDays: number;
  technicalReviewDays: number;
  rawDays: number;
  adjustmentPercent: number;
  adjustedDays: number;
  quotedDays: number;
  basis: string[];
};

export type StoredCbamApplication = CbamApplicationInput & CbamCalculation & {
  reference: string;
  submittedAt: string;
  status: string;
  estimatedCost: number;
};

export const DEFAULT_CBAM_DAY_RATE = 1_300_000;
export const DEFAULT_CBAM_EXPENSES = 600_000;
export const CBAM_GOODS = ['시멘트', '비료', '알루미늄', '철강', '수소', '전력'];
export const MANAGEMENT_SYSTEMS = ['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 50001', 'ISO 27001'];

const IMPORTER_FRAMEWORK: Record<CbamComplexity, [number, number, number]> = {
  simple: [1, 1, 0.25], medium: [1.5, 2, 0.25], complex: [2, 3, 0.5], very_complex: [2, 4, 0.5],
};
const OPERATOR_FRAMEWORK: Record<CbamComplexity, [number, number, number]> = {
  simple: [1, 2, 0.25], medium: [1.5, 3, 0.25], complex: [1.5, 4, 0.5], very_complex: [2, 5, 0.5],
};

const numberValue = (value: string) => {
  const parsed = Number(String(value || '').replace(/,/g, ''));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};
const scoreBand = (score: number): CbamComplexity => score >= 6 ? 'very_complex' : score >= 3 ? 'complex' : score >= 1 ? 'medium' : 'simple';

export const complexityLabel = (value: CbamComplexity) => ({ simple: '단순', medium: '중간', complex: '복잡', very_complex: '매우 복잡' }[value]);
export const clientTypeLabel = (value: CbamClientType) => value === 'importer' ? 'EU 수입자/신고자' : '제3국 제조사업자';
export const serviceTypeLabel = (value: CbamApplicationInput['serviceType']) => ({ pre_verification: '사전검증(갭 분석)', verification: 'CBAM 검증', other: '기타 자문' }[value]);

export function createDefaultCbamApplication(): CbamApplicationInput {
  return {
    clientType: 'operator', serviceType: 'pre_verification', companyName: '', contactName: '', email: '', phone: '', address: '', country: '대한민국', sites: '',
    verificationYears: ['2026'], cbamGoods: [], cnCodes: '', operatorCount: '1', processCount: '1', goodsCount: '1', dataLocation: '', remoteAccess: 'yes',
    managementSystems: [], dataPersonnel: '1', communicationTemplate: 'all', mmdStatus: 'clear', carbonPrice: 'no', previouslyVerified: 'no', embeddedEmissionsKt: '',
    productionProcesses: '', fuelStreams: '', goodsComplexity: 'simple', biomass: 'none', chp: false, knownClient: false, notes: '', consent: false,
  };
}

export function calculateCbamDays(input: CbamApplicationInput): CbamCalculation {
  const operators = numberValue(input.operatorCount);
  const processes = numberValue(input.processCount);
  const goods = numberValue(input.goodsCount);
  const basis: string[] = [];
  let score = 0;

  if (input.clientType === 'importer') {
    if (operators >= 5) { score += 2; basis.push(`관련 사업자 ${operators}곳: 다수 사업자`); }
    else if (operators >= 2) { score += 1; basis.push(`관련 사업자 ${operators}곳: 복수 사업자`); }
    if (goods >= 5) { score += 2; basis.push(`CBAM 상품 ${goods}개: 다수 상품`); }
    else if (goods >= 2) { score += 1; basis.push(`CBAM 상품 ${goods}개: 복수 상품`); }
    if (input.carbonPrice === 'yes') { score += 1; basis.push('제3국 탄소가격 정보 검토 필요'); }
    if (input.communicationTemplate !== 'all') { score += 1; basis.push('사업자 커뮤니케이션 템플릿의 전면 사용 미확인'); }
  } else {
    if (processes >= 5) { score += 2; basis.push(`생산공정 ${processes}개: 다수 공정`); }
    else if (processes >= 2) { score += 1; basis.push(`생산공정 ${processes}개: 복수 공정`); }
    if (goods >= 5) { score += 2; basis.push(`CBAM 상품 ${goods}개: 다수 상품`); }
    else if (goods >= 2) { score += 1; basis.push(`CBAM 상품 ${goods}개: 복수 상품`); }
    if (input.mmdStatus === 'none') { score += 2; basis.push('MMD 미제공'); }
    else if (input.mmdStatus === 'complex') { score += 1; basis.push('MMD가 복잡하거나 명확하지 않음'); }
    if (input.biomass !== 'none') { score += 1; basis.push('바이오매스 연료흐름 검토 필요'); }
    if (input.chp) { score += 1; basis.push('열병합발전(CHP) 포함'); }
    if (input.carbonPrice === 'yes') { score += 1; basis.push('제3국 탄소가격 정보 검토 필요'); }
  }

  if (!basis.length) basis.push(input.clientType === 'importer' ? '상품 1개, 사업자 1곳, 탄소가격 없음, 공통 템플릿 사용' : '생산공정 1개, 상품 1개, MMD 명확, 특수 연료흐름 없음');
  const complexity = scoreBand(score);
  const [saraDays, verificationDays, technicalReviewDays] = (input.clientType === 'importer' ? IMPORTER_FRAMEWORK : OPERATOR_FRAMEWORK)[complexity];
  const rawDays = saraDays + verificationDays + technicalReviewDays;
  const adjustmentPercent = input.knownClient ? -10 : 0;
  const adjustedDays = rawDays * (1 + adjustmentPercent / 100);
  const quotedDays = Math.ceil(adjustedDays * 2) / 2;

  basis.push(`복잡도 점수 ${score}점 → ${complexityLabel(complexity)} 등급 적용 (0점 단순 · 1~2점 중간 · 3~5점 복잡 · 6점 이상 매우 복잡)`);
  basis.push(`${clientTypeLabel(input.clientType)} ${complexityLabel(complexity)} 등급 기준: SARA ${saraDays.toFixed(2)}일 + 검증 ${verificationDays.toFixed(2)}일 + 기술검토 ${technicalReviewDays.toFixed(2)}일 = 원시 ${rawDays.toFixed(2)}일`);
  if (input.knownClient) basis.push('기존 검증팀이 알고 있는 고객: 원시일수의 10% 감액 적용');
  if (input.managementSystems.length) basis.push(`인증 경영시스템 보유: ${input.managementSystems.join(', ')} (자동 감액 없이 담당자 검토)`);
  if (input.remoteAccess !== 'no') basis.push('원격 데이터 접근 가능성 있음 (현장방문 방식은 담당자 별도 판단)');
  if (input.previouslyVerified === 'yes') basis.push('내재배출량의 기존 제3자 검증 결과 있음 (담당자 별도 판단)');
  basis.push(`원시 ${rawDays.toFixed(2)}일 → 조정 ${adjustedDays.toFixed(2)}일 → 0.5일 단위 올림 ${quotedDays.toFixed(1)}일`);
  return { complexity, saraDays, verificationDays, technicalReviewDays, rawDays, adjustmentPercent, adjustedDays, quotedDays, basis };
}

export const estimateCbamCost = (days: number, dayRate = DEFAULT_CBAM_DAY_RATE, expenses = DEFAULT_CBAM_EXPENSES) => Math.round(days * dayRate + expenses);
export const formatKrw = (value: number) => `${Math.round(value).toLocaleString('ko-KR')}원`;
