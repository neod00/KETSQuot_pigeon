"use client";
import { useNavigator } from './NavigatorContext';
import { buildChecklistCsv, recommendedActions, QUESTION_GUIDANCE, ANSWER_LABELS, EVIDENCE_LABELS } from '@/lib/readiness-guidance';
import { QUESTIONS } from '@/shared/cbam-navigator';
import { useState } from 'react';
import { businessDocumentData, documentFilename, EMPTY_REPORT_DETAILS } from '@/lib/business-document-data';

export function PreparationChecklist() {
  const { draft } = useNavigator();
  const [details, setDetails] = useState({ ...EMPTY_REPORT_DETAILS });
  const [busy, setBusy] = useState<'pdf' | 'xlsx' | null>(null);
  const [error, setError] = useState('');
  const actions = recommendedActions(draft).slice(0, 3);
  async function exportDocument(kind: 'pdf' | 'xlsx') {
    setBusy(kind); setError('');
    try {
      const data = businessDocumentData(draft, details);
      let bytes: Uint8Array;
      if (kind === 'pdf') {
        const { buildBusinessReport } = await import('@/lib/business-report');
        const responses = await Promise.all([fetch('/fonts/NotoSansKR-Regular.ttf'), fetch('/lrqa-logo.png')]);
        if (responses.some(r => !r.ok)) throw new Error('서식 자산을 불러오지 못했습니다.');
        const [font, logo] = await Promise.all(responses.map(async r => new Uint8Array(await r.arrayBuffer())));
        bytes = await buildBusinessReport(data, font, logo);
      } else {
        const { buildBusinessWorkbook } = await import('@/lib/business-workbook');
        bytes = await buildBusinessWorkbook(data);
      }
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: kind === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a'); a.href = url; a.download = documentFilename(kind, data.date); a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch { setError('문서를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요. 입력 내용은 유지됩니다.'); }
    finally { setBusy(null); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([buildChecklistCsv(draft)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'LRQA-CBAM-검증준비-체크리스트.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="panel preparation-checklist">
    <div className="checklist-heading"><div><p className="eyebrow">다음 업무로 이어가기</p><h3>우선 조치 3개</h3></div></div>
    <p className="muted">자료 확보상태와 진단 응답을 참고해 정리했습니다. 확인 부서는 예시이며, 실제 담당자와 기한은 체크리스트에 작성해 주세요.</p>
    {actions.length ? <ol className="action-list">{actions.map(action => <li key={action.id}><span className="badge">{action.confirmOnly ? '증빙 확인' : action.priority}</span><strong>{action.confirmOnly ? `${action.evidence}의 실제 확보 여부를 확인하세요.` : action.action}</strong><p>확인할 부서: {action.owner}</p><small>자료 예시: {action.example}</small></li>)}</ol> : <p>기록된 자료 상태를 기준으로 추가 조치가 없습니다. 검증 범위와 일정을 담당자와 확인해 주세요.</p>}
    <div className="business-documents">
      <h3>보고·협조요청 문서 만들기</h3>
      <p className="muted">현재 진단과 자료 확보상태를 문서에 반영합니다. 아래 정보는 이번 문서 생성에만 사용하며 저장하거나 전송하지 않습니다.</p>
      <div className="document-fields">
        <label>회사명<input maxLength={160} value={details.company} onChange={e => setDetails({ ...details, company: e.target.value })} placeholder="예: 한국제조 주식회사" /></label>
        <label>보고자·요청자<input maxLength={120} value={details.author} onChange={e => setDetails({ ...details, author: e.target.value })} placeholder="예: 환경팀 홍길동" /></label>
        <label>보고 대상·수신 부서<input maxLength={160} value={details.recipient} onChange={e => setDetails({ ...details, recipient: e.target.value })} placeholder="예: 팀장 / 생산·구매팀" /></label>
        <label>자료 대상기간<input maxLength={120} value={details.reportingPeriod} onChange={e => setDetails({ ...details, reportingPeriod: e.target.value })} placeholder="예: 2026.01.01 ~ 2026.12.31" /></label>
        <label>회신 요청기한<input type="date" value={details.deadline} onChange={e => setDetails({ ...details, deadline: e.target.value })} /></label>
        <label className="document-request">지원·의사결정 요청<textarea rows={3} maxLength={1500} value={details.decisionRequest} onChange={e => setDetails({ ...details, decisionRequest: e.target.value })} placeholder="예: 부서별 자료 담당자 지정과 공급업체 배출량 자료 요청에 대한 협조가 필요합니다." /></label>
      </div>
      <div className="document-downloads">
        <div><strong>팀장 보고용 PDF</strong><p>준비도 요약 · 우선 조치 · 지원 요청 · 전체 진단 내역</p><button className="button primary" disabled={!!busy} onClick={() => exportDocument('pdf')}>{busy === 'pdf' ? 'PDF 생성 중…' : '보고서 다운로드 (PDF)'}</button></div>
        <div><strong>타팀 협조요청용 Excel</strong><p>자료 요청 목록 · 담당자·기한 입력 · 진행상태 선택 · 전체 체크리스트</p><button className="button secondary" disabled={!!busy} onClick={() => exportDocument('xlsx')}>{busy === 'xlsx' ? 'Excel 생성 중…' : '협조요청서 다운로드 (Excel)'}</button></div>
      </div>
      <p className="muted document-note">미입력 정보는 문서에 미입력·미지정으로 표시됩니다. 진단 미완료 시 최종 준비도 점수를 표시하지 않습니다. Excel에서 진행상태를 수정해도 앱의 진단 결과는 변경되지 않습니다.</p>
      {error && <p role="alert">{error}</p>}
      <details className="document-raw"><summary>원자료 내보내기</summary><button className="button secondary" onClick={download}>원자료 다운로드 (CSV)</button></details>
    </div>
    <p className="print-summary">제품: {draft.productName || '미입력'} · CN 코드: {draft.cnCode || '미입력'} · 사업장: {draft.sites || '미입력'}</p>
    <table className="print-only"><caption>검증 준비자료 전체 체크리스트</caption><thead><tr><th>자료 / 우선순위</th><th>자가진단 / 자료 상태</th><th>확인할 부서 · 다음 조치</th><th>담당자 / 기한</th></tr></thead><tbody>{QUESTIONS.map(q => <tr key={q.id}><td>{q.evidence}<br />{q.priority}</td><td>{ANSWER_LABELS[draft.answers[q.id]] || '미응답'}<br />{EVIDENCE_LABELS[draft.evidence[q.id]] || '확인 전'}</td><td>{QUESTION_GUIDANCE[q.id].owner}<br />{QUESTION_GUIDANCE[q.id].action}</td><td>담당자:<br /><br />기한:</td></tr>)}</tbody></table>
  </section>;
}
