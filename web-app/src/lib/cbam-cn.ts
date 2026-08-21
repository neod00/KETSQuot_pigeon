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

type ScopeRule = {
  code: string;
  sector: string;
  descriptionKo: string;
  descriptionEn: string;
  greenhouseGases: string[];
  aliases: string[];
};

export const CBAM_SCOPE_VERSION = 'Regulation (EU) 2023/956, consolidated 2025-10-20';
export const CBAM_CN_VERSION = 'CN 2026 · Regulation (EU) 2025/1926';
export const CBAM_SCOPE_SOURCE = 'https://eur-lex.europa.eu/eli/reg/2023/956/2025-10-20/eng';
export const TARIC_SOURCE = 'https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp?Lang=en';

const CO2 = ['CO₂'];
const CO2_N2O = ['CO₂', 'N₂O'];
const CO2_PFC = ['CO₂', 'PFCs'];

const INCLUDED_RULES: ScopeRule[] = [
  { code: '25231000', sector: '시멘트', descriptionKo: '시멘트 클링커', descriptionEn: 'Cement clinkers', greenhouseGases: CO2, aliases: ['시멘트', '클링커', 'cement', 'clinker'] },
  { code: '25232100', sector: '시멘트', descriptionKo: '백색 포틀랜드 시멘트', descriptionEn: 'White Portland cement', greenhouseGases: CO2, aliases: ['백색 시멘트', '포틀랜드', 'cement'] },
  { code: '25232900', sector: '시멘트', descriptionKo: '기타 포틀랜드 시멘트', descriptionEn: 'Other Portland cement', greenhouseGases: CO2, aliases: ['포틀랜드 시멘트', 'cement'] },
  { code: '25233000', sector: '시멘트', descriptionKo: '알루미나 시멘트', descriptionEn: 'Aluminous cement', greenhouseGases: CO2, aliases: ['알루미나 시멘트', 'cement'] },
  { code: '25239000', sector: '시멘트', descriptionKo: '기타 수경성 시멘트', descriptionEn: 'Other hydraulic cements', greenhouseGases: CO2, aliases: ['수경성 시멘트', 'cement'] },
  { code: '27160000', sector: '전력', descriptionKo: '전기에너지', descriptionEn: 'Electrical energy', greenhouseGases: CO2, aliases: ['전력', '전기', 'electricity', 'electrical energy'] },
  { code: '28080000', sector: '비료', descriptionKo: '질산 및 황질산', descriptionEn: 'Nitric acid; sulphonitric acids', greenhouseGases: CO2_N2O, aliases: ['질산', '황질산', 'nitric acid'] },
  { code: '2814', sector: '비료', descriptionKo: '암모니아', descriptionEn: 'Ammonia, anhydrous or in aqueous solution', greenhouseGases: CO2, aliases: ['암모니아', '무수 암모니아', 'ammonia'] },
  { code: '28342100', sector: '비료', descriptionKo: '질산칼륨', descriptionEn: 'Nitrates of potassium', greenhouseGases: CO2_N2O, aliases: ['질산칼륨', 'potassium nitrate'] },
  { code: '3102', sector: '비료', descriptionKo: '질소계 광물성·화학 비료', descriptionEn: 'Mineral or chemical fertilisers, nitrogenous', greenhouseGases: CO2_N2O, aliases: ['질소 비료', '질소질 비료', '요소 비료', 'fertiliser', 'fertilizer'] },
  { code: '3105', sector: '비료', descriptionKo: '복합 광물성·화학 비료', descriptionEn: 'Mineral or chemical fertilisers containing two or three fertilising elements', greenhouseGases: CO2_N2O, aliases: ['복합 비료', 'npk', 'fertiliser', 'fertilizer'] },
  { code: '72', sector: '철강', descriptionKo: '철 및 비합금·합금강 제품', descriptionEn: 'Iron and steel', greenhouseGases: CO2, aliases: ['철강', '강철', '탄소강', '스테인리스', '코일', '후판', '열연', '냉연', 'steel', 'iron'] },
  { code: '26011200', sector: '철강', descriptionKo: '응집 철광과 정광', descriptionEn: 'Agglomerated iron ores and concentrates', greenhouseGases: CO2, aliases: ['철광석', '펠릿', 'iron ore', 'pellet'] },
  { code: '7301', sector: '철강', descriptionKo: '철강 시트파일 및 용접 형강', descriptionEn: 'Sheet piling and welded angles, shapes and sections of iron or steel', greenhouseGases: CO2, aliases: ['시트파일', '용접 형강', 'sheet piling'] },
  { code: '7302', sector: '철강', descriptionKo: '철도용 철강 궤도 부품', descriptionEn: 'Railway or tramway track construction material of iron or steel', greenhouseGases: CO2, aliases: ['레일', '철도 궤도', 'railway track', 'rail'] },
  { code: '730300', sector: '철강', descriptionKo: '주철제 관·파이프·중공 프로파일', descriptionEn: 'Tubes, pipes and hollow profiles of cast iron', greenhouseGases: CO2, aliases: ['주철관', '주철 파이프', 'cast iron pipe'] },
  { code: '7304', sector: '철강', descriptionKo: '철강제 무계목 관·파이프', descriptionEn: 'Seamless tubes, pipes and hollow profiles of iron or steel', greenhouseGases: CO2, aliases: ['무계목 강관', '심리스 파이프', 'seamless pipe'] },
  { code: '7305', sector: '철강', descriptionKo: '대구경 철강제 관·파이프', descriptionEn: 'Other circular tubes and pipes of iron or steel over 406.4 mm', greenhouseGases: CO2, aliases: ['대구경 강관', '용접 강관', 'large pipe'] },
  { code: '7306', sector: '철강', descriptionKo: '기타 철강제 관·파이프·중공 프로파일', descriptionEn: 'Other tubes, pipes and hollow profiles of iron or steel', greenhouseGases: CO2, aliases: ['강관', '철강 파이프', '중공 프로파일', 'steel pipe', 'tube'] },
  { code: '7307', sector: '철강', descriptionKo: '철강제 관 연결구류', descriptionEn: 'Tube or pipe fittings of iron or steel', greenhouseGases: CO2, aliases: ['엘보', '커플링', '슬리브', '관 연결구', 'pipe fitting'] },
  { code: '7308', sector: '철강', descriptionKo: '철강 구조물 및 구조물 부품', descriptionEn: 'Structures and parts of structures of iron or steel', greenhouseGases: CO2, aliases: ['철골 구조물', '교량 부품', '철강 프레임', 'steel structure'] },
  { code: '730900', sector: '철강', descriptionKo: '300리터 초과 철강 탱크·용기', descriptionEn: 'Iron or steel reservoirs, tanks and similar containers over 300 litres', greenhouseGases: CO2, aliases: ['철강 탱크', '대형 저장용기', 'steel tank'] },
  { code: '7310', sector: '철강', descriptionKo: '300리터 이하 철강 캔·드럼·용기', descriptionEn: 'Iron or steel tanks, drums, cans and similar containers up to 300 litres', greenhouseGases: CO2, aliases: ['철강 캔', '드럼', '소형 용기', 'steel drum', 'can'] },
  { code: '731100', sector: '철강', descriptionKo: '철강제 압축·액화가스 용기', descriptionEn: 'Containers for compressed or liquefied gas of iron or steel', greenhouseGases: CO2, aliases: ['가스 용기', '가스 실린더', 'gas cylinder'] },
  { code: '7318', sector: '철강', descriptionKo: '철강제 나사·볼트·너트·와셔·리벳', descriptionEn: 'Screws, bolts, nuts, washers, rivets and similar articles of iron or steel', greenhouseGases: CO2, aliases: ['나사', '볼트', '너트', '와셔', '리벳', '스크류', 'bolt', 'screw', 'nut', 'washer', 'rivet'] },
  { code: '7326', sector: '철강', descriptionKo: '기타 철강 제품', descriptionEn: 'Other articles of iron or steel', greenhouseGases: CO2, aliases: ['기타 철강 제품', '철강 부품', 'steel article', 'steel part'] },
  { code: '7601', sector: '알루미늄', descriptionKo: '괴 상태의 알루미늄', descriptionEn: 'Unwrought aluminium', greenhouseGases: CO2_PFC, aliases: ['알루미늄 잉곳', '괴', 'unwrought aluminium', 'ingot'] },
  { code: '7603', sector: '알루미늄', descriptionKo: '알루미늄 분말·플레이크', descriptionEn: 'Aluminium powders and flakes', greenhouseGases: CO2_PFC, aliases: ['알루미늄 분말', '플레이크', 'aluminium powder'] },
  { code: '7604', sector: '알루미늄', descriptionKo: '알루미늄 봉·로드·프로파일', descriptionEn: 'Aluminium bars, rods and profiles', greenhouseGases: CO2_PFC, aliases: ['알루미늄 프로파일', '알루미늄 봉', 'aluminium profile', 'bar', 'rod'] },
  { code: '7605', sector: '알루미늄', descriptionKo: '알루미늄 선', descriptionEn: 'Aluminium wire', greenhouseGases: CO2_PFC, aliases: ['알루미늄 와이어', '알루미늄 선', 'aluminium wire'] },
  { code: '7606', sector: '알루미늄', descriptionKo: '두께 0.2mm 초과 알루미늄 판·시트·스트립', descriptionEn: 'Aluminium plates, sheets and strip over 0.2 mm', greenhouseGases: CO2_PFC, aliases: ['알루미늄 판', '알루미늄 시트', '알루미늄 스트립', 'aluminium sheet', 'plate'] },
  { code: '7607', sector: '알루미늄', descriptionKo: '두께 0.2mm 이하 알루미늄 포일', descriptionEn: 'Aluminium foil up to 0.2 mm', greenhouseGases: CO2_PFC, aliases: ['알루미늄 포일', '알루미늄 호일', 'aluminium foil'] },
  { code: '7608', sector: '알루미늄', descriptionKo: '알루미늄 관·파이프', descriptionEn: 'Aluminium tubes and pipes', greenhouseGases: CO2_PFC, aliases: ['알루미늄 파이프', '알루미늄 관', 'aluminium pipe', 'tube'] },
  { code: '76090000', sector: '알루미늄', descriptionKo: '알루미늄 관 연결구류', descriptionEn: 'Aluminium tube or pipe fittings', greenhouseGases: CO2_PFC, aliases: ['알루미늄 엘보', '알루미늄 커플링', 'aluminium pipe fitting'] },
  { code: '7610', sector: '알루미늄', descriptionKo: '알루미늄 구조물 및 구조물 부품', descriptionEn: 'Aluminium structures and parts of structures', greenhouseGases: CO2_PFC, aliases: ['알루미늄 구조물', '알루미늄 프레임', 'aluminium structure'] },
  { code: '76110000', sector: '알루미늄', descriptionKo: '300리터 초과 알루미늄 탱크·용기', descriptionEn: 'Aluminium reservoirs and tanks over 300 litres', greenhouseGases: CO2_PFC, aliases: ['알루미늄 탱크', '대형 알루미늄 용기'] },
  { code: '7612', sector: '알루미늄', descriptionKo: '300리터 이하 알루미늄 캔·드럼·용기', descriptionEn: 'Aluminium cans, drums and similar containers up to 300 litres', greenhouseGases: CO2_PFC, aliases: ['알루미늄 캔', '알루미늄 드럼', 'aluminium can'] },
  { code: '76130000', sector: '알루미늄', descriptionKo: '알루미늄제 압축·액화가스 용기', descriptionEn: 'Aluminium containers for compressed or liquefied gas', greenhouseGases: CO2_PFC, aliases: ['알루미늄 가스 용기', 'aluminium gas cylinder'] },
  { code: '7614', sector: '알루미늄', descriptionKo: '알루미늄 연선·케이블', descriptionEn: 'Stranded wire, cables and plaited bands of aluminium', greenhouseGases: CO2_PFC, aliases: ['알루미늄 연선', '알루미늄 케이블', 'aluminium cable'] },
  { code: '7616', sector: '알루미늄', descriptionKo: '기타 알루미늄 제품', descriptionEn: 'Other articles of aluminium', greenhouseGases: CO2_PFC, aliases: ['기타 알루미늄 제품', '알루미늄 부품', 'aluminium article', 'aluminium part'] },
  { code: '28041000', sector: '수소', descriptionKo: '수소', descriptionEn: 'Hydrogen', greenhouseGases: CO2, aliases: ['수소', 'hydrogen'] },
];

const CONDITIONAL_RULES: ScopeRule[] = [
  { code: '25070080', sector: '시멘트', descriptionKo: '기타 카올린계 점토', descriptionEn: 'Other kaolinic clays except non-calcined kaolinic clays', greenhouseGases: CO2, aliases: ['카올린', '고령토', '소성 점토', 'calcined clay', 'kaolin'] },
];

const EXCLUDED_RULES = [
  { code: '31056000', descriptionKo: '인과 칼륨을 포함하는 비료' },
  { code: '72022', descriptionKo: '페로실리콘' },
  { code: '72023000', descriptionKo: '페로실리코망가니즈' },
  { code: '72025000', descriptionKo: '페로실리코크로뮴' },
  { code: '72027000', descriptionKo: '페로몰리브데늄' },
  { code: '72028000', descriptionKo: '페로텅스텐 및 페로실리코텅스텐' },
  { code: '72029100', descriptionKo: '페로티타늄 및 페로실리코티타늄' },
  { code: '72029200', descriptionKo: '페로바나듐' },
  { code: '72029300', descriptionKo: '페로니오븀' },
  { code: '720299', descriptionKo: '기타 페로합금' },
  { code: '7204', descriptionKo: '철강 웨이스트·스크랩 및 재용해용 스크랩 잉곳' },
];

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

  if (!allowedLengths.includes(normalized.length)) {
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
  return [...new Set(String(value || '').split(/[\s,;|/]+/).map(normalizeCnCode).filter(Boolean))];
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
