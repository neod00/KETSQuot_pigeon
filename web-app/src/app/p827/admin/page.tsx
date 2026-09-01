'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  calculateP827Days, estimateP827Cost, p827ComplexityLabel, p827EngagementLabel,
  type P827ApplicationInput, type P827RiskAssessment, type StoredP827Application,
} from '@/lib/p827-application';

const EDIT = 'mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100';
const money = (value: number) => `${Math.round(value).toLocaleString('ko-KR')}원`;

export default function P827AdminPage() {
  const [applications, setApplications] = useState<StoredP827Application[]>([]);
  const [selected, setSelected] = useState<StoredP827Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [riskEditing, setRiskEditing] = useState(false);
  const [pricingEditing, setPricingEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/p827/applications', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || '신청서를 불러오지 못했습니다.');
      setApplications(payload.applications);
      setSelected(current => current ? payload.applications.find((item: StoredP827Application) => item.reference === current.reference) || payload.applications[0] : payload.applications[0]);
    } catch (caught) { setError(caught instanceof Error ? caught.message : '신청서를 불러오지 못했습니다.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total: applications.length,
    newCount: applications.filter(item => item.status === '신규 접수').length,
    days: applications.reduce((sum, item) => sum + item.quotedDays, 0),
    value: applications.reduce((sum, item) => sum + item.estimatedCost, 0),
  }), [applications]);

  const save = async (application: P827ApplicationInput, risk?: P827RiskAssessment, pricing?: { quotedDays: number; dayRate: number; applicationFee: number; expenses: number; reason: string }) => {
    if (!selected) return;
    const response = await fetch('/api/p827/applications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reference: selected.reference, application, risk, pricing }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || '저장하지 못했습니다.');
    setApplications(items => items.map(item => item.reference === selected.reference ? payload.application : item));
    setSelected(payload.application); setEditing(false); setRiskEditing(false); setPricingEditing(false);
  };

  const openGenerator = () => {
    if (!selected) return;
    const year = selected.reportingPeriod.match(/20\d{2}/)?.[0] || String(new Date().getFullYear() - 1);
    const deadline = selected.deadline ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' }).format(new Date(`${selected.deadline}T00:00:00`)) : '';
    sessionStorage.setItem('p827_application_draft', JSON.stringify({
      companyName: selected.organisationName,
      clientRepName: selected.contactName,
      hqAddress: selected.contactAddress,
      targetSites: selected.locations || selected.organisationBoundary,
      serviceDesc: selected.objective || p827EngagementLabel(selected.engagementType),
      vYear: year,
      ghgDeclarationPeriod: selected.reportingPeriod,
      assuranceLevel: selected.assuranceLevel === 'reasonable' ? '합리적 보증수준 (Reasonable level of assurance)' : '제한적 보증수준 (Limited level of assurance)',
      materialityLevel: selected.materialityType === 'professional' ? '전문적 판단' : selected.materialityPercent || '5%',
      verificationStandard: /14064/i.test(selected.criteria) ? 'iso14064' : 'isae',
      scope3Categories: selected.scope3Categories,
      s1Days: selected.stage1Days,
      s2Days: selected.stage2Days,
      s3Days: selected.stage3Days,
      auditRate: selected.dayRate,
      expenses: selected.expenses,
      appFeeAmount: selected.applicationFee,
      appFeeType: selected.applicationFee > 0 ? 'charged' : 'exempt',
      reportingDeadline: deadline,
      manualFinalCost: selected.estimatedCost,
      isManualCost: true,
    }));
    window.location.href = '/system';
  };

  return <main className="min-h-screen bg-[#f3f6f8] text-slate-950">
    <header className="bg-[#071526] text-white"><div className="mx-auto max-w-[1500px] px-5 py-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Internal review workspace</p><h1 className="mt-1 text-2xl font-black">P827 신청·견적 관리</h1></div><div className="flex gap-2"><Link href="/p827" className="rounded-lg border border-white/20 px-3 py-2 text-sm font-bold">고객 신청서 열기</Link><Link href="/system" className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-950">견적·계약 생성기</Link></div></div><div className="mt-7 grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-4"><Stat label="전체 신청" value={`${stats.total}건`} /><Stat label="신규 접수" value={`${stats.newCount}건`} /><Stat label="예상 검증일" value={`${stats.days.toFixed(1)}일`} /><Stat label="예상 공급가" value={money(stats.value)} /></div></div></header>
    <div className="mx-auto max-w-[1500px] px-5 py-7">
      {error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</p>}
      <div className="grid items-start gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b p-5"><div><h2 className="text-lg font-black">접수된 P827 신청서</h2><p className="mt-1 text-sm text-slate-500">업체를 선택하면 신청내용·산정근거·내부 위험분석을 확인할 수 있습니다.</p></div><button type="button" onClick={load} className="rounded-lg border px-3 py-2 text-sm font-bold">새로고침</button></div><div className="overflow-x-auto"><table className="min-w-[820px] w-full text-left text-sm"><thead className="bg-slate-100 text-xs text-slate-500"><tr><Th>접수번호 / 일시</Th><Th>업체</Th><Th>업무</Th><Th>복잡도</Th><Th>검증일수</Th><Th>예상비용</Th><Th>상태</Th></tr></thead><tbody>{loading ? <tr><td colSpan={7} className="p-10 text-center text-slate-500">불러오는 중...</td></tr> : applications.length === 0 ? <tr><td colSpan={7} className="p-10 text-center text-slate-500">접수된 신청서가 없습니다.</td></tr> : applications.map(item => <tr key={item.reference} onClick={() => setSelected(item)} className={`cursor-pointer border-t hover:bg-blue-50 ${selected?.reference === item.reference ? 'bg-blue-50' : ''}`}><Td><strong>{item.reference}</strong><span className="mt-1 block text-xs text-slate-500">{formatDate(item.submittedAt)}</span></Td><Td><strong>{item.organisationName}</strong><span className="mt-1 block text-xs text-slate-500">{item.contactName}</span></Td><Td>{p827EngagementLabel(item.engagementType)}</Td><Td><Badge>{p827ComplexityLabel(item.complexity)}</Badge></Td><Td><strong>{item.quotedDays.toFixed(1)}일</strong></Td><Td className="font-bold">{money(item.estimatedCost)}</Td><Td><Badge>{item.status}</Badge></Td></tr>)}</tbody></table></div></section>
        <aside className="xl:sticky xl:top-5">{selected ? <div className="space-y-5"><DetailCard application={selected} onEdit={() => setEditing(true)} onRisk={() => setRiskEditing(true)} onPricing={() => setPricingEditing(true)} onGenerate={openGenerator} /></div> : <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-slate-500">신청서를 선택해 주세요.</div>}</aside>
      </div>
    </div>
    {selected && editing && <ApplicationEditor application={selected} onClose={() => setEditing(false)} onSave={value => save(value)} />}
    {selected && riskEditing && <RiskEditor application={selected} onClose={() => setRiskEditing(false)} onSave={risk => save(selected, risk)} />}
    {selected && pricingEditing && <PricingEditor application={selected} onClose={() => setPricingEditing(false)} onSave={pricing => save(selected, undefined, pricing)} />}
  </main>;
}

function DetailCard({ application, onEdit, onRisk, onPricing, onGenerate }: { application: StoredP827Application; onEdit: () => void; onRisk: () => void; onPricing: () => void; onGenerate: () => void }) {
  const calc = calculateP827Days(application);
  return <>
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="border-b p-5"><p className="text-xs font-black uppercase tracking-wider text-blue-700">{application.reference}</p><h2 className="mt-2 text-2xl font-black">{application.organisationName}</h2><p className="mt-1 text-sm text-slate-500">{application.contactName} · {application.email} · {application.phone}</p><button onClick={onEdit} className="mt-4 w-full rounded-xl border px-4 py-2.5 text-sm font-black">신청서 열람·수정</button></div><div className="p-5"><h3 className="text-xs font-black uppercase tracking-wider text-slate-500">예비 검증일수</h3><div className="mt-3 grid grid-cols-4 gap-2 text-center"><Day label="Stage 1" value={application.stage1Days} /><Day label="Stage 2" value={application.stage2Days} /><Day label="Stage 3" value={application.stage3Days} /><Day label="견적" value={application.quotedDays} accent /></div><div className="mt-4 rounded-xl bg-slate-950 p-4 text-white"><div className="flex items-end justify-between"><div><p className="text-xs text-slate-400">복잡도 / 원시일수</p><p className="mt-1 font-black">{p827ComplexityLabel(application.complexity)} · {application.rawDays.toFixed(2)}일</p></div><p className="text-lg font-black text-emerald-300">{application.quotedDays.toFixed(1)}일</p></div></div><h3 className="mt-5 text-xs font-black uppercase tracking-wider text-slate-500">산정근거</h3><ol className="mt-2 space-y-2">{calc.basis.map((item,index) => <li key={`${item}-${index}`} className="flex gap-2 rounded-lg bg-slate-50 p-3 text-xs leading-5"><strong className="text-blue-700">{String(index + 1).padStart(2,'0')}</strong><span>{item}</span></li>)}</ol></div></section>
    <section className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="text-xs font-black uppercase tracking-wider text-slate-500">신청 범위</h3><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><Info label="목적" value={application.objective || '-'} /><Info label="검증기준" value={application.criteria || '-'} /><Info label="대상기간" value={application.reportingPeriod || '-'} /><Info label="사업장" value={application.locations || '-'} /><Info label="보증수준" value={application.assuranceLevel === 'limited' ? '제한적' : '합리적'} /><Info label="Scope" value={[application.scope1 && '1',application.scope2 && '2',application.scope3 && '3'].filter(Boolean).join(', ') || '-'} /></dl></section>
    <section className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Business Risk Analysis</h3><button onClick={onRisk} className="text-xs font-black text-blue-700">평가·수정</button></div><div className="mt-3 grid grid-cols-3 gap-2 text-center"><Risk label="상업" value={application.commercialLevel} /><Risk label="평판" value={application.reputationalLevel} /><Risk label="책임" value={application.liabilityLevel} /></div></section>
    <section className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="text-xs font-black uppercase tracking-wider text-slate-500">비용·문서 생성</h3><div className="mt-3 rounded-xl bg-emerald-50 p-4"><p className="text-xs font-bold text-emerald-800">{application.quotedDays.toFixed(1)} MD × {money(application.dayRate)} + 신청비 {money(application.applicationFee)} + 제경비 {money(application.expenses)}</p><p className="mt-1 text-xl font-black text-emerald-950">{money(application.estimatedCost)}</p></div><button onClick={onPricing} className="mt-3 w-full rounded-xl border border-emerald-700 px-4 py-3 text-sm font-black text-emerald-800">심사일수·단가·제경비 조정</button><button onClick={onGenerate} className="mt-3 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">견적·계약 생성기로 보내기</button></section>
  </>;
}

function ApplicationEditor({ application, onClose, onSave }: { application: StoredP827Application; onClose: () => void; onSave: (value: P827ApplicationInput) => Promise<void> }) {
  const [form,setForm] = useState<P827ApplicationInput>({ ...application, scope3Categories: [...application.scope3Categories], ghgGases: [...application.ghgGases], emissionScopeOptions: [...application.emissionScopeOptions] });
  const [saving,setSaving] = useState(false); const [error,setError] = useState('');
  const update = <K extends keyof P827ApplicationInput>(key: K,value: P827ApplicationInput[K]) => setForm(current => ({...current,[key]:value}));
  const submit = async (event:FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await onSave(form); } catch(caught) { setError(caught instanceof Error ? caught.message : '저장하지 못했습니다.'); } finally { setSaving(false); } };
  return <Modal title="신청서 열람·수정" reference={application.reference} onClose={onClose}><form onSubmit={submit}><div className="grid gap-4 p-6 sm:grid-cols-2"><Edit label="회사명 *"><input required className={EDIT} value={form.organisationName} onChange={e=>update('organisationName',e.target.value)} /></Edit><Edit label="담당자 *"><input required className={EDIT} value={form.contactName} onChange={e=>update('contactName',e.target.value)} /></Edit><Edit label="이메일 *"><input required type="email" className={EDIT} value={form.email} onChange={e=>update('email',e.target.value)} /></Edit><Edit label="전화번호 *"><input required className={EDIT} value={form.phone} onChange={e=>update('phone',e.target.value)} /></Edit><div className="sm:col-span-2"><Edit label="주소"><input className={EDIT} value={form.contactAddress} onChange={e=>update('contactAddress',e.target.value)} /></Edit></div><div className="sm:col-span-2"><Edit label="검증 목적"><textarea className={`${EDIT} min-h-20`} value={form.objective} onChange={e=>update('objective',e.target.value)} /></Edit></div><Edit label="대상 사업장"><textarea className={`${EDIT} min-h-20`} value={form.locations} onChange={e=>update('locations',e.target.value)} /></Edit><Edit label="검증 기준"><input className={EDIT} value={form.criteria} onChange={e=>update('criteria',e.target.value)} /></Edit><Edit label="대상 기간"><input className={EDIT} value={form.reportingPeriod} onChange={e=>update('reportingPeriod',e.target.value)} /></Edit><Edit label="검증의견서 기한"><input type="date" className={EDIT} value={form.deadline} onChange={e=>update('deadline',e.target.value)} /></Edit><Edit label="보증 수준"><select className={EDIT} value={form.assuranceLevel} onChange={e=>update('assuranceLevel',e.target.value as P827ApplicationInput['assuranceLevel'])}><option value="limited">제한적</option><option value="reasonable">합리적</option></select></Edit><Edit label="업무 유형"><select className={EDIT} value={form.engagementType} onChange={e=>update('engagementType',e.target.value as P827ApplicationInput['engagementType'])}><option value="organisation_verification">조직 데이터·정보 검증</option><option value="project_validation">프로젝트 타당성평가</option><option value="project_verification">프로젝트 검증</option><option value="project_validation_verification">타당성평가 및 검증</option></select></Edit><div className="sm:col-span-2"><Edit label="추가 정보"><textarea className={`${EDIT} min-h-28`} value={form.additionalInfo} onChange={e=>update('additionalInfo',e.target.value)} /></Edit></div></div><Footer error={error}><button disabled={saving} className="rounded-xl bg-blue-800 px-5 py-3 text-sm font-black text-white">{saving?'저장 중...':'수정 저장 및 재산정'}</button></Footer></form></Modal>;
}

function RiskEditor({ application,onClose,onSave }:{ application:StoredP827Application; onClose:()=>void; onSave:(risk:P827RiskAssessment)=>Promise<void> }) {
  const [risk,setRisk] = useState<P827RiskAssessment>({ commercialLevel:application.commercialLevel,commercialReason:application.commercialReason,reputationalLevel:application.reputationalLevel,reputationalReason:application.reputationalReason,liabilityLevel:application.liabilityLevel,liabilityReason:application.liabilityReason }); const [saving,setSaving]=useState(false); const [error,setError]=useState('');
  const submit=async(event:FormEvent)=>{event.preventDefault();setSaving(true);setError('');try{await onSave(risk);}catch(caught){setError(caught instanceof Error?caught.message:'저장하지 못했습니다.');}finally{setSaving(false);}};
  return <Modal title="Business Risk Analysis" reference={application.reference} onClose={onClose}><form onSubmit={submit}><div className="space-y-5 p-6">{([['commercial','상업적 위험'],['reputational','평판 위험'],['liability','오류·누락 책임 위험']] as const).map(([key,label])=><div key={key} className="rounded-xl border p-4"><Edit label={label}><select className={EDIT} value={risk[`${key}Level`]} onChange={e=>setRisk(current=>({...current,[`${key}Level`]:e.target.value}))}><option value="unassessed">미평가</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Edit><textarea className={`${EDIT} min-h-20`} placeholder="판단 근거" value={risk[`${key}Reason`]} onChange={e=>setRisk(current=>({...current,[`${key}Reason`]:e.target.value}))} /></div>)}</div><Footer error={error}><button disabled={saving} className="rounded-xl bg-blue-800 px-5 py-3 text-sm font-black text-white">{saving?'저장 중...':'위험분석 저장'}</button></Footer></form></Modal>;
}

function PricingEditor({ application,onClose,onSave }:{ application:StoredP827Application; onClose:()=>void; onSave:(pricing:{quotedDays:number;dayRate:number;applicationFee:number;expenses:number;reason:string})=>Promise<void> }) {
  const [days,setDays]=useState(String(application.quotedDays)); const [rate,setRate]=useState(String(application.dayRate)); const [fee,setFee]=useState(String(application.applicationFee)); const [expenses,setExpenses]=useState(String(application.expenses)); const [reason,setReason]=useState(application.pricingAdjustmentReason); const [saving,setSaving]=useState(false); const [error,setError]=useState(''); const number=(value:string)=>Number(value.replace(/,/g,''));
  const submit=async(event:FormEvent)=>{event.preventDefault();setSaving(true);setError('');try{await onSave({quotedDays:number(days),dayRate:number(rate),applicationFee:number(fee),expenses:number(expenses),reason});}catch(caught){setError(caught instanceof Error?caught.message:'저장하지 못했습니다.');}finally{setSaving(false);}};
  return <Modal title="일수·단가 내부 조정" reference={application.reference} onClose={onClose}><form onSubmit={submit}><div className="space-y-4 p-6"><p className="rounded-xl bg-slate-100 p-4 text-sm">자동 산정일수 <strong className="ml-2">{(application.automaticQuotedDays ?? calculateP827Days(application).quotedDays).toFixed(1)}일</strong></p><Edit label="최종 검증일수 (MD)"><input required min="0.5" step="0.5" type="number" className={EDIT} value={days} onChange={e=>setDays(e.target.value)} /></Edit><Edit label="MD 단가"><input required min="0" type="number" className={EDIT} value={rate} onChange={e=>setRate(e.target.value)} /></Edit><Edit label="신청비"><input required min="0" type="number" className={EDIT} value={fee} onChange={e=>setFee(e.target.value)} /></Edit><Edit label="제경비·출장비"><input required min="0" type="number" className={EDIT} value={expenses} onChange={e=>setExpenses(e.target.value)} /></Edit><Edit label="조정 사유"><textarea className={`${EDIT} min-h-20`} value={reason} onChange={e=>setReason(e.target.value)} /></Edit><p className="rounded-xl bg-emerald-50 p-4 font-black text-emerald-950">예상 공급가 {money(estimateP827Cost(number(days),number(rate),number(fee),number(expenses)))}</p></div><Footer error={error}><button disabled={saving} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white">{saving?'저장 중...':'조정 조건 저장'}</button></Footer></form></Modal>;
}

function Modal({title,reference,onClose,children}:{title:string;reference:string;onClose:()=>void;children:React.ReactNode}){return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 p-4 sm:p-8"><div className="mx-auto max-w-4xl rounded-2xl bg-white shadow-2xl"><header className="flex items-start justify-between border-b p-6"><div><p className="text-xs font-black uppercase tracking-wider text-blue-700">{reference}</p><h2 className="mt-1 text-2xl font-black">{title}</h2></div><button onClick={onClose} className="rounded-lg border px-3 py-2 text-sm font-bold">닫기</button></header>{children}</div></div>}
function Footer({error,children}:{error:string;children:React.ReactNode}){return <div className="flex items-center justify-between gap-3 border-t p-6">{error?<p className="text-sm font-bold text-red-700">{error}</p>:<span />}{children}</div>}
function Edit({label,children}:{label:string;children:React.ReactNode}){return <label className="block text-sm font-bold text-slate-700">{label}{children}</label>}
function Stat({label,value}:{label:string;value:string}){return <div className="bg-white/5 p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>}
function Th({children}:{children:React.ReactNode}){return <th className="whitespace-nowrap px-4 py-3 font-black">{children}</th>}
function Td({children,className=''}:{children:React.ReactNode;className?:string}){return <td className={`px-4 py-4 align-top ${className}`}>{children}</td>}
function Badge({children}:{children:React.ReactNode}){return <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-800">{children}</span>}
function Day({label,value,accent=false}:{label:string;value:number;accent?:boolean}){return <div className={`rounded-lg p-2 ${accent?'bg-blue-800 text-white':'bg-slate-100'}`}><p className="text-[10px] font-bold opacity-70">{label}</p><p className="mt-1 font-black">{value.toFixed(2)}</p></div>}
function Info({label,value}:{label:string;value:string}){return <div><dt className="text-xs font-bold text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-line font-semibold">{value}</dd></div>}
function Risk({label,value}:{label:string;value:StoredP827Application['commercialLevel']}){const text={unassessed:'미평가',low:'Low',medium:'Medium',high:'High'}[value];return <div className="rounded-lg bg-slate-100 p-3"><p className="text-[10px] font-bold text-slate-500">{label}</p><p className="mt-1 text-sm font-black">{text}</p></div>}
function formatDate(value:string){return new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Seoul'}).format(new Date(value))}
