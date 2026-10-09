import ExcelJS from 'exceljs';
import type { BusinessDocumentData } from './business-document-data';
import { READINESS_NOTICE } from '@/shared/cbam-navigator';

const NAVY = '101330', MINT = '0FF2B2', INK = '26314A', PALE = 'F2F5F9', AMBER = 'FFF4D6';
export async function buildBusinessWorkbook(data: BusinessDocumentData) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'LRQA CBAM Navigator'; wb.created = new Date(`${data.date}T00:00:00+09:00`);
  wb.calcProperties.fullCalcOnLoad = true;
  function base(name: string, widths: number[], landscape = false) {
    const s = wb.addWorksheet(name, { properties: { defaultRowHeight: 23 }, views: [{ showGridLines: false }], pageSetup: { paperSize: 9, orientation: landscape ? 'landscape' : 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: .3, right: .3, top: .45, bottom: .45, header: .2, footer: .2 } } });
    s.columns = widths.map(width => ({ width }));
    s.headerFooter.oddFooter = '&LLRQA CBAM Navigator&C내부 업무용&R&P / &N';
    return s;
  }
  function line(s: ExcelJS.Worksheet, row: number, text: string, end: number, size = 11, fill?: string) {
    s.mergeCells(row, 1, row, end); const c = s.getCell(row, 1); c.value = text;
    c.font = { name: '맑은 고딕', size, color: { argb: INK }, bold: size > 11 };
    c.alignment = { vertical: 'middle', wrapText: true };
    if (fill) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    s.getRow(row).height = size > 11 ? 34 : Math.max(25, Math.ceil(text.length / (end * 12)) * 17 + 10);
  }
  function title(s: ExcelJS.Worksheet, title: string, cols: number) {
    line(s, 1, 'LRQA CBAM Navigator', cols, 12); line(s, 2, title, cols, 20);
    s.getCell(2, 1).border = { bottom: { style: 'medium', color: { argb: MINT } } };
    line(s, 3, `${data.details.company || '회사명 미입력'} / ${data.draft.productName || '제품 미입력'} / 작성일 ${data.date}`, cols);
  }
  function table(s: ExcelJS.Worksheet, headers: string[], records: (string | number | Date | null)[][], row: number, name: string, heights: number[]) {
    s.addTable({ name, ref: `A${row}`, headerRow: true, style: { theme: 'TableStyleMedium2', showRowStripes: true }, columns: headers.map(name => ({ name, filterButton: true })), rows: records });
    s.getRow(row).height = 30;
    s.getRow(row).eachCell(c => { c.font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; c.alignment = { vertical: 'middle', wrapText: true }; });
    records.forEach((_, i) => {
      const r = s.getRow(row + i + 1); r.height = heights[i] || 65;
      r.eachCell({ includeEmpty: true }, c => { c.font = { name: '맑은 고딕', size: 10, color: { argb: INK } }; c.alignment = { vertical: 'top', wrapText: true }; c.border = { bottom: { style: 'hair', color: { argb: 'DFE5ED' } } }; });
    });
    s.views = [{ showGridLines: false, state: 'frozen', xSplit: 2, ySplit: row }];
    s.pageSetup.printTitlesRow = `${row}:${row}`; s.pageSetup.printArea = `A1:${s.getColumn(headers.length).letter}${row + records.length}`;
  }
  const summary = base('보고 요약', [18, 24, 24, 24]); title(summary, 'CBAM 검증 준비현황', 4);
  const info = [['보고자', data.details.author || '미입력'], ['보고 대상', data.details.recipient || '미입력'], ['대상기간', data.details.reportingPeriod || '미입력'], ['CN 코드', data.draft.cnCode || '미입력'], ['사업장', data.draft.sites || '미입력'], ['회신 요청기한', data.details.deadline || '미지정']];
  info.forEach(([label, value], i) => { summary.getCell(i + 5, 1).value = label; summary.mergeCells(i + 5, 2, i + 5, 4); summary.getCell(i + 5, 2).value = value; summary.getCell(i + 5, 2).alignment = { wrapText: true, vertical: 'middle' }; summary.getRow(i + 5).height = Math.max(26, Math.ceil(value.length / 45) * 17 + 10); });
  line(summary, 12, `자가진단: ${data.scoreLabel} (${data.scored.answered}/24 응답) / 준비됨 응답: ${data.readyAnswers}개 / 추가 준비·미응답: ${data.actions.length}개`, 4, 11, PALE);
  table(summary, ['진단 영역', '응답 수', '자가진단 준비도', '비고'], data.categories.map(c => [c.label, c.answered, c.answered === 4 ? c.score / 100 : null, c.answered === 4 ? '자가진단 기준' : '진단 미완료']), 14, 'CategorySummary', data.categories.map(() => 30));
  summary.views = [{ showGridLines: false }];
  for (let r = 15; r <= 20; r++) summary.getCell(r, 3).numFmt = '0%';
  line(summary, 22, '지원·의사결정 요청', 4, 12, PALE);
  const requestText = data.details.decisionRequest || '미작성 - 담당 부서 지정, 자료 확보 일정, 공급업체 협조 등 필요한 사항을 작성해 주세요.';
  const chunks = requestText.match(/[\s\S]{1,300}/g) || [''];
  chunks.forEach((chunk, i) => line(summary, 23 + i, chunk, 4));
  const after = 23 + chunks.length;
  line(summary, after + 1, '업무 진행: 자료 협조요청 시트에서 부서·담당자·기한을 지정하고, 회신자료 위치와 진행상태를 갱신하세요. 진단 응답은 다운로드 시점의 기록이며 Excel 수정 내용은 앱에 자동 반영되지 않습니다.', 4);
  line(summary, after + 3, READINESS_NOTICE, 4); line(summary, after + 4, '자료 예시·확인 부서는 참고사항입니다. 해당 없음의 근거는 별도로 확인해야 합니다.', 4);
  summary.pageSetup.printArea = `A1:D${after + 4}`;
  const request = base('자료 협조요청', [6, 10, 18, 32, 24, 14, 12, 12, 13, 22], true); title(request, 'CBAM 자료 협조요청서', 10);
  line(request, 5, `수신: ${data.details.recipient || '관련 부서 (배포 전 지정)'} / 요청자: ${data.details.author || '미입력'} / 대상기간: ${data.details.reportingPeriod || '미입력'}`, 10);
  line(request, 6, '노란색 칸에 실제 요청 부서·담당자·기한·진행상태·회신자료 위치를 작성하세요. 부서명은 예시입니다. 필터로 해당 부서의 요청만 선택할 수 있습니다.', 10);
  const due = /^\d{4}-\d{2}-\d{2}$/.test(data.details.deadline) ? new Date(`${data.details.deadline}T00:00:00Z`) : null;
  const rows = data.actions.map(r => [r.id, r.priority, r.evidence, `요청: ${r.action}\n예시: ${r.example}`, r.explanation, r.owner, null, due, '요청 전', null]);
  if (rows.length) {
    table(request, ['ID', '우선순위', '필요 자료', '요청 내용·자료 예시', '요청 목적', '요청 부서 (수정)', '담당자', '회신기한', '진행상태', '회신자료 위치·메모'], rows, 8, 'CooperationRequests', rows.map(r => Math.max(95, Math.ceil(String(r[3]).length / 19) * 15 + 20, Math.ceil(String(r[4]).length / 15) * 15 + 20)));
    request.getColumn(8).numFmt = 'yyyy-mm-dd';
    for (let r = 9; r < 9 + rows.length; r++) {
      for (let c = 6; c <= 10; c++) request.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER } };
      request.getCell(r, 9).dataValidation = { type: 'list', allowBlank: false, formulae: ['"요청 전,요청 완료,회신 대기,일부 회신,확보 완료,해당 없음"'] };
      request.getCell(r, 8).dataValidation = { type: 'date', operator: 'between', allowBlank: true, formulae: [new Date('2000-01-01'), new Date('2100-12-31')], showErrorMessage: true, error: '날짜를 입력해 주세요.' };
    }
    request.addConditionalFormatting({ ref: `I9:I${8 + rows.length}`, rules: [{ type: 'containsText', operator: 'containsText', text: '확보 완료', priority: 1, style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DDF7EE' } } } }] });
  } else line(request, 8, '진단 응답 기준으로 추가 자료 요청 대상이 없습니다. 검증 범위와 제출 일정은 담당자와 확인하세요.', 10);
  const checklist = base('전체 진단·자료', [7, 20, 14, 37, 17, 24, 40], true); title(checklist, '전체 진단·자료 체크리스트', 7);
  line(checklist, 5, '진단 응답과 필요한 자료를 연결했습니다. 다운로드 시점의 기록이며, 자료 협조요청 시트에서 담당자·기한·진행상태를 관리할 수 있습니다. Excel 수정 내용은 앱에 자동 반영되지 않습니다.', 7);
  table(checklist, ['ID', '영역', '우선순위', '진단 질문', '진단 응답', '필요 자료', '자료 예시'], data.rows.map(r => [r.id, r.categoryLabel, r.priority, r.text, r.answer, r.evidence, r.example]), 7, 'DiagnosticSnapshot', data.rows.map(r => Math.max(72, Math.ceil(r.text.length / 22) * 15 + 15, Math.ceil(r.example.length / 25) * 15 + 15)));
  summary.eachRow(r => r.eachCell(c => { c.font = { name: '맑은 고딕', size: 11, color: { argb: INK }, ...c.font }; }));
  return new Uint8Array(await wb.xlsx.writeBuffer());
}
