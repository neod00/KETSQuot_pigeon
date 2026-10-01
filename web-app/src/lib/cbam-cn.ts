import { INCLUDED_RULES, CONDITIONAL_RULES, EXCLUDED_RULES, CBAM_SCOPE_VERSION, CBAM_CN_VERSION, CBAM_SCOPE_SOURCE } from './cbam-cn-data';
export { CBAM_SCOPE_VERSION, CBAM_CN_VERSION, CBAM_SCOPE_SOURCE, TARIC_SOURCE } from './cbam-cn-data';

export type CbamCnStatus = 'in_scope' | 'out_of_scope' | 'partial' | 'conditional' | 'invalid';

export type CbamCnAssessment = {
  input: string;
  normalized: string;
  displayCode: string;
  status: CbamCnStatus;
  statusLabel: string;
  sector?: string;
  descriptionKo: string;
  descriptionEn?: string;
  greenhouseGases: string[];
  matchedRule?: string;
  explanation: string;
  sourceVersion: string;
  sourceUrl: string;
};

export type CbamProductCandidate = {
  code: string;
  titleKo: string;
  titleEn?: string;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  missingInformation: string[];
  source: 'ai' | 'catalog';
  assessment: CbamCnAssessment;
};

const STATUS_LABELS: Record<CbamCnStatus, string> = {
  in_scope: 'CBAM 대상',
  out_of_scope: 'CBAM 비대상',
  partial: '일부 하위 코드 대상',
  conditional: '제품 속성 확인 필요',
  invalid: '입력 형식 확인',
};

export function normalizeCnCode(value: string) {
  return String(value || '').replace(/[^0-9]/g, '');
}

export function formatCnCode(code: string) {
  if (code.length === 8) return `${code.slice(0, 4)} ${code.slice(4, 6)} ${code.slice(6)}`;
  if (code.length === 6) return `${code.slice(0, 4)} ${code.slice(4)}`;
  return code;
}

function longestRule<T extends { code: string }>(rules: T[]) {
  return [...rules].sort((a, b) => b.code.length - a.code.length)[0];
}

export function assessCnCode(input: string): CbamCnAssessment {
  const normalized = normalizeCnCode(input);
  const allowedLengths = [2, 4, 5, 6, 8];
  const base = {
    input,
    normalized,
    displayCode: formatCnCode(normalized),
    sourceVersion: `${CBAM_SCOPE_VERSION} · ${CBAM_CN_VERSION}`,
    sourceUrl: CBAM_SCOPE_SOURCE,
  };

  if (!/^[0-9\s-]+$/.test(input) || !allowedLengths.includes(normalized.length)) {
    return {
      ...base,
      status: 'invalid',
      statusLabel: STATUS_LABELS.invalid,
      descriptionKo: 'CN 코드는 2·4·5·6·8자리 숫자로 입력해 주세요.',
      greenhouseGases: [],
      explanation: '공백과 하이픈은 허용되지만 숫자 자리수는 CN 구조에 맞아야 합니다.',
    };
  }

  const enclosingExclusion = longestRule(EXCLUDED_RULES.filter(rule => normalized.startsWith(rule.code)));
  if (enclosingExclusion) {
    return {
      ...base,
      status: 'out_of_scope',
      statusLabel: STATUS_LABELS.out_of_scope,
      sector: normalized.startsWith('31') ? '비료' : '철강',
      descriptionKo: enclosingExclusion.descriptionKo,
      greenhouseGases: [],
      matchedRule: `Annex I 명시적 제외 ${formatCnCode(enclosingExclusion.code)}`,
      explanation: 'CBAM Annex I의 포함 범위 안에 위치하지만 명시적 제외 코드가 우선 적용됩니다.',
    };
  }

  const enclosingConditional = longestRule(CONDITIONAL_RULES.filter(rule => normalized.startsWith(rule.code)));
  if (enclosingConditional) {
    return {
      ...base,
      status: 'conditional',
      statusLabel: STATUS_LABELS.conditional,
      sector: enclosingConditional.sector,
      descriptionKo: enclosingConditional.descriptionKo,
      descriptionEn: enclosingConditional.descriptionEn,
      greenhouseGases: enclosingConditional.greenhouseGases,
      matchedRule: `Annex I ex ${formatCnCode(enclosingConditional.code)}`,
      explanation: '이 코드는 전체가 아니라 소성된 카올린계 점토만 대상입니다. 비소성 제품은 제외되므로 제품 속성 확인이 필요합니다.',
    };
  }

  const enclosingInclusion = longestRule(INCLUDED_RULES.filter(rule => normalized.startsWith(rule.code)));
  const childInclusions = INCLUDED_RULES.filter(rule => rule.code.startsWith(normalized));
  const childExclusions = EXCLUDED_RULES.filter(rule => rule.code.startsWith(normalized));
  const childConditionals = CONDITIONAL_RULES.filter(rule => rule.code.startsWith(normalized));

  if (normalized.length < 8 && ((enclosingInclusion && (childExclusions.length || childConditionals.length)) || (!enclosingInclusion && (childInclusions.length || childConditionals.length)))) {
    const representative = enclosingInclusion || childInclusions[0] || childConditionals[0];
    return {
      ...base,
      status: 'partial',
      statusLabel: STATUS_LABELS.partial,
      sector: representative?.sector,
      descriptionKo: representative ? `${representative.descriptionKo} 관련 상위 코드` : '세부 CN 코드 확인 필요',
      descriptionEn: representative?.descriptionEn,
      greenhouseGases: representative?.greenhouseGases || [],
      matchedRule: `상위 코드 ${formatCnCode(normalized)}`,
      explanation: '이 상위 코드 아래에 대상·비대상 또는 조건부 품목이 함께 있어 정확한 8자리 CN 코드가 필요합니다.',
    };
  }

  if (enclosingInclusion) {
    return {
      ...base,
      status: 'in_scope',
      statusLabel: STATUS_LABELS.in_scope,
      sector: enclosingInclusion.sector,
      descriptionKo: enclosingInclusion.descriptionKo,
      descriptionEn: enclosingInclusion.descriptionEn,
      greenhouseGases: enclosingInclusion.greenhouseGases,
      matchedRule: `Annex I ${formatCnCode(enclosingInclusion.code)}`,
      explanation: normalized.length === 8
        ? '입력한 8자리 코드가 CBAM Annex I 포함 규칙과 일치합니다.'
        : '이 코드 범위는 CBAM Annex I에 포함됩니다. 세관 신고에는 최종 8자리 CN 코드를 확인해 주세요.',
    };
  }

  return {
    ...base,
    status: 'out_of_scope',
    statusLabel: STATUS_LABELS.out_of_scope,
    descriptionKo: '현행 CBAM Annex I 포함 코드에서 찾을 수 없음',
    greenhouseGases: [],
    explanation: '형식상 코드에 대한 CBAM 범위 판정입니다. 코드 자체의 현재 유효성은 EU TARIC에서 별도로 확인해 주세요.',
  };
}

export function parseCnCodeInput(value: string) {
  // Preserve formatted single codes (e.g. 7318 15 90) and invalid tokens.
  const tokens = String(value || '').trim().split(/[,;|/\r\n]+/).flatMap(part => {
    const text = part.trim();
    if (/^\d{4}\s+\d{2}(\s+\d{2})?$/.test(text)) return [text];
    return text.split(/\s+/);
  }).filter(Boolean);
  return [...new Set(tokens)];
}

function normalizedText(value: string) {
  return value.toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ').trim();
}

export function searchProductCatalog(input: { productName: string; material?: string; form?: string; use?: string }): CbamProductCandidate[] {
  const query = normalizedText([input.productName, input.material, input.form, input.use].filter(Boolean).join(' '));
  if (!query) return [];

  const scored = [...INCLUDED_RULES, ...CONDITIONAL_RULES]
    .map(rule => {
      const searchable = normalizedText([rule.descriptionKo, rule.descriptionEn, ...rule.aliases].join(' '));
      const aliasMatches = rule.aliases.filter(alias => query.includes(normalizedText(alias)) || searchable.includes(query)).length;
      const materialBoost = rule.sector === '철강' && /(철|강|steel|iron)/i.test(query) ? 2 : rule.sector === '알루미늄' && /(알루미늄|aluminium|aluminum)/i.test(query) ? 2 : 0;
      const score = aliasMatches * 3 + materialBoost + (query.includes(normalizedText(rule.descriptionKo)) ? 4 : 0);
      return { rule, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || b.rule.code.length - a.rule.code.length);
  const minimumScore = Math.max(3, (scored[0]?.score || 0) - 3);

  return scored
    .filter(item => item.score >= minimumScore)
    .slice(0, 5)
    .map(({ rule, score }) => ({
      code: rule.code,
      titleKo: rule.descriptionKo,
      titleEn: rule.descriptionEn,
      reasoning: `제품 설명과 ${rule.sector} 분야의 공식 품목 범위가 일치할 가능성이 있습니다.`,
      confidence: score >= 8 ? 'high' : score >= 4 ? 'medium' : 'low',
      missingInformation: rule.code.length < 8 ? ['EU 세관 신고용 8자리 CN 코드'] : [],
      source: 'catalog',
      assessment: assessCnCode(rule.code),
    }));
}

export const CBAM_SCOPE_RULE_SUMMARY = INCLUDED_RULES.map(rule => ({
  code: rule.code,
  sector: rule.sector,
  descriptionEn: rule.descriptionEn,
}));
