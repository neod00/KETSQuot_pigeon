import 'server-only';

import JSZip from 'jszip';
import type { SamAccount } from '@/lib/samTypes';

export interface SamWorkbookRow {
  country: string;
  accountName: string;
  sector: string;
  manager: string;
  internalSponsor: string;
  clientSponsor: string;
  lastQbrDate: string;
  qbrOutcome: string;
  nextQbrDate: string;
  lastVisitDate: string;
  attendees: string;
  visitOutcome: string;
  opportunity: string;
  dealStage: string;
  estimatedCloseDate: string;
  dealValueNote: string;
  atRisk: string;
  growthStrategy: string;
  crossSell: string;
  notes: string;
}

const columns = 'ABCDEFGHIJKLMNOPQRST'.split('');

const decodeXml = (value: string) => value
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&amp;/g, '&');

const escapeXml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const sharedStrings = async (zip: JSZip) => {
  const file = zip.file('xl/sharedStrings.xml');
  if (!file) return [] as string[];
  const source = await file.async('text');
  return Array.from(source.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)).map((match) =>
    decodeXml(Array.from(match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)).map((text) => text[1]).join('')),
  );
};

const koreaSheetPath = async (zip: JSZip) => {
  const workbook = await zip.file('xl/workbook.xml')?.async('text');
  const rels = await zip.file('xl/_rels/workbook.xml.rels')?.async('text');
  if (!workbook || !rels) throw new Error('Excel workbook structure is incomplete.');
  const sheet = Array.from(workbook.matchAll(/<sheet\b([^>]+)>?/g)).find((match) => /name="Korea"/i.test(match[1]));
  const relId = sheet?.[1].match(/r:id="([^"]+)"/)?.[1];
  if (!relId) throw new Error('Korea sheet was not found.');
  const target = Array.from(rels.matchAll(/<Relationship\b([^>]+)\/?>(?:<\/Relationship>)?/g))
    .find((match) => match[1].includes(`Id="${relId}"`))?.[1]
    .match(/Target="([^"]+)"/)?.[1];
  if (!target) throw new Error('Korea sheet relationship was not found.');
  return target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
};

const cellValue = (cell: string, strings: string[]) => {
  const type = cell.match(/\bt="([^"]+)"/)?.[1];
  if (type === 'inlineStr') {
    return decodeXml(Array.from(cell.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)).map((match) => match[1]).join(''));
  }
  const value = cell.match(/<v>([\s\S]*?)<\/v>/)?.[1] || '';
  return type === 's' ? strings[Number(value)] || '' : decodeXml(value);
};

export async function parseSamWorkbook(bytes: Uint8Array): Promise<SamWorkbookRow[]> {
  const zip = await JSZip.loadAsync(bytes);
  const [strings, path] = await Promise.all([sharedStrings(zip), koreaSheetPath(zip)]);
  const sheet = await zip.file(path)?.async('text');
  if (!sheet) throw new Error('Korea sheet data was not found.');
  const values = new Map<string, string>();
  for (const match of sheet.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
    const address = match[1].match(/\br="([^"]+)"/)?.[1];
    if (address) values.set(address, cellValue(match[0], strings));
  }
  const rows: SamWorkbookRow[] = [];
  const maxRow = Math.max(4, ...Array.from(values.keys()).map((key) => Number(key.match(/\d+/)?.[0] || 0)));
  for (let row = 4; row <= maxRow; row += 1) {
    const cells = columns.map((column) => values.get(`${column}${row}`) || '');
    if (!cells[1] || cells[1].startsWith('★')) continue;
    rows.push({
      country: cells[0], accountName: cells[1], sector: cells[2], manager: cells[3],
      internalSponsor: cells[4], clientSponsor: cells[5], lastQbrDate: cells[6],
      qbrOutcome: cells[7], nextQbrDate: cells[8], lastVisitDate: cells[9],
      attendees: cells[10], visitOutcome: cells[11], opportunity: cells[12],
      dealStage: cells[13], estimatedCloseDate: cells[14], dealValueNote: cells[15],
      atRisk: cells[16], growthStrategy: cells[17], crossSell: cells[18], notes: cells[19],
    });
  }
  return rows;
}

const rowValues = (account: SamAccount) => [
  account.country,
  account.name.en,
  account.sector.en,
  account.manager,
  account.internalSponsor.en,
  account.clientSponsor.en,
  account.lastQbrDate,
  account.qbrOutcome.en,
  account.nextQbrDate,
  account.lastVisitDate,
  account.attendees.en,
  account.visitOutcome.en,
  account.opportunity.en,
  account.dealStage.en,
  account.estimatedCloseDate,
  account.dealValueNote.en || (account.dealValueUsd ? `USD ${account.dealValueUsd.toLocaleString('en-US')}` : 'TBD'),
  account.atRisk ? `Y - ${account.risk.en}` : `N - ${account.risk.en}`,
  account.growthStrategy.en,
  account.crossSell.en,
  account.notes.en,
];

const styleByColumn = (sheet: string) => {
  const styles = new Map<string, string>();
  const row = sheet.match(/<row\b[^>]*\br="4"[^>]*>([\s\S]*?)<\/row>/)?.[1] || '';
  for (const match of row.matchAll(/<c\b([^>]*)>/g)) {
    const column = match[1].match(/\br="([A-Z]+)4"/)?.[1];
    const style = match[1].match(/\bs="([^"]+)"/)?.[1];
    if (column && style) styles.set(column, style);
  }
  return styles;
};

export async function buildSamExcel(accounts: SamAccount[], template: Uint8Array) {
  const zip = await JSZip.loadAsync(template);
  const path = await koreaSheetPath(zip);
  const sheet = await zip.file(path)?.async('text');
  if (!sheet) throw new Error('Korea sheet data was not found.');
  const styles = styleByColumn(sheet);
  const headerRows = Array.from(sheet.matchAll(/<row\b[^>]*\br="[123]"[^>]*>[\s\S]*?<\/row>/g)).map((match) => match[0]).join('');
  const dataRows = accounts.map((account, index) => {
    const rowNumber = index + 4;
    const cells = rowValues(account).map((value, columnIndex) => {
      const column = columns[columnIndex];
      const style = styles.get(column);
      return `<c r="${column}${rowNumber}"${style ? ` s="${style}"` : ''} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
    }).join('');
    return `<row r="${rowNumber}" spans="1:20">${cells}</row>`;
  }).join('');
  const footerRow = accounts.length + 4;
  const footerStyle = styles.get('A');
  const footer = `<row r="${footerRow}" spans="1:20"><c r="A${footerRow}"${footerStyle ? ` s="${footerStyle}"` : ''} t="inlineStr"><is><t xml:space="preserve">★ Managed in LRQA Korea SAM Business. English export generated from approved content.</t></is></c></row>`;
  let updated = sheet
    .replace(/<dimension\b[^>]*ref="[^"]*"\s*\/>/, `<dimension ref="A1:T${footerRow}"/>`)
    .replace(/<sheetData>[\s\S]*?<\/sheetData>/, `<sheetData>${headerRows}${dataRows}${footer}</sheetData>`);
  updated = updated.replace(/<mergeCell ref="A9:T9"\s*\/>/, `<mergeCell ref="A${footerRow}:T${footerRow}"/>`);
  zip.file(path, updated);
  return new Uint8Array(await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }));
}
