import type { CoreIsoStandard } from './auditDurationEngine';

export type OhsRiskLevel = 'low' | 'medium' | 'high' | '';

export interface IsoMultiSiteRecord {
  name: string;
  address: string;
  activities: string;
  effectiveEmployees: string;
  ohsRisk: OhsRiskLevel;
  ohsRiskNotes: string;
}

export interface IsoMultiSiteEvidence {
  commonManagementSystem: boolean;
  legalOrContractualLink: boolean;
  centralFunctionControl: boolean;
  internalAuditProgramme: boolean;
  managementReview: boolean;
  samplingRationale: string;
  sites: IsoMultiSiteRecord[];
}

export const emptyMultiSiteEvidence = (): IsoMultiSiteEvidence => ({
  commonManagementSystem: false,
  legalOrContractualLink: false,
  centralFunctionControl: false,
  internalAuditProgramme: false,
  managementReview: false,
  samplingRationale: '',
  sites: [],
});

export const createMultiSiteRecords = (count: number, mainSite?: Partial<IsoMultiSiteRecord>) =>
  Array.from({ length: Math.max(0, Math.min(100, Math.floor(count))) }, (_, index): IsoMultiSiteRecord => ({
    name: index === 0 ? mainSite?.name || '본사' : `사업장 ${index + 1}`,
    address: index === 0 ? mainSite?.address || '' : '',
    activities: '',
    effectiveEmployees: '',
    ohsRisk: '',
    ohsRiskNotes: '',
  }));

export const normaliseMultiSiteEvidence = (value: unknown, siteCount: number): IsoMultiSiteEvidence => {
  const record = value && typeof value === 'object' ? value as Partial<IsoMultiSiteEvidence> : {};
  const sites = Array.isArray(record.sites)
    ? record.sites.slice(0, Math.max(0, siteCount)).map((site) => {
      const item = site && typeof site === 'object' ? site as Partial<IsoMultiSiteRecord> : {};
      return {
        name: String(item.name || ''),
        address: String(item.address || ''),
        activities: String(item.activities || ''),
        effectiveEmployees: String(item.effectiveEmployees || ''),
        ohsRisk: ['low', 'medium', 'high'].includes(String(item.ohsRisk)) ? String(item.ohsRisk) as OhsRiskLevel : '',
        ohsRiskNotes: String(item.ohsRiskNotes || ''),
      };
    })
    : [];
  return {
    commonManagementSystem: Boolean(record.commonManagementSystem),
    legalOrContractualLink: Boolean(record.legalOrContractualLink),
    centralFunctionControl: Boolean(record.centralFunctionControl),
    internalAuditProgramme: Boolean(record.internalAuditProgramme),
    managementReview: Boolean(record.managementReview),
    samplingRationale: String(record.samplingRationale || '').trim(),
    sites,
  };
};

export const multiSiteEvidenceIssues = (
  evidence: IsoMultiSiteEvidence,
  siteCount: number,
  standards: readonly string[],
) => {
  const issues: string[] = [];
  if (siteCount <= 1) return issues;
  if (!evidence.commonManagementSystem) issues.push('공통 경영시스템 운영 근거');
  if (!evidence.legalOrContractualLink) issues.push('중앙 기능과 사업장의 법적 또는 계약상 연결 근거');
  if (!evidence.centralFunctionControl) issues.push('중앙 기능의 운영 통제 근거');
  if (!evidence.internalAuditProgramme) issues.push('모든 사업장을 포함한 내부심사 프로그램');
  if (!evidence.managementReview) issues.push('중앙 경영검토 수행 근거');
  if (!evidence.samplingRationale.trim()) issues.push('표본심사 적용 근거');
  if (evidence.sites.length < siteCount) issues.push('전체 사업장 목록');

  evidence.sites.slice(0, siteCount).forEach((site, index) => {
    if (!site.name.trim() || !site.activities.trim()) issues.push(`사업장 ${index + 1}의 명칭 및 활동`);
  });

  if (standards.includes('ISO 45001')) {
    if (evidence.sites.slice(0, siteCount).some((site) => !site.ohsRisk)) {
      issues.push('ISO 45001 사업장별 OH&S 위험 수준');
    }
    if (evidence.sites.slice(0, siteCount).some((site) => !site.ohsRiskNotes.trim())) {
      issues.push('ISO 45001 사업장별 공정·위험 차이 근거');
    }
  }
  return [...new Set(issues)];
};

export const canApplyMultiSiteSampling = (
  evidence: IsoMultiSiteEvidence,
  siteCount: number,
  standards: readonly string[],
) => multiSiteEvidenceIssues(evidence, siteCount, standards).length === 0;

export const multiSiteReference = (standards: readonly CoreIsoStandard[] | readonly string[]) =>
  standards.includes('ISO 45001')
    ? 'IAF MD1:2018 및 MD22:2023 - 사업장별 OH&S 위험과 공정의 대표성 검토 필요'
    : 'IAF MD1:2018 - 다사업장 적격성 및 표본심사 근거 확인 필요';
