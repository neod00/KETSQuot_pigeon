"use client";
import { useNavigator } from './NavigatorContext';
import { buildChecklistCsv, recommendedActions, QUESTION_GUIDANCE, ANSWER_LABELS, EVIDENCE_LABELS } from '@/lib/readiness-guidance';
import { QUESTIONS } from '@/shared/cbam-navigator';

export function PreparationChecklist() {
  const { draft } = useNavigator();
  const actions = recommendedActions(draft).slice(0, 3);
  function download() {
    const url = URL.createObjectURL(new Blob([buildChecklistCsv(draft)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'LRQA-CBAM-검증준비-체크리스트.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="panel preparation-checklist">
    <div className="checklist-heading"><div><p className="eyebrow">다음 업무로 이어가기</p><h3>우선 조치 3개</h3></div><div className="checklist-actions"><button className="button secondary" onClick={download}>체크리스트 다운로드 (CSV)</button><button className="button secondary" onClick={() => window.print()}>인쇄 / PDF 저장</button></div></div>
    <p className="muted">자료 확보상태와 진단 응답을 참고해 정리했습니다. 확인 부서는 예시이며, 실제 담당자와 기한은 체크리스트에 작성해 주세요.</p>
    {actions.length ? <ol className="action-list">{actions.map(action => <li key={action.id}><span className="badge">{action.confirmOnly ? '증빙 확인' : action.priority}</span><strong>{action.confirmOnly ? `${action.evidence}의 실제 확보 여부를 확인하세요.` : action.action}</strong><p>확인할 부서: {action.owner}</p><small>자료 예시: {action.example}</small></li>)}</ol> : <p>기록된 자료 상태를 기준으로 추가 조치가 없습니다. 검증 범위와 일정을 담당자와 확인해 주세요.</p>}
    <p className="print-summary">제품: {draft.productName || '미입력'} · CN 코드: {draft.cnCode || '미입력'} · 사업장: {draft.sites || '미입력'}</p>
    <table className="print-only"><caption>검증 준비자료 전체 체크리스트</caption><thead><tr><th>자료 / 우선순위</th><th>자가진단 / 자료 상태</th><th>확인할 부서 · 다음 조치</th><th>담당자 / 기한</th></tr></thead><tbody>{QUESTIONS.map(q => <tr key={q.id}><td>{q.evidence}<br />{q.priority}</td><td>{ANSWER_LABELS[draft.answers[q.id]] || '미응답'}<br />{EVIDENCE_LABELS[draft.evidence[q.id]] || '확인 전'}</td><td>{QUESTION_GUIDANCE[q.id].owner}<br />{QUESTION_GUIDANCE[q.id].action}</td><td>담당자:<br /><br />기한:</td></tr>)}</tbody></table>
  </section>;
}
