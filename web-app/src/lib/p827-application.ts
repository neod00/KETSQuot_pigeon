export const P827_SCOPE3_CATEGORIES = [
  '구매한 제품 및 서비스 Purchased goods and services',
  '자본재 Capital goods',
  'Scope 1이나 2에 포함되지 않는 연료 및 에너지 관련 활동 Fuel- and energy-related activities',
  '업스트림 운송 및 유통 Upstream transportation and distribution',
  '사업장에서 발생된 폐기물 Waste generated in operations',
  '출장 Business travel',
  '직원 출퇴근 Employee commuting',
  '업스트림 임대 자산 Upstream leased assets',
  '다운스트림 운송 및 유통 Downstream transportation and distribution',
  '판매된 제품의 가공 Processing of sold products',
  '판매된 제품의 사용 Use of sold products',
  '판매된 제품의 폐기 End-of-life treatment of sold products',
  '다운스트림 임대 자산 Downstream leased assets',
  '프랜차이즈 Franchises',
  '투자 Investments',
] as const;

export const P827_GHG_GASES = ['CO2', 'CH4', 'N2O', 'HFCs', 'PFCs', 'SF6'] as const;

export type P827RiskLevel = 'low' | 'medium' | 'high' | 'unassessed';
export type P827EngagementType = 'organisation_verification' | 'project_validation' | 'project_verification' | 'project_validation_verification';

export type P827ApplicationInput = {
  organisationName: string;
  contactName: string;
  contactAddress: string;
  phone: string;
  email: string;
  objective: string;
  organisationBoundary: string;
  legalOwnership: string;
  financialBoundary: string;
  scope1: boolean;
  scope2: boolean;
  scope3: boolean;
  scope3Categories: boolean[];
  geographicalBoundary: string;
  locations: string;
  exclusions: string;
  activitiesProcesses: string;
  engagementType: P827EngagementType;
  criteria: string;
  ghgGases: string[];
  emissionScopeOptions: string[];
  sourcesSinks: string;
  inventorySize: string;
  reportTitle: string;
  reportingPeriod: string;
  intendedUsers: string;
  assuranceLevel: 'limited' | 'reasonable';
  materialityType: 'professional' | 'quantitative';
  materialityPercent: string;
  deadline: string;
  additionalInfo: string;
  consent: boolean;
};

export type P827RiskAssessment = {
  commercialLevel: P827RiskLevel;
  commercialReason: string;
  reputationalLevel: P827RiskLevel;
  reputationalReason: string;
  liabilityLevel: P827RiskLevel;
  liabilityReason: string;
};

export type P827Calculation = {
  complexity: 'simple' | 'medium' | 'complex' | 'very_complex';
  stage1Days: number;
  stage2Days: number;
  stage3Days: number;
  rawDays: number;
  quotedDays: number;
  basis: string[];
};

export type StoredP827Application = P827ApplicationInput & P827RiskAssessment & P827Calculation & {
  reference: string;
  submittedAt: string;
  status: string;
  automaticQuotedDays?: number;
  manualQuotedDays?: number;
  dayRate: number;
  applicationFee: number;
  expenses: number;
  pricingAdjustmentReason: string;
  estimatedCost: number;
};

export const DEFAULT_P827_DAY_RATE = 1_350_000;
export const DEFAULT_P827_APPLICATION_FEE = 720_000;
export const DEFAULT_P827_EXPENSES = 400_000;

export function createDefaultP827Application(): P827ApplicationInput {
  return {
    organisationName: '', contactName: '', contactAddress: '', phone: '', email: '', objective: '', organisationBoundary: '', legalOwnership: '', financialBoundary: '',
    scope1: true, scope2: true, scope3: false, scope3Categories: Array(P827_SCOPE3_CATEGORIES.length).fill(false), geographicalBoundary: '', locations: '', exclusions: '', activitiesProcesses: '',
    engagementType: 'organisation_verification', criteria: 'GHG Protocol', ghgGases: ['CO2', 'CH4', 'N2O'], emissionScopeOptions: ['direct', 'energy_indirect'], sourcesSinks: 'GHG Source only', inventorySize: '',
    reportTitle: '', reportingPeriod: '', intendedUsers: '', assuranceLevel: 'limited', materialityType: 'professional', materialityPercent: '', deadline: '', additionalInfo: '', consent: false,
  };
}

const countLocations = (value: string) => value.split(/[,;\n]/).map(item => item.trim()).filter(Boolean).length;
const inventoryNumber = (value: string) => {
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

export function calculateP827Days(input: P827ApplicationInput): P827Calculation {
  const basis: string[] = [];
  let score = 0;
  const locations = countLocations(input.locations);
  const scope3Count = input.scope3 ? input.scope3Categories.filter(Boolean).length : 0;
  const inventory = inventoryNumber(input.inventorySize);

  if (locations >= 3) { score += 2; basis.push(`검증 대상 위치 ${locations}곳: 다수 사업장`); }
  else if (locations === 2) { score += 1; basis.push('검증 대상 위치 2곳: 복수 사업장'); }
  else basis.push('검증 대상 위치 1곳 또는 단일 조직 기준');

  if (input.scope3) {
    if (scope3Count >= 6) { score += 2; basis.push(`Scope 3 ${scope3Count}개 카테고리: 광범위한 기타 간접배출 검토`); }
    else { score += 1; basis.push(`Scope 3 ${Math.max(scope3Count, 1)}개 카테고리 포함`); }
  } else basis.push('Scope 1·2 중심, Scope 3 미포함');

  if (input.assuranceLevel === 'reasonable') { score += 2; basis.push('합리적 보증: 표본과 증빙 검토 강도 증가'); }
  else basis.push('제한적 보증 적용');
  if (input.engagementType === 'project_validation_verification') { score += 1; basis.push('프로젝트 타당성평가와 검증을 함께 수행'); }
  if (inventory >= 1_000_000) { score += 2; basis.push(`대규모 인벤토리 ${input.inventorySize}`); }
  else if (inventory >= 100_000) { score += 1; basis.push(`중대 규모 인벤토리 ${input.inventorySize}`); }
  if (/해외|global|글로벌|국외/i.test(`${input.geographicalBoundary} ${input.locations}`)) { score += 1; basis.push('해외 또는 글로벌 경계 포함'); }
  if (input.exclusions.trim()) { score += 1; basis.push('검증 범위 제외사항 검토 필요'); }

  const complexity = score >= 6 ? 'very_complex' : score >= 3 ? 'complex' : score >= 1 ? 'medium' : 'simple';
  const framework = {
    simple: [0.75, 2, 0.25],
    medium: [1, 3, 0.5],
    complex: [1.5, 4, 0.5],
    very_complex: [2, 6, 1],
  } as const;
  const [stage1Days, stage2Days, stage3Days] = framework[complexity];
  const rawDays = stage1Days + stage2Days + stage3Days;
  const quotedDays = Math.ceil(rawDays * 2) / 2;
  const label = { simple: '단순', medium: '중간', complex: '복잡', very_complex: '매우 복잡' }[complexity];
  basis.push(`복잡도 ${score}점 → ${label} 등급 (0점 단순, 1~2점 중간, 3~5점 복잡, 6점 이상 매우 복잡)`);
  basis.push(`Stage 1 ${stage1Days.toFixed(2)}일 + Stage 2 ${stage2Days.toFixed(2)}일 + Stage 3 ${stage3Days.toFixed(2)}일 = ${rawDays.toFixed(2)}일`);
  basis.push(`0.5일 단위 견적일수 ${quotedDays.toFixed(1)}일`);
  return { complexity, stage1Days, stage2Days, stage3Days, rawDays, quotedDays, basis };
}

export const estimateP827Cost = (days: number, dayRate = DEFAULT_P827_DAY_RATE, applicationFee = DEFAULT_P827_APPLICATION_FEE, expenses = DEFAULT_P827_EXPENSES) => Math.round(days * dayRate + applicationFee + expenses);
export const p827ComplexityLabel = (value: StoredP827Application['complexity']) => ({ simple: '단순', medium: '중간', complex: '복잡', very_complex: '매우 복잡' }[value]);
export const p827EngagementLabel = (value: P827EngagementType) => ({ organisation_verification: '조직 데이터·정보 검증', project_validation: '프로젝트 타당성평가', project_verification: '프로젝트 검증', project_validation_verification: '프로젝트 타당성평가 및 검증' }[value]);
