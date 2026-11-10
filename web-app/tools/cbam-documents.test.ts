import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import PizZip from 'pizzip';
import { DOMParser as XmlDomParser, XMLSerializer as XmlSerializer } from '@xmldom/xmldom';
import { buildIsoQuoteDocumentXml, type IsoQuoteDocxData } from '../src/utils/isoQuoteDocxGenerator';
import { buildCbamQuotePreviewHtml, cbamQuotePreviewBlocks } from '../src/utils/cbamQuoteDocument';

Object.assign(globalThis, { DOMParser: XmlDomParser, XMLSerializer: XmlSerializer });
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const template = new PizZip(readFileSync('public/templates/LRQA_CBAM_Quote_Template.docx')).file('word/document.xml')!.asText();
const data: IsoQuoteDocxData = {
  companyName: '현대아이에프씨 & <검증>', contactPerson: '유찬호', docId: 'Q-CBAM-261029-TEST', issueDate: '2026-10-29', auditType: 'CBAM 검증', standards: ['CBAM'],
  scope: '고객 유형: 제3국 제조사업자 / 대상 연도: 2026 / CBAM 상품: 철강 / CN 코드: 7308 90 98 / 검증 대상: 제1공장 & 제2공장',
  siteName: '제1공장 & 제2공장', siteAddress: '서울 <본사> & 경주', employeeCount: '-', stage1Days: 3, stage2Days: 0, surveillanceDays: 0, recertDays: 0,
  dayRate: 1300000, expenses: 600000, certFee: 0, discount: 100000, vatType: '별도', contractYears: '단일 검증 업무',
  paymentTerms: '송장 일자로부터 45일 이내 지급되어야 합니다.', validity: '45일', documentTitle: 'CBAM 검증 서비스 제안서',
  serviceLabel: 'P1173 CBAM 검증 서비스', templatePath: '/templates/LRQA_CBAM_Quote_Template.docx',
};
const parse = (source: string) => new XmlDomParser({ onError: level => { if (level !== 'warning') throw new Error('Invalid XML'); } }).parseFromString(source, 'application/xml');
const content = (source: string) => Array.from(parse(source).getElementsByTagNameNS(W, 't')).map(t => t.textContent).join('');

test('CBAM quote fills company in both drawing branches, scope, site, reference, date and all prices', () => {
  const source = buildIsoQuoteDocumentXml(template, data);
  const value = content(source);
  for (const expected of [data.companyName, data.scope, data.siteName, data.siteAddress, data.docId, '2026년 10월 29일', '3.0일', '3,900,000원', '600,000원', '4,500,000원', '4,400,000원', '유효기간은 45일', data.paymentTerms]) assert.ok(value.includes(expected), expected);
  for (const stale of ['서한ENP', '용명공단길', 'Q-CBAM-260825', '11,200,000원', '9,900,000원', '2026년 8월 25일', '-명']) assert.ok(!value.includes(stale), stale);
  assert.equal(value.split(data.companyName).length - 1, 2);
  const before = parse(template), after = parse(source);
  for (const tag of ['p', 'r', 't', 'drawing', 'pict', 'tbl', 'tr', 'tc', 'sectPr']) assert.equal(after.getElementsByTagNameNS(W, tag).length, before.getElementsByTagNameNS(W, tag).length, tag);
  for (const xml of [before, after]) for (const node of Array.from(xml.getElementsByTagNameNS(W, 't'))) { node.textContent = ''; node.removeAttributeNS('http://www.w3.org/XML/1998/namespace', 'space'); }
  assert.equal(new XmlSerializer().serializeToString(after), new XmlSerializer().serializeToString(before));
});

test('zero expenses are retained and no-discount quotes omit the sample special-discount row', () => {
  const source = buildIsoQuoteDocumentXml(template, { ...data, discount: 0, expenses: 0, vatType: '포함' });
  const blocks = cbamQuotePreviewBlocks(source);
  const table = blocks.filter(block => block.type === 'table')[1];
  assert.equal(table.type, 'table');
  assert.deepEqual(table.rows.find(row => row[0] === '제경비/출장비'), ['제경비/출장비', '-', '0원', '-']);
  assert.deepEqual(table.rows.find(row => row[0] === '총 합'), ['총 합', '3.0일', '3,900,000원', 'VAT 포함']);
  assert.equal(table.rows.some(row => row[0].includes('할인')), false);
});

test('preview reads all six sections and both tables from the populated Word document', () => {
  const source = buildIsoQuoteDocumentXml(template, data);
  const blocks = cbamQuotePreviewBlocks(source);
  assert.equal(blocks.filter(block => block.type === 'table').length, 2);
  const headings = blocks.filter(block => block.type === 'paragraph' && /^\d+\. /.test(block.text));
  assert.equal(headings.length, 6);
  const html = buildCbamQuotePreviewHtml(source, data);
  assert.ok(html.includes('현대아이에프씨 &amp; &lt;검증&gt;'));
  assert.ok(html.includes('서울 &lt;본사&gt; &amp; 경주'));
  assert.ok(html.includes('4,400,000원'));
  assert.ok(!html.includes('서한ENP'));
  assert.ok(!html.includes('주요 산정근거'));
  assert.ok(!html.includes('LRQA 회사 소개'));
});

test('user text resembling template anchors is inserted literally without a second substitution', () => {
  const companyName = '고객 유형: <img src=x onerror=alert(1)> & Q-CBAM-';
  const source = buildIsoQuoteDocumentXml(template, { ...data, companyName });
  assert.equal(content(source).split(companyName).length - 1, 2);
  assert.ok(!buildCbamQuotePreviewHtml(source, { ...data, companyName }).includes('<img src=x'));
});

test('unexpected templates fail instead of downloading unchanged example data', () => {
  assert.throws(() => buildIsoQuoteDocumentXml(template.replaceAll('서한ENP', 'changed'), data), /서식이 변경/);
});

test('generic ISO quotation generation still fills its original template', () => {
  const isoTemplate = new PizZip(readFileSync('public/templates/LRQA_ISO_Audit_Quote_Template.docx')).file('word/document.xml')!.asText();
  const source = buildIsoQuoteDocumentXml(isoTemplate, { ...data, templatePath: undefined, standards: ['ISO 9001'], auditType: '최초' });
  assert.ok(content(source).includes(data.companyName));
  assert.ok(content(source).includes(data.docId));
});
