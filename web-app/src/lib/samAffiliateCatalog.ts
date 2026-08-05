import type { SamAccount, SamAffiliate, SamAffiliateCatalogInfo } from '@/lib/samTypes';

const official = (
  id: string,
  nameKo: string,
  nameEn: string,
  category: string,
  aliases: string[] = [],
): SamAffiliate => ({ id, nameKo, nameEn, category, aliases, source: 'official' });

type Catalog = { info: SamAffiliateCatalogInfo; affiliates: SamAffiliate[] };

const CATALOGS: Record<string, Catalog> = {
  'sam-hyundai': {
    info: {
      sourceName: 'Hyundai Motor Group Affiliates',
      sourceUrl: 'https://www.hyundaimotorgroup.com/en/about-us/strategy',
      asOf: '2026-08-05',
      scope: '현대자동차그룹 공식 사이트에 공개된 국내 주요 계열사',
      regulatoryCount: 74,
    },
    affiliates: [
      official('hmg-auto-hmc', '현대자동차', 'Hyundai Motor Company', '완성차', ['현대차', 'Hyundai Motors', 'Hyundai Motors Company']),
      official('hmg-auto-kia', '기아', 'Kia Corporation', '완성차', ['기아자동차', 'Kia']),
      official('hmg-steel-hyundai-steel', '현대제철', 'Hyundai Steel', '철강'),
      official('hmg-steel-bng', '현대비앤지스틸', 'Hyundai BNG Steel', '철강', ['Hyundai BNG STEEL']),
      official('hmg-steel-special', '현대종합특수강', 'Hyundai Special Steel', '철강'),
      official('hmg-construction-hdec', '현대건설', 'Hyundai Engineering & Construction', '건설', ['Hyundai E&C']),
      official('hmg-construction-hec', '현대엔지니어링', 'Hyundai Engineering', '건설'),
      official('hmg-construction-hesi', '현대스틸산업', 'Hyundai Engineering & Steel Industries', '건설'),
      official('hmg-construction-city', '현대도시개발', 'Hyundai City Corporation', '건설'),
      official('hmg-construction-farm', '현대서산농장', 'Hyundai Farm Land & Development Company', '건설·개발'),
      official('hmg-parts-mobis', '현대모비스', 'Hyundai Mobis', '부품'),
      official('hmg-parts-transys', '현대트랜시스', 'Hyundai Transys', '부품'),
      official('hmg-parts-wia', '현대위아', 'Hyundai WIA', '부품'),
      official('hmg-parts-mseat', '현대엠시트', 'Hyundai MSEAT', '부품'),
      official('hmg-parts-kefico', '현대케피코', 'Hyundai KEFICO', '부품'),
      official('hmg-parts-ihl', '현대아이에이치엘', 'Hyundai IHL', '부품'),
      official('hmg-parts-partecs', '현대파텍스', 'Hyundai PARTECS', '부품'),
      official('hmg-parts-motras', '모트라스', 'MOTRAS', '부품'),
      official('hmg-parts-teczen', '테크젠', 'TECZEN', '부품'),
      official('hmg-finance-capital', '현대캐피탈', 'Hyundai Capital', '금융'),
      official('hmg-finance-card', '현대카드', 'Hyundai Card', '금융'),
      official('hmg-finance-commercial', '현대커머셜', 'Hyundai Commercial', '금융'),
      official('hmg-finance-securities', '현대차증권', 'Hyundai Motor Securities', '금융'),
      official('hmg-other-glovis', '현대글로비스', 'Hyundai Glovis', '물류'),
      official('hmg-other-rotem', '현대로템', 'Hyundai Rotem', '철도·방산'),
      official('hmg-other-innocean', '이노션', 'INNOCEAN', '광고·마케팅'),
      official('hmg-other-haevichi', '해비치호텔앤드리조트', 'Haevichi Hotel & Resort', '호텔·리조트'),
      official('hmg-other-autoever', '현대오토에버', 'Hyundai AutoEver', 'IT'),
      official('hmg-other-ngv', '현대엔지비', 'Hyundai NGV', '연구·교육'),
      official('hmg-other-git', '지아이티', 'GIT', 'IT·서비스'),
      official('hmg-other-gmarine', '지마린서비스', 'G-Marine Service', '해운·서비스'),
      official('hmg-other-kevcs', '한국전기차충전서비스', 'Korea Electric Vehicle Charging Service', 'EV 충전', ['KEVCS']),
    ],
  },
  'sam-samsung': {
    info: {
      sourceName: 'Samsung official affiliate disclosure',
      sourceUrl: 'https://news.samsung.com/global/samsung-affiliates-announce-first-half-investment-and-hiring-plans',
      asOf: '2026-08-05',
      scope: '삼성 공식 발표에서 명시한 17개 주요 계열사',
      regulatoryCount: 67,
    },
    affiliates: [
      official('samsung-electronics', '삼성전자', 'Samsung Electronics', '전자'),
      official('samsung-display', '삼성디스플레이', 'Samsung Display', '전자'),
      official('samsung-sdi', '삼성SDI', 'Samsung SDI', '전자·배터리'),
      official('samsung-electro-mechanics', '삼성전기', 'Samsung Electro-Mechanics', '전자부품'),
      official('samsung-sds', '삼성SDS', 'Samsung SDS', 'IT'),
      official('samsung-heavy', '삼성중공업', 'Samsung Heavy Industries', '중공업'),
      official('samsung-ea', '삼성E&A', 'Samsung E&A', '엔지니어링', ['삼성엔지니어링', 'Samsung Engineering']),
      official('samsung-ct', '삼성물산', 'Samsung C&T', '건설·상사·패션', ['Samsung C and T']),
      official('samsung-life', '삼성생명', 'Samsung Life Insurance', '금융'),
      official('samsung-fire', '삼성화재', 'Samsung Fire & Marine Insurance', '금융'),
      official('samsung-card', '삼성카드', 'Samsung Card', '금융'),
      official('samsung-securities', '삼성증권', 'Samsung Securities', '금융'),
      official('samsung-biologics', '삼성바이오로직스', 'Samsung Biologics', '바이오'),
      official('samsung-bioepis', '삼성바이오에피스', 'Samsung Bioepis', '바이오'),
      official('samsung-hotel-shilla', '호텔신라', 'Hotel Shilla', '호텔·면세'),
      official('samsung-cheil', '제일기획', 'Cheil Worldwide', '광고·마케팅'),
      official('samsung-s1', '에스원', 'S-1 Corporation', '보안·서비스', ['S1', 'S-1']),
    ],
  },
  'sam-posco': {
    info: {
      sourceName: 'POSCO Holdings group company disclosures',
      sourceUrl: 'https://www.posco-inc.com/hs91a1-front/app/esg/ethical-compliance.html',
      asOf: '2026-08-05',
      scope: '포스코홀딩스 공식 CP·지속가능경영 자료에 공개된 주요 국내 그룹사',
      regulatoryCount: 51,
    },
    affiliates: [
      official('posco-holdings', '포스코홀딩스', 'POSCO Holdings', '지주'),
      official('posco-steel', '포스코', 'POSCO', '철강'),
      official('posco-international', '포스코인터내셔널', 'POSCO International', '상사·에너지'),
      official('posco-enc', '포스코이앤씨', 'POSCO E&C', '건설', ['포스코건설', 'POSCO Engineering & Construction']),
      official('posco-futurem', '포스코퓨처엠', 'POSCO Future M', '이차전지소재'),
      official('posco-dx', '포스코DX', 'POSCO DX', 'IT·자동화'),
      official('posco-steelion', '포스코스틸리온', 'POSCO STEELEON', '철강'),
      official('posco-mtech', '포스코엠텍', 'POSCO M-TECH', '철강·소재'),
      official('posco-flow', '포스코플로우', 'POSCO FLOW', '물류'),
      official('posco-ac', '포스코A&C', 'POSCO A&C', '건축·건설'),
      official('posco-entob', '엔투비', 'eNtoB', '구매·서비스'),
      official('posco-mobility', '포스코모빌리티솔루션', 'POSCO Mobility Solution', '모빌리티소재'),
      official('posco-mc-materials', '포스코MC머티리얼즈', 'POSCO MC Materials', '소재'),
      official('posco-wide', '포스코와이드', 'POSCO WIDE', '시설·서비스', ['포스코O&M', 'POSCO O&M']),
      official('posco-pr-tech', '포스코PR테크', 'POSCO PR Tech', '철강 서비스'),
      official('posco-ph-solution', '포스코PH솔루션', 'POSCO PH Solution', '철강 서비스'),
      official('posco-gyr-tech', '포스코GYR테크', 'POSCO GYR Tech', '철강 서비스'),
      official('posco-gy-solution', '포스코GY솔루션', 'POSCO GY Solution', '철강 서비스'),
      official('posco-pilbara-lithium', '포스코필바라리튬솔루션', 'POSCO Pilbara Lithium Solution', '리튬·소재'),
    ],
  },
  'sam-sk': {
    info: {
      sourceName: 'SK Group Affiliates',
      sourceUrl: 'https://www.sk.com/ko/about/affiliates.jsp',
      asOf: '2026-08-05',
      scope: 'SK 공식 계열사 안내에 공개된 21개 주요 회사',
      regulatoryCount: 151,
    },
    affiliates: [
      official('sk-inc', 'SK주식회사', 'SK Inc.', '지주·투자', ['SK Inc', 'SK Corporation']),
      official('sk-hynix', 'SK하이닉스', 'SK hynix', '반도체', ['SK Hynix']),
      official('sk-innovation', 'SK이노베이션', 'SK innovation', '에너지·화학', ['SK Innovation']),
      official('sk-telecom', 'SK텔레콤', 'SK telecom', '통신', ['SK Telecom']),
      official('sk-discovery', 'SK디스커버리', 'SK discovery', '지주·투자', ['SK Discovery']),
      official('sk-on', 'SK온', 'SK On', '배터리'),
      official('sk-energy', 'SK에너지', 'SK energy', '에너지', ['SK Energy']),
      official('sk-ecoplant', 'SK에코플랜트', 'SK ecoplant', '건설·환경', ['SK Ecoplant']),
      official('sk-innovation-ens', 'SK이노베이션 E&S', 'SK Innovation E&S', '에너지', ['SK E&S', 'SK E and S']),
      official('sk-geocentric', 'SK지오센트릭', 'SK geo centric', '화학', ['SK Geocentric']),
      official('sk-broadband', 'SK브로드밴드', 'SK broadband', '통신', ['SK Broadband']),
      official('sk-gas', 'SK가스', 'SK gas', '에너지', ['SK Gas']),
      official('sk-siltron', 'SK실트론', 'SK siltron', '반도체소재', ['SK Siltron']),
      official('sk-square', 'SK스퀘어', 'SK square', '투자', ['SK Square']),
      official('sk-networks', 'SK네트웍스', 'SK networks', '상사·서비스', ['SK Networks']),
      official('sk-enmove', 'SK엔무브', 'SK enmove', '에너지·윤활유', ['SK Enmove']),
      official('skc', 'SKC', 'SKC', '소재'),
      official('sk-chemicals', 'SK케미칼', 'SK chemicals', '화학·바이오', ['SK Chemicals']),
      official('sk-ax', 'SK AX', 'SK AX', 'IT', ['SK C&C', 'SK C and C']),
      official('sk-ecoplant-materials', 'SK에코플랜트 머티리얼즈', 'SK Ecoplant Materials', '환경·소재'),
      official('sk-biopharm', 'SK바이오팜', 'SK biopharmaceuticals', '바이오', ['SK Biopharm']),
    ],
  },
  'sam-hyosung': {
    info: {
      sourceName: 'Hyosung Affiliates',
      sourceUrl: 'https://www.hyosung.com/en/about-us',
      asOf: '2026-08-05',
      scope: '효성 공식 사이트에 공개된 현 효성그룹 15개 계열사',
    },
    affiliates: [
      official('hyosung-tnc', '효성티앤씨', 'Hyosung TNC', '섬유·무역'),
      official('hyosung-heavy', '효성중공업', 'Hyosung Heavy Industries', '중공업·건설'),
      official('hyosung-chemical', '효성화학', 'Hyosung Chemical', '화학'),
      official('hyosung-tns', '효성티앤에스', 'Hyosung TNS', 'IT·금융자동화'),
      official('hyosung-itx', '효성ITX', 'Hyosung ITX', 'IT·서비스'),
      official('hyosung-goodsprings', '효성굿스프링스', 'Hyosung Goodsprings', '산업기계'),
      official('hyosung-neochem', '효성네오켐', 'Hyosung Neochem', '소재'),
      official('hyosung-ventures', '효성벤처스', 'Hyosung Ventures', '투자'),
      official('hyosung-chinhung', '진흥기업', 'Chinhung International', '건설', ['Chinhung']),
      official('hyosung-shinwha', '신화인터텍', 'Shinwha Intertek', '전자소재'),
      official('hyosung-fmk', 'FMK', 'FMK', '자동차 유통'),
      official('hyosung-galaxia-moneytree', '갤럭시아머니트리', 'Galaxia Moneytree', '핀테크'),
      official('hyosung-galaxia-sm', '갤럭시아SM', 'Galaxia SM', '스포츠·마케팅'),
      official('hyosung-galaxia-device', '갤럭시아디바이스', 'Galaxia Device', '전자부품'),
      official('hyosung-galaxia-electronics', '갤럭시아일렉트로닉스', 'Galaxia Electronics', '전자·LED'),
    ],
  },
};

const normalize = (value: string) => value
  .normalize('NFKC')
  .toLowerCase()
  .replace(/주식회사|\(주\)|co\.?[,]?\s*ltd\.?|corporation|corp\.?|limited|ltd\.?/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, '');

const identityKeys = (affiliate: SamAffiliate) => [affiliate.nameKo, affiliate.nameEn, ...affiliate.aliases]
  .map(normalize)
  .filter(Boolean);

export const officialAffiliateCatalog = (accountId: string) => CATALOGS[accountId] || null;

export const mergeOfficialAffiliateCatalog = (account: SamAccount): SamAccount => {
  const catalog = officialAffiliateCatalog(account.id);
  if (!catalog) return account;

  const legacyRemovedIds = account.id === 'sam-hyosung' ? new Set(['hyosung-3']) : new Set<string>();
  const remaining = [...(account.affiliates || [])].filter((affiliate) => !legacyRemovedIds.has(affiliate.id));
  const merged = catalog.affiliates.map((entry) => {
    const entryKeys = new Set(identityKeys(entry));
    const index = remaining.findIndex((candidate) => identityKeys(candidate).some((key) => entryKeys.has(key)));
    if (index < 0) return entry;
    const existing = remaining.splice(index, 1)[0];
    return {
      ...entry,
      ...existing,
      nameKo: entry.nameKo,
      nameEn: entry.nameEn,
      category: entry.category,
      source: 'official' as const,
      aliases: Array.from(new Set([...entry.aliases, ...(existing.aliases || [])])),
    };
  });

  return {
    ...account,
    affiliateCatalog: catalog.info,
    affiliates: [...merged, ...remaining.map((affiliate) => ({ ...affiliate, source: affiliate.source || 'manual' as const }))],
  };
};
