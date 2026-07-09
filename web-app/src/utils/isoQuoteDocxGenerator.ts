export interface IsoQuoteDocxData {
  companyName: string;
  contactPerson: string;
  docId: string;
  issueDate: string;
  auditType: string;
  standards: string[];
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

const isRenewalQuote = (auditType: string) => auditType.includes('갱신');
const isSurveillanceQuote = (auditType: string) => auditType.includes('사후');
const isCurrentCycleQuote = (auditType: string) => isRenewalQuote(auditType) || isSurveillanceQuote(auditType);

const auditPhrase = (auditType: string) => {
  if (isRenewalQuote(auditType)) return '갱신 심사';
  if (auditType.includes('전환') || auditType.includes('인수')) return '인수인증 심사';
  if (auditType.includes('범위')) return '범위 확장 심사';
  if (isSurveillanceQuote(auditType)) return '사후관리 심사';
  return '최초 심사';
};

const REMOVE_ROW_MARKER = '__LRQA_REMOVE_TABLE_ROW__';

const removeMarkedRows = (xml: string) =>
  xml.replace(/<w:tr[\s\S]*?<\/w:tr>/g, (row) => (row.includes(REMOVE_ROW_MARKER) ? '' : row));

const patchTextNodes = (xml: string, updates: Record<number, string>) => {
  let index = 0;
  return xml.replace(/<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t>/g, (full, attrs = '') => {
    const currentIndex = index;
    index += 1;
    if (!Object.prototype.hasOwnProperty.call(updates, currentIndex)) return full;
    return `<w:t${attrs}>${escapeXml(updates[currentIndex] ?? '')}</w:t>`;
  });
};

const getBinaryContent = async (path: string, PizZipUtils: { getBinaryContent: (path: string, callback: (error: Error | null, content: string) => void) => void }) =>
  new Promise<string>((resolve, reject) => {
    PizZipUtils.getBinaryContent(path, (error: Error | null, content: string) => {
      if (error) reject(error);
      else resolve(content);
    });
  });

export const generateIsoQuoteDocx = async (data: IsoQuoteDocxData) => {
  if (typeof window === 'undefined') return;

  const [{ default: PizZip }, { default: PizZipUtils }, { saveAs }] = await Promise.all([
    import('pizzip'),
    import('pizzip/utils/index.js'),
    import('file-saver'),
  ]);

  const content = await getBinaryContent(TEMPLATE_PATH, PizZipUtils);
  const zip = new PizZip(content);
  const documentFile = zip.file('word/document.xml');
  if (!documentFile) throw new Error('word/document.xml not found in ISO quote template');

  const standardDisplay = (data.standards.length ? data.standards : ['ISO 9001'])
    .map((standard) => STANDARD_VERSION[standard] || standard)
    .join(', ');
  const title = `${standardDisplay} ${auditPhrase(data.auditType)} 제안서`;
  const stage1Fee = data.stage1Days * data.dayRate;
  const stage2Fee = data.stage2Days * data.dayRate;
  const initialAuditFee = stage1Fee + stage2Fee;
  const annualSurveillanceFee = data.surveillanceDays * data.dayRate;
  const recertificationFee = data.recertDays * data.dayRate;
  const currentCycleQuote = isCurrentCycleQuote(data.auditType);
  const currentCycleDays = isRenewalQuote(data.auditType) ? data.recertDays : data.surveillanceDays;
  const currentCycleFee = isRenewalQuote(data.auditType) ? recertificationFee : annualSurveillanceFee;
  const quotedAuditDays = currentCycleQuote ? currentCycleDays : data.stage1Days + data.stage2Days;
  const quoteSubtotal = (currentCycleQuote ? currentCycleFee : initialAuditFee) + data.expenses + data.certFee;
  const discountedTotal = Math.max(quoteSubtotal - data.discount, 0);

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
  if (currentCycleQuote) {
    setRange(123, 123, REMOVE_ROW_MARKER);
    setRange(148, 148, `${standardDisplay} ${auditPhrase(data.auditType)}`);
    setRange(150, 156, `${formatDays(currentCycleDays)}일`);
    setRange(157, 164, formatWon(currentCycleFee));
    setRange(165, 168, '-');
    setRange(169, 169, isRenewalQuote(data.auditType) ? '3년 주기 갱신' : '12개월 주기');
  } else {
    setRange(123, 123, `${standardDisplay} ${auditPhrase(data.auditType)}`);
    setRange(125, 128, `${formatDays(data.stage1Days)}일`);
    setRange(130, 133, `${formatDays(data.stage2Days)}일`);
    setRange(134, 138, formatWon(stage1Fee));
    setRange(139, 142, formatWon(stage2Fee));
    setRange(143, 146, `${formatDays(data.surveillanceDays)}일`);
    setRange(148, 148, REMOVE_ROW_MARKER);
  }
  setRange(177, 181, `${formatDays(quotedAuditDays)}일`);
  setRange(182, 186, formatWon(discountedTotal));
  setRange(188, 189, `제경비 ${formatWon(data.expenses)} / VAT ${data.vatType}`);
  setRange(192, 194, `: ${formatWon(data.dayRate)}/일`);
  setRange(197, 197, data.vatType === '포함'
    ? '상기 비용은 부가세(VAT)가 포함된 금액입니다.'
    : '상기 비용은 부가세(VAT)가 별도이며, 해당되는 세금정책에 따라 부과됩니다.');
  setRange(206, 208, data.paymentTerms || '일자로부터 30일 이내 현금으로 지급되어야 합니다.');
  setRange(218, 218, data.validity || '1개월');
  setRange(234, 234, data.companyName || '고객');
  setRange(236, 236, data.companyName || '고객');

  const patchedXml = removeMarkedRows(patchTextNodes(documentFile.asText(), updates));
  zip.file('word/document.xml', patchedXml);

  const output = zip.generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const standardFileLabel = safeFilePart((data.standards.length ? data.standards : ['ISO']).join('_'));
  const companyFileLabel = safeFilePart(data.companyName || '고객사');
  const fileName = `LRQA_심사 견적서_${standardFileLabel} 심사 견적서_${companyFileLabel}_${formatYmd(data.issueDate)}.docx`;
  saveAs(output, fileName);
};