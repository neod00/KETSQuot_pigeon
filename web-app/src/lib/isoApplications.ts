import 'server-only';

import { createHash } from 'node:crypto';
import { listDeletedIsoApplicationIds } from './isoApplicationInbox';
import type { IsoApplication, IsoApplicationStatus, IsoQuoteInput } from './isoTypes';

type LegacyRecord = Record<string, unknown>;

const repairText = (value: unknown) => {
  const text = String(value ?? '').trim();
  if (!/[ÃÂìëíê]/.test(text)) return text;
  try {
    return Buffer.from(text, 'latin1').toString('utf8');
  } catch {
    return text;
  }
};

const normalizedRecord = (record: LegacyRecord) => Object.fromEntries(
  Object.entries(record).map(([key, value]) => [repairText(key), typeof value === 'string' ? repairText(value) : value]),
) as LegacyRecord;

const toSourceFields = (record: LegacyRecord) => Object.fromEntries(
  Object.entries(record).map(([key, value]) => {
    const text = Array.isArray(value)
      ? value.map(repairText).filter(Boolean).join(', ')
      : repairText(value);
    return [key, text];
  }),
);

const pick = (record: LegacyRecord, aliases: string[]) => {
  for (const alias of aliases) {
    const value = record[alias];
    if (value !== undefined && value !== null && String(value).trim() !== '') return repairText(value);
  }
  return '';
};

const toBoolean = (value: string) => ['yes', 'true', '1', '예', '동의', '신청'].includes(value.trim().toLowerCase());

const toNumber = (value: string, fallback = 0) => {
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeStandards = (record: LegacyRecord) => {
  const source = [
    pick(record, ['ISO표준', 'ISO 표준', 'isoStandards']),
    pick(record, ['기타표준', '기타 표준', 'otherStandards']),
    pick(record, ['기존표준', '기존 표준', 'existingStandard']),
  ].filter(Boolean).join(', ');
  const matches = source.match(/ISO\s*\d{4,5}(?:-\d)?/gi) || [];
  return [...new Set(matches.map((item) => item.replace(/ISO\s*/i, 'ISO ')))];
};

const mapStatus = (source: string, quoteReady: boolean): IsoApplicationStatus => {
  if (source.includes('완료')) return 'completed';
  if (source.includes('진행')) return 'in_review';
  return quoteReady ? 'quote_ready' : 'new';
};

const createApplicationId = (record: LegacyRecord) => {
  const seed = [
    pick(record, ['신청일시', 'applicationDate']),
    pick(record, ['법인명(국문)', 'companyNameKo', 'companyName']),
    pick(record, ['담당자이메일', 'contactEmail']),
    pick(record, ['담당자명', 'contactName']),
  ].join('|');
  return `APP-${createHash('sha256').update(seed, 'utf8').digest('hex').slice(0, 16).toUpperCase()}`;
};

export const normalizeLegacyApplication = (sourceRecord: LegacyRecord): IsoApplication => {
  const record = normalizedRecord(sourceRecord);
  const companyName = pick(record, ['법인명(국문)', 'companyNameKo', 'companyName']);
  const companyNameEn = pick(record, ['법인명(영문)', 'companyNameEn']);
  const contactName = pick(record, ['담당자명', 'contactName']);
  const contactEmail = pick(record, ['담당자이메일', 'contactEmail']);
  const contactPhone = pick(record, ['담당자전화', 'contactPhone', '대표전화번호']);
  const standards = normalizeStandards(record);
  const otherStandards = pick(record, ['기타표준', 'otherStandards']);
  const scope = pick(record, ['인증범위', 'certificationScope', '활동내용기재']);
  const siteCount = Math.max(1, toNumber(pick(record, ['인증포함사업장수', 'siteCount']), 1));
  const employeeCount = toNumber(pick(record, ['총직원수', 'totalEmployees']), 0);
  const existingCertification = toBoolean(pick(record, ['기존인증보유여부', 'existingCertification']));
  const transferRequested = toBoolean(pick(record, ['기존인증LRQA이전요청', 'transferToLrqa']));
  const auditType = transferRequested ? 'transfer' : existingCertification ? 'renewal' : 'new_certification';
  const missingFields = [
    !companyName ? '고객사명' : '',
    !contactName ? '담당자명' : '',
    !contactEmail && !contactPhone ? '담당자 연락처' : '',
    standards.length === 0 ? 'ISO 표준' : '',
    !scope ? '인증 범위' : '',
    employeeCount <= 0 ? '직원 수' : '',
  ].filter(Boolean);
  const quoteReady = missingFields.length === 0;
  const sourceStatus = pick(record, ['상태', 'status']) || '신규';
  const desiredYear = pick(record, ['희망년도', 'desiredAuditYear']);
  const desiredMonth = pick(record, ['희망월', 'desiredAuditMonth']);

  return {
    id: createApplicationId(record),
    submittedAt: pick(record, ['신청일시', 'applicationDate']),
    status: mapStatus(sourceStatus, quoteReady),
    sourceStatus,
    companyName: companyName || companyNameEn || '회사명 미입력',
    companyNameEn,
    contactName,
    contactEmail,
    contactPhone,
    mobilePhone: pick(record, ['휴대폰번호', 'mobilePhone']),
    standards,
    otherStandards,
    scope,
    activityDescription: pick(record, ['활동내용기재', 'activityDescription']),
    siteCount,
    siteList: pick(record, ['사업장목록', 'siteList']),
    siteAddress: pick(record, ['본사주소', 'headOfficeAddress']),
    postalCode: pick(record, ['우편번호', 'postalCode']),
    employeeCount,
    auditType,
    desiredAuditDate: [desiredYear, desiredMonth].filter(Boolean).join('-'),
    existingCertification,
    existingCertificationBody: pick(record, ['기존인증기관', 'existingCertBody']),
    certificationExpiryDate: pick(record, ['인증만료일', 'certExpiryDate']),
    transferRequested,
    consultantName: pick(record, ['컨설턴트명', 'consultantName']),
    consultingOrg: pick(record, ['컨설팅기관', 'consultingOrg']),
    businessRegistrationNumber: pick(record, ['사업자등록번호', 'businessRegNumber']),
    dataConsent: toBoolean(pick(record, ['데이터처리동의', 'dataConsent'])),
    sourceFields: toSourceFields(record),
    missingFields,
    quoteReady,
  };
};

export async function fetchIsoApplications(): Promise<IsoApplication[]> {
  const apiUrl = process.env.ISO_APPLICATIONS_API_URL ||
    'https://lrqa-iso-application.netlify.app/.netlify/functions/get-applications';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (process.env.ISO_APPLICATIONS_API_KEY) headers['x-internal-api-key'] = process.env.ISO_APPLICATIONS_API_KEY;
  const response = await fetch(apiUrl, { headers, cache: 'no-store' });
  if (!response.ok) throw new Error(`신청서 API 응답 오류: ${response.status}`);
  const payload = await response.json() as { data?: { applications?: LegacyRecord[] }; applications?: LegacyRecord[] };
  const records = payload.data?.applications || payload.applications || [];
  const deletedIds = await listDeletedIsoApplicationIds();
  return records
    .map(normalizeLegacyApplication)
    .filter((application) => !deletedIds.has(application.id))
    .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
}

export async function findIsoApplication(applicationId: string) {
  const applications = await fetchIsoApplications();
  return applications.find((application) => application.id === applicationId) || null;
}

export const toIsoQuoteInput = (application: IsoApplication): IsoQuoteInput => {
  const supported = ['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 27001', 'ISO 50001'];
  const standards = application.standards.filter((standard) => supported.includes(standard));
  const distinctOtherStandard = application.otherStandards.trim() !== application.scope.trim() ? application.otherStandards : '';
  const customStandard = application.standards.find((standard) => !supported.includes(standard)) || distinctOtherStandard;
  return {
    companyName: application.companyName,
    contactPerson: application.contactName,
    auditType: application.auditType,
    standards: standards.length > 0 ? standards : ['ISO 9001'],
    customStandard: customStandard || undefined,
    scope: application.scope,
    siteName: '본사',
    siteAddress: application.siteAddress,
    siteCount: application.siteCount,
    employeeCount: application.employeeCount,
    customerPhone: application.mobilePhone || application.contactPhone,
    customerEmail: application.contactEmail,
    postalCode: application.postalCode,
    businessRegistrationNumber: application.businessRegistrationNumber,
    billingAddress: application.siteAddress,
  };
};
