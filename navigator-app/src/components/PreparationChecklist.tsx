"use client";
import { useNavigator } from './NavigatorContext';
import { buildChecklistCsv, recommendedActions, QUESTION_GUIDANCE, ANSWER_LABELS, EVIDENCE_LABELS } from '@/lib/readiness-guidance';
import { QUESTIONS } from '@/shared/cbam-navigator';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { businessDocumentData, documentFilename, EMPTY_REPORT_DETAILS } from '@/lib/business-document-data';
import { LEAD_PRIVACY_VERSION, type LeadIntent } from '@/shared/cbam-lead';

export function PreparationChecklist() {
  const { draft, ready } = useNavigator();
  const [details, setDetails] = useState({ ...EMPTY_REPORT_DETAILS });
  const [contact, setContact] = useState({ phone:'', email:'', consultationMessage:'', consent:false });
  const [privacy, setPrivacy] = useState({ retention:'', contact:'' });
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState<LeadIntent | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    (async () => {
      const response = await fetch('/api/public/cbam/leads');
      if (!response.ok) return;
      const value: unknown = await response.json();
      if (!value || typeof value !== 'object') return;
      const fields = value as Record<string, unknown>;
      if (active && typeof fields.retention === 'string' && typeof fields.contact === 'string') {
        setPrivacy({ retention: fields.retention, contact: fields.contact });
      }
    })().catch(() => {});
    return () => { active = false; };
  }, []);
  const actions = recommendedActions(draft).slice(0, 3);
  async function register(intent: LeadIntent) {
    const response = await fetch('/api/public/cbam/leads', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({
      companyName:details.company, contactName:details.author, phone:contact.phone, email:contact.email,
      recipient:details.recipient, reportingPeriod:details.reportingPeriod, deadline:details.deadline, decisionRequest:details.decisionRequest,
      consultationMessage:contact.consultationMessage, consent:contact.consent, privacyNoticeVersion:LEAD_PRIVACY_VERSION, intent,
      sites:draft.sites, productionProcesses:draft.productionProcesses, productionRoute:draft.productionRoute, precursors:draft.precursors, country:draft.country,
      navigatorData:{ sessionId:draft.sessionId, productName:draft.productName, searchedCnCodes:[...new Set([draft.cnCode, ...draft.searchedCnCodes].filter(Boolean))], readinessAnswers:draft.answers, evidenceStatus:draft.evidence, startedAt:draft.startedAt },
    }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.message || '진단 접수를 저장하지 못했습니다.');
    return result.reference as string;
  }
  async function exportDocument(kind: LeadIntent) {
    if (!formRef.current?.reportValidity()) return;
    setBusy(kind); setError(''); setNotice('');
    try {
      const reference = await register(kind);
      if (kind === 'consultation') { setNotice(`상담 요청이 접수되었습니다. 담당자가 입력하신 연락처로 연락드립니다. 접수번호: ${reference}`); return; }
      if (kind === 'csv') { download(); setNotice(`진단정보를 접수하고 원자료를 다운로드했습니다. 접수번호: ${reference}`); return; }
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
      setNotice(`진단정보를 접수하고 문서를 다운로드했습니다. 접수번호: ${reference}`);
    } catch (e) { setError(e instanceof Error ? e.message : '요청을 완료하지 못했습니다. 입력 내용을 유지한 채 다시 시도해 주세요.'); }
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
    <form className="business-documents" ref={formRef} onSubmit={e => e.preventDefault()}>
      <h3>보고·협조요청 문서 만들기</h3>
      <p className="muted">회사·담당자 정보를 입력하면 현재 진단을 반영한 문서를 받을 수 있습니다. 제출한 연락처와 진단정보는 LRQA의 진단 접수 관리와 요청사항 대응을 위해 저장됩니다.</p>
      <div className="document-fields">
        <label>회사명 *<input required autoComplete="organization" maxLength={160} value={details.company} onChange={e => setDetails({ ...details, company: e.target.value })} placeholder="예: 한국제조 주식회사" /></label>
        <label>담당자명 *<input required autoComplete="name" maxLength={120} value={details.author} onChange={e => setDetails({ ...details, author: e.target.value })} placeholder="예: 홍길동" /></label>
        <label>전화번호 *<input required type="tel" autoComplete="tel" maxLength={40} pattern="[+0-9][0-9 \(\)\-]{6,39}" value={contact.phone} onChange={e => setContact({ ...contact, phone:e.target.value })} placeholder="예: 010-1234-5678" /></label>
        <label>이메일 *<input required type="email" autoComplete="email" maxLength={254} value={contact.email} onChange={e => setContact({ ...contact, email:e.target.value })} placeholder="예: name@company.com" /></label>
        <label>보고 대상·수신 부서<input maxLength={160} value={details.recipient} onChange={e => setDetails({ ...details, recipient: e.target.value })} placeholder="예: 팀장 / 생산·구매팀" /></label>
        <label>자료 대상기간<input maxLength={120} value={details.reportingPeriod} onChange={e => setDetails({ ...details, reportingPeriod: e.target.value })} placeholder="예: 2026.01.01 ~ 2026.12.31" /></label>
        <label>회신 요청기한<input type="date" value={details.deadline} onChange={e => setDetails({ ...details, deadline: e.target.value })} /></label>
        <label className="document-request">지원·의사결정 요청<textarea rows={3} maxLength={1500} value={details.decisionRequest} onChange={e => setDetails({ ...details, decisionRequest: e.target.value })} placeholder="예: 부서별 자료 담당자 지정과 공급업체 배출량 자료 요청에 대한 협조가 필요합니다." /></label>
      </div>
      <details className="lead-privacy"><summary>개인정보 수집·이용 안내</summary><p>수집 항목: 회사명, 담당자명, 전화번호, 이메일, 진단 응답·자료 확보상태 및 입력한 요청사항</p><p>이용 목적: 진단 접수 관리, 요청 문서 제공 및 상담 요청에 대한 연락</p><p>보유기간: {privacy.retention || '개인정보 안내 페이지 확인'}</p><p>문의: {privacy.contact || 'LRQA Korea'}</p><p>동의를 거부할 수 있으며, 거부 시 문서 제공과 상담 요청 접수가 제한됩니다. <Link href="/privacy" target="_blank">개인정보 안내 전체 보기</Link></p></details>
      <label className="lead-consent"><input required type="checkbox" checked={contact.consent} onChange={e => setContact({ ...contact, consent:e.target.checked })} /><span>개인정보 수집·이용에 동의하며, 연락처와 진단정보를 LRQA에 제출합니다. *</span></label>
      <div className="document-downloads">
        <div><strong>내부 보고용 PDF</strong><p>준비도 요약 · 우선 조치 · 지원 요청 · 전체 진단 내역</p><button type="button" className="button primary" disabled={!!busy || !ready} onClick={() => exportDocument('pdf')}>{busy === 'pdf' ? '접수·PDF 생성 중…' : '보고서 다운로드 (PDF)'}</button></div>
        <div><strong>타팀 협조요청용 Excel</strong><p>자료 요청 목록 · 담당자·기한 입력 · 진행상태 선택 · 전체 체크리스트</p><button type="button" className="button secondary" disabled={!!busy || !ready} onClick={() => exportDocument('xlsx')}>{busy === 'xlsx' ? '접수·Excel 생성 중…' : '협조요청서 다운로드 (Excel)'}</button></div>
      </div>
      <div className="consultation-request"><h3>진단 결과 상담 요청</h3><p className="muted">진단 결과나 자료 준비에 대해 담당자와 상담하고 싶다면 요청을 남겨 주세요. 문서 다운로드만으로 상담 요청이 접수되지는 않습니다.</p><label>상담 요청 내용 (선택)<textarea rows={3} maxLength={1500} value={contact.consultationMessage} onChange={e => setContact({ ...contact, consultationMessage:e.target.value })} placeholder="예: 공급업체 배출량 자료 확보 방법과 검증 준비 일정을 상담하고 싶습니다." /></label><button type="button" className="button secondary" disabled={!!busy || !ready} onClick={() => exportDocument('consultation')}>{busy === 'consultation' ? '상담 요청 접수 중…' : '진단 결과 상담 요청'}</button></div>
      <p className="muted document-note">같은 진단 세션과 이메일의 문서·상담 요청은 한 접수 기록에 반영합니다. 진단 미완료 시 최종 준비도 점수를 표시하지 않습니다. Excel 편집 내용은 앱에 자동 반영되지 않습니다.</p>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status" className="lead-success">{notice}</p>}
      <details className="document-raw"><summary>원자료 내보내기</summary><button type="button" disabled={!!busy || !ready} className="button secondary" onClick={() => exportDocument('csv')}>원자료 다운로드 (CSV)</button></details>
    </form>
    <p className="print-summary">제품: {draft.productName || '미입력'} · CN 코드: {draft.cnCode || '미입력'} · 사업장: {draft.sites || '미입력'}</p>
    <table className="print-only"><caption>검증 준비자료 전체 체크리스트</caption><thead><tr><th>자료 / 우선순위</th><th>자가진단 / 자료 상태</th><th>확인할 부서 · 다음 조치</th><th>담당자 / 기한</th></tr></thead><tbody>{QUESTIONS.map(q => <tr key={q.id}><td>{q.evidence}<br />{q.priority}</td><td>{ANSWER_LABELS[draft.answers[q.id]] || '미응답'}<br />{EVIDENCE_LABELS[draft.evidence[q.id]] || '확인 전'}</td><td>{QUESTION_GUIDANCE[q.id].owner}<br />{QUESTION_GUIDANCE[q.id].action}</td><td>담당자:<br /><br />기한:</td></tr>)}</tbody></table>
  </section>;
}
