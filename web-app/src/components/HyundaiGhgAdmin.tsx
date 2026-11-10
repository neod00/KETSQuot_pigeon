'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import HyundaiGhgFields, { GHG_INPUT } from './HyundaiGhgFields';
import P827ApplicationForm from './P827ApplicationForm';
import { APPLICATION_STATUSES, CHANGE_TYPES, SCOPE3_CATEGORIES, changeStatusLabel, customerTypeLabel, formatGhgDate, parseHyundaiGhgInput, scopeLabel, hyundaiInputFromP827, targetYearLabel, getTargetYears, targetYearsLabel, targetYearsOverlap, type ApplicationStatus, type CustomerType, type HyundaiGhgApplication, type HyundaiGhgInput } from '@/lib/hyundai-ghg';
import { P827_GENERATOR_DEFAULTS, type P827GeneratorData } from '@/lib/p827-generator-data';

const P827Generator = dynamic(() => import('./P827Generator'), { loading: () => <p className="p-6 text-sm text-slate-500">견적·계약 생성기를 불러오는 중…</p>, ssr: false });
const API = '/api/hyundai-ghg/applications';
const BUTTON = 'min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:text-sm';
const TABS = [{ id: 'application', label: '신청내용' }, { id: 'review', label: '내부 검토' }, { id: 'documents', label: '견적·계약' }, { id: 'history', label: '처리이력' }] as const;
type Tab = typeof TABS[number]['id'];

function applicationFields(application: HyundaiGhgApplication): HyundaiGhgInput {
  return parseHyundaiGhgInput(application);
}

function IntakeFields({ value, onChange, disabled = false }: { value: HyundaiGhgInput; onChange: (value: HyundaiGhgInput) => void; disabled?: boolean }) {
  if (value.p827Application) return <P827ApplicationForm embedded value={value.p827Application} onChange={input => onChange(hyundaiInputFromP827(input))} disabled={disabled} />;
  return <HyundaiGhgFields value={value} onChange={onChange} disabled={disabled} />;
}

function documentApplicationFields(input: HyundaiGhgInput): Partial<P827GeneratorData> {
  const p827 = input.p827Application;
  const years = getTargetYears(input);
  return { companyName: input.companyName, hqAddress: input.address, targetSites: input.sites,
    vYear: years.join(', '), ghgDeclarationPeriod: years.map(year => `${year}년 01월 01일~${year}년 12월 31일`).join('; '),
    serviceDesc: `온실가스 배출량 ${input.scopes.map(scope => `Scope ${scope}`).join(', ')} 제3자 검증`,
    scope3Categories: SCOPE3_CATEGORIES.map(category => input.scopes.includes(3) && input.scope3Categories.includes(category.id)),
    ...(p827 ? {
      ghgDeclarationPeriod: p827.reportingPeriod, targetSites: p827.locations || p827.organisationBoundary,
      serviceDesc: p827.objective || `온실가스 배출량 ${scopeLabel(input.scopes)} 제3자 검증`,
      assuranceLevel: p827.assuranceLevel === 'reasonable' ? '합리적 보증수준 (Reasonable level of assurance)' : '제한적 보증수준 (Limited level of assurance)',
      materialityLevel: p827.materialityType === 'professional' ? '전문적 판단' : p827.materialityPercent,
      verificationStandard: /14064/i.test(p827.criteria) ? 'iso14064' as const : 'isae' as const,
      reportingDeadline: p827.deadline,
    } : {}),
  };
}

function initialDocumentDraft(application: HyundaiGhgApplication): P827GeneratorData {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return { ...P827_GENERATOR_DEFAULTS,
    proposalDate: today, proposalNo: `QR.${application.reference}`,
    s1Days: 0, s2Days: 0, s3Days: 0, auditRate: 0, expenses: 0, appFeeAmount: 0,
    reportingDeadline: '', clientRepName: '', manualFinalCost: 0,
    ...documentApplicationFields(application), ...application.documentDraft } as P827GeneratorData;
}

export default function HyundaiGhgAdmin() {
  const [applications, setApplications] = useState<HyundaiGhgApplication[]>([]);
  const [selected, setSelected] = useState<HyundaiGhgApplication | null>(null);
  const selectedReference = selected?.reference;
  useEffect(() => {
    if (selectedReference && window.matchMedia('(max-width: 1279px)').matches) {
      document.getElementById('hyundai-ghg-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedReference]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [linkFallback, setLinkFallback] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const dirty = useRef(false);
  const saving = useRef(false);
  const onDirtyChange = useCallback((value: boolean) => { dirty.current = value; }, []);
  const onSavingChange = useCallback((value: boolean) => { saving.current = value; }, []);
  const canLeave = () => !saving.current && (!dirty.current || window.confirm('저장하지 않은 변경사항이 있습니다. 변경사항을 버리고 이동하시겠습니까?'));

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(API, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || '신청서를 불러오지 못했습니다.');
      setApplications(payload.applications);
      setSelected(null);
      dirty.current = false;
    } catch (caught) { setError(caught instanceof Error ? caught.message : '불러오지 못했습니다.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty.current || saving.current) event.preventDefault(); };
    const navigation = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest('a[href]');
      if (!link || link.getAttribute('target') === '_blank') return;
      if ((dirty.current || saving.current) && !canLeave()) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', navigation, true);
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', navigation, true); };
  }, []);

  async function copyLink(type: CustomerType) {
    const url = `${window.location.origin}/hyundai-ghg/${type}`;
    try { await navigator.clipboard.writeText(url); setNotice(`${customerTypeLabel(type)}용 신청 링크를 복사했습니다.`); setLinkFallback(''); }
    catch { setLinkFallback(url); setNotice('아래 신청 링크를 선택해 복사해 주세요.'); }
  }
  const years = useMemo(() => [...new Set(applications.flatMap(item => getTargetYears(item).length ? getTargetYears(item) : ['']))].sort().reverse(), [applications]);
  const filtered = useMemo(() => applications.filter(item =>
    (typeFilter === 'all' || item.customerType === typeFilter) &&
    (yearFilter === 'all' || (yearFilter ? getTargetYears(item).includes(yearFilter) : !getTargetYears(item).length)) &&
    (statusFilter === 'all' || item.status === statusFilter) &&
    `${item.companyName} ${item.contactName} ${item.reference}`.toLowerCase().includes(query.trim().toLowerCase())), [applications, query, typeFilter, yearFilter, statusFilter]);
  const stats = [
    { label: '전체 접수', count: applications.length },
    { label: '신규 접수', count: applications.filter(item => item.status === '접수').length },
    { label: '보완 요청', count: applications.filter(item => item.status === '보완 요청').length },
    { label: '계약 완료', count: applications.filter(item => item.status === '계약 완료').length },
  ];
  function select(application: HyundaiGhgApplication) {
    if (application.reference === selected?.reference || !canLeave()) return;
    dirty.current = false; setSelected(application);
  }
  function onSaved(application: HyundaiGhgApplication) {
    setApplications(items => items.map(item => item.reference === application.reference ? application : item));
    setSelected(application);
  }
  return <main className="min-h-screen bg-[#eef2f5] text-slate-900">
    <header className="bg-[#10132f] px-5 py-6 text-white lg:px-7"><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-xs font-bold tracking-widest text-emerald-300">GHG VERIFICATION WORKSPACE</p><h1 className="mt-2 text-2xl font-bold">현대차 협력사 GHG검증</h1><p className="mt-2 text-sm text-slate-300">기존·신규 협력사의 신청부터 검토, 견적·계약까지 관리합니다.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => void copyLink('existing')} className="rounded-lg border border-white/30 px-3 py-2.5 text-sm font-semibold hover:bg-white/10">기존 고객용 링크 복사</button><button onClick={() => void copyLink('new')} className="rounded-lg bg-emerald-300 px-3 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-200">신규 고객용 링크 복사</button></div></div><div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(item => <div key={item.label} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"><p className="text-xs text-slate-300">{item.label}</p><p className="mt-1 text-2xl font-bold">{item.count}<span className="ml-1 text-sm font-normal text-slate-400">건</span></p></div>)}</div></header>
    <div className="p-4 lg:p-6">{notice && <div role="status" className="mb-4 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">{notice}{linkFallback && <input readOnly aria-label="신청 링크" className={GHG_INPUT} value={linkFallback} onFocus={event => event.target.select()} />}</div>}{error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"><input aria-label="회사명·담당자·접수번호 검색" className="col-span-2 min-h-11 min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base sm:w-auto sm:min-w-[220px] sm:flex-1 sm:text-sm" placeholder="회사명·담당자·접수번호 검색" value={query} onChange={e => setQuery(e.target.value)} /><select aria-label="고객 구분 필터" className={BUTTON} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="all">전체 고객</option><option value="existing">기존 고객</option><option value="new">신규 협력사</option></select><select aria-label="대상년도 필터" className={BUTTON} value={yearFilter} onChange={e => setYearFilter(e.target.value)}><option value="all">전체 년도</option>{years.map(year => <option key={year} value={year}>{targetYearLabel(year)}</option>)}</select><select aria-label="처리상태 필터" className={BUTTON} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">전체 상태</option>{APPLICATION_STATUSES.map(status => <option key={status}>{status}</option>)}</select><button className={BUTTON} disabled={loading} onClick={() => { if (canLeave()) void load(); }}>새로고침</button></div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.5fr)]">
        <section id="hyundai-ghg-list" className="scroll-mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-4 py-4"><h2 className="font-bold">접수된 신청서 <span className="ml-1 text-sm font-medium text-teal-700">{filtered.length}건</span></h2></div><div className="max-h-[75vh] overflow-y-auto">{loading ? <p className="p-8 text-center text-sm text-slate-500">불러오는 중…</p> : !filtered.length ? <div className="px-5 py-12 text-center"><p className="text-sm text-slate-500">{applications.length ? '검색 조건에 맞는 신청서가 없습니다.' : '접수된 신청서가 없습니다.'}</p>{!applications.length && <p className="mt-2 text-xs leading-5 text-slate-400">상단의 신청 링크를 고객사에 안내해 주세요.</p>}</div> : filtered.map(item => <button key={item.reference} onClick={() => select(item)} aria-pressed={selected?.reference === item.reference} className={`block w-full border-b border-l-4 p-4 text-left last:border-b-0 ${selected?.reference === item.reference ? 'border-l-teal-600 bg-teal-50' : 'border-l-transparent hover:bg-slate-50'}`}><div className="flex items-start justify-between gap-2"><strong className="min-w-0 break-words text-sm">{item.companyName}</strong><StatusBadge status={item.status} /></div><p className="mt-2 text-xs text-slate-600">{customerTypeLabel(item.customerType)} · {targetYearsLabel(item)} · {scopeLabel(item.scopes)}</p><p className="mt-1 text-xs text-slate-500">{item.contactName} · {formatGhgDate(item.submittedAt)}</p><p className="mt-1 text-[11px] text-slate-400">{item.reference}</p></button>)}</div></section>
        {selected ? <ApplicationWorkspace key={selected.reference} application={selected} onSaved={onSaved} onDirtyChange={onDirtyChange} onSavingChange={onSavingChange} duplicate={applications.some(item => item.reference !== selected.reference && targetYearsOverlap(item, selected) && item.companyName.replace(/\s/g, '').toLowerCase() === selected.companyName.replace(/\s/g, '').toLowerCase())} /> : <section className="grid min-h-72 place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><p className="text-lg font-semibold text-slate-700">신청서를 선택해 주세요.</p><p className="mt-2 text-sm text-slate-500">신청내용 확인과 견적·계약 작업을 여기서 진행합니다.</p><div className="mt-5 flex flex-wrap justify-center gap-3"><Link href="/hyundai-ghg/existing" target="_blank" rel="noopener noreferrer" className={BUTTON}>기존 고객용 미리보기 ↗</Link><Link href="/hyundai-ghg/new" target="_blank" rel="noopener noreferrer" className={BUTTON}>신규 고객용 미리보기 ↗</Link></div></div></section>}
      </div>
    </div>
  </main>;
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`shrink-0 rounded px-2 py-1 text-[11px] font-semibold ${status === '계약 완료' ? 'bg-teal-100 text-teal-800' : status === '보완 요청' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>{status}</span>;
}

function ApplicationWorkspace({ application, onSaved, onDirtyChange, onSavingChange, duplicate }: { application: HyundaiGhgApplication; onSaved: (application: HyundaiGhgApplication) => void; onDirtyChange: (value: boolean) => void; onSavingChange: (value: boolean) => void; duplicate: boolean }) {
  const [form, setForm] = useState(() => applicationFields(application));
  const [notes, setNotes] = useState(application.internalNotes);
  const [status, setStatus] = useState(application.status);
  const [documentDraft, setDocumentDraft] = useState(() => initialDocumentDraft(application));
  const [documentKey, setDocumentKey] = useState(0);
  const [tab, setTab] = useState<Tab>('application');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [baseline, setBaseline] = useState(() => JSON.stringify({ form: applicationFields(application), notes: application.internalNotes, status: application.status, documentDraft: initialDocumentDraft(application) }));
  const signature = JSON.stringify({ form, notes, status, documentDraft });
  const dirty = signature !== baseline;
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => { onSavingChange(saving); return () => onSavingChange(false); }, [saving, onSavingChange]);
  const onDraftChange = useCallback((draft: P827GeneratorData) => setDocumentDraft(draft), []);
  async function save() {
    if (saving) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const input = parseHyundaiGhgInput(form);
      const response = await fetch(API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reference: application.reference, version: application.version, application: input, internalNotes: notes, status, documentDraft }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || '저장하지 못했습니다.');
      const next = payload.application as HyundaiGhgApplication;
      setForm(applicationFields(next)); setNotes(next.internalNotes);
      setBaseline(JSON.stringify({ form: applicationFields(next), notes: next.internalNotes, status: next.status, documentDraft }));
      onDirtyChange(false); onSaved(next); setNotice('저장했습니다.');
    } catch (caught) { setError(caught instanceof Error ? caught.message : '저장하지 못했습니다.'); }
    finally { setSaving(false); }
  }
  return <section id="hyundai-ghg-workspace" className="min-w-0 scroll-mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <header className="border-b border-slate-200 p-5"><button type="button" onClick={() => document.getElementById('hyundai-ghg-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="mb-3 min-h-11 rounded-lg px-2 text-sm font-semibold text-teal-800 hover:bg-teal-50 xl:hidden">← 목록으로</button><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-teal-700">{customerTypeLabel(application.customerType)} · {targetYearsLabel(application)} 배출량</p><h2 className="mt-1 break-words text-xl font-bold">{application.companyName}</h2><p className="mt-2 text-xs text-slate-500">{application.reference} · 접수 {formatGhgDate(application.submittedAt)}</p></div><StatusBadge status={application.status} /></div><div className="mt-4 flex flex-wrap items-end gap-3"><label className="min-w-36 text-xs font-semibold text-slate-600">처리상태<select aria-label="처리상태" disabled={saving} className={GHG_INPUT} value={status} onChange={e => setStatus(e.target.value as ApplicationStatus)}>{APPLICATION_STATUSES.map(item => <option key={item}>{item}</option>)}</select></label><button onClick={() => void save()} disabled={saving || !dirty} className="min-h-10 rounded-lg bg-teal-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-900 disabled:opacity-50">{saving ? '저장 중…' : '변경사항 저장'}</button><span className="pb-2 text-xs text-slate-500">{dirty ? '저장하지 않은 변경사항이 있습니다.' : `최종 저장 ${formatGhgDate(application.updatedAt)}`}</span></div>{notice && <p role="status" className="mt-3 text-sm text-teal-800">{notice}</p>}{error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}{duplicate && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">같은 회사명으로 대상년도가 겹치는 다른 접수 건이 있습니다. 중복 여부를 확인해 주세요. 각 신청서는 별도로 보관됩니다.</p>}</header>
    <nav aria-label="신청서 작업" className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 px-1 sm:flex sm:overflow-x-auto sm:px-2">{TABS.map(item => <button key={item.id} disabled={saving} aria-current={tab === item.id ? 'page' : undefined} onClick={() => setTab(item.id)} className={`min-h-11 min-w-0 whitespace-nowrap border-b-2 px-0.5 py-3 text-xs font-semibold sm:shrink-0 sm:px-4 sm:text-sm ${tab === item.id ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>{item.label}</button>)}</nav>
    {tab === 'application' && <div className="p-5"><IntakeFields value={form} onChange={setForm} disabled={saving} /><p className="mt-5 text-xs text-slate-500">고객 제출 원본은 처리이력 탭에서 확인할 수 있습니다.</p></div>}
    {tab === 'review' && <div className="space-y-5 p-5"><div className="rounded-lg bg-slate-50 p-4 text-sm"><h3 className="font-bold">검토 요약</h3><p className="mt-3">{scopeLabel(form.scopes)} · {targetYearsLabel(form)}</p><p className="mt-2">{form.customerType === 'existing' ? `전년 대비: ${changeStatusLabel(form.changeStatus)}` : 'LRQA 최초 검증 신청'}</p>{form.changeTypes.length > 0 && <p className="mt-2">{form.changeTypes.filter(type => CHANGE_TYPES.includes(type as typeof CHANGE_TYPES[number])).join(', ')}</p>}{form.changeDetails && <p className="mt-2 whitespace-pre-wrap leading-6">{form.changeDetails}</p>}{form.scope3Categories.length > 0 && <p className="mt-2 text-xs text-slate-600">Scope 3 카테고리: {form.scope3Categories.join(', ')}</p>}</div><label className="block text-sm font-semibold text-slate-700">내부 검토 메모<textarea className={GHG_INPUT} disabled={saving} maxLength={10000} rows={8} placeholder="범위 확인, 고객에게 요청할 보완사항, 견적 조건 등을 기록해 주세요." value={notes} onChange={e => setNotes(e.target.value)} /></label><p className="text-xs text-slate-500">처리상태를 ‘보완 요청’으로 변경해도 고객에게 자동 발송되지는 않습니다.</p></div>}
    {tab === 'documents' && <div><div className="space-y-3 border-b border-slate-200 bg-teal-50/50 p-4"><p className="text-sm font-semibold text-slate-800">검증일수와 금액을 직접 입력해 주세요.</p><p className="text-xs leading-5 text-slate-600">전년도 견적 연계와 검증일수 자동 산정은 적용하지 않습니다. 주소·계약 대표자 등 문서 발행에 필요한 정보를 보완한 후 생성해 주세요. 견적 조건은 상단의 ‘변경사항 저장’으로 보관합니다.</p><button disabled={saving} className={BUTTON} onClick={() => { setDocumentDraft(current => ({ ...current, ...documentApplicationFields(form) })); setDocumentKey(key => key + 1); }}>현재 신청정보를 문서에 반영</button></div><fieldset disabled={saving} className="min-w-0"><P827Generator key={documentKey} embedded initialData={documentDraft} onDraftChange={onDraftChange} verificationScopes={form.scopes} verificationYears={form.customerType === 'existing' ? getTargetYears(form) : undefined} /></fieldset></div>}
    {tab === 'history' && <div className="p-5"><h3 className="mb-4 text-sm font-bold">처리이력</h3><ol className="space-y-4">{[...application.events].reverse().map((event, index) => <li key={`${event.at}-${index}`} className="border-l-2 border-teal-200 pl-4"><p className="text-sm text-slate-800">{event.action}</p><p className="mt-1 text-xs text-slate-500">{event.actor} · {formatGhgDate(event.at)}</p></li>)}</ol><details className="mt-7 rounded-lg border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold">고객 제출 원본 확인</summary><div className="mt-5"><IntakeFields value={application.originalSubmission} onChange={() => undefined} disabled /><p className="mt-4 text-xs text-slate-500">정보 수집·이용 동의: {application.originalSubmission.consent ? '동의' : '미동의'} · {formatGhgDate(application.submittedAt)}</p></div></details></div>}
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3"><span className="text-xs text-slate-500">{dirty ? '수정 후 저장해 주세요.' : '모든 변경사항이 저장되었습니다.'}</span><button onClick={() => void save()} disabled={saving || !dirty} className={BUTTON}>{saving ? '저장 중…' : '변경사항 저장'}</button></footer>
  </section>;
}
