'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  clientTypeLabel,
  calculateCbamDays,
  complexityLabel,
  formatKrw,
  serviceTypeLabel,
  type CbamApplicationInput,
  type StoredCbamApplication,
} from '@/lib/cbam';
import CnCodeChecker from './CnCodeChecker';

export default function CbamAdminPage() {
  const [applications, setApplications] = useState<StoredCbamApplication[]>([]);
  const [selected, setSelected] = useState<StoredCbamApplication | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'applications' | 'cn-checker'>('applications');
  const [editing, setEditing] = useState<StoredCbamApplication | null>(null);

  const load = useCallback(async (key = adminKey) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/cbam/applications', { headers: key ? { 'x-cbam-admin-key': key } : undefined });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || '신청서를 불러오지 못했습니다.');
      if (key) sessionStorage.setItem('cbamAdminKey', key);
      setApplications(result.applications);
      setSelected(current => current ? result.applications.find((item: StoredCbamApplication) => item.reference === current.reference) || result.applications[0] : result.applications[0]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '신청서를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { const savedKey = sessionStorage.getItem('cbamAdminKey') || ''; setAdminKey(savedKey); load(savedKey); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => ({
    total: applications.length,
    newCount: applications.filter(item => item.status === '신규 접수').length,
    totalDays: applications.reduce((sum, item) => sum + item.quotedDays, 0),
    value: applications.reduce((sum, item) => sum + item.estimatedCost, 0),
  }), [applications]);

  const saveApplication = async (reference: string, application: CbamApplicationInput) => {
    const response = await fetch('/api/cbam/applications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reference, application }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || '신청서를 수정하지 못했습니다.');
    setApplications(current => current.map(item => item.reference === reference ? result.application : item));
    setSelected(result.application);
    setEditing(null);
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto max-w-[1500px] px-5 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[0.25em] text-teal-300">Internal review workspace</p><h1 className="mt-1 text-2xl font-black">CBAM 신청·견적 관리</h1></div>
            <div className="flex items-center gap-2"><Link href="/cbam" className="rounded-lg border border-white/20 px-3 py-2 text-sm font-bold hover:bg-white/10">공개 신청서</Link><Link href="/" className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-950">메인으로</Link></div>
          </div>
          <div className="mt-7 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-4">
            <Stat label="전체 신청" value={`${stats.total}건`} /><Stat label="신규 접수" value={`${stats.newCount}건`} /><Stat label="예상 검증일" value={`${stats.totalDays.toFixed(1)}일`} /><Stat label="예상 공급가" value={formatKrw(stats.value)} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-7">
        {error && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="font-bold text-amber-900">{error}</p><div className="mt-3 flex max-w-md gap-2"><input type="password" placeholder="CBAM_ADMIN_KEY" value={adminKey} onChange={e => setAdminKey(e.target.value)} className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"/><button onClick={() => load()} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">인증</button></div></div>}
        <nav className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="CBAM 내부 관리 메뉴">
          <button type="button" onClick={() => setView('applications')} className={`rounded-xl px-5 py-3 text-sm font-black transition ${view === 'applications' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>신청서 관리</button>
          <button type="button" onClick={() => setView('cn-checker')} className={`rounded-xl px-5 py-3 text-sm font-black transition ${view === 'cn-checker' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>CN 코드·제품 판정</button>
        </nav>
        {view === 'applications' ? <div className="grid items-start gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="text-lg font-black">접수된 신청서</h2><p className="mt-1 text-sm text-slate-500">행을 선택하면 상세 산정근거와 문서 생성 기능이 표시됩니다.</p></div><button onClick={() => load()} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold hover:bg-slate-50">새로고침</button></div>
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500"><tr><Th>접수번호 / 일시</Th><Th>업체</Th><Th>업무</Th><Th>복잡도</Th><Th>심사일수</Th><Th>예상비용</Th><Th>상태</Th></tr></thead>
                <tbody>{loading ? <tr><td colSpan={7} className="p-10 text-center text-slate-500">불러오는 중...</td></tr> : applications.length === 0 ? <tr><td colSpan={7} className="p-10 text-center text-slate-500">접수된 신청서가 없습니다.</td></tr> : applications.map(application => <tr key={application.reference} onClick={() => setSelected(application)} className={`cursor-pointer border-t border-slate-100 transition hover:bg-teal-50 ${selected?.reference === application.reference ? 'bg-teal-50' : ''}`}><Td><strong className="block">{application.reference}</strong><span className="mt-1 block text-xs text-slate-500">{formatDateTime(application.submittedAt)}</span></Td><Td><strong className="block">{application.companyName}</strong><span className="mt-1 block text-xs text-slate-500">{application.contactName} · {application.country}</span></Td><Td>{serviceTypeLabel(application.serviceType)}<span className="mt-1 block text-xs text-slate-500">{clientTypeLabel(application.clientType)}</span></Td><Td><Badge tone={application.complexity === 'very_complex' || application.complexity === 'complex' ? 'amber' : 'teal'}>{complexityLabel(application.complexity)}</Badge></Td><Td><strong>{application.quotedDays.toFixed(1)}일</strong><span className="mt-1 block text-xs text-slate-500">원시 {application.rawDays.toFixed(2)}일</span></Td><Td className="font-bold">{formatKrw(application.estimatedCost)}</Td><Td><Badge tone="blue">{application.status}</Badge></Td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <aside className="xl:sticky xl:top-5">
            {selected ? <ApplicationDetail application={selected} onCheckCnCodes={() => setView('cn-checker')} onEdit={() => setEditing(selected)} /> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">신청서를 선택해 주세요.</div>}
          </aside>
        </div> : <CnCodeChecker adminKey={adminKey} initialCodes={selected?.cnCodes || ''} applicationReference={selected?.reference} companyName={selected?.companyName} />}
      </div>
      {editing && <ApplicationEditor application={editing} onClose={() => setEditing(null)} onSave={saveApplication} />}
    </main>
  );
}

function ApplicationDetail({ application, onCheckCnCodes, onEdit }: { application: StoredCbamApplication; onCheckCnCodes: () => void; onEdit: () => void }) {
  // 기존에 접수된 신청서도 최신 산정 설명을 즉시 보여 주되, 확정 일수는 저장된 값을 유지한다.
  const explanation = calculateCbamDays(application);
  return <div className="space-y-5">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-teal-700">{application.reference}</p><h2 className="mt-2 text-2xl font-black">{application.companyName}</h2><p className="mt-1 text-sm text-slate-500">{application.contactName} · {application.email} · {application.phone}</p></div><Badge tone="blue">{application.status}</Badge></div><button type="button" onClick={onEdit} className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-800 hover:bg-slate-50">신청서 열람·수정</button></div>
      <div className="p-5">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">예비 검증일수 산정</h3>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center"><Day label="SARA" value={application.saraDays} /><Day label="검증" value={application.verificationDays} /><Day label="기술검토" value={application.technicalReviewDays} /><Day label="견적일수" value={application.quotedDays} accent /></div>
        <div className="mt-4 rounded-xl bg-slate-950 p-5 text-white"><div className="flex items-end justify-between gap-4"><div><p className="text-xs text-slate-400">복잡도 / 원시일수</p><p className="mt-1 text-lg font-black">{complexityLabel(application.complexity)} · {application.rawDays.toFixed(2)}일</p></div><div className="text-right"><p className="text-xs text-slate-400">조정 후 / 0.5일 올림</p><p className="mt-1 text-lg font-black text-teal-300">{application.adjustedDays.toFixed(2)} → {application.quotedDays.toFixed(1)}일</p></div></div></div>
        <h3 className="mt-6 text-sm font-black uppercase tracking-wider text-slate-500">산정근거</h3>
        <p className="mt-2 text-xs leading-5 text-slate-500">아래 순서대로 ‘입력값 → 복잡도 점수 → 적용 기준일수 → 견적일수’가 연결됩니다. 신청서 수정 후 자동으로 다시 산정됩니다.</p>
        <ol className="mt-3 space-y-2">{explanation.basis.map((basis, index) => <li key={`${basis}-${index}`} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm leading-5"><span className="font-black text-teal-700">{String(index + 1).padStart(2, '0')}</span><span>{basis}</span></li>)}</ol>
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">업체·범위 정보</h3>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><Detail label="고객 유형" value={clientTypeLabel(application.clientType)} /><Detail label="서비스" value={serviceTypeLabel(application.serviceType)} /><Detail label="대상 연도" value={application.verificationYears.join(', ') || '-'} /><Detail label="CBAM 상품" value={application.cbamGoods.join(', ') || '-'} /><Detail label="CN 코드" value={application.cnCodes || '-'} /><Detail label="사업장" value={application.sites || '-'} /><Detail label="사업자 / 공정 / 상품" value={`${application.operatorCount} / ${application.processCount} / ${application.goodsCount}`} /><Detail label="MMD" value={mmdLabel(application.mmdStatus)} /></dl>
      <button type="button" onClick={onCheckCnCodes} className="mt-5 w-full rounded-xl border border-teal-700 px-4 py-3 text-sm font-black text-teal-800 transition hover:bg-teal-50">이 신청서의 CN 코드 판정</button>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">비용 및 문서 생성</h3>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-teal-50 p-4"><div><p className="text-xs font-bold text-teal-800">예상 공급가</p><p className="mt-1 text-xs text-teal-700">기본 MD 단가 + 제경비, VAT 별도</p></div><strong className="text-xl text-teal-950">{formatKrw(application.estimatedCost)}</strong></div>
      <p className="mt-4 text-xs leading-5 text-slate-500">견적/계약 화면에서 MD 단가, 제경비, 조정일수와 계약 범위를 내부 담당자가 최종 수정할 수 있습니다.</p>
      <div className="mt-4 grid grid-cols-2 gap-3"><Link href={`/cbam/documents?type=quote&ref=${encodeURIComponent(application.reference)}`} className="rounded-xl bg-teal-700 px-4 py-3 text-center text-sm font-black text-white hover:bg-teal-800">견적서 생성</Link><Link href={`/cbam/documents?type=contract&ref=${encodeURIComponent(application.reference)}`} className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-800">계약서 생성</Link></div>
    </section>
  </div>;
}

function ApplicationEditor({ application, onClose, onSave }: { application: StoredCbamApplication; onClose: () => void; onSave: (reference: string, input: CbamApplicationInput) => Promise<void> }) {
  const [form, setForm] = useState<CbamApplicationInput>(() => ({ ...application }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = <K extends keyof CbamApplicationInput>(key: K, value: CbamApplicationInput[K]) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try { await onSave(application.reference, form); } catch (caught) { setError(caught instanceof Error ? caught.message : '신청서를 수정하지 못했습니다.'); } finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 sm:p-8"><form onSubmit={submit} className="mx-auto max-w-5xl rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6"><div><p className="text-xs font-black uppercase tracking-widest text-teal-700">{application.reference}</p><h2 className="mt-1 text-2xl font-black">신청서 열람·수정</h2><p className="mt-1 text-sm text-slate-500">저장 시 검증일수와 예상비용이 입력값 기준으로 다시 계산됩니다.</p></div><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold">닫기</button></div><div className="grid gap-6 p-6 lg:grid-cols-2"><EditField label="회사명 *"><input required className={EDIT_FIELD} value={form.companyName} onChange={e => update('companyName', e.target.value)} /></EditField><EditField label="담당자명 *"><input required className={EDIT_FIELD} value={form.contactName} onChange={e => update('contactName', e.target.value)} /></EditField><EditField label="이메일 *"><input required type="email" className={EDIT_FIELD} value={form.email} onChange={e => update('email', e.target.value)} /></EditField><EditField label="전화번호 *"><input required className={EDIT_FIELD} value={form.phone} onChange={e => update('phone', e.target.value)} /></EditField><EditField label="국가"><input className={EDIT_FIELD} value={form.country} onChange={e => update('country', e.target.value)} /></EditField><EditField label="사업장"><input className={EDIT_FIELD} value={form.sites} onChange={e => update('sites', e.target.value)} /></EditField><div className="lg:col-span-2"><EditField label="주소"><input className={EDIT_FIELD} value={form.address} onChange={e => update('address', e.target.value)} /></EditField></div><EditField label="고객 유형"><select className={EDIT_FIELD} value={form.clientType} onChange={e => update('clientType', e.target.value as CbamApplicationInput['clientType'])}><option value="operator">제3국 제조사업자</option><option value="importer">EU 수입자/신고자</option></select></EditField><EditField label="요청 서비스"><select className={EDIT_FIELD} value={form.serviceType} onChange={e => update('serviceType', e.target.value as CbamApplicationInput['serviceType'])}><option value="verification">CBAM 검증</option><option value="pre_verification">사전검증</option><option value="other">기타 자문</option></select></EditField><EditField label="검증 대상 연도 (쉼표 구분)"><input className={EDIT_FIELD} value={form.verificationYears.join(', ')} onChange={e => update('verificationYears', e.target.value.split(',').map(value => value.trim()).filter(Boolean))} /></EditField><EditField label="CBAM 상품 (쉼표 구분)"><input className={EDIT_FIELD} value={form.cbamGoods.join(', ')} onChange={e => update('cbamGoods', e.target.value.split(',').map(value => value.trim()).filter(Boolean))} /></EditField><div className="lg:col-span-2"><EditField label="CN 코드"><textarea className={EDIT_FIELD} value={form.cnCodes} onChange={e => update('cnCodes', e.target.value)} /></EditField></div><EditField label="관련 사업자 수"><input type="number" min="0" className={EDIT_FIELD} value={form.operatorCount} onChange={e => update('operatorCount', e.target.value)} /></EditField><EditField label="관련 생산공정 수"><input type="number" min="0" className={EDIT_FIELD} value={form.processCount} onChange={e => update('processCount', e.target.value)} /></EditField><EditField label="관련 CBAM 상품 수"><input type="number" min="0" className={EDIT_FIELD} value={form.goodsCount} onChange={e => update('goodsCount', e.target.value)} /></EditField><EditField label="MMD 상태"><select className={EDIT_FIELD} value={form.mmdStatus} onChange={e => update('mmdStatus', e.target.value as CbamApplicationInput['mmdStatus'])}><option value="clear">명확함</option><option value="complex">복잡/불명확</option><option value="none">미제공</option><option value="not_applicable">해당 없음</option></select></EditField><EditField label="바이오매스"><select className={EDIT_FIELD} value={form.biomass} onChange={e => update('biomass', e.target.value as CbamApplicationInput['biomass'])}><option value="none">없음</option><option value="used_red_compliant">사용 · 자료 있음</option><option value="used_review_needed">사용 · 검토 필요</option></select></EditField><EditField label="탄소가격 정보"><select className={EDIT_FIELD} value={form.carbonPrice} onChange={e => update('carbonPrice', e.target.value as CbamApplicationInput['carbonPrice'])}><option value="no">없음/미확인</option><option value="yes">있음</option></select></EditField><div className="lg:col-span-2"><EditField label="생산공정 설명"><textarea className={EDIT_FIELD} value={form.productionProcesses} onChange={e => update('productionProcesses', e.target.value)} /></EditField></div><div className="lg:col-span-2"><EditField label="추가 참고사항"><textarea className={`${EDIT_FIELD} min-h-32`} value={form.notes} onChange={e => update('notes', e.target.value)} /></EditField></div><label className="flex gap-2 text-sm font-semibold"><input type="checkbox" checked={form.chp} onChange={e => update('chp', e.target.checked)} />열병합발전(CHP) 포함</label><label className="flex gap-2 text-sm font-semibold"><input type="checkbox" checked={form.knownClient} onChange={e => update('knownClient', e.target.checked)} />기존 검증팀이 알고 있는 고객</label></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-6">{error ? <p className="text-sm font-bold text-red-700">{error}</p> : <p className="text-sm text-slate-500">접수일·접수번호·상태는 유지됩니다.</p>}<button disabled={saving} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? '저장 중...' : '수정 저장 및 재산정'}</button></div></form></div>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="bg-white/5 p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>; }
const EDIT_FIELD = 'mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100';
function EditField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-bold text-slate-700"><span>{label}</span>{children}</label>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="whitespace-nowrap px-4 py-3 font-black">{children}</th>; }
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <td className={`px-4 py-4 align-top ${className}`}>{children}</td>; }
function Badge({ children, tone }: { children: React.ReactNode; tone: 'teal' | 'amber' | 'blue' }) { const styles = { teal: 'bg-teal-100 text-teal-800', amber: 'bg-amber-100 text-amber-800', blue: 'bg-blue-100 text-blue-800' }; return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${styles[tone]}`}>{children}</span>; }
function Day({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) { return <div className={`rounded-xl p-3 ${accent ? 'bg-teal-700 text-white' : 'bg-slate-100'}`}><p className={`text-[11px] font-bold ${accent ? 'text-teal-100' : 'text-slate-500'}`}>{label}</p><p className="mt-1 text-lg font-black">{value.toFixed(2)}</p></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-line font-semibold leading-5">{value}</dd></div>; }
function formatDateTime(value: string) { return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(new Date(value)); }
function mmdLabel(value: StoredCbamApplication['mmdStatus']) { return ({ clear: '명확한 MMD 제공', complex: 'MMD 복잡/불명확', none: 'MMD 미제공', not_applicable: '해당 없음' }[value]); }
