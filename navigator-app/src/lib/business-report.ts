import { PDFDocument, rgb, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { READINESS_NOTICE } from '@/shared/cbam-navigator';
import type { BusinessDocumentData } from './business-document-data';

// A4 document composition is independent of the application viewport/print CSS.
export async function buildBusinessReport(data: BusinessDocumentData, fontBytes: Uint8Array, logoBytes?: Uint8Array) {
  const doc = await PDFDocument.create(); doc.registerFontkit(fontkit);
  // Embed the full static font: fontkit subsetting can lose CJK composite glyphs.
  const font = await doc.embedFont(fontBytes, { subset: false });
  const logo = logoBytes ? await doc.embedPng(logoBytes) : undefined;
  doc.setTitle('CBAM 검증 준비현황 보고서'); doc.setAuthor(data.details.author || 'LRQA CBAM Navigator');
  doc.setSubject('자가진단 및 증빙자료 준비상태'); doc.setCreator('LRQA CBAM Navigator');
  const navy = rgb(.063, .075, .188), mint = rgb(.059, .949, .698), ink = rgb(.15, .19, .29), muted = rgb(.39, .44, .52), pale = rgb(.95, .96, .98), white = rgb(1, 1, 1);
  const W = 595.28, H = 841.89, L = 42, CW = W - 84;
  let page: PDFPage, y = 0;
  function rect(x: number, top: number, w: number, h: number, color = pale) { page.drawRectangle({ x, y: H - top - h, width: w, height: h, color }); }
  function lines(text: string, width: number, size: number) {
    const result: string[] = [];
    for (const paragraph of text.replace(/\r/g, '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').split('\n')) {
      let current = '';
      for (const char of paragraph) { if (current && font.widthOfTextAtSize(current + char, size) > width) { result.push(current.trimEnd()); current = ''; } current += char; }
      result.push(current);
    }
    return result;
  }
  function text(value: string, x: number, top: number, width = CW, size = 10, color = ink) {
    const wrapped = lines(value, width, size); wrapped.forEach((line, i) => page.drawText(line, { x, y: H - top - size - i * size * 1.55, font, size, color }));
    return wrapped.length * size * 1.55;
  }
  function newPage(label: string) {
    page = doc.addPage([W, H]); rect(0, 0, W, 92, navy);
    if (logo) page.drawImage(logo, { x: L, y: H - 76, width: 60, height: 60 });
    else text('LRQA', L, 30, 80, 21, mint);
    text('CBAM Navigator', L + 80, 29, 290, 15, white); text(label, L + 80, 55, 380, 9, rgb(.77, .82, .89));
    y = 104;
  }
  function section(title: string) { y += 8; text(title, L, y, CW, 13); y += 27; }
  function paragraph(value: string, size = 10) { y += text(value, L, y, CW, size) + 9; }
  function flow(value: string, label: string) {
    for (const line of lines(value, CW, 10)) { if (y > 748) newPage(label); text(line, L, y, CW, 10); y += 16; }
    y += 9;
  }
  newPage('검증 준비현황 보고서');
  text('CBAM 검증 준비현황', L, y, CW, 23); y += 37;
  const info = [
    ['회사', data.details.company || '미입력'], ['제품 / CN', `${data.draft.productName || '미입력'} / ${data.draft.cnCode || '미입력'}`],
    ['사업장', data.draft.sites || '미입력'], ['대상기간', data.details.reportingPeriod || '미입력'],
    ['보고자 / 수신', `${data.details.author || '미입력'} / ${data.details.recipient || '미입력'}`], ['작성일 / 회신기한', `${data.date} / ${data.details.deadline || '미지정'}`],
  ];
  const half = (CW - 12) / 2;
  for (let i = 0; i < info.length; i += 2) {
    const height = Math.max(...info.slice(i, i + 2).map(([, value]) => lines(value, half - 20, 9).length * 14 + 23));
    if (y + height > 740) newPage('보고 대상 정보 (계속)');
    info.slice(i, i + 2).forEach(([label, value], j) => {
      const x = L + j * (half + 12); rect(x, y, half, height);
      text(label, x + 10, y + 4, half - 20, 7, muted); text(value, x + 10, y + 18, half - 20, 9);
    }); y += height + 5;
  }
  if (y + 220 > 748) newPage('준비도 요약');
  section('01  준비도 요약');
  rect(L, y, CW, 65, navy); text(data.scoreLabel, L + 16, y + 6, 150, 23, mint);
  text(`${data.scored.answered}/24개 응답`, L + 16, y + 42, 145, 9, white);
  text(`증빙 준비 완료 ${data.readyEvidence}건`, L + 195, y + 12, 285, 12, white);
  text(`추가 확인·자료 확보 ${data.actions.length}건 / 해당 없음 ${data.notApplicable}건`, L + 195, y + 37, 285, 9, white); y += 76;
  data.categories.forEach((c, i) => {
    const x = L + (i % 2) * (half + 12), top = y + Math.floor(i / 2) * 28;
    text(c.label, x, top, half - 65, 8);
    text(c.answered === 4 ? `${c.score}%` : `${c.answered}/4 응답`, x + half - 65, top, 65, 8, muted);
    rect(x, top + 18, half, 5);
    if (c.answered === 4) rect(x, top + 18, half * c.score / 100, 5, mint);
  }); y += 88;
  paragraph('점수는 자가진단 응답을 기준으로 계산합니다. 증빙 준비 완료는 실제 자료 확보상태에 기록한 항목 수이며, 해당 없음은 근거 확인이 필요합니다.', 9);
  if (y + 125 > 748) newPage('우선 조치');
  section('02  우선 조치');
  const top = data.actions.slice(0, 3);
  if (!top.length) paragraph('현재 기록 기준으로 추가 자료 확보 대상이 없습니다. 검증 범위와 해당 없음의 근거를 담당자와 확인하세요.');
  for (const [i, a] of top.entries()) {
    const content = `${i + 1}. [${a.id}] ${a.action}\n확인할 부서 (예시): ${a.owner}`;
    const h = lines(content, CW - 24, 9).length * 14 + 15;
    if (y + h > 748) newPage('우선 조치 (계속)');
    rect(L, y, CW, h); text(content, L + 12, y + 6, CW - 24, 9); y += h + 7;
  }
  if (y + 60 > 748) newPage('지원·의사결정 요청');
  section('03  지원·의사결정 요청');
  flow(data.details.decisionRequest || '미작성 - 관련 부서 담당자 지정, 자료 확보 일정, 공급업체 협조 등 필요한 지원사항을 작성해 주세요.', '지원·의사결정 요청 (계속)');
  newPage('전체 진단·증빙 내역');
  text('전체 진단·증빙 내역', L, y, CW, 21); y += 39;
  paragraph('자가진단 응답과 실제 자료 확보상태를 나란히 표시했습니다. 다운로드 시점의 기록이며 공식 검증결과가 아닙니다.', 9);
  let previousCategory = '';
  for (const r of data.rows) {
    const questionHeight = lines(r.text, CW - 24, 10).length * 15.5;
    const status = `자가진단: ${r.answer} / 자료 상태: ${r.status}`;
    const h = questionHeight + lines(status, CW - 24, 9).length * 14 + lines(`필요 자료: ${r.evidence}`, CW - 24, 9).length * 14 + 34;
    if (y + h + (previousCategory !== r.category ? 29 : 0) > 748) { newPage('전체 진단·증빙 내역 (계속)'); previousCategory = ''; }
    if (previousCategory !== r.category) { text(r.categoryLabel, L, y, CW, 12); y += 29; previousCategory = r.category; }
    rect(L, y, CW, h);
    text(`[${r.id}] ${r.priority}`, L + 12, y + 6, CW - 24, 8, muted);
    text(r.text, L + 12, y + 23, CW - 24, 10);
    const sy = y + 25 + questionHeight;
    const sh = text(status, L + 12, sy, CW - 24, 9);
    text(`필요 자료: ${r.evidence}`, L + 12, sy + sh + 3, CW - 24, 9, muted); y += h + 8;
  }
  const pages = doc.getPages();
  for (const [i, p] of pages.entries()) {
    page = p; rect(L, 777, CW, .7, rgb(.82, .85, .9));
    text(READINESS_NOTICE, L, 788, CW - 55, 7, muted);
    text(`${i + 1} / ${pages.length}`, W - 77, 789, 38, 8, muted);
    text(`LRQA CBAM Navigator / ${data.date}`, L, 818, CW, 7, muted);
  }
  return doc.save();
}
