export const CORE_ISO_STANDARDS = ['ISO 9001', 'ISO 14001', 'ISO 45001'] as const;

export type CoreIsoStandard = (typeof CORE_ISO_STANDARDS)[number];
export type AuditComplexity = 'high' | 'medium' | 'low' | 'limited';
export type AuditCalculationStatus = 'calculated' | 'review_required' | 'insufficient';

export interface AuditDurationInput {
  standards: string[];
  fullTimeEmployees: number;
  partTimeEmployees?: number;
  partTimeFte?: number;
  contractorEmployees?: number;
  effectiveEmployeeOverride?: number;
  overrideJustification?: string;
  complexity?: Partial<Record<CoreIsoStandard, AuditComplexity>>;
  siteCount?: number;
  multiSite?: {
    eligible: boolean;
    samplingAllowed: boolean;
    effectiveCycle?: boolean;
  };
  integration?: {
    level: number;
    teamAbility: number;
  };
}

export interface StandardAuditDurationResult {
  standard: CoreIsoStandard;
  effectiveEmployees: number;
  complexity: AuditComplexity;
  baseInitialDays: number;
  adjustedInitialDays: number;
  stage1Days: number;
  stage2Days: number;
  surveillanceDays: number;
  recertDays: number;
  rationale: string[];
}

export interface AuditSiteSamplingResult {
  totalSites: number;
  initialSampleSites: number;
  surveillanceSampleSites: number;
  recertSampleSites: number;
  centralFunctionRequired: boolean;
  samplingApplied: boolean;
}

export interface AuditDurationResult {
  rulesetVersion: string;
  calculatedAt: string;
  status: AuditCalculationStatus;
  effectiveEmployees: number;
  integrationReductionPercent: number;
  combinedBaseInitialDays: number;
  combinedAdjustedInitialDays: number;
  perStandard: StandardAuditDurationResult[];
  siteSampling: AuditSiteSamplingResult | null;
  warnings: string[];
  rationale: string[];
}

type DurationBand = {
  max: number;
  qms: number;
  ems: Record<AuditComplexity, number>;
  ohs: Record<Exclude<AuditComplexity, 'limited'>, number>;
};

const RULESET_VERSION = 'IAF MD1:2018 / MD5:2023 / MD11:2023 / LRQA ADJ v3';

const bands: DurationBand[] = [
  { max: 5, qms: 1.5, ems: { high: 3, medium: 2.5, low: 2.5, limited: 2.5 }, ohs: { high: 3, medium: 2.5, low: 2.5 } },
  { max: 10, qms: 2, ems: { high: 3.5, medium: 3, low: 3, limited: 3 }, ohs: { high: 3.5, medium: 3, low: 3 } },
  { max: 15, qms: 2.5, ems: { high: 4.5, medium: 3.5, low: 3, limited: 3 }, ohs: { high: 4.5, medium: 3.5, low: 3 } },
  { max: 25, qms: 3, ems: { high: 5.5, medium: 4.5, low: 3.5, limited: 3 }, ohs: { high: 5.5, medium: 4.5, low: 3.5 } },
  { max: 45, qms: 4, ems: { high: 7, medium: 5.5, low: 4, limited: 3 }, ohs: { high: 7, medium: 5.5, low: 4 } },
  { max: 65, qms: 5, ems: { high: 8, medium: 6, low: 4.5, limited: 3.5 }, ohs: { high: 8, medium: 6, low: 4.5 } },
  { max: 85, qms: 6, ems: { high: 9, medium: 7, low: 5, limited: 3.5 }, ohs: { high: 9, medium: 7, low: 5 } },
  { max: 125, qms: 7, ems: { high: 11, medium: 8, low: 5.5, limited: 4 }, ohs: { high: 11, medium: 8, low: 5.5 } },
  { max: 175, qms: 8, ems: { high: 12, medium: 9, low: 6, limited: 4.5 }, ohs: { high: 12, medium: 9, low: 6 } },
  { max: 275, qms: 9, ems: { high: 13, medium: 10, low: 7, limited: 5 }, ohs: { high: 13, medium: 10, low: 7 } },
  { max: 425, qms: 10, ems: { high: 15, medium: 11, low: 8, limited: 5.5 }, ohs: { high: 15, medium: 11, low: 8 } },
  { max: 625, qms: 11, ems: { high: 16, medium: 12, low: 9, limited: 6 }, ohs: { high: 16, medium: 12, low: 9 } },
  { max: 875, qms: 12, ems: { high: 17, medium: 13, low: 10, limited: 6.5 }, ohs: { high: 17, medium: 13, low: 10 } },
  { max: 1175, qms: 13, ems: { high: 19, medium: 15, low: 11, limited: 7 }, ohs: { high: 19, medium: 15, low: 11 } },
  { max: 1550, qms: 14, ems: { high: 20, medium: 16, low: 12, limited: 7.5 }, ohs: { high: 20, medium: 16, low: 12 } },
  { max: 2025, qms: 15, ems: { high: 21, medium: 17, low: 12, limited: 8 }, ohs: { high: 21, medium: 17, low: 12 } },
  { max: 2675, qms: 16, ems: { high: 23, medium: 18, low: 13, limited: 8.5 }, ohs: { high: 23, medium: 18, low: 13 } },
  { max: 3450, qms: 17, ems: { high: 25, medium: 19, low: 14, limited: 9 }, ohs: { high: 25, medium: 19, low: 14 } },
  { max: 4350, qms: 18, ems: { high: 27, medium: 20, low: 15, limited: 10 }, ohs: { high: 27, medium: 20, low: 15 } },
  { max: 5450, qms: 19, ems: { high: 28, medium: 21, low: 16, limited: 11 }, ohs: { high: 28, medium: 21, low: 16 } },
  { max: 6800, qms: 20, ems: { high: 30, medium: 23, low: 17, limited: 12 }, ohs: { high: 30, medium: 23, low: 17 } },
  { max: 8500, qms: 21, ems: { high: 32, medium: 25, low: 19, limited: 13 }, ohs: { high: 32, medium: 25, low: 19 } },
  { max: 10700, qms: 22, ems: { high: 34, medium: 27, low: 20, limited: 14 }, ohs: { high: 34, medium: 27, low: 20 } },
];

const roundHalf = (value: number) => Math.round(value * 2) / 2;
const ceilHalf = (value: number) => Math.ceil(value * 2) / 2;
const clampPercent = (value: number) => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

const findBand = (employees: number) => bands.find((band) => employees <= band.max) || bands[bands.length - 1];

const getIntegrationReduction = (levelValue: number, teamValue: number) => {
  const level = clampPercent(levelValue);
  const team = clampPercent(teamValue);
  if (level <= 20 || team <= 20) return 0;
  if (level <= 40) return 5;
  if (level <= 60) return team <= 40 ? 5 : 10;
  if (level <= 80) {
    if (team <= 40) return 5;
    if (team <= 60) return 10;
    return 15;
  }
  if (team <= 40) return 5;
  if (team <= 60) return 10;
  if (team <= 80) return 15;
  return 20;
};

const allocateRoundedTotals = (values: number[], reductionPercent: number) => {
  if (values.length === 0) return [];
  const factor = 1 - reductionPercent / 100;
  const target = roundHalf(values.reduce((sum, value) => sum + value, 0) * factor);
  const raw = values.map((value) => value * factor);
  const allocated = raw.map((value) => Math.floor(value * 2) / 2);
  let increments = Math.max(0, Math.round((target - allocated.reduce((sum, value) => sum + value, 0)) * 2));
  const order = raw
    .map((value, index) => ({ index, remainder: value - allocated[index] }))
    .sort((a, b) => b.remainder - a.remainder);
  for (let index = 0; index < increments; index += 1) {
    allocated[order[index % order.length].index] += 0.5;
  }
  return allocated.map((value) => Math.max(0.5, value));
};

const splitInitialDays = (standard: CoreIsoStandard, total: number) => {
  if (standard === 'ISO 9001') {
    return { stage1Days: ceilHalf(total / 3), stage2Days: ceilHalf((total * 2) / 3) };
  }
  if (standard === 'ISO 14001') {
    return { stage1Days: ceilHalf(total / 3), stage2Days: roundHalf((total * 2) / 3) };
  }
  return { stage1Days: roundHalf(total / 3), stage2Days: ceilHalf((total * 2) / 3) };
};

const resolveEffectiveEmployees = (input: AuditDurationInput, warnings: string[]) => {
  const fullTime = Math.max(0, input.fullTimeEmployees || 0);
  const partTime = Math.max(0, input.partTimeEmployees || 0);
  const partTimeFte = Math.max(0, Math.min(1, input.partTimeFte ?? 0.5));
  const contractors = Math.max(0, input.contractorEmployees || 0);
  const calculated = Math.ceil(fullTime + partTime * partTimeFte + contractors);
  if ((input.effectiveEmployeeOverride || 0) > 0) {
    if (!input.overrideJustification?.trim()) warnings.push('유효 인원 수동 조정에는 근거 입력이 필요합니다.');
    return Math.ceil(input.effectiveEmployeeOverride || calculated);
  }
  return calculated;
};

const buildSiteSampling = (input: AuditDurationInput, warnings: string[]): AuditSiteSamplingResult | null => {
  const totalSites = Math.max(1, Math.floor(input.siteCount || 1));
  if (totalSites <= 1) return null;
  const eligible = Boolean(input.multiSite?.eligible);
  const samplingAllowed = eligible && Boolean(input.multiSite?.samplingAllowed);
  if (!eligible) {
    warnings.push('다사업장 적격성과 중앙기능을 확인하지 않았으므로 사업장별 심사일수 검토가 필요합니다.');
  }
  if (eligible && !samplingAllowed) {
    warnings.push('다사업장 표본심사를 적용하지 않아 최초·갱신은 전체 사업장을 대상으로 계산합니다.');
  }
  return {
    totalSites,
    initialSampleSites: samplingAllowed ? Math.ceil(Math.sqrt(totalSites)) : totalSites,
    surveillanceSampleSites: samplingAllowed ? Math.ceil(0.6 * Math.sqrt(totalSites)) : Math.ceil(totalSites * 0.3),
    recertSampleSites: samplingAllowed
      ? Math.ceil((input.multiSite?.effectiveCycle ? 0.8 : 1) * Math.sqrt(totalSites))
      : totalSites,
    centralFunctionRequired: true,
    samplingApplied: samplingAllowed,
  };
};

export const createDefaultAuditDurationInput = (
  standards: string[],
  fullTimeEmployees = 0,
  siteCount = 1,
): AuditDurationInput => ({
  standards,
  fullTimeEmployees,
  partTimeEmployees: 0,
  partTimeFte: 0.5,
  contractorEmployees: 0,
  complexity: {
    'ISO 9001': 'medium',
    'ISO 14001': 'medium',
    'ISO 45001': 'medium',
  },
  siteCount,
  multiSite: {
    eligible: false,
    samplingAllowed: false,
    effectiveCycle: false,
  },
  integration: {
    level: 0,
    teamAbility: 0,
  },
});

export const calculateAuditDuration = (input: AuditDurationInput): AuditDurationResult => {
  const warnings: string[] = [];
  const rationale: string[] = [];
  const selected = CORE_ISO_STANDARDS.filter((standard) => input.standards.includes(standard));
  const unsupported = input.standards.filter((standard) => !CORE_ISO_STANDARDS.includes(standard as CoreIsoStandard));
  const effectiveEmployees = resolveEffectiveEmployees(input, warnings);
  const siteSampling = buildSiteSampling(input, warnings);

  if (unsupported.length > 0) {
    warnings.push(`${unsupported.join(', ')}은 현재 자동 산정 대상이 아니므로 별도 절차로 확인해야 합니다.`);
  }
  if (effectiveEmployees > 10700) {
    warnings.push('유효 인원 10,700명 초과 조직은 MD5 표의 증가 추세와 조직 복잡성을 별도로 검토해야 합니다.');
  }
  if (effectiveEmployees > 0) {
    rationale.push(
      `유효 인원 ${effectiveEmployees}명 = 정규/기본 ${Math.max(0, input.fullTimeEmployees || 0)}명`
      + ` + 시간제 ${Math.max(0, input.partTimeEmployees || 0)}명 × ${input.partTimeFte ?? 0.5}`
      + ` + 계약·상주 인력 ${Math.max(0, input.contractorEmployees || 0)}명`,
    );
  }

  const baseValues = selected.map((standard) => {
    const band = findBand(Math.max(1, effectiveEmployees));
    const requestedComplexity = input.complexity?.[standard] || 'medium';
    if (standard === 'ISO 9001') return band.qms;
    if (standard === 'ISO 14001') return band.ems[requestedComplexity];
    const ohsComplexity = requestedComplexity === 'limited' ? 'low' : requestedComplexity;
    if (requestedComplexity === 'limited') warnings.push('ISO 45001에는 Limited 복잡도를 적용할 수 없어 Low로 계산했습니다.');
    return band.ohs[ohsComplexity];
  });

  const integrationReductionPercent = selected.length >= 2
    ? getIntegrationReduction(input.integration?.level || 0, input.integration?.teamAbility || 0)
    : 0;
  if (selected.length >= 2 && integrationReductionPercent === 0) {
    warnings.push('통합심사 감축 근거가 입력되지 않아 규격별 심사일수를 단순 합산했습니다.');
  }
  if (integrationReductionPercent > 0) {
    rationale.push(
      `MD11 통합수준 ${clampPercent(input.integration?.level || 0)}%, 심사팀 수행능력 `
      + `${clampPercent(input.integration?.teamAbility || 0)}%에 따라 ${integrationReductionPercent}%를 감축했습니다.`,
    );
  }

  const adjustedValues = allocateRoundedTotals(baseValues, integrationReductionPercent);
  const perStandard = selected.map((standard, index): StandardAuditDurationResult => {
    const complexity = input.complexity?.[standard] || 'medium';
    const baseInitialDays = baseValues[index];
    const adjustedInitialDays = adjustedValues[index];
    const split = splitInitialDays(standard, adjustedInitialDays);
    const standardRationale = [
      `${standard}: MD5 유효 인원 구간과 ${standard === 'ISO 9001' ? '기본' : complexity} 복잡도로 최초심사 ${baseInitialDays}일을 산정했습니다.`,
      `ADJ v3의 규격별 분할 방식으로 1단계 ${split.stage1Days}일, 2단계 ${split.stage2Days}일을 제안합니다.`,
    ];
    return {
      standard,
      effectiveEmployees,
      complexity,
      baseInitialDays,
      adjustedInitialDays,
      ...split,
      surveillanceDays: Math.max(1, roundHalf(adjustedInitialDays / 3)),
      recertDays: Math.max(1, roundHalf((adjustedInitialDays * 2) / 3)),
      rationale: standardRationale,
    };
  });

  if (siteSampling) {
    rationale.push(
      `MD1 기준 사업장 표본: 최초 ${siteSampling.initialSampleSites}, 사후관리 ${siteSampling.surveillanceSampleSites}, `
      + `갱신 ${siteSampling.recertSampleSites}개 사업장 및 중앙기능 심사.`,
    );
  }
  rationale.push('사후관리 약 1/3, 갱신 약 2/3 기준으로 0.5일 단위 반올림하고 최소 1일을 적용했습니다.');

  let status: AuditCalculationStatus = 'calculated';
  if (selected.length === 0 || effectiveEmployees <= 0) status = 'insufficient';
  else if (
    warnings.length > 0
    || Boolean(siteSampling)
    || (input.effectiveEmployeeOverride || 0) > 0
  ) status = 'review_required';

  return {
    rulesetVersion: RULESET_VERSION,
    calculatedAt: new Date().toISOString(),
    status,
    effectiveEmployees,
    integrationReductionPercent,
    combinedBaseInitialDays: roundHalf(baseValues.reduce((sum, value) => sum + value, 0)),
    combinedAdjustedInitialDays: roundHalf(perStandard.reduce((sum, row) => sum + row.stage1Days + row.stage2Days, 0)),
    perStandard,
    siteSampling,
    warnings,
    rationale,
  };
};
