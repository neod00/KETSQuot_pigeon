/** Questionnaire transcribed from LRQA Application_2023A, pages 1–4. */
export const ISO_COMPLIANCE_STANDARDS = ['ISO 37001', 'ISO 37301'] as const;
export type IsoComplianceStandard = typeof ISO_COMPLIANCE_STANDARDS[number];
export const ISO_COMPLIANCE_FORM_VERSION = 'LRQA-2023A-37001-37301-v1';

export interface ApplicationField {
  key: string;
  label: string;
  type?: 'textarea' | 'email' | 'number' | 'month' | 'date';
  options?: readonly string[];
  required?: boolean;
  when?: readonly [string, string];
}
export interface ApplicationSection { title: string; fields: ApplicationField[] }
export const YES_NO = ['예', '아니요'] as const;
const yn = (key: string, label: string, required = false): ApplicationField => ({ key, label, options: YES_NO, required });

export const ISO_COMPANY_FIELDS: ApplicationField[] = [
  { key: 'companyNameKo', label: '회사명 국문', required: true },
  { key: 'companyNameEn', label: '회사명 영문' },
  { key: 'representative', label: '대표자' },
  { key: 'businessRegNumber', label: '사업자등록번호' },
  { key: 'website', label: 'Homepage' },
  { key: 'contactName', label: '담당자 성명', required: true },
  { key: 'positionDepartment', label: '직책 / 부서' },
  { key: 'contactPhone', label: '전화', required: true },
  { key: 'fax', label: '팩스' },
  { key: 'mobilePhone', label: '핸드폰' },
  { key: 'contactEmail', label: 'E-Mail', type: 'email', required: true },
];
export const ISO_SITE_FIELDS: ApplicationField[] = [
  { key: 'address', label: '주소', required: true },
  { key: 'postalCode', label: '우편번호' },
  { key: 'totalEmployees', label: '전체 종업원 수', type: 'number', required: true },
  { key: 'permanentEmployees', label: '정규 종업원 수', type: 'number' },
  { key: 'temporaryEmployees', label: '비정규 종업원 수', type: 'number' },
  { key: 'shiftTeams', label: '교대조 수', type: 'number' },
  { key: 'shiftPattern', label: '교대 근무 방식 / 시간' },
  { key: 'shiftEmployees', label: '교대근무자 전체 인원', type: 'number' },
  yn('sameShiftActivities', '교대조별 활동이 같은가요?'),
  { key: 'shiftActivities', label: '교대조 활동 설명', type: 'textarea' },
  { key: 'processes', label: '프로세스 / 사업장 활동', type: 'textarea' },
  { key: 'resources', label: '자원 / 주요설비·특허·실용신안', type: 'textarea' },
];
export const ISO_COMMON_SECTIONS: ApplicationSection[] = [
  { title: '인증 심사 및 인증범위', fields: [
    yn('integratedAudit', '2개 이상 인증 신청 시 통합심사 진행 여부'),
    { key: 'integrationLevel', label: '통합 시스템 구축 정도', options: ['20%', '40%', '60%', '80%', '100%', '기타'], when: ['integratedAudit', '예'] },
    { key: 'integrationOther', label: '기타 통합 시스템 구축 정도', when: ['integrationLevel', '기타'] },
    { key: 'accreditation', label: '인정기관', options: ['UKAS(영국)', 'KAB(국내)', '기타 해외 인정기관'] },
    { key: 'accreditationOther', label: '기타 인정기관명', when: ['accreditation', '기타 해외 인정기관'] },
    { key: 'scopeKo', label: '인증범위 국문', type: 'textarea', required: true },
    { key: 'scopeEn', label: '인증범위 영문', type: 'textarea' },
  ] },
  { title: '리스크평가 및 사내외주처리', fields: [
    yn('safetyRelated', '안전에 영향을 주는 산업 및 제품에 해당합니까?'),
    yn('highRisk', '산업 및 활동이 인명 또는 공공에 치명적인 영향을 미칩니까?'),
    yn('specialLegislation', '제품 / 서비스에 특별 법규가 적용됩니까?'),
    { key: 'applicableLaws', label: '해당 법규', when: ['specialLegislation', '예'] },
    yn('additionalRequirements', '특정 산업 / 단체 요구사항이 적용됩니까?'),
    { key: 'requirementsDetail', label: '해당 요구사항', when: ['additionalRequirements', '예'] },
    yn('outsourcing', '경영시스템 범위에 포함된 활동 중 사내외주처리 활동이 있습니까?'),
    { key: 'outsourcingActivity1', label: '외주처리활동 1 활동명', when: ['outsourcing', '예'] },
    { key: 'outsourcingEmployees1', label: '외주처리활동 1 인원수', type: 'number', when: ['outsourcing', '예'] },
    { key: 'outsourcingActivity2', label: '외주처리활동 2 활동명', when: ['outsourcing', '예'] },
    { key: 'outsourcingEmployees2', label: '외주처리활동 2 인원수', type: 'number', when: ['outsourcing', '예'] },
  ] },
  { title: '경영시스템 현황', fields: [
    yn('managementSystem', '1. 신청규격에 대한 경영시스템이 있습니까?'),
    { key: 'systemStart', label: '경영시스템 실행 시작 연월', type: 'month', when: ['managementSystem', '예'] },
    { key: 'systemMonths', label: '실행 기간 (개월)', type: 'number', when: ['managementSystem', '예'] },
    yn('existingCertification', '2. 경영시스템 인증을 받은 바가 있습니까?'),
    { key: 'existingCertBody', label: '기존 인증기관', when: ['existingCertification', '예'] },
    { key: 'existingStandard', label: '기존 인증규격', when: ['existingCertification', '예'] },
    { key: 'existingScope', label: '기존 인증범위', type: 'textarea', when: ['existingCertification', '예'] },
    { key: 'certExpiryDate', label: '인증서 유효기간', type: 'date', when: ['existingCertification', '예'] },
    { key: 'auditProgress', label: '진행된 심사 단계', options: ['예비심사', '1단계 심사', '2단계 심사', '사후 심사', '재인증 심사'], when: ['existingCertification', '예'] },
    { key: 'recertificationNumber', label: '재인증 심사 차수', type: 'number', when: ['auditProgress', '재인증 심사'] },
    yn('consultantAdvice', '3. 컨설턴트의 자문을 받고 있습니까?'),
    { key: 'consultingOrg', label: '컨설팅 기관', when: ['consultantAdvice', '예'] },
    { key: 'consultantName', label: '컨설턴트', when: ['consultantAdvice', '예'] },
    yn('customerRequirement', '4. 경영시스템 인증을 요구한 고객이 있습니까?'),
    { key: 'requestingCustomer', label: '고객명', when: ['customerRequirement', '예'] },
    { key: 'requestedStandard', label: '고객이 요구한 인증규격', when: ['customerRequirement', '예'] },
    yn('designResponsibility', '5. 설계 책임이 있습니까?'),
    { key: 'designLocation', label: '설계부서 위치', when: ['designResponsibility', '예'] },
    { key: 'designEmployees', label: '설계부서 인원수', type: 'number', when: ['designResponsibility', '예'] },
    { key: 'stage1Date', label: '6. 희망하는 1단계 심사 연월', type: 'month' },
    { key: 'stage2Date', label: '희망하는 2단계 심사 연월', type: 'month' },
    yn('preAudit', '7. 예비심사를 희망하십니까?'),
    { key: 'preAuditDate', label: '예비심사 희망 연월', type: 'month', when: ['preAudit', '예'] },
    { key: 'preAuditDays', label: '예비심사 일수 (Manday)', when: ['preAudit', '예'] },
    yn('onsiteTraining', '8. 방문 교육을 희망하십니까?'),
    { key: 'trainingDate', label: '교육 희망 연월', type: 'month', when: ['onsiteTraining', '예'] },
    { key: 'trainingDuration', label: '교육 시간 / 일수', when: ['onsiteTraining', '예'] },
    { key: 'constructionSites', label: '9. 건설업의 경우 시공분야별 개설 현장 수', type: 'textarea' },
    { key: 'referral', label: '10. LRQA에 인증을 신청하신 동기', type: 'textarea' },
    { key: 'additionalInfo', label: '추가 참고사항 / 조직도 전달 관련 메모', type: 'textarea' },
  ] },
];

export const ISO_37001_FIELDS: ApplicationField[] = [
  { key: 'briberyIssues', label: '1. 최근 귀사에서 반부패 또는 뇌물 관련 해당되는 이슈가 있었습니까?', options: ['해당되는 이슈가 있었음', '해당되는 이슈가 없었음'], required: true },
  { key: 'exports', label: '2. 해외 수출하는 제품 / 서비스가 있습니까?', options: ['수출하고 있음', '수출하지 않음'], required: true },
  { key: 'exportCountries', label: '수출국가명', required: true, when: ['exports', '수출하고 있음'] },
  { key: 'industry', label: '3. 귀사가 해당되는 업종 분류', options: ['중앙행정기관', '광역자치단체 / 기초자치단체', '교육청', '공직 유관단체 / 공단 / 공사 등', '제조업', '건설업', '도소매업', '운수업', '교육서비스업', '보건·의료·사회복지', '금융·보험업'], required: true },
  { key: 'integrityGrade', label: '종합청렴도 조사등급 (해당 시)' },
  { key: 'agents', label: '4. 귀사를 대신하여 의뢰인이나 공직자와 교류하는 대리인 / 중개인이 있습니까?', options: ['있음', '없음'], required: true },
  { key: 'agentCount', label: '대리인 / 중개인 수 (명)', type: 'number', required: true, when: ['agents', '있음'] },
  { key: 'publicOfficials', label: '5. 허가와 승인을 담당하는 국내 또는 해외 공직자와 교류가 있습니까?', options: ['예 (정기적)', '예 (비정기적)', '아니요'], required: true },
];
export const ISO_37301_FIELDS: ApplicationField[] = [
  { key: 'violations', label: '1. 최근 귀사에서 법규위반에 해당되는 이슈가 있었습니까?', options: ['년 1건 초과로 있었음', '년 1건 있었음', '없음'], required: true },
  { key: 'monitoring', label: '2. 준법을 감시하는 별도의 기능 (조직, 모니터링)이 있습니까?', options: ['있음', '일부 있음', '없음'], required: true },
  { key: 'riskAssessment', label: '3. 준법에 대한 리스크 평가가 이루어져 있습니까?', options: ['있음', '일부 있음', '없음'], required: true },
  { key: 'internalControls', label: '4. 준법 의무사항에 대한 내부통제기준이 별도로 마련되어 있습니까?', options: ['있음', '일부 있음', '없음'], required: true },
];
export const ISO_PERSONNEL_ROLES = ['최고 경영자', '준수책임자', '각 부서장', '컴플라이언스 조직', '재무,구매', '법률 또는 계약', '프로젝트 관리', '현장관리자/감독자', '유통,판매/마케팅'] as const;
export interface IsoPersonnelRow { counts: string[]; note: string }
export interface IsoComplianceSupplement { fields: Record<string, string>; personnel: IsoPersonnelRow[] }
export interface IsoComplianceApplicationInput {
  standards: IsoComplianceStandard[];
  common: Record<string, string>;
  sites: Record<string, string>[];
  antiBribery?: IsoComplianceSupplement;
  compliance?: IsoComplianceSupplement;
  consent: boolean;
}
export const fieldIsVisible = (field: ApplicationField, values: Record<string, string>, definitions: ApplicationField[]): boolean => {
  if (!field.when) return true;
  const parent = definitions.find(item => item.key === field.when![0]);
  return values[field.when[0]] === field.when[1] && (!parent || fieldIsVisible(parent, values, definitions));
};
export const createIsoSupplement = (siteCount = 1): IsoComplianceSupplement => ({
  fields: {}, personnel: ISO_PERSONNEL_ROLES.map(() => ({ counts: Array<string>(Math.max(5, siteCount)).fill(''), note: '' })),
});
export const createIsoComplianceApplication = (): IsoComplianceApplicationInput => ({ standards: [], common: {}, sites: [{}], consent: false });
export const siteLabel = (index: number) => index === 0 ? '본사' : `사업장${index}`;
export const personnelTotals = (rows: IsoPersonnelRow[], columns: number) => Array.from({ length: columns }, (_, column) => {
  const values = rows.map(row => row.counts[column] || '');
  return values.every(value => value === '') ? '' : String(values.reduce((sum, value) => sum + Number(value || 0), 0));
});

const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('신청서 형식을 확인해 주세요.');
  return value as Record<string, unknown>;
};
function parseFields(value: unknown, definitions: ApplicationField[], prefix: string) {
  const source = object(value);
  const fields: Record<string, string> = {};
  for (const field of definitions) {
    const raw = source[field.key] ?? '';
    if (typeof raw !== 'string' || raw.length > (field.type === 'textarea' ? 6000 : 500)) throw new Error(`${prefix} ${field.label} 형식을 확인해 주세요.`);
    fields[field.key] = raw.trim();
  }
  for (const field of definitions) {
    if (!fieldIsVisible(field, fields, definitions)) { fields[field.key] = ''; continue; }
    const text = fields[field.key];
    if (field.required && !text) throw new Error(`${prefix} ${field.label} 항목을 입력해 주세요.`);
    if (!text) continue;
    if (field.options && !field.options.includes(text)) throw new Error(`${prefix} ${field.label} 선택값을 확인해 주세요.`);
    if (field.type === 'number' && (!/^\d+$/.test(text) || Number(text) > 1_000_000)) throw new Error(`${prefix} ${field.label}은 0 이상의 정수로 입력해 주세요.`);
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) throw new Error('이메일 주소를 확인해 주세요.');
    if (field.type === 'month' && !/^\d{4}-(0[1-9]|1[0-2])$/.test(text)) throw new Error(`${field.label}을 확인해 주세요.`);
    if (field.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(Date.parse(text)) || new Date(text).toISOString().slice(0, 10) !== text)) throw new Error(`${field.label}을 확인해 주세요.`);
  }
  return fields;
}
function parseSupplement(value: unknown, definitions: ApplicationField[], standard: string, sites: number): IsoComplianceSupplement {
  const source = object(value);
  const fields = parseFields(source.fields, definitions, standard);
  const columns = Math.max(5, sites);
  if (!Array.isArray(source.personnel) || source.personnel.length !== ISO_PERSONNEL_ROLES.length) throw new Error(`${standard} 인원표를 확인해 주세요.`);
  const personnel = source.personnel.map((value, index) => {
    const row = object(value);
    if (!Array.isArray(row.counts) || row.counts.length !== columns || row.counts.some(count => typeof count !== 'string' || (count !== '' && (!/^\d+$/.test(count) || Number(count) > 1_000_000)))) throw new Error(`${standard} ${ISO_PERSONNEL_ROLES[index]} 인원은 0 이상의 정수로 입력해 주세요.`);
    if (typeof row.note !== 'string' || row.note.length > 1000) throw new Error(`${standard} 인원표 비고를 확인해 주세요.`);
    return { counts: row.counts.map((count, column) => column < sites ? count as string : ''), note: row.note.trim() };
  });
  return { fields, personnel };
}
export function parseIsoComplianceApplication(value: unknown): IsoComplianceApplicationInput {
  const source = object(value);
  if (!Array.isArray(source.standards) || !source.standards.length || source.standards.length > 2 || source.standards.some(item => !ISO_COMPLIANCE_STANDARDS.includes(item as IsoComplianceStandard))) throw new Error('ISO 37001 또는 ISO 37301을 선택해 주세요.');
  const standards = [...new Set(source.standards)] as IsoComplianceStandard[];
  const common = parseFields(source.common, [...ISO_COMPANY_FIELDS, ...ISO_COMMON_SECTIONS.flatMap(section => section.fields), { key: 'author', label: '작성자', required: true }, { key: 'signatureDate', label: '작성일', type: 'date', required: true }], '');
  if (!Array.isArray(source.sites) || source.sites.length < 1 || source.sites.length > 20) throw new Error('사업장은 1~20개까지 입력할 수 있습니다.');
  const sites = source.sites.map((site, index) => parseFields(site, ISO_SITE_FIELDS, siteLabel(index)));
  if (sites.reduce((sum, site) => sum + Number(site.totalEmployees), 0) <= 0) throw new Error('전체 종업원 수를 1명 이상 입력해 주세요.');
  if (source.consent !== true) throw new Error('개인정보 수집·이용 동의가 필요합니다.');
  return {
    standards, common, sites, consent: true,
    ...(standards.includes('ISO 37001') ? { antiBribery: parseSupplement(source.antiBribery, ISO_37001_FIELDS, 'ISO 37001', sites.length) } : {}),
    ...(standards.includes('ISO 37301') ? { compliance: parseSupplement(source.compliance, ISO_37301_FIELDS, 'ISO 37301', sites.length) } : {}),
  };
}

/** Common aliases keep existing inbox, audit review and quote workflows usable. */
export function isoComplianceSourceFields(input: IsoComplianceApplicationInput, submittedAt: string): Record<string, string> {
  const c = input.common;
  return {
    ...c, applicationDate: submittedAt, isoStandards: input.standards.join(', '),
    headOfficeAddress: input.sites[0].address, postalCode: input.sites[0].postalCode,
    totalEmployees: String(input.sites.reduce((sum, site) => sum + Number(site.totalEmployees), 0)),
    siteCount: String(input.sites.length), certificationScope: c.scopeKo, activityDescription: c.scopeKo,
    siteList: input.sites.map((site, i) => `${siteLabel(i)} | ${site.address} | ${site.processes || ''} | ${site.totalEmployees}명`).join('\n'),
    department: c.positionDepartment, dataConsent: '예', signature: c.author,
    desiredAuditYear: c.stage1Date?.split('-')[0] || '', desiredAuditMonth: c.stage1Date?.split('-')[1] || '',
    formVersion: ISO_COMPLIANCE_FORM_VERSION,
    ...(input.antiBribery ? { ISO37001추가양식: JSON.stringify(input.antiBribery) } : {}),
    ...(input.compliance ? { ISO37301추가양식: JSON.stringify(input.compliance) } : {}),
  };
}
