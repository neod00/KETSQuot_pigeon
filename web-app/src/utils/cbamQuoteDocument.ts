import type { IsoQuoteDocxData } from './isoQuoteDocxGenerator';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const text = (element: Element) => Array.from(element.getElementsByTagNameNS(W, 't')).map(node => node.textContent || '').join('');
const elements = (element: Element, name: string) => Array.from(element.getElementsByTagNameNS(W, name));

function parse(source: string) {
  const xml = new DOMParser().parseFromString(source, 'application/xml');
  if (xml.getElementsByTagName('parsererror').length) throw new Error('CBAM 견적서 서식을 읽을 수 없습니다.');
  return xml;
}

// Change text only: retain runs, namespaces, drawings, AlternateContent and table properties.
function setText(element: Element, value: string) {
  const nodes = elements(element, 't');
  if (!nodes.length) throw new Error('CBAM 견적서의 필수 입력 위치를 찾을 수 없습니다.');
  nodes[0].textContent = value;
  nodes[0].setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
  nodes.slice(1).forEach(node => { node.textContent = ''; });
}

export function buildCbamQuoteDocumentXml(source: string, data: IsoQuoteDocxData) {
  const xml = parse(source);
  // Drawing text boxes contain nested paragraphs and duplicate fallback branches.
  const paragraphs = Array.from(xml.getElementsByTagNameNS(W, 'p')).filter(p => !elements(p, 'p').length);
  const originalText = new Map(paragraphs.map(p => [p, text(p).trim()]));
  const replace = (matches: (value: string) => boolean, value: string) => {
    const targets = paragraphs.filter(p => matches(originalText.get(p)!));
    if (!targets.length) throw new Error('CBAM 견적서 서식이 변경되었습니다. 필수 입력 위치를 확인해 주세요.');
    targets.forEach(p => setText(p, value));
  };
  const [year, month, day] = data.issueDate.split('-').map(Number);
  replace(value => value === '서한ENP', data.companyName);
  replace(value => /^Q-CBAM-/.test(value), data.docId);
  replace(value => /^\d{4}년.*Version/.test(value), `${year}년 ${month}월 ${day}일, Version 1.0`);
  replace(value => value.startsWith('고객 유형:'), data.scope);
  replace(value => value.startsWith('모든 심사비는'), `모든 심사비는 ${data.paymentTerms}`);
  const validity = paragraphs.find(p => text(p).startsWith('본 견적의 유효기간은'));
  if (!validity) throw new Error('CBAM 견적 유효기간 입력 위치를 찾을 수 없습니다.');
  setText(validity, text(validity).replace(/유효기간은\s*\d+일/, `유효기간은 ${data.validity}`));

  const tables = Array.from(xml.getElementsByTagNameNS(W, 'tbl'));
  const siteTable = tables.find(table => text(table).startsWith('사업장명주소인원'));
  const costTable = tables.find(table => text(table).startsWith('비용 항목'));
  if (!siteTable || !costTable) throw new Error('CBAM 견적서의 사업장 또는 비용표를 찾을 수 없습니다.');
  const patchRow = (row: Element, values: string[]) => {
    const cells = elements(row, 'tc');
    if (cells.length !== values.length) throw new Error('CBAM 견적서 표 구조가 변경되었습니다.');
    cells.forEach((cell, index) => setText(cell, values[index]));
  };
  const siteRow = elements(siteTable, 'tr')[1];
  if (!siteRow) throw new Error('CBAM 견적서의 사업장 행을 찾을 수 없습니다.');
  patchRow(siteRow, [data.siteName || data.companyName, data.siteAddress || '-', data.employeeCount === '-' ? '-' : `${data.employeeCount}명`]);

  const days = data.stage1Days + data.stage2Days;
  const fee = days * data.dayRate;
  const subtotal = fee + data.expenses;
  const final = Math.max(subtotal - data.discount, 0);
  const won = (amount: number) => `${Math.round(amount).toLocaleString('ko-KR')}원`;
  const rows = elements(costTable, 'tr');
  const updateCost = (label: string, values: string[]) => {
    const row = rows.find(row => text(elements(row, 'tc')[0]).trim() === label);
    if (!row) throw new Error(`CBAM 견적서의 ${label} 행을 찾을 수 없습니다.`);
    patchRow(row, values);
    return row;
  };
  updateCost('CBAM 제3자 검증 서비스', [data.serviceLabel || 'CBAM 제3자 검증 서비스', `${days.toFixed(1)}일`, won(fee), '-']);
  updateCost('제경비/출장비', ['제경비/출장비', '-', won(data.expenses), '-']);
  updateCost('총 합', ['총 합', `${days.toFixed(1)}일`, won(subtotal), `VAT ${data.vatType}`]);
  const discountRow = updateCost('총 합(특별 할인적용)', ['총 합(특별 할인적용)', `${days.toFixed(1)}일`, won(final), `VAT ${data.vatType}`]);
  if (data.discount === 0) discountRow.parentNode?.removeChild(discountRow);
  return new XMLSerializer().serializeToString(xml);
}

export type CbamQuoteBlock = { type: 'paragraph'; text: string } | { type: 'table'; rows: string[][] };

// Read the populated Word body, so the preview and print cannot drift into a second form.
export function cbamQuotePreviewBlocks(source: string): CbamQuoteBlock[] {
  const xml = parse(source);
  const body = xml.getElementsByTagNameNS(W, 'body')[0];
  if (!body) throw new Error('CBAM 견적서 본문을 찾을 수 없습니다.');
  const blocks: CbamQuoteBlock[] = [];
  let started = false;
  for (const node of Array.from(body.childNodes)) {
    if (node.nodeType !== 1) continue;
    const element = node as Element;
    const value = text(element).trim();
    if (!started) {
      if (element.localName === 'p' && value === '인증 심사 제안 내용') started = true;
      continue;
    }
    if (elements(element, 'drawing').length || elements(element, 'pict').length) break;
    if (element.localName === 'tbl') {
      blocks.push({ type: 'table', rows: elements(element, 'tr').map(row => elements(row, 'tc').map(cell => text(cell).trim())) });
    } else if (element.localName === 'p' && value) {
      blocks.push({ type: 'paragraph', text: value });
    }
  }
  if (blocks.filter(block => block.type === 'table').length !== 2) throw new Error('Word 견적서의 미리보기 내용을 찾을 수 없습니다.');
  return blocks;
}

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function buildCbamQuotePreviewHtml(source: string, data: IsoQuoteDocxData) {
  const blocks = cbamQuotePreviewBlocks(source);
  const content = blocks.map(block => {
    if (block.type === 'paragraph') {
      const heading = /^\d+\. /.test(block.text);
      return `<${heading ? 'h2' : 'p'}>${escapeHtml(block.text)}</${heading ? 'h2' : 'p'}>`;
    }
    const [header, ...rows] = block.rows;
    return `<table><thead><tr>${header.map(cell => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr${row[0].startsWith('총 합') ? ' class="total"' : ''}>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }).join('');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escapeHtml(data.companyName)} CBAM 검증 견적서</title><style>
    *{box-sizing:border-box}html,body{margin:0;background:#fff;color:#161b28;font-family:Arial,"Malgun Gothic",sans-serif;font-size:10pt;line-height:1.65}
    main{padding:14mm 16mm}header{margin-bottom:7mm}header img{width:25mm;height:auto;background:#10152f;padding:2mm}h1{font-size:20pt;line-height:1.4;margin:5mm 0 3mm}header p{margin:1mm 0}header small{color:#526071}
    h2{font-size:12pt;margin:6mm 0 2mm;break-after:avoid}p{margin:2mm 0;white-space:pre-wrap;overflow-wrap:anywhere;orphans:3;widows:3}
    table{width:100%;border-collapse:collapse;margin:3mm 0;table-layout:fixed;font-size:9pt}th,td{border:.5pt solid #616a7b;padding:2mm;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}th{background:#e9e8f0;font-weight:700}th:first-child{width:31%}.total{font-weight:700;background:#f4f3f7}tr{break-inside:avoid}thead{display:table-header-group}footer{margin-top:8mm;font-size:8pt;color:#526071}
    @media(max-width:600px){main{padding:6mm}h1{font-size:16pt}table{font-size:8pt}}
    @media print{@page{size:A4;margin:16mm}main{padding:0}html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><main><header><img src="/lrqa-logo.png" alt="LRQA"><h1>${escapeHtml(data.documentTitle || 'CBAM 검증 서비스 제안서')}</h1><p><strong>${escapeHtml(data.companyName)}</strong> ${escapeHtml(data.contactPerson)} 귀하</p><small>${escapeHtml(data.docId)} · ${escapeHtml(data.issueDate)}</small></header>${content}<footer>로이드인증원 · LRQA · lrqa.com</footer></main></body></html>`;
}
