import {
  calculateIsoQuoteCost,
  futureAuditHeader,
  isRenewalQuote,
  isSurveillanceQuote,
  isTransferQuote,
} from '../lib/isoQuoteRules';

export interface IsoStandardCostData {
  standard: string;
  stage1Days: number;
  stage2Days: number;
  surveillanceDays: number;
  recertDays: number;
  dayRate: number;
}

export interface IsoQuoteDocxData {
  companyName: string;
  contactPerson: string;
  docId: string;
  issueDate: string;
  auditType: string;
  standards: string[];
  standardCosts?: IsoStandardCostData[];
  scope: string;
  siteName: string;
  siteAddress: string;
  employeeCount: string;
  stage1Days: number;
  stage2Days: number;
  surveillanceDays: number;
  recertDays: number;
  dayRate: number;
  expenses: number;
  certFee: number;
  discount: number;
  vatType: '별도' | '포함';
  contractYears: string;
  paymentTerms: string;
  validity: string;
}

const TEMPLATE_PATH = '/templates/LRQA_ISO_Audit_Quote_Template.docx';

const STANDARD_VERSION: Record<string, string> = {
  'ISO 9001': 'ISO 9001:2015',
  'ISO 14001': 'ISO 14001:2015',
  'ISO 45001': 'ISO 45001:2018',
  'ISO 27001': 'ISO 27001:2022',
  'ISO 50001': 'ISO 50001:2018',
};

const escapeXml = (value: string) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const formatWon = (value: number) => `${Math.round(value || 0).toLocaleString()}원`;

const formatDays = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toFixed(1);
};

const formatYmd = (value: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
};

const formatKoreanDate = (value: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return value || '';
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const safeFilePart = (value: string) =>
  (value || '미입력')
    .replace(/[\\/?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

const auditPhrase = (auditType: string) => {
  if (isRenewalQuote(auditType)) return '갱신 심사';
  if (isTransferQuote(auditType)) return '인수인증 심사';
  if (auditType.includes('범위')) return '범위 확장 심사';
  if (isSurveillanceQuote(auditType)) return '사후관리 심사';
  return '최초 심사';
};

const patchTextNodes = (xml: string, updates: Record<number, string>) => {
  let index = 0;
  return xml.replace(/<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t>/g, (full, attrs = '') => {
    const currentIndex = index;
    index += 1;
    if (!Object.prototype.hasOwnProperty.call(updates, currentIndex)) return full;
    return `<w:t${attrs}>${escapeXml(updates[currentIndex] ?? '')}</w:t>`;
  });
};

const patchRowTextNodes = (rowXml: string, updates: Record<number, string>) => {
  let index = 0;
  return rowXml.replace(/<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t>/g, (full, attrs = '') => {
    const currentIndex = index;
    index += 1;
    if (!Object.prototype.hasOwnProperty.call(updates, currentIndex)) return full;
    return `<w:t${attrs}>${escapeXml(updates[currentIndex] ?? '')}</w:t>`;
  });
};

const patchCellTextNodes = (rowXml: string, cellIndex: number, values: string[]) => {
  let currentCell = 0;
  return rowXml.replace(/<w:tc[\s\S]*?<\/w:tc>/g, (cellXml) => {
    const targetCell = currentCell === cellIndex;
    currentCell += 1;
    if (!targetCell) return cellXml;

    let textIndex = 0;
    return cellXml.replace(/<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t>/g, (_full, attrs = '') => {
      const value = values[textIndex] ?? '';
      textIndex += 1;
      return '<w:t' + attrs + '>' + escapeXml(value) + '</w:t>';
    });
  });
};

const setRowRange = (updates: Record<number, string>, start: number, end: number, value: string) => {
  updates[start] = value;
  for (let i = start + 1; i <= end; i += 1) updates[i] = '';
};

const collectRows = (xml: string) =>
  [...xml.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)].map((match) => ({
    xml: match[0],
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));

const collapseRowCellsToOneParagraph = (rowXml: string) =>
  rowXml.replace(/<w:tc[\s\S]*?<\/w:tc>/g, (cellXml) => {
    const paragraphs = [...cellXml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)];
    if (paragraphs.length <= 1) return cellXml;

    const first = paragraphs[0];
    const last = paragraphs[paragraphs.length - 1];
    const firstEnd = (first.index ?? 0) + first[0].length;
    const lastEnd = (last.index ?? 0) + last[0].length;
    return cellXml.slice(0, firstEnd) + cellXml.slice(lastEnd);
  });

const addBoldToRuns = (rowXml: string) =>
  rowXml.replace(/<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g, (runXml) => {
    if (/<w:b(?:\s[^>]*)?\/>/.test(runXml)) return runXml;
    if (/<w:rPr(?:\s[^>]*)?>/.test(runXml)) {
      return runXml.replace(/<w:rPr(?:\s[^>]*)?>/, (open) => open + '<w:b/>');
    }
    return runXml.replace(/<w:r(?:\s[^>]*)?>/, (open) => open + '<w:rPr><w:b/></w:rPr>');
  });

const patchFutureAuditHeader = (xml: string, auditType: string) => {
  const headerRow = collectRows(xml).find((row) =>
    row.xml.includes('사후관리') && row.xml.includes('12개월 주기'));
  if (!headerRow) return xml;

  const header = futureAuditHeader(auditType);
  const patchedRow = patchCellTextNodes(
    headerRow.xml,
    3,
    [header.title, '', '(', header.cycle, ')'],
  );
  return xml.slice(0, headerRow.start) + patchedRow + xml.slice(headerRow.end);
};

const boldTotalRow = (xml: string) => {
  const totalRow = collectRows(xml).find((row) => row.xml.includes('총합'));
  if (!totalRow) return xml;

  const patchedRow = addBoldToRuns(totalRow.xml);
  return xml.slice(0, totalRow.start) + patchedRow + xml.slice(totalRow.end);
};

const getBinaryContent = async (path: string, PizZipUtils: { getBinaryContent: (path: string, callback: (error: Error | null, content: string) => void) => void }) =>
  new Promise<string>((resolve, reject) => {
    PizZipUtils.getBinaryContent(path, (error: Error | null, content: string) => {
      if (error) reject(error);
      else resolve(content);
    });
  });

const normalizeStandardCosts = (data: IsoQuoteDocxData): IsoStandardCostData[] => {
  if (Array.isArray(data.standardCosts) && data.standardCosts.length > 0) return data.standardCosts;

  const selected = data.standards.length ? data.standards : ['ISO 9001'];
  return selected.map((standard) => ({
    standard,
    stage1Days: data.stage1Days,
    stage2Days: data.stage2Days,
    surveillanceDays: data.surveillanceDays,
    recertDays: data.recertDays,
    dayRate: data.dayRate,
  }));
};

const toCostRows = (data: IsoQuoteDocxData) =>
  normalizeStandardCosts(data).map((input) => ({
    ...input,
    label: (STANDARD_VERSION[input.standard] || input.standard) + ' ' + auditPhrase(data.auditType),
    ...calculateIsoQuoteCost(input, data.auditType),
  }));

type CostRow = ReturnType<typeof toCostRows>[number];

const buildAuditCostRow = (templateXml: string, row: CostRow) => {
  const updates: Record<number, string> = {};
  setRowRange(updates, 0, 0, row.label);

  if (row.singleLineAudit) {
    setRowRange(updates, 1, 10, formatDays(row.activeAuditDays) + '일');
    setRowRange(
      updates,
      11,
      19,
      row.freeTransfer
        ? '무상(' + formatDays(row.activeAuditDays) + '일, ' + formatWon(row.dayRate) + '/일)'
        : formatWon(row.activeAuditFee),
    );
    setRowRange(updates, 20, 23, row.futureAuditDays === null ? '-' : formatDays(row.futureAuditDays) + '일');
    setRowRange(updates, 24, 24, row.note);
  } else {
    setRowRange(updates, 1, 5, '1단계 심사: ' + formatDays(row.stage1Days) + '일');
    setRowRange(updates, 6, 10, '2단계 심사: ' + formatDays(row.stage2Days) + '일');
    setRowRange(updates, 11, 15, formatWon(row.stage1Fee));
    setRowRange(updates, 16, 19, formatWon(row.stage2Fee));
    setRowRange(updates, 20, 23, row.futureAuditDays === null ? '-' : formatDays(row.futureAuditDays) + '일');
    setRowRange(updates, 24, 24, '-');
  }

  const patchedRow = patchRowTextNodes(templateXml, updates);
  return row.singleLineAudit ? collapseRowCellsToOneParagraph(patchedRow) : patchedRow;
};

const buildExpenseRow = (templateXml: string, expenses: number) => {
  const updates: Record<number, string> = {};
  setRowRange(updates, 0, 0, '제경비/출장비');
  setRowRange(updates, 1, 10, '-');
  setRowRange(updates, 11, 19, formatWon(expenses));
  setRowRange(updates, 20, 23, '-');
  setRowRange(updates, 24, 24, '-');
  const patchedRow = collapseRowCellsToOneParagraph(patchRowTextNodes(templateXml, updates));
  return patchCellTextNodes(patchedRow, 4, ['-']);
};

const replaceCostRows = (xml: string, costRows: CostRow[], data: IsoQuoteDocxData) => {
  const rows = collectRows(xml);
  const firstTemplateRow = rows.find((row) => row.xml.includes('ISO 9001:2015 최초 심사'));
  const secondTemplateRow = rows.find((row) => row.xml.includes('ISO 14001:2015 최초 심사'));

  if (!firstTemplateRow || !secondTemplateRow) return xml;

  const templates = [firstTemplateRow.xml, secondTemplateRow.xml];
  const nextRows = costRows.map((row, index) => buildAuditCostRow(templates[index % templates.length], row));

  if (data.expenses > 0) {
    nextRows.push(buildExpenseRow(templates[nextRows.length % templates.length], data.expenses));
  }

  return xml.slice(0, firstTemplateRow.start) + nextRows.join('') + xml.slice(secondTemplateRow.end);
};

export const generateIsoQuoteDocx = async (data: IsoQuoteDocxData) => {
  if (typeof window === 'undefined') return;

  const [{ default: PizZip }, { default: PizZipUtils }, { default: saveAs }] = await Promise.all([
    import('pizzip'),
    import('pizzip/utils/index.js'),
    import('file-saver'),
  ]);

  const content = await getBinaryContent(TEMPLATE_PATH, PizZipUtils);
  const zip = new PizZip(content);
  const documentFile = zip.file('word/document.xml');
  if (!documentFile) throw new Error('word/document.xml not found in ISO quote template');

  const costRows = toCostRows(data);
  const selectedStandards = costRows.map((row) => row.standard);
  const standardDisplay = selectedStandards
    .map((standard) => STANDARD_VERSION[standard] || standard)
    .join(', ');
  const title = `${standardDisplay} ${auditPhrase(data.auditType)} 제안서`;
  const quotedAuditDays = costRows.reduce((sum, row) => sum + row.activeAuditDays, 0);
  const auditFeeTotal = costRows.reduce((sum, row) => sum + row.activeAuditFee, 0);
  const hasExpenses = data.expenses > 0;
  const quoteSubtotal = auditFeeTotal + (hasExpenses ? data.expenses : 0) + data.certFee;
  const discountedTotal = Math.max(quoteSubtotal - data.discount, 0);
  const uniqueDayRates = [...new Set(costRows.map((row) => row.dayRate))];
  const dayRateNote = uniqueDayRates.length === 1 ? `: ${formatWon(uniqueDayRates[0])}/일` : ': 규격별 입력 단가 적용';

  const updates: Record<number, string> = {};
  const setRange = (start: number, end: number, value: string) => {
    updates[start] = value;
    for (let i = start + 1; i <= end; i += 1) updates[i] = '';
  };

  setRange(0, 0, data.companyName || '고객사명');
  setRange(1, 1, data.companyName || '고객사명');
  setRange(2, 9, title);
  setRange(10, 17, title);
  setRange(18, 19, data.docId || 'OPP-0000000');
  setRange(20, 29, formatKoreanDate(data.issueDate));

  setRange(71, 78, `${standardDisplay} (UKAS)`);
  setRange(81, 85, data.scope || '경영시스템 인증심사');
  setRange(91, 91, data.siteName || '본사');
  setRange(92, 96, data.siteAddress || '-');
  setRange(97, 98, `${data.employeeCount || '0'}명`);

  setRange(120, 121, formatWon(data.certFee));
  setRange(177, 181, `${formatDays(quotedAuditDays)}일`);
  setRange(182, 186, formatWon(discountedTotal));
  setRange(188, 189, hasExpenses ? `VAT ${data.vatType}` : `제경비/VAT ${data.vatType}`);
  setRange(192, 194, dayRateNote);
  setRange(197, 197, data.vatType === '포함'
    ? '상기 비용은 부가세(VAT)가 포함된 금액입니다.'
    : '상기 비용은 부가세(VAT)가 별도이며, 해당되는 세금정책에 따라 부과됩니다.');
  setRange(206, 208, data.paymentTerms || '송장 일자로부터 30일 이내 현금으로 지급되어야 합니다.');
  setRange(218, 218, data.validity || '1개월');
  setRange(234, 234, data.companyName || '고객');
  setRange(236, 236, data.companyName || '고객');

  let patchedXml = patchTextNodes(documentFile.asText(), updates);
  patchedXml = patchFutureAuditHeader(patchedXml, data.auditType);
  patchedXml = replaceCostRows(patchedXml, costRows, data);
  patchedXml = boldTotalRow(patchedXml);
  zip.file('word/document.xml', patchedXml);

  const output = zip.generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const standardFileLabel = safeFilePart(selectedStandards.join('_'));
  const companyFileLabel = safeFilePart(data.companyName || '고객사');
  const fileName = `LRQA_심사 견적서_${standardFileLabel} 심사 견적서_${companyFileLabel}_${formatYmd(data.issueDate)}.docx`;
  saveAs(output, fileName);
  return { blob: output, fileName };
};