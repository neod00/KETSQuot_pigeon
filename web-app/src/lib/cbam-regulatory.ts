import { INCLUDED_RULES, CONDITIONAL_RULES, EXCLUDED_RULES } from './cbam-cn-data';
import { assessCnCode } from './cbam-cn';
import { REGULATORY_DATE } from './cbam-navigator';

export const REGULATIONS = [
  ['2023/956', 'CBAM 기본규정 · Annex I, II, III, IV, VII', 'reg/2023/956/2025-10-20'],
  ['2025/2083', '간소화 개정 · 수입자별 연간 순중량 기준', 'reg/2025/2083/oj'],
  ['2025/2547', '내재배출량 산정 · 제3~5조, Annex I~IV', 'reg_impl/2025/2547/oj'],
  ['2025/2546', '검증 원칙', 'reg_impl/2025/2546/oj'],
  ['2025/2551', '검증기관 인정·적격성', 'reg_del/2025/2551/oj'],
  ['2025/2621', '기본값 · 2026/1740 정정 함께 확인', 'reg_impl/2025/2621/oj'],
  ['2026/1740', '기본값 Annex I·IV 정정', 'reg_impl/2026/1740/oj'],
].map(([sourceRegulation, legalReference, path]) => ({ sourceRegulation, legalReference, sourceUrl: `https://eur-lex.europa.eu/eli/${path}/eng`, effectiveFrom: '2026-01-01', effectiveTo: null, revision: '2026-09-29.1', lastCheckedAt: REGULATORY_DATE }));

export function productStructure(code: string) {
  const a = assessCnCode(code), c = a.normalized;
  let category = '세부 CN 코드·제품 속성 확인 필요';
  if (a.status === 'in_scope' || a.status === 'conditional') {
    if (a.sector === '시멘트') category = c.startsWith('2507') ? '소성 점토' : c.startsWith('252310') ? '시멘트 클링커' : c.startsWith('252330') ? '알루미나 시멘트' : '시멘트';
    if (a.sector === '전력') category = '전력';
    if (a.sector === '수소') category = '수소';
    if (a.sector === '알루미늄') category = c.startsWith('7601') ? '괴 상태의 알루미늄' : '알루미늄 제품';
    if (a.sector === '비료') category = c.startsWith('2808') ? '질산' : c.startsWith('2814') ? '암모니아' : c.startsWith('310210') ? '요소' : c === '3102' ? '요소 / 혼합비료 (세부 코드 필요)' : '혼합비료';
    if (a.sector === '철강') category = c.startsWith('2601') ? '소결광' : c.startsWith('7201') ? '선철' : c.startsWith('72021') ? '페로망가니즈' : c.startsWith('72024') ? '페로크로뮴' : c.startsWith('72026') ? '페로니켈' : c.startsWith('7203') ? '직접환원철' : /^(7206|7207|7218|7224)/.test(c) ? '조강' : c.startsWith('7205') ? '선철 / 직접환원철 / 철강 제품 (제품 속성 확인)' : '철강 제품';
  }
  let unit = '동일 CN 코드 제품의 생산량(t)';
  if (a.sector === '전력') unit = '전력량(kWh)';
  if (/^(252310|252321|252329|252390)/.test(c)) unit = '제품에 포함된 클링커의 양(t)';
  if (a.sector === '비료') unit = /^(2808|2814|3105)/.test(c) ? '제품에 포함된 질소의 양(kg)' : '해당 CN 코드의 보충 단위(규정 2658/87 확인)';
  if (!['in_scope', 'conditional'].includes(a.status)) unit = '세부 코드 확인 후 결정';
  return { category, unit, reference: '2025/2547 제3~5조 및 Annex I 표 1', sourceUrl: REGULATIONS[2].sourceUrl };
}

export const CBAM_CN_MASTER = [
  ...INCLUDED_RULES.map(r => ({ ...r, scope: true, conditional: false, excluded: false })),
  ...CONDITIONAL_RULES.map(r => ({ ...r, scope: true, conditional: true, excluded: false })),
  ...EXCLUDED_RULES.map(r => ({ ...r, sector: r.code.startsWith('31') ? '비료' : '철강', descriptionEn: 'Explicit exclusion from Annex I', greenhouseGases: [], scope: false, conditional: false, excluded: true })),
].map(r => ({ ...r, normalizedCode: r.code, goodsCategory: productStructure(r.code).category, effectiveFrom: '2026-01-01', effectiveTo: null, sourceRegulation: '2023/956 as amended by 2025/2083', sourceUrl: REGULATIONS[0].sourceUrl, legalReference: 'Annex I', revision: '2026-09-29.1', lastCheckedAt: REGULATORY_DATE }));

export function assessApplicability(input: { euExport: string; cnCode: string; origin: string; importer: string; mass: string; allImports: boolean }) {
  if (input.euExport === 'no') return '현재 입력한 거래는 EU 반입 거래가 아닙니다. 향후 거래가 바뀌면 다시 확인하세요.';
  const a = assessCnCode(input.cnCode);
  if (a.status === 'out_of_scope') return '입력한 코드가 CBAM 대상 범위에 포함되지 않습니다. 실제 통관 코드의 유효성을 확인하세요.';
  if (input.euExport !== 'yes' || a.status !== 'in_scope' || !input.origin || !input.importer) return '추가 정보 확인이 필요합니다. EU 반입 여부, 최종 CN 코드, 원산지와 수입자 역할을 확인하세요.';
  if (['CH', 'IS', 'LI', 'NO'].includes(input.origin)) return 'Annex III의 원산지 제외 적용 가능성을 확인하세요. 발송국이 아닌 관세 원산지 기준입니다.';
  if (a.sector === '전력' || a.sector === '수소') return 'CBAM 적용 가능성이 높습니다. 전력·수소에는 연간 50톤 면제가 적용되지 않습니다. 기타 제외조건을 확인하세요.';
  if (!input.allImports || input.mass.trim() === '' || !Number.isFinite(Number(input.mass)) || Number(input.mass) < 0) return 'EU 수입자별로 해당 연도 모든 공급국·공급업체의 대상 품목 순중량 합계를 확인해야 합니다.';
  if (Number(input.mass) <= 50) return '연간 50톤 이하 면제 적용 가능성을 확인하세요. 연중 기준을 초과하면 해당 연도 대상 수입 전체의 의무를 재검토해야 합니다.';
  return 'CBAM 적용 가능성이 높습니다. EU 수입자와 신고·검증 준비사항 및 기타 제외조건을 확인하세요.';
}
