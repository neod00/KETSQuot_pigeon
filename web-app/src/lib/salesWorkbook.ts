import JSZip from 'jszip';
import type { SalesRecordInput } from '@/lib/salesTypes';

type CellValue = string | number | boolean | null;

const columnNumber = (reference: string) => {
  const letters = reference.replace(/[^A-Z]/gi, '').toUpperCase();
  return letters.split('').reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
};

const excelDate = (serial: number) => {
  const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
  return date.toISOString().slice(0, 10);
};

const valueText = (value: CellValue | undefined) => value == null ? '' : String(value).trim();
const ownerText = (value: CellValue | undefined) => {
  const owner = valueText(value);
  if (!owner || owner.length > 40 || /[@#\d]/.test(owner)) return '';
  if (/^(pipeline|renewal|won|lost|new)$/i.test(owner)) return '';
  return owner;
};
const valueNumber = (value: CellValue) => Number.isFinite(Number(value)) ? Number(value) : 0;
const moneyWon = (value: CellValue) => {
  const parsed = valueNumber(value);
  return parsed > 0 && parsed < 1_000_000 ? Math.round(parsed * 10_000) : Math.round(parsed);
};

const xml = (content: string) => new DOMParser().parseFromString(content, 'application/xml');

async function sharedStrings(zip: JSZip) {
  const file = zip.file('xl/sharedStrings.xml');
  if (!file) return [];
  const document = xml(await file.async('text'));
  return Array.from(document.getElementsByTagName('si')).map((item) =>
    Array.from(item.getElementsByTagName('t')).map((node) => node.textContent || '').join(''),
  );
}

async function quoteSheetPath(zip: JSZip) {
  const workbookFile = zip.file('xl/workbook.xml');
  const relationsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (!workbookFile || !relationsFile) throw new Error('올바른 Excel 통합 문서가 아닙니다.');

  const workbook = xml(await workbookFile.async('text'));
  const relations = xml(await relationsFile.async('text'));
  const sheets = Array.from(workbook.getElementsByTagName('sheet'));
  const targetSheet = sheets.find((sheet) => sheet.getAttribute('name') === 'Quot_2026') || sheets[0];
  if (!targetSheet) throw new Error('가져올 시트를 찾지 못했습니다.');
  const relationId = targetSheet.getAttribute('r:id');
  const relation = Array.from(relations.getElementsByTagName('Relationship')).find((item) => item.getAttribute('Id') === relationId);
  const target = relation?.getAttribute('Target');
  if (!target) throw new Error('Excel 시트 경로를 확인하지 못했습니다.');
  return target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
}

const readCell = (cell: Element, strings: string[]): CellValue => {
  const type = cell.getAttribute('t');
  if (type === 'inlineStr') return Array.from(cell.getElementsByTagName('t')).map((node) => node.textContent || '').join('');
  const raw = cell.getElementsByTagName('v')[0]?.textContent ?? '';
  if (type === 's') return strings[Number(raw)] || '';
  if (type === 'b') return raw === '1';
  if (type === 'str') return raw;
  const numeric = Number(raw);
  return raw !== '' && Number.isFinite(numeric) ? numeric : raw;
};

const recordFromRow = (headers: string[], row: CellValue[]): Partial<SalesRecordInput> => {
  const entries: Array<[string, CellValue]> = [];
  headers.forEach((header, index) => {
    if (header) entries.push([header, row[index] ?? null]);
  });
  const byHeader = new Map(entries);
  const get = (header: string) => byHeader.get(header) ?? null;
  const rawDate = get('DATE');
  const quotedAt = typeof rawDate === 'number' ? excelDate(rawDate) : valueText(rawDate);
  const product = valueText(get('Product'));
  const companyName = valueText(get('업체명'));
  const contactHistory = valueText(get('통화내역'));
  const quoteNumber = valueText(get('Q.No.'));

  return {
    innovation: valueText(get('이노베이션')),
    product,
    category: valueText(get('구분')),
    sf: valueText(get('SF')),
    quotedAt,
    quoteNumber,
    deadline: valueText(get('기한')),
    companyName,
    accountName: valueText(get('Account')),
    opportunityName: valueText(get('Opportunity')),
    contactName: valueText(get('담당자')),
    telephone: valueText(get('tel')),
    mobile: valueText(get('HP')),
    email: valueText(get('e-mail')),
    contactHistory,
    nextAction: valueText(get('이후 진행')),
    consultingFollowUp: valueText(get('컨설팅FU')),
    leadSource: valueText(get('Lead source')),
    contract: valueText(get('Contract')),
    mpApproval: valueText(get('MP승인')),
    quoteMandays: valueNumber(get('견적MD')),
    application6sv: valueText(get('신청/6SV')),
    amountExcludingExpenses: moneyWon(get('금액(출장비제외)')),
    amountIncludingExpenses: moneyWon(get('금액(출장비포함)')),
    quoteReviewResult: valueText(get('Q검토결과')),
    originalOwner: ownerText(get('Orig owner')),
    won: ['1', 'y', 'yes', 'true'].includes(valueText(get('won(y:1)')).toLowerCase()),
    d365Matched: ['1', 'y', 'yes', 'true'].includes(valueText(get('D365매칭(1:확인)')).toLowerCase()),
    retentionExpansion: valueText(get('Retention & Expansion')),
  };
};

export async function parseSalesWorkbook(file: File) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const strings = await sharedStrings(zip);
  const sheetPath = await quoteSheetPath(zip);
  const sheetFile = zip.file(sheetPath);
  if (!sheetFile) throw new Error('Quot_2026 시트를 읽지 못했습니다.');
  const document = xml(await sheetFile.async('text'));
  const rows = Array.from(document.getElementsByTagName('row')).map((rowElement) => {
    const cells: CellValue[] = [];
    Array.from(rowElement.getElementsByTagName('c')).forEach((cell) => {
      const index = columnNumber(cell.getAttribute('r') || 'A1');
      cells[index] = readCell(cell, strings);
    });
    return cells;
  });
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => valueText(cell) === 'Q.No.')
    && row.some((cell) => valueText(cell) === '업체명'));
  if (headerIndex < 0) throw new Error('Quot_2026 시트에서 Q.No.와 업체명 헤더를 찾지 못했습니다.');

  const headerRow = rows[headerIndex];
  const headers = Array.from(
    { length: headerRow.length },
    (_, index) => valueText(headerRow[index]),
  );
  return rows.slice(headerIndex + 1)
    .map((row) => recordFromRow(headers, row))
    .filter((record) => record.companyName || record.quoteNumber);
}
