import { assessCnCode } from '@/shared/cbam-cn';
import { assessApplicability, REGULATIONS } from '@/shared/cbam-regulatory';

export type ApplicabilityInput = Parameters<typeof assessApplicability>[0];
export type ApplicabilityField = keyof ApplicabilityInput;
export type ApplicabilityIssue = {
  field: ApplicabilityField;
  title: string;
  detail: string;
  action: string;
};
type Reference = { label: string; url: string };
export type ApplicabilityGuidance = {
  heading: string;
  summary: string;
  issues: ApplicabilityIssue[];
  references: Reference[];
};
export const APPLICABILITY_FIELD_LABELS: Record<ApplicabilityField, string> = {
  euExport: 'EU 반입 여부', cnCode: 'CN 코드', origin: '관세 원산지',
  importer: '귀사의 역할', mass: '연간 수입량', allImports: '수입량 합산 여부',
};
const scopeReference = { label: '2023/956 제2조 · Annex I — EU 반입 및 대상 품목', url: REGULATIONS[0].sourceUrl };
const originReference = { label: '2023/956 제2조 · Annex III — 원산지 제외조건', url: REGULATIONS[0].sourceUrl };
const thresholdReference = { label: '2023/956 제2a조 · Annex VII (2025/2083 개정) — 연간 50톤 기준', url: REGULATIONS[0].sourceUrl };
const massIssue = (detail: string): ApplicabilityIssue => ({
  field: 'mass', title: 'EU 수입자의 연간 대상 수입량을 확인해야 합니다.', detail,
  action: 'EU 수입자에게 해당 연도의 시멘트·비료·철강·알루미늄 대상 품목 순중량 합계를 요청하세요. 모르면 비워두고 합산 확인 체크도 해제하세요.',
});

export function buildApplicabilityGuidance(input: ApplicabilityInput): ApplicabilityGuidance {
  const summary = assessApplicability(input);
  const code = assessCnCode(input.cnCode);
  if (input.euExport === 'no') return {
    heading: '현재 입력한 거래는 EU 반입 거래가 아닙니다.', summary,
    issues: [], references: [scopeReference],
  };

  const issues: ApplicabilityIssue[] = [];
  const references: Reference[] = [];
  if (input.euExport !== 'yes') {
    issues.push({ field: 'euExport', title: 'EU 반입 여부가 확인되지 않았습니다.',
      detail: input.euExport === 'unknown' ? 'EU 반입 여부를 ‘확인 필요’로 선택했습니다.' : 'EU 반입 여부를 선택하지 않았습니다.',
      action: '수입자 또는 무역 담당자에게 해당 거래의 EU 반입 여부를 확인한 뒤 ‘예’ 또는 ‘아니요’를 선택하세요.' });
    references.push(scopeReference);
  }
  if (code.status === 'invalid') {
    issues.push({ field: 'cnCode', title: 'CN 코드 입력을 확인해야 합니다.', detail: code.descriptionKo,
      action: 'EU 수입자에게 실제 통관 CN 코드를 확인하고 숫자와 허용된 공백·하이픈으로 입력하세요. 국내 10자리 HSK 코드를 그대로 입력하지 마세요.' });
  } else if (code.status === 'partial') {
    issues.push({ field: 'cnCode', title: `CN 코드 ${code.displayCode}만으로는 대상 여부를 구분할 수 없습니다.`,
      detail: '이 상위 코드 아래에는 CBAM 대상·비대상 또는 조건부 품목이 함께 있습니다. 상품분야가 표시되어도 최종 품목은 확인되지 않은 상태입니다.',
      action: 'EU 수입자 또는 통관 담당자에게 이 제품의 실제 8자리 CN 코드를 확인해 입력하세요.' });
    references.push(scopeReference);
  } else if (code.status === 'conditional') {
    issues.push({ field: 'cnCode', title: `CN 코드 ${code.displayCode}의 제품 속성을 확인해야 합니다.`, detail: code.explanation,
      action: '제품 사양서와 공급업체 자료에서 소성 여부를 확인하고 EU 수입자와 대상 품목 해당 여부를 검토하세요. 코드만 다시 입력해도 이 조건은 해소되지 않습니다.' });
    references.push(scopeReference);
  } else if (code.status === 'out_of_scope') {
    issues.push({ field: 'cnCode', title: 'CN 코드의 유효성과 실제 통관 분류를 재확인해야 합니다.', detail: code.explanation,
      action: 'EU TARIC 또는 EU 수입자의 통관자료로 코드가 실제 존재하고 제품에 맞는지 확인하세요. 포함 규칙과 불일치한다는 이유만으로 비대상으로 확정하지 마세요.' });
    references.push(scopeReference);
  }
  if (!input.origin) {
    issues.push({ field: 'origin', title: '관세 원산지를 선택하지 않았습니다.', detail: '발송국과 관세 원산지는 다를 수 있습니다.',
      action: '원산지 자료와 수입자의 통관정보를 확인한 뒤 관세 원산지를 선택하세요.' });
    references.push(originReference);
  }
  if (!input.importer) issues.push({ field: 'importer', title: '귀사의 역할을 선택하지 않았습니다.',
    detail: '한국 등 EU 밖에서 제품을 생산하는 회사는 ‘제3국 제조사업자’에 해당합니다.',
    action: '귀사가 EU 수입자·신고자인지, EU 밖의 제조사업자인지 확인해 선택하세요.' });

  if (issues.length) return {
    heading: `적용 판단을 위해 ${issues.length}개 항목을 확인해 주세요.`,
    summary: '수입량만으로는 적용 여부를 판단할 수 없습니다. 아래에 표시한 이유와 다음 행동을 확인하고, 입력사항을 수정한 뒤 ‘적용 가능성 확인’을 다시 누르세요.',
    issues, references: [...new Set(references)],
  };
  if (['CH', 'IS', 'LI', 'NO'].includes(input.origin)) return {
    heading: '관세 원산지의 제외조건을 확인해 주세요.', summary,
    issues: [{ field: 'origin', title: 'Annex III 원산지 제외 적용 가능성이 있습니다.',
      detail: '선택한 원산지는 스위스·아이슬란드·리히텐슈타인·노르웨이 중 하나입니다.',
      action: 'EU 수입자와 원산지 근거 및 제외조건 충족 여부를 확인하세요. 해당 국가에서 발송됐다는 사실만으로 제외되는 것은 아닙니다.' }],
    references: [originReference],
  };
  if (code.sector === '전력' || code.sector === '수소') return {
    heading: 'CBAM 적용 가능성이 높습니다.', summary, issues: [],
    references: [scopeReference, { label: '2023/956 제2a조 (2025/2083 개정) — 전력·수소는 소량면제 제외', url: REGULATIONS[0].sourceUrl }],
  };
  if (input.mass.trim() === '') issues.push(massIssue('연간 수입량이 입력되지 않았습니다. 우리 회사의 생산량·수출량이 아니라 해당 EU 수입자의 전체 대상 수입량이 필요합니다.'));
  else if (!Number.isFinite(Number(input.mass)) || Number(input.mass) < 0) issues.push(massIssue('수입량에는 0 이상의 유한한 숫자를 입력해야 합니다. 단위는 제품의 순중량(t)이며 배출량(tCO₂e)이 아닙니다.'));
  if (!input.allImports) issues.push({ field: 'allImports', title: '입력 수입량이 전체 합계인지 확인되지 않았습니다.',
    detail: '한 공급업체 또는 우리 회사의 EU 수출량만으로는 50톤 면제 기준을 판단할 수 없습니다.',
    action: '해당 EU 수입자의 모든 공급국·공급업체의 연간 대상 수입량을 합산한 값인지 확인한 경우에만 체크하세요.' });
  if (issues.length) return { heading: '수입량 합계를 확인해 주세요.', summary: '아래 항목을 확인한 뒤 적용 가능성을 다시 조회하세요.', issues, references: [thresholdReference] };
  return {
    heading: Number(input.mass) <= 50 ? '연간 50톤 이하 면제 적용 가능성이 있습니다.' : 'CBAM 적용 가능성이 높습니다.',
    summary: `입력한 연간 대상 수입량 ${new Intl.NumberFormat('ko-KR').format(Number(input.mass))}t은 50t 기준을 ${Number(input.mass) <= 50 ? '초과하지 않습니다' : '초과합니다'}. ${summary}`,
    issues: [], references: [scopeReference, thresholdReference],
  };
}
