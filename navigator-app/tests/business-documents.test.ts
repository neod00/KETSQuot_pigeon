import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { PDFDocument } from 'pdf-lib';
import { readFile } from 'node:fs/promises';
import { businessDocumentData, EMPTY_REPORT_DETAILS } from '../src/lib/business-document-data';
import { buildBusinessWorkbook } from '../src/lib/business-workbook';
import { buildBusinessReport } from '../src/lib/business-report';
import { QUESTIONS } from '../src/shared/cbam-navigator';
import type { Draft } from '../src/components/NavigatorContext';

const draft: Draft = { sessionId: '', startedAt: '', productName: '=HYPERLINK("test")', cnCode: '73181590', sector: '철강', searchedCnCodes: [], productionProcesses: '', productionRoute: '', precursors: '', country: '', sites: '시험 사업장', euExport: '', importer: '', mass: '', allImports: false, readinessIndex: 0, answers: { S1: 'ready' }, evidence: { S1: 'ready', R1: 'not_applicable' } };
test('unfinished diagnosis is incomplete and requests follow answers despite legacy evidence records', () => {
  const data = businessDocumentData(draft, EMPTY_REPORT_DETAILS, new Date('2026-10-02T16:00:00Z'));
  assert.equal(data.date, '2026-10-03'); assert.equal(data.scoreLabel, '진단 미완료');
  assert.equal(data.rows.length, 24); assert.equal(data.actions.length, 23);
  assert.ok(!data.actions.some(a => a.id === 'S1'));
  assert.ok(data.actions.some(a => a.id === 'R1'));
  assert.equal(data.readyAnswers, 1);
  assert.ok(data.rows.every(row => !('status' in row)));
});
test('editing diagnosis answers updates report and request lists without editing evidence states', () => {
  const answers = Object.fromEntries(QUESTIONS.map(q => [q.id, 'ready' as const]));
  const complete = businessDocumentData({ ...draft, answers }, EMPTY_REPORT_DETAILS);
  assert.equal(complete.scoreLabel, '100%'); assert.equal(complete.actions.length, 0); assert.equal(complete.readyAnswers, 24);
  const changed = businessDocumentData({ ...draft, answers: { ...answers, R3: 'missing', S1: 'partial' } }, EMPTY_REPORT_DETAILS);
  assert.equal(changed.actions.length, 2); assert.equal(changed.readyAnswers, 22);
  assert.deepEqual(new Set(changed.actions.map(a => a.id)), new Set(['S1', 'R3']));
  assert.equal(changed.rows.find(row => row.id === 'S1')?.answer, '일부 준비');
});
test('workbook keeps untrusted text literal, provides editable workflow controls and all diagnosis rows', async () => {
  const bytes = await buildBusinessWorkbook(businessDocumentData(draft, { ...EMPTY_REPORT_DETAILS, deadline: '2026-10-20' }));
  const wb = new ExcelJS.Workbook(); await wb.xlsx.load(bytes.buffer as Parameters<typeof wb.xlsx.load>[0]);
  assert.deepEqual(wb.worksheets.map(s => s.name), ['보고 요약', '자료 협조요청', '전체 진단·자료']);
  assert.ok(String(wb.getWorksheet('보고 요약')!.getCell('A3').value).includes(draft.productName));
  assert.equal(wb.getWorksheet('자료 협조요청')!.getCell('I9').dataValidation.type, 'list');
  assert.equal(wb.getWorksheet('자료 협조요청')!.getCell('H9').value instanceof Date, true);
  assert.equal(wb.getWorksheet('전체 진단·자료')!.rowCount, 31);
  assert.equal(wb.getWorksheet('전체 진단·자료')!.getCell('A31').value, 'V4');
  assert.equal(wb.getWorksheet('전체 진단·자료')!.getCell('G7').value, '자료 예시');
  assert.equal(wb.getWorksheet('전체 진단·자료')!.getCell('E8').value, '준비됨');
  assert.ok(!JSON.stringify(wb.model).includes('자료 확보상태'));
  assert.equal(wb.getWorksheet('자료 협조요청')!.pageSetup.fitToWidth, 1);
});
test('PDF generates for complete, blank and long metadata; Korean font is embedded', async () => {
  const font = new Uint8Array(await readFile('public/fonts/NotoSansKR-Regular.ttf'));
  for (const answers of [{}, Object.fromEntries(QUESTIONS.map(q => [q.id, 'ready' as const]))]) {
    const bytes = await buildBusinessReport(businessDocumentData({ ...draft, answers }, { ...EMPTY_REPORT_DETAILS, company: '긴 회사명 '.repeat(20), decisionRequest: '자료 확보 협조를 요청합니다.\n'.repeat(75) }), font);
    const pdf = await PDFDocument.load(bytes); assert.ok(pdf.getPageCount() > 3);
    assert.equal(pdf.getTitle(), 'CBAM 검증 준비현황 보고서');
    for (const page of pdf.getPages()) assert.equal(Math.round(page.getWidth()), 595);
  }
});
