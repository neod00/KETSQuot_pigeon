import type { IsoQuoteDocxData, IsoStandardCostData } from './isoQuoteDocxGenerator';

export interface IsoContractDocxData extends IsoQuoteDocxData {
  signerTitle: string;
  customerPhone: string;
  customerEmail: string;
  postalCode: string;
  businessRegistrationNumber: string;
  billingAddress: string;
}

const TEMPLATE_PATH = '/templates/SEO_Assessment_Contract_Kor_회사명.docx';

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
const formatDays = (value: number) => (Number.isFinite(value) ? value : 0).toFixed(1);

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

const isRenewal = (auditType: string) => auditType.includes('갱신');
const isSurveillance = (auditType: string) => auditType.includes('사후');
const isCurrentCycle = (auditType: string) => isRenewal(auditType) || isSurveillance(auditType);

const auditPhrase = (auditType: string) => {
  if (isRenewal(auditType)) return '갱신 심사';
  if (auditType.includes('전환') || auditType.includes('인수')) return '인수인증 심사';
  if (auditType.includes('범위')) return '범위 확장 심사';
  if (isSurveillance(auditType)) return '사후관리 심사';
  return '최초 심사';
};

const getBinaryContent = async (
  path: string,
  PizZipUtils: { getBinaryContent: (path: string, callback: (error: Error | null, content: string) => void) => void },
) => new Promise<string>((resolve, reject) => {
  PizZipUtils.getBinaryContent(path, (error: Error | null, content: string) => {
    if (error) reject(error);
    else resolve(content);
  });
});

const normalizeStandardCosts = (data: IsoContractDocxData): IsoStandardCostData[] => {
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

const toCostRows = (data: IsoContractDocxData) => {
  const currentCycle = isCurrentCycle(data.auditType);
  const renewal = isRenewal(data.auditType);
  return normalizeStandardCosts(data).map((input) => {
    const stage1Fee = input.stage1Days * input.dayRate;
    const stage2Fee = input.stage2Days * input.dayRate;
    const activeAuditDays = currentCycle
      ? (renewal ? input.recertDays : input.surveillanceDays)
      : input.stage1Days + input.stage2Days;
    const activeAuditFee = currentCycle ? activeAuditDays * input.dayRate : stage1Fee + stage2Fee;
    return { ...input, stage1Fee, stage2Fee, activeAuditDays, activeAuditFee };
  });
};

type CostRow = ReturnType<typeof toCostRows>[number];

interface XmlElementRange {
  xml: string;
  start: number;
  end: number;
  depth: number;
}

const collectElements = (xml: string, tagName: string): XmlElementRange[] => {
  const tagPattern = new RegExp('<\\/?' + tagName + '(?:\\s[^>]*)?>', 'g');
  const stack: number[] = [];
  const elements: XmlElementRange[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(xml)) !== null) {
    if (!match[0].startsWith('</')) {
      stack.push(match.index);
      continue;
    }

    const start = stack.pop();
    if (start === undefined) continue;
    const end = match.index + match[0].length;
    elements.push({ xml: xml.slice(start, end), start, end, depth: stack.length + 1 });
  }

  return elements.sort((a, b) => a.start - b.start);
};

const collectRows = (xml: string) => collectElements(xml, 'w:tr');

const getText = (xml: string) =>
  [...xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
    .map((match) => match[1].replace(/<[^>]+>/g, ''))
    .join('');

const replaceTokenInTextNodes = (xml: string, token: string, value: string) => {
  let next = xml;

  for (let pass = 0; pass < 100; pass += 1) {
    const nodes = [...next.matchAll(/<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((match) => ({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
      attrs: match[1] || '',
      text: match[2],
    }));
    const joined = nodes.map((node) => node.text).join('');
    const tokenStart = joined.indexOf(token);
    if (tokenStart < 0) return next;

    const tokenEnd = tokenStart + token.length;
    let cursor = 0;
    let startNode = -1;
    let endNode = -1;
    let startOffset = 0;
    let endOffset = 0;

    nodes.forEach((node, index) => {
      const nodeEnd = cursor + node.text.length;
      if (startNode < 0 && tokenStart >= cursor && tokenStart < nodeEnd) {
        startNode = index;
        startOffset = tokenStart - cursor;
      }
      if (endNode < 0 && tokenEnd > cursor && tokenEnd <= nodeEnd) {
        endNode = index;
        endOffset = tokenEnd - cursor;
      }
      cursor = nodeEnd;
    });

    if (startNode < 0 || endNode < 0) return next;
    const patches: Array<{ start: number; end: number; replacement: string }> = [];
    for (let index = startNode; index <= endNode; index += 1) {
      const node = nodes[index];
      const before = index === startNode ? node.text.slice(0, startOffset) : '';
      const after = index === endNode ? node.text.slice(endOffset) : '';
      const content = index === startNode ? before + escapeXml(value) + after : after;
      patches.push({
        start: node.start,
        end: node.end,
        replacement: '<w:t' + node.attrs + '>' + content + '</w:t>',
      });
    }

    next = patches.sort((a, b) => b.start - a.start).reduce(
      (current, patch) => current.slice(0, patch.start) + patch.replacement + current.slice(patch.end),
      next,
    );
  }

  return next;
};

const setTextNodes = (xml: string, value: string) => {
  let used = false;
  const replaced = xml.replace(/<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t>/g, (_full, attrs = '') => {
    if (used) return '<w:t' + attrs + '></w:t>';
    used = true;
    return '<w:t' + attrs + '>' + escapeXml(value) + '</w:t>';
  });
  if (used) return replaced;
  return replaced.replace(/<w:p([^>]*)>/, '<w:p$1><w:r><w:t xml:space="preserve">' + escapeXml(value) + '</w:t></w:r>');
};

const getCells = (rowXml: string) =>
  collectElements(rowXml, 'w:tc').filter((cell) => cell.depth === 1);

const setCell = (rowXml: string, cellIndex: number, value: string) => {
  const cell = getCells(rowXml)[cellIndex];
  if (!cell) return rowXml;
  return rowXml.slice(0, cell.start) + setTextNodes(cell.xml, value) + rowXml.slice(cell.end);
};

const replaceParagraph = (xml: string, needle: string, value: string) =>
  xml.replace(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g, (paragraphXml) =>
    getText(paragraphXml).includes(needle) ? setTextNodes(paragraphXml, value) : paragraphXml);

const applyCellUpdates = (rowXml: string, updates: Record<number, string>) =>
  Object.entries(updates).reduce(
    (next, [cellIndex, value]) => setCell(next, Number(cellIndex), value),
    rowXml,
  );

const replaceMatchingRows = (
  xml: string,
  predicate: (rowXml: string) => boolean,
  transform: (rowXml: string) => string,
) => {
  const patches = collectRows(xml)
    .filter((row) => predicate(row.xml))
    .map((row) => ({ ...row, replacement: transform(row.xml) }))
    .sort((a, b) => b.start - a.start);

  return patches.reduce(
    (next, patch) => next.slice(0, patch.start) + patch.replacement + next.slice(patch.end),
    xml,
  );
};

const patchRowContaining = (xml: string, needle: string, updates: Record<number, string>) =>
  replaceMatchingRows(xml, (rowXml) => getText(rowXml).includes(needle), (rowXml) => applyCellUpdates(rowXml, updates));

const hasExactFirstCell = (rowXml: string, label: string) => {
  const firstCell = getCells(rowXml)[0];
  return Boolean(firstCell && getText(firstCell.xml).trim() === label);
};

const patchRowExact = (xml: string, label: string, updates: Record<number, string>) =>
  replaceMatchingRows(xml, (rowXml) => hasExactFirstCell(rowXml, label), (rowXml) => applyCellUpdates(rowXml, updates));

const removeRowExact = (xml: string, label: string) =>
  replaceMatchingRows(xml, (rowXml) => hasExactFirstCell(rowXml, label), () => '');
const buildAuditRow = (templateXml: string, row: CostRow, data: IsoContractDocxData) => {
  const currentCycle = isCurrentCycle(data.auditType);
  const label = `${STANDARD_VERSION[row.standard] || row.standard} ${auditPhrase(data.auditType)}`;
  let next = setCell(templateXml, 0, label);
  if (currentCycle) {
    next = setCell(next, 1, `${formatDays(row.activeAuditDays)}일`);
    next = setCell(next, 2, formatWon(row.activeAuditFee));
    next = setCell(next, 3, '-');
    next = setCell(next, 4, isRenewal(data.auditType) ? '3년 주기 갱신' : '12개월 주기');
    return next;
  }
  next = setCell(next, 1, `1단계 심사: ${formatDays(row.stage1Days)}일 / 2단계 심사: ${formatDays(row.stage2Days)}일`);
  next = setCell(next, 2, `${formatWon(row.stage1Fee)} / ${formatWon(row.stage2Fee)}`);
  next = setCell(next, 3, `${formatDays(row.surveillanceDays)}일`);
  return setCell(next, 4, '-');
};

const replaceStandardRows = (xml: string, costRows: CostRow[], data: IsoContractDocxData) => {
  const rows = collectRows(xml);
  const templateRows = rows.filter((row) => {
    const cells = getCells(row.xml);
    return cells.length >= 5 && /^ISO (9001|14001|45001):/.test(getText(cells[0].xml).trim());
  });
  if (templateRows.length < 3) return xml;
  const first = templateRows[0];
  const last = templateRows[templateRows.length - 1];
  const replacements = costRows.map((row, index) => buildAuditRow(templateRows[index % templateRows.length].xml, row, data));
  return xml.slice(0, first.start) + replacements.join('') + xml.slice(last.end);
};

const replaceTemplateTokens = (xml: string, data: IsoContractDocxData, standardDisplay: string) => {
  const replacements: Record<string, string> = {
    '«ACCOUNT NAME»': data.companyName || '고객사명',
    '«PRODUCT _NAME»': standardDisplay,
    '«COMPANY ADDRESS»': data.siteAddress || '-',
    '«ASSESSMENT SCOPE»': data.scope || '경영시스템 인증심사',
    '«NUMBER OF PERSON»': `${data.employeeCount || '0'}명`,
    'YYYY년 MM월 DD일': formatKoreanDate(data.issueDate),
    SEOXXXXXXX: data.docId || 'SEO-0000000',
  };
  return Object.entries(replacements).reduce(
    (next, [token, value]) => replaceTokenInTextNodes(next, token, value),
    xml,
  );
};

export const buildIsoContractDocumentXml = (templateXml: string, data: IsoContractDocxData) => {
  const costRows = toCostRows(data);
  const standardDisplay = costRows.map((row) => STANDARD_VERSION[row.standard] || row.standard).join(', ');
  const totalAuditDays = costRows.reduce((sum, row) => sum + row.activeAuditDays, 0);
  const auditFeeTotal = costRows.reduce((sum, row) => sum + row.activeAuditFee, 0);
  const hasExpenses = data.expenses > 0;
  const total = Math.max(auditFeeTotal + (hasExpenses ? data.expenses : 0) + data.certFee - data.discount, 0);
  const uniqueRates = [...new Set(costRows.map((row) => row.dayRate))];
  const rateNote = uniqueRates.length === 1 ? `${formatWon(uniqueRates[0])}/일` : '규격별 입력 단가 적용';

  let xml = replaceTemplateTokens(templateXml, data, standardDisplay);
  xml = replaceStandardRows(xml, costRows, data);
  xml = patchRowExact(xml, '연간 관리 수수료', { 2: formatWon(data.certFee) });
  xml = patchRowExact(xml, '총합', {
    1: `${formatDays(totalAuditDays)}일`,
    2: formatWon(total),
    3: '-',
    4: hasExpenses ? `VAT ${data.vatType}` : `제경비/VAT ${data.vatType}`,
  });
  xml = hasExpenses
    ? patchRowExact(xml, '제경비/출장비', { 1: '-', 2: formatWon(data.expenses), 3: '-', 4: '-' })
    : removeRowExact(xml, '제경비/출장비');

  xml = xml.split('1,300,000원/일').join(escapeXml(rateNote));
  xml = replaceParagraph(xml, '이 제안은 발행일로부터 90일 동안 유효합니다.', '이 제안은 발행일로부터 ' + (data.validity || '90일') + ' 동안 유효합니다.');
  xml = replaceParagraph(xml, '고객:  ', `고객: ${data.companyName || '고객사명'},`);
  xml = replaceParagraph(xml, '각각 LRQA와', `각각 LRQA와 ${data.companyName || '고객사명'}를 대표하여 권한이 부여된 대표자에 의해 서명됨`);

  xml = patchRowContaining(xml, 'SIGNED by LRQA Korea Limited', { 0: `SIGNED by ${data.companyName || '고객사명'}` });
  xml = patchRowExact(xml, '직책:', { 1: data.signerTitle || '-' });
  xml = patchRowExact(xml, '성명:', { 1: data.contactPerson || '-' });
  xml = patchRowExact(xml, '일자:', { 1: formatKoreanDate(data.issueDate) });

  xml = patchRowContaining(xml, '인보이스에 표시될 회사 이름:', { 0: `인보이스에 표시될 회사 이름: ${data.companyName || '고객사명'}` });
  xml = patchRowExact(xml, '거리', { 1: data.siteAddress || '-', 2: data.billingAddress || '등록 주소와 동일' });
  xml = patchRowExact(xml, '도/시', { 1: data.siteName || '-', 2: '' });
  xml = patchRowExact(xml, '우편 번호', { 1: data.postalCode || '-', 2: '' });
  xml = patchRowExact(xml, '연락할 이름', { 1: data.contactPerson || '-', 2: data.contactPerson || '-' });
  xml = patchRowExact(xml, '직책', { 1: data.signerTitle || '-', 2: data.signerTitle || '-' });
  xml = patchRowExact(xml, '휴대폰 번호', { 1: data.customerPhone || '-', 2: data.customerPhone || '-' });
  xml = patchRowExact(xml, '이메일', { 1: data.customerEmail || '-', 2: data.customerEmail || '-' });
  xml = patchRowExact(xml, '사업자등록번호', { 1: data.businessRegistrationNumber || '-' });
  return xml;
};
export const generateIsoContractDocx = async (data: IsoContractDocxData) => {
  if (typeof window === 'undefined') return;

  const [{ default: PizZip }, { default: PizZipUtils }, { saveAs }] = await Promise.all([
    import('pizzip'),
    import('pizzip/utils/index.js'),
    import('file-saver'),
  ]);

  const content = await getBinaryContent(TEMPLATE_PATH, PizZipUtils);
  const zip = new PizZip(content);
  const documentFile = zip.file('word/document.xml');
  if (!documentFile) throw new Error('word/document.xml not found in ISO contract template');

  const xml = buildIsoContractDocumentXml(documentFile.asText(), data);

  zip.file('word/document.xml', xml);
  const output = zip.generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const fileName = `SEO_Assessment_Contract_Kor_${safeFilePart(data.companyName || '고객사')}_${formatYmd(data.issueDate)}.docx`;
  saveAs(output, fileName);
};
