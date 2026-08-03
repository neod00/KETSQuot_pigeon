import 'server-only';

import JSZip from 'jszip';
import type { SamAccount, SamAction, SamBilingualText } from '@/lib/samTypes';

const escapeXml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')
  .replace(/\r?\n/g, '&#10;');

const combinedText = (block: string) =>
  Array.from(block.matchAll(/<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g)).map((match) => match[1]).join('').trim();

const setBlockText = (block: string, value: string) => {
  let used = false;
  return block.replace(/<a:t\b([^>]*)>[\s\S]*?<\/a:t>/g, (_match, attrs) => {
    if (used) return `<a:t${attrs}></a:t>`;
    used = true;
    return `<a:t${attrs}>${escapeXml(value)}</a:t>`;
  });
};

const replaceExactShape = (xml: string, oldText: string, newText: string) =>
  xml.replace(/<p:sp\b[\s\S]*?<\/p:sp>/g, (shape) =>
    combinedText(shape).replace(/\s+/g, ' ') === oldText.replace(/\s+/g, ' ')
      ? setBlockText(shape, newText)
      : shape,
  );

const setTable = (xml: string, tableIndex: number, matrix: string[][]) => {
  let index = 0;
  return xml.replace(/<a:tbl\b[\s\S]*?<\/a:tbl>/g, (table) => {
    index += 1;
    if (index !== tableIndex) return table;
    let rowIndex = 0;
    return table.replace(/<a:tr\b[\s\S]*?<\/a:tr>/g, (row) => {
      const values = matrix[rowIndex++] || [];
      let cellIndex = 0;
      return row.replace(/<a:tc\b[\s\S]*?<\/a:tc>/g, (cell) => {
        const value = values[cellIndex++];
        return value === undefined ? cell : setBlockText(cell, value);
      });
    });
  });
};

const en = (field: SamBilingualText, fallback = 'TBD') => field.en.trim() || fallback;
const money = (value: number) => value > 0 ? `USD ${Math.round(value / 1000)}k` : 'TBD';
const today = () => new Date().toISOString().slice(0, 10);

const fallbackActions = (account: SamAccount): SamAction[] => [
  {
    id: 'growth', goal: { ko: '', en: `Deliver and grow ${en(account.opportunity, account.name.en)}`, status: 'approved' },
    ambitionUsd: account.dealValueUsd, milestone: { ko: '', en: en(account.growthStrategy), status: 'approved' },
    owner: account.manager, dueDate: account.estimatedCloseDate || account.nextReviewDate,
    status: account.atRisk ? 'at-risk' : 'on-track', risk: account.risk,
  },
  {
    id: 'cross-sell', goal: { ko: '', en: 'Develop cross-sell opportunities', status: 'approved' },
    ambitionUsd: 0, milestone: account.crossSell, owner: account.manager,
    dueDate: account.nextQbrDate, status: 'not-started', risk: account.risk,
  },
];

const slide2Main = (account: SamAccount) => [
  [`Account Name:\n${account.name.en}`, `Primary Sector:\n${en(account.sector)}`, 'Primary Competitors:\nGlobal and local assurance, certification and sustainability service providers'],
  [`Brief History of Account & Why It’s a Growth Target:\n${en(account.notes)}`, '', ''],
  [`Current Annual Sales, Revenue & Margin:\n${en(account.dealValueNote, money(account.dealValueUsd))}\nMargin: TBD`, `Target Annual Sales, Revenue & Margin:\n${en(account.growthStrategy)}`, `Action Plan to Grow Account:\n${en(account.crossSell)}`],
  [`Existing LRQA Services & In which markets:\n${en(account.qbrOutcome)}`, `Open Opportunities & In which markets:\n${en(account.opportunity)}`, ''],
  [`Client Pain Points:\n${en(account.risk)}`, `LRQA Solutions to Meet Client Pains:\n${en(account.crossSell)}`, ''],
  [`Client Goals & Objectives:\n${en(account.growthStrategy)}`, `LRQA Solutions to Meet Client Goals & Objectives:\n${en(account.crossSell)}`, 'Why LRQA?\nGlobal assurance credibility, technical expertise and established Korea delivery capability'],
  [`Existing Account Contacts & Decision Makers:\n${en(account.clientSponsor)}`, 'Targeted Account Contacts & Decision Makers:\nSee Contacts Heatmap', `Measurement & Results:\nPipeline conversion, retention, account growth and action completion`],
  [`Existing Account Meeting Frequency & Format:\nLast QBR: ${account.lastQbrDate || 'TBD'}\n${en(account.qbrOutcome)}`, '', ''],
  ['Existing LRQA Competitors Serving Account:\nTBD / monitor by opportunity', `Targeted Account Meeting Frequency & Format:\n${account.reviewCadence} internal review; next QBR ${account.nextQbrDate || 'TBD'}`, ''],
];

const slide2Actions = (account: SamAccount) => {
  const actions = (account.actions.length ? account.actions : fallbackActions(account)).slice(0, 4);
  return [
    ['Key Actions', 'Dates', 'Responsible Persons'],
    ...Array.from({ length: 4 }, (_, index) => {
      const action = actions[index];
      return action
        ? [`${index + 1}. ${en(action.goal)}`, action.dueDate || 'TBD', action.owner || account.manager]
        : [`${index + 1}. TBD`, 'TBD', account.manager];
    }),
  ];
};

const slide3 = (account: SamAccount) => [
  ['Market Drivers', 'Strategies / Goals', 'Pain / Challenges', 'Metrics', 'Champions', 'Potential Projects', 'LRQA Solutions'],
  ['Increasing regulatory, customer and supply-chain assurance expectations', en(account.growthStrategy), en(account.risk), 'Revenue, retention, pipeline and delivery quality', en(account.clientSponsor), en(account.opportunity), en(account.crossSell)],
  ['Group-wide sustainability and operational needs', 'Expand from current delivery into affiliate opportunities', 'Fragmented ownership across affiliates and functions', 'Affiliates engaged and qualified opportunities', 'Working-level and executive sponsors', 'Affiliate assurance and training', 'Integrated assurance, certification and training'],
  ['Climate disclosure and product carbon expectations', 'Position LRQA as a strategic assurance partner', 'Competitive and price pressure', 'Cross-sell conversion and renewal rate', account.manager, 'GHG, LCA, PCF, Scope 3 and reporting assurance', 'Global technical network and Korea account management'],
  ['', '', '', '', '', '', ''],
];

const slide4 = (account: SamAccount) => {
  const contacts = account.contacts.slice(0, 7);
  return [
    ['Dept / Function / Business Area that owns the Metrics', 'Decision Maker Name', 'Decision-Making Role (incl. Champion / Economic Buyer)', 'Support Status\n(supporter, detractor, neutral)', 'Marker', 'Action'],
    ...(contacts.length ? contacts.map((contact) => [
      en(contact.department), contact.name, en(contact.role), contact.supportStatus, contact.influence, en(contact.action),
    ]) : [
      ['Sustainability / ESG', en(account.clientSponsor), 'Working-level sponsors and decision influencers', 'Supporter', 'High', 'Maintain engagement and confirm next actions'],
      ['Procurement / Commercial', 'TBD', 'Economic buyer / commercial gatekeeper', 'Neutral', 'Medium', 'Clarify procurement process and value case'],
      ['Technical / Quality / EHS', 'TBD', 'Technical evaluator and delivery owner', 'Neutral', 'Medium', 'Map technical requirements and project pipeline'],
    ]),
  ];
};

const slide6 = (account: SamAccount) => {
  const actions = (account.actions.length ? account.actions : fallbackActions(account)).slice(0, 6);
  return [
    [`Goal Description`, `Ambition (USD '000)`, 'Next Steps & Key Milestones (next 6 months)', 'Action Agreed (month)', 'Last Update (date)', 'By When (month)', 'Status', 'Risks & Dependencies'],
    ...Array.from({ length: 6 }, (_, index) => {
      const action = actions[index];
      if (!action) return ['', '', '', '', '', '', '', ''];
      return [
        en(action.goal), action.ambitionUsd ? String(Math.round(action.ambitionUsd / 1000)) : 'TBD',
        en(action.milestone), today().slice(0, 7), account.updatedAt.slice(0, 10),
        action.dueDate || 'TBD', action.status, en(action.risk),
      ];
    }),
  ];
};

export async function buildSamPptx(account: SamAccount, template: Uint8Array) {
  const zip = await JSZip.loadAsync(template);
  for (let slide = 1; slide <= 6; slide += 1) {
    const path = `ppt/slides/slide${slide}.xml`;
    const file = zip.file(path);
    if (!file) continue;
    let xml = await file.async('text');
    if (slide === 1) {
      xml = replaceExactShape(xml, 'Selling LRQA Way Account plan template', `Selling LRQA Way Account Plan\n${account.name.en}`);
      xml = replaceExactShape(xml, 'Insert Name', account.manager);
      xml = replaceExactShape(xml, '30 June 2025', today());
    }
    if (slide === 2) {
      xml = replaceExactShape(xml, 'Account plan on a page – F&N', `Account plan on a page - ${account.name.en}`);
      xml = setTable(xml, 1, slide2Main(account));
      xml = setTable(xml, 2, slide2Actions(account));
    }
    if (slide === 3) {
      xml = replaceExactShape(xml, 'Selling the LRQA Way Account Strategy Map', `Selling the LRQA Way Account Strategy Map - ${account.name.en}`);
      xml = setTable(xml, 1, slide3(account));
    }
    if (slide === 4) {
      xml = replaceExactShape(xml, 'Decision Process Mapping / Contacts Heatmap', `Decision Process Mapping / Contacts Heatmap - ${account.name.en}`);
      xml = setTable(xml, 1, slide4(account));
    }
    if (slide === 5) {
      xml = replaceExactShape(xml, 'Account Management Team', `Account Management Team - ${account.name.en}`);
      const replacements: Array<[string, string]> = [
        ['Global Account ManagerINSERT NAME', `Executive Sponsor\n${account.team.find((member) => member.role.en.includes('Sponsor'))?.name || 'Ryan'}`],
        ['SAM Region/Country Xxxxx NAME', `SAM Korea\n${account.manager}`],
        ['Program SupportNAME', `Program Support\n${account.team.find((member) => member.role.en.includes('Program'))?.name || 'TBD'}`],
        ['Technical LeadNAME', `Technical Lead\n${account.team.find((member) => member.role.en.includes('Technical'))?.name || 'CSY / TKK'}`],
        ['Escalation NAME', `Escalation\n${account.team.find((member) => member.role.en.includes('Escalation'))?.name || 'Ryan / BGL'}`],
      ];
      replacements.forEach(([oldText, newText]) => { xml = replaceExactShape(xml, oldText, newText); });
    }
    if (slide === 6) {
      xml = replaceExactShape(xml, 'Action plan', `Action plan - ${account.name.en}`);
      xml = replaceExactShape(xml, 'Presentation title here', `${account.name.en} Account Plan`);
      xml = setTable(xml, 1, slide6(account));
      xml = setTable(xml, 2, [['At risk', 'Not initiated', 'On-Track']]);
    }
    zip.file(path, xml);
  }
  return new Uint8Array(await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }));
}
