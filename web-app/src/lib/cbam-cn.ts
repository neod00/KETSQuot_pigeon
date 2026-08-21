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
export const CBAM_CN_VERSION = 'CN 2026 쨌 Regulation (EU) 2025/1926';
export const CBAM_SCOPE_SOURCE = 'https://eur-lex.europa.eu/eli/reg/2023/956/2025-10-20/eng';
export const TARIC_SOURCE = 'https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp?Lang=en';

const CO2 = ['CO??];
const CO2_N2O = ['CO??, 'N?괥'];
const CO2_PFC = ['CO??, 'PFCs'];

const INCLUDED_RULES: ScopeRule[] = [
  { code: '25231000', sector: '?쒕찘??, descriptionKo: '?쒕찘???대쭅而?, descriptionEn: 'Cement clinkers', greenhouseGases: CO2, aliases: ['?쒕찘??, '?대쭅而?, 'cement', 'clinker'] },
  { code: '25232100', sector: '?쒕찘??, descriptionKo: '諛깆깋 ?ы??쒕뱶 ?쒕찘??, descriptionEn: 'White Portland cement', greenhouseGases: CO2, aliases: ['諛깆깋 ?쒕찘??, '?ы??쒕뱶', 'cement'] },
  { code: '25232900', sector: '?쒕찘??, descriptionKo: '湲고? ?ы??쒕뱶 ?쒕찘??, descriptionEn: 'Other Portland cement', greenhouseGases: CO2, aliases: ['?ы??쒕뱶 ?쒕찘??, 'cement'] },
  { code: '25233000', sector: '?쒕찘??, descriptionKo: '?뚮（誘몃굹 ?쒕찘??, descriptionEn: 'Aluminous cement', greenhouseGases: CO2, aliases: ['?뚮（誘몃굹 ?쒕찘??, 'cement'] },
  { code: '25239000', sector: '?쒕찘??, descriptionKo: '湲고? ?섍꼍???쒕찘??, descriptionEn: 'Other hydraulic cements', greenhouseGases: CO2, aliases: ['?섍꼍???쒕찘??, 'cement'] },
  { code: '27160000', sector: '?꾨젰', descriptionKo: '?꾧린?먮꼫吏', descriptionEn: 'Electrical energy', greenhouseGases: CO2, aliases: ['?꾨젰', '?꾧린', 'electricity', 'electrical energy'] },
  { code: '28080000', sector: '鍮꾨즺', descriptionKo: '吏덉궛 諛??⑹쭏??, descriptionEn: 'Nitric acid; sulphonitric acids', greenhouseGases: CO2_N2O, aliases: ['吏덉궛', '?⑹쭏??, 'nitric acid'] },
  { code: '2814', sector: '鍮꾨즺', descriptionKo: '?붾え?덉븘', descriptionEn: 'Ammonia, anhydrous or in aqueous solution', greenhouseGases: CO2, aliases: ['?붾え?덉븘', '臾댁닔 ?붾え?덉븘', 'ammonia'] },
  { code: '28342100', sector: '鍮꾨즺', descriptionKo: '吏덉궛移쇰ⅷ', descriptionEn: 'Nitrates of potassium', greenhouseGases: CO2_N2O, aliases: ['吏덉궛移쇰ⅷ', 'potassium nitrate'] },
  { code: '3102', sector: '鍮꾨즺', descriptionKo: '吏덉냼怨?愿묐Ъ?굿룻솕??鍮꾨즺', descriptionEn: 'Mineral or chemical fertilisers, nitrogenous', greenhouseGases: CO2_N2O, aliases: ['吏덉냼 鍮꾨즺', '吏덉냼吏?鍮꾨즺', '?붿냼 鍮꾨즺', 'fertiliser', 'fertilizer'] },
  { code: '3105', sector: '鍮꾨즺', descriptionKo: '蹂듯빀 愿묐Ъ?굿룻솕??鍮꾨즺', descriptionEn: 'Mineral or chemical fertilisers containing two or three fertilising elements', greenhouseGases: CO2_N2O, aliases: ['蹂듯빀 鍮꾨즺', 'npk', 'fertiliser', 'fertilizer'] },
  { code: '72', sector: '泥좉컯', descriptionKo: '泥?諛?鍮꾪빀湲댟룻빀湲덇컯 ?쒗뭹', descriptionEn: 'Iron and steel', greenhouseGases: CO2, aliases: ['泥좉컯', '媛뺤쿋', '?꾩냼媛?, '?ㅽ뀒?몃━??, '肄붿씪', '?꾪뙋', '?댁뿰', '?됱뿰', 'steel', 'iron'] },
  { code: '26011200', sector: '泥좉컯', descriptionKo: '?묒쭛 泥좉킅怨??뺢킅', descriptionEn: 'Agglomerated iron ores and concentrates', greenhouseGases: CO2, aliases: ['泥좉킅??, '?좊┸', 'iron ore', 'pellet'] },
  { code: '7301', sector: '泥좉컯', descriptionKo: '泥좉컯 ?쒗듃?뚯씪 諛??⑹젒 ?뺢컯', descriptionEn: 'Sheet piling and welded angles, shapes and sections of iron or steel', greenhouseGases: CO2, aliases: ['?쒗듃?뚯씪', '?⑹젒 ?뺢컯', 'sheet piling'] },
  { code: '7302', sector: '泥좉컯', descriptionKo: '泥좊룄??泥좉컯 沅ㅻ룄 遺??, descriptionEn: 'Railway or tramway track construction material of iron or steel', greenhouseGases: CO2, aliases: ['?덉씪', '泥좊룄 沅ㅻ룄', 'railway track', 'rail'] },
  { code: '730300', sector: '泥좉컯', descriptionKo: '二쇱쿋??愿쨌?뚯씠?꽷룹쨷怨??꾨줈?뚯씪', descriptionEn: 'Tubes, pipes and hollow profiles of cast iron', greenhouseGases: CO2, aliases: ['二쇱쿋愿', '二쇱쿋 ?뚯씠??, 'cast iron pipe'] },
  { code: '7304', sector: '泥좉컯', descriptionKo: '泥좉컯??臾닿퀎紐?愿쨌?뚯씠??, descriptionEn: 'Seamless tubes, pipes and hollow profiles of iron or steel', greenhouseGases: CO2, aliases: ['臾닿퀎紐?媛뺢?', '?щ━???뚯씠??, 'seamless pipe'] },
  { code: '7305', sector: '泥좉컯', descriptionKo: '?援ш꼍 泥좉컯??愿쨌?뚯씠??, descriptionEn: 'Other circular tubes and pipes of iron or steel over 406.4 mm', greenhouseGases: CO2, aliases: ['?援ш꼍 媛뺢?', '?⑹젒 媛뺢?', 'large pipe'] },
  { code: '7306', sector: '泥좉컯', descriptionKo: '湲고? 泥좉컯??愿쨌?뚯씠?꽷룹쨷怨??꾨줈?뚯씪', descriptionEn: 'Other tubes, pipes and hollow profiles of iron or steel', greenhouseGases: CO2, aliases: ['媛뺢?', '泥좉컯 ?뚯씠??, '以묎났 ?꾨줈?뚯씪', 'steel pipe', 'tube'] },
  { code: '7307', sector: '泥좉컯', descriptionKo: '泥좉컯??愿 ?곌껐援щ쪟', descriptionEn: 'Tube or pipe fittings of iron or steel', greenhouseGases: CO2, aliases: ['?섎낫', '而ㅽ뵆留?, '?щ━釉?, '愿 ?곌껐援?, 'pipe fitting'] },
  { code: '7308', sector: '泥좉컯', descriptionKo: '泥좉컯 援ъ“臾?諛?援ъ“臾?遺??, descriptionEn: 'Structures and parts of structures of iron or steel', greenhouseGases: CO2, aliases: ['泥좉낏 援ъ“臾?, '援먮웾 遺??, '泥좉컯 ?꾨젅??, 'steel structure'] },
  { code: '730900', sector: '泥좉컯', descriptionKo: '300由ы꽣 珥덇낵 泥좉컯 ?깊겕쨌?⑷린', descriptionEn: 'Iron or steel reservoirs, tanks and similar containers over 300 litres', greenhouseGases: CO2, aliases: ['泥좉컯 ?깊겕', '?????μ슜湲?, 'steel tank'] },
  { code: '7310', sector: '泥좉컯', descriptionKo: '300由ы꽣 ?댄븯 泥좉컯 罹붋룸뱶?셋룹슜湲?, descriptionEn: 'Iron or steel tanks, drums, cans and similar containers up to 300 litres', greenhouseGases: CO2, aliases: ['泥좉컯 罹?, '?쒕읆', '?뚰삎 ?⑷린', 'steel drum', 'can'] },
  { code: '731100', sector: '泥좉컯', descriptionKo: '泥좉컯???뺤텞쨌?≫솕媛???⑷린', descriptionEn: 'Containers for compressed or liquefied gas of iron or steel', greenhouseGases: CO2, aliases: ['媛???⑷린', '媛???ㅻ┛??, 'gas cylinder'] },
  { code: '7318', sector: '泥좉컯', descriptionKo: '泥좉컯???섏궗쨌蹂쇳듃쨌?덊듃쨌??붋룸━踰?, descriptionEn: 'Screws, bolts, nuts, washers, rivets and similar articles of iron or steel', greenhouseGases: CO2, aliases: ['?섏궗', '蹂쇳듃', '?덊듃', '???, '由щ껙', '?ㅽ겕瑜?, 'bolt', 'screw', 'nut', 'washer', 'rivet'] },
  { code: '7326', sector: '泥좉컯', descriptionKo: '湲고? 泥좉컯 ?쒗뭹', descriptionEn: 'Other articles of iron or steel', greenhouseGases: CO2, aliases: ['湲고? 泥좉컯 ?쒗뭹', '泥좉컯 遺??, 'steel article', 'steel part'] },
  { code: '7601', sector: '?뚮（誘몃뒆', descriptionKo: '愿??곹깭???뚮（誘몃뒆', descriptionEn: 'Unwrought aluminium', greenhouseGases: CO2_PFC, aliases: ['?뚮（誘몃뒆 ?됯납', '愿?, 'unwrought aluminium', 'ingot'] },
  { code: '7603', sector: '?뚮（誘몃뒆', descriptionKo: '?뚮（誘몃뒆 遺꾨쭚쨌?뚮젅?댄겕', descriptionEn: 'Aluminium powders and flakes', greenhouseGases: CO2_PFC, aliases: ['?뚮（誘몃뒆 遺꾨쭚', '?뚮젅?댄겕', 'aluminium powder'] },
  { code: '7604', sector: '?뚮（誘몃뒆', descriptionKo: '?뚮（誘몃뒆 遊됀룸줈?쑣룻봽濡쒗뙆??, descriptionEn: 'Aluminium bars, rods and profiles', greenhouseGases: CO2_PFC, aliases: ['?뚮（誘몃뒆 ?꾨줈?뚯씪', '?뚮（誘몃뒆 遊?, 'aluminium profile', 'bar', 'rod'] },
  { code: '7605', sector: '?뚮（誘몃뒆', descriptionKo: '?뚮（誘몃뒆 ??, descriptionEn: 'Aluminium wire', greenhouseGases: CO2_PFC, aliases: ['?뚮（誘몃뒆 ??댁뼱', '?뚮（誘몃뒆 ??, 'aluminium wire'] },
  { code: '7606', sector: '?뚮（誘몃뒆', descriptionKo: '?먭퍡 0.2mm 珥덇낵 ?뚮（誘몃뒆 ?먃룹떆?맞룹뒪?몃┰', descriptionEn: 'Aluminium plates, sheets and strip over 0.2 mm', greenhouseGases: CO2_PFC, aliases: ['?뚮（誘몃뒆 ??, '?뚮（誘몃뒆 ?쒗듃', '?뚮（誘몃뒆 ?ㅽ듃由?, 'aluminium sheet', 'plate'] },
  { code: '7607', sector: '?뚮（誘몃뒆', descriptionKo: '?먭퍡 0.2mm ?댄븯 ?뚮（誘몃뒆 ?ъ씪', descriptionEn: 'Aluminium foil up to 0.2 mm', greenhouseGases: CO2_PFC, aliases: ['?뚮（誘몃뒆 ?ъ씪', '?뚮（誘몃뒆 ?몄씪', 'aluminium foil'] },
  { code: '7608', sector: '?뚮（誘몃뒆', descriptionKo: '?뚮（誘몃뒆 愿쨌?뚯씠??, descriptionEn: 'Aluminium tubes and pipes', greenhouseGases: CO2_PFC, aliases: ['?뚮（誘몃뒆 ?뚯씠??, '?뚮（誘몃뒆 愿', 'aluminium pipe', 'tube'] },
  { code: '76090000', sector: '?뚮（誘몃뒆', descriptionKo: '?뚮（誘몃뒆 愿 ?곌껐援щ쪟', descriptionEn: 'Aluminium tube or pipe fittings', greenhouseGases: CO2_PFC, aliases: ['?뚮（誘몃뒆 ?섎낫', '?뚮（誘몃뒆 而ㅽ뵆留?, 'aluminium pipe fitting'] },
  { code: '7610', sector: '?뚮（誘몃뒆', descriptionKo: '?뚮（誘몃뒆 援ъ“臾?諛?援ъ“臾?遺??, descriptionEn: 'Aluminium structures and parts of structures', greenhouseGases: CO2_PFC, aliases: ['?뚮（誘몃뒆 援ъ“臾?, '?뚮（誘몃뒆 ?꾨젅??, 'aluminium structure'] },
  { code: '76110000', sector: '?뚮（誘몃뒆', descriptionKo: '300由ы꽣 珥덇낵 ?뚮（誘몃뒆 ?깊겕쨌?⑷린', descriptionEn: 'Aluminium reservoirs and tanks over 300 litres', greenhouseGases: CO2_PFC, aliases: ['?뚮（誘몃뒆 ?깊겕', '????뚮（誘몃뒆 ?⑷린'] },
  { code: '7612', sector: '?뚮（誘몃뒆', descriptionKo: '300由ы꽣 ?댄븯 ?뚮（誘몃뒆 罹붋룸뱶?셋룹슜湲?, descriptionEn: 'Aluminium cans, drums and similar containers up to 300 litres', greenhouseGases: CO2_PFC, aliases: ['?뚮（誘몃뒆 罹?, '?뚮（誘몃뒆 ?쒕읆', 'aluminium can'] },
  { code: '76130000', sector: '?뚮（誘몃뒆', descriptionKo: '?뚮（誘몃뒆???뺤텞쨌?≫솕媛???⑷린', descriptionEn: 'Aluminium containers for compressed or liquefied gas', greenhouseGases: CO2_PFC, aliases: ['?뚮（誘몃뒆 媛???⑷린', 'aluminium gas cylinder'] },
  { code: '7614', sector: '?뚮（誘몃뒆', descriptionKo: '?뚮（誘몃뒆 ?곗꽑쨌耳?대툝', descriptionEn: 'Stranded wire, cables and plaited bands of aluminium', greenhouseGases: CO2_PFC, aliases: ['?뚮（誘몃뒆 ?곗꽑', '?뚮（誘몃뒆 耳?대툝', 'aluminium cable'] },
  { code: '7616', sector: '?뚮（誘몃뒆', descriptionKo: '湲고? ?뚮（誘몃뒆 ?쒗뭹', descriptionEn: 'Other articles of aluminium', greenhouseGases: CO2_PFC, aliases: ['湲고? ?뚮（誘몃뒆 ?쒗뭹', '?뚮（誘몃뒆 遺??, 'aluminium article', 'aluminium part'] },
  { code: '28041000', sector: '?섏냼', descriptionKo: '?섏냼', descriptionEn: 'Hydrogen', greenhouseGases: CO2, aliases: ['?섏냼', 'hydrogen'] },
];

const CONDITIONAL_RULES: ScopeRule[] = [
  { code: '25070080', sector: '?쒕찘??, descriptionKo: '湲고? 移댁삱由곌퀎 ?먰넗', descriptionEn: 'Other kaolinic clays except non-calcined kaolinic clays', greenhouseGases: CO2, aliases: ['移댁삱由?, '怨좊졊??, '?뚯꽦 ?먰넗', 'calcined clay', 'kaolin'] },
];

const EXCLUDED_RULES = [
  { code: '31056000', descriptionKo: '?멸낵 移쇰ⅷ???ы븿?섎뒗 鍮꾨즺' },
  { code: '72022', descriptionKo: '?섎줈?ㅻ━肄? },
  { code: '72023000', descriptionKo: '?섎줈?ㅻ━肄붾쭩媛?덉쫰' },
  { code: '72025000', descriptionKo: '?섎줈?ㅻ━肄뷀겕濡쒕?' },
  { code: '72027000', descriptionKo: '?섎줈紐곕━釉뚮뜲?? },
  { code: '72028000', descriptionKo: '?섎줈?낆뒪??諛??섎줈?ㅻ━肄뷀뀉?ㅽ뀗' },
  { code: '72029100', descriptionKo: '?섎줈?고???諛??섎줈?ㅻ━肄뷀떚??? },
  { code: '72029200', descriptionKo: '?섎줈諛붾굹?? },
  { code: '72029300', descriptionKo: '?섎줈?덉삤釉' },
  { code: '720299', descriptionKo: '湲고? ?섎줈?⑷툑' },
  { code: '7204', descriptionKo: '泥좉컯 ?⑥씠?ㅽ듃쨌?ㅽ겕??諛??ъ슜?댁슜 ?ㅽ겕???됯납' },
];

const STATUS_LABELS: Record<CbamCnStatus, string> = {
  in_scope: 'CBAM ???,
  out_of_scope: 'CBAM 鍮꾨???,
  partial: '?쇰? ?섏쐞 肄붾뱶 ???,
  conditional: '?쒗뭹 ?띿꽦 ?뺤씤 ?꾩슂',
  invalid: '?낅젰 ?뺤떇 ?뺤씤',
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
    sourceVersion: `${CBAM_SCOPE_VERSION} 쨌 ${CBAM_CN_VERSION}`,
    sourceUrl: CBAM_SCOPE_SOURCE,
  };

  if (!allowedLengths.includes(normalized.length)) {
    return {
      ...base,
      status: 'invalid',
      statusLabel: STATUS_LABELS.invalid,
      descriptionKo: 'CN 肄붾뱶??2쨌4쨌5쨌6쨌8?먮━ ?レ옄濡??낅젰??二쇱꽭??',
      greenhouseGases: [],
      explanation: '怨듬갚怨??섏씠?덉? ?덉슜?섏?留??レ옄 ?먮━?섎뒗 CN 援ъ“??留욎븘???⑸땲??',
    };
  }

  const enclosingExclusion = longestRule(EXCLUDED_RULES.filter(rule => normalized.startsWith(rule.code)));
  if (enclosingExclusion) {
    return {
      ...base,
      status: 'out_of_scope',
      statusLabel: STATUS_LABELS.out_of_scope,
      sector: normalized.startsWith('31') ? '鍮꾨즺' : '泥좉컯',
      descriptionKo: enclosingExclusion.descriptionKo,
      greenhouseGases: [],
      matchedRule: `Annex I 紐낆떆???쒖쇅 ${formatCnCode(enclosingExclusion.code)}`,
      explanation: 'CBAM Annex I???ы븿 踰붿쐞 ?덉뿉 ?꾩튂?섏?留?紐낆떆???쒖쇅 肄붾뱶媛 ?곗꽑 ?곸슜?⑸땲??',
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
      explanation: '??肄붾뱶???꾩껜媛 ?꾨땲???뚯꽦??移댁삱由곌퀎 ?먰넗留???곸엯?덈떎. 鍮꾩냼???쒗뭹? ?쒖쇅?섎?濡??쒗뭹 ?띿꽦 ?뺤씤???꾩슂?⑸땲??',
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
      descriptionKo: representative ? `${representative.descriptionKo} 愿???곸쐞 肄붾뱶` : '?몃? CN 肄붾뱶 ?뺤씤 ?꾩슂',
      descriptionEn: representative?.descriptionEn,
      greenhouseGases: representative?.greenhouseGases || [],
      matchedRule: `?곸쐞 肄붾뱶 ${formatCnCode(normalized)}`,
      explanation: '???곸쐞 肄붾뱶 ?꾨옒????겶룸퉬????먮뒗 議곌굔遺 ?덈ぉ???④퍡 ?덉뼱 ?뺥솗??8?먮━ CN 肄붾뱶媛 ?꾩슂?⑸땲??',
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
        ? '?낅젰??8?먮━ 肄붾뱶媛 CBAM Annex I ?ы븿 洹쒖튃怨??쇱튂?⑸땲??'
        : '??肄붾뱶 踰붿쐞??CBAM Annex I???ы븿?⑸땲?? ?멸? ?좉퀬?먮뒗 理쒖쥌 8?먮━ CN 肄붾뱶瑜??뺤씤??二쇱꽭??',
    };
  }

  return {
    ...base,
    status: 'out_of_scope',
    statusLabel: STATUS_LABELS.out_of_scope,
    descriptionKo: '?꾪뻾 CBAM Annex I ?ы븿 肄붾뱶?먯꽌 李얠쓣 ???놁쓬',
    greenhouseGases: [],
    explanation: '?뺤떇??肄붾뱶?????CBAM 踰붿쐞 ?먯젙?낅땲?? 肄붾뱶 ?먯껜???꾩옱 ?좏슚?깆? EU TARIC?먯꽌 蹂꾨룄濡??뺤씤??二쇱꽭??',
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
      const materialBoost = rule.sector === '泥좉컯' && /(泥?媛?steel|iron)/i.test(query) ? 2 : rule.sector === '?뚮（誘몃뒆' && /(?뚮（誘몃뒆|aluminium|aluminum)/i.test(query) ? 2 : 0;
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
      reasoning: `?쒗뭹 ?ㅻ챸怨?${rule.sector} 遺꾩빞??怨듭떇 ?덈ぉ 踰붿쐞媛 ?쇱튂??媛?μ꽦???덉뒿?덈떎.`,
      confidence: score >= 8 ? 'high' : score >= 4 ? 'medium' : 'low',
      missingInformation: rule.code.length < 8 ? ['EU ?멸? ?좉퀬??8?먮━ CN 肄붾뱶'] : [],
      source: 'catalog',
      assessment: assessCnCode(rule.code),
    }));
}

export const CBAM_SCOPE_RULE_SUMMARY = INCLUDED_RULES.map(rule => ({
  code: rule.code,
  sector: rule.sector,
  descriptionEn: rule.descriptionEn,
}));

