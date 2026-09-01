'use client';

import { FormEvent, useState } from 'react';
import {
  P827_GHG_GASES, P827_SCOPE3_CATEGORIES, createDefaultP827Application,
  type P827ApplicationInput,
} from '@/lib/p827-application';

const INPUT = 'w-full border-0 bg-white px-3 py-2.5 text-sm outline-none focus:bg-blue-50';
const CHECK = 'h-4 w-4 accent-[#0a4a7a]';

export default function P827ApplicationPage() {
  const [form, setForm] = useState<P827ApplicationInput>(() => createDefaultP827Application());
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const update = <K extends keyof P827ApplicationInput>(key: K, value: P827ApplicationInput[K]) => setForm(current => ({ ...current, [key]: value }));
  const toggle = (key: 'ghgGases' | 'emissionScopeOptions', value: string) => setForm(current => ({ ...current, [key]: current[key].includes(value) ? current[key].filter(item => item !== value) : [...current[key], value] }));

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setSubmitting(true);
    try {
      const response = await fetch('/api/p827/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || '신청서를 접수하지 못했습니다.');
      setReference(payload.application.reference);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (caught) { setError(caught instanceof Error ? caught.message : '신청서를 접수하지 못했습니다.'); }
    finally { setSubmitting(false); }
  };

  if (reference) return <main className="grid min-h-screen place-items-center bg-slate-950 p-5 text-white"><section className="max-w-xl rounded-2xl border border-white/10 bg-white/5 p-9 shadow-2xl"><div className="mb-6 grid h-12 w-12 place-items-center rounded-full bg-emerald-300 text-xl font-black text-slate-950">✓</div><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Application received</p><h1 className="mt-3 text-3xl font-black">P827 신청이 접수되었습니다.</h1><p className="mt-5 leading-7 text-slate-300">접수번호는 <strong className="text-white">{reference}</strong>입니다. 담당자가 범위와 예비 검증일수를 검토한 후 안내드립니다.</p><button type="button" onClick={() => { setReference(''); setForm(createDefaultP827Application()); }} className="mt-7 rounded-lg bg-emerald-300 px-4 py-3 font-black text-slate-950">새 신청서 작성</button></section></main>;

  return <main className="min-h-screen bg-[#edf1f3] px-3 py-8 text-slate-950 sm:px-6">
    <form onSubmit={submit} className="mx-auto max-w-[1040px] bg-white px-4 py-7 shadow-xl sm:px-10">
      <header className="mb-1 flex items-start gap-5">
        <div className="grid h-24 w-24 shrink-0 place-items-center border-[3px] border-[#68bfa8] bg-white"><img src="/lrqa-logo.png" alt="LRQA" className="w-20 bg-slate-950 p-2" /></div>
        <div className="flex min-h-24 flex-1 items-center justify-center border border-slate-950 px-5 text-center"><h1 className="text-xl font-black leading-tight text-[#0a4a7a] sm:text-2xl">P827 Data and Information Verification<br />Client information and business risk enquiry form</h1></div>
      </header>

      <SectionTitle>Client Details · 고객 정보</SectionTitle>
      <TableRow label="Organisation name / 회사명 *"><input required className={INPUT} value={form.organisationName} onChange={e => update('organisationName', e.target.value)} /></TableRow>
      <TableRow label="Contact for future correspondence / 담당자 *"><input required className={INPUT} value={form.contactName} onChange={e => update('contactName', e.target.value)} /></TableRow>
      <TableRow label="Contact address / 연락 주소"><input className={INPUT} value={form.contactAddress} onChange={e => update('contactAddress', e.target.value)} /></TableRow>
      <TableRow label="Contact phone number / 전화번호 *"><input required className={INPUT} value={form.phone} onChange={e => update('phone', e.target.value)} /></TableRow>
      <TableRow label="Contact e-mail / 이메일 *"><input required type="email" className={INPUT} value={form.email} onChange={e => update('email', e.target.value)} /></TableRow>

      <div className="mt-5"><SectionTitle>Terms of Engagement · 검증 업무 조건</SectionTitle></div>
      <TableRow label="Objectives of the Assurance Engagement / 검증 목적"><textarea className={`${INPUT} min-h-28`} placeholder="예: 사업장 온실가스 배출량 검증" value={form.objective} onChange={e => update('objective', e.target.value)} /></TableRow>
      <TableRow label="Organisation / Project boundaries / 조직·프로젝트 경계"><textarea className={`${INPUT} min-h-20`} value={form.organisationBoundary} onChange={e => update('organisationBoundary', e.target.value)} /></TableRow>
      <TableRow label="Legal Ownership / Equity boundaries / 법적 소유·지분 경계"><input className={INPUT} value={form.legalOwnership} onChange={e => update('legalOwnership', e.target.value)} /></TableRow>
      <TableRow label="Financial boundaries / 재무 경계"><input className={INPUT} placeholder="예: 100% 지분 소유" value={form.financialBoundary} onChange={e => update('financialBoundary', e.target.value)} /></TableRow>
      <TableRow label="Operational boundaries / 운영 경계">
        <div className="space-y-3 p-3 text-sm">
          <div className="flex flex-wrap gap-5"><Check label="Scope 1 (Direct emissions)" checked={form.scope1} onChange={value => update('scope1', value)} /><Check label="Scope 2 (Indirect emissions)" checked={form.scope2} onChange={value => update('scope2', value)} /><Check label="Scope 3 (Other indirect emissions)" checked={form.scope3} onChange={value => { update('scope3', value); if (!value) update('scope3Categories', Array(P827_SCOPE3_CATEGORIES.length).fill(false)); }} /></div>
          {form.scope3 && <div className="overflow-hidden border border-slate-500"><div className="grid grid-cols-[46px_1fr_58px] bg-slate-100 text-center text-xs font-black"><span className="border-r border-slate-500 p-2">No.</span><span className="border-r border-slate-500 p-2">Scope 3 배출원</span><span className="p-2">해당</span></div>{P827_SCOPE3_CATEGORIES.map((category, index) => <label key={category} className="grid cursor-pointer grid-cols-[46px_1fr_58px] border-t border-slate-400 text-xs"><span className="border-r border-slate-400 p-2 text-center">{index + 1}</span><span className="border-r border-slate-400 p-2">{category}</span><span className="grid place-items-center"><input className={CHECK} type="checkbox" checked={Boolean(form.scope3Categories[index])} onChange={e => { const next = [...form.scope3Categories]; next[index] = e.target.checked; update('scope3Categories', next); }} /></span></label>)}</div>}
        </div>
      </TableRow>
      <TableRow label="Geographical boundaries / 지역 경계"><input className={INPUT} placeholder="예: 국내, 해외, 글로벌" value={form.geographicalBoundary} onChange={e => update('geographicalBoundary', e.target.value)} /></TableRow>
      <TableRow label="Locations included in boundaries / 포함 사업장"><textarea className={`${INPUT} min-h-20`} placeholder="사업장명과 주소를 줄바꿈으로 입력" value={form.locations} onChange={e => update('locations', e.target.value)} /></TableRow>
      <TableRow label="Exclusions from the engagement / 제외사항"><textarea className={`${INPUT} min-h-20`} value={form.exclusions} onChange={e => update('exclusions', e.target.value)} /></TableRow>
      <TableRow label="Infrastructure / activities / processes / 공정·활동 설명"><textarea className={`${INPUT} min-h-28`} value={form.activitiesProcesses} onChange={e => update('activitiesProcesses', e.target.value)} /></TableRow>
      <TableRow label="Type of Engagement / 업무 유형"><select className={INPUT} value={form.engagementType} onChange={e => update('engagementType', e.target.value as P827ApplicationInput['engagementType'])}><option value="organisation_verification">Organisation Data and/or Information Verification</option><option value="project_validation">Project Validation</option><option value="project_verification">Project Verification</option><option value="project_validation_verification">Project Validation and Verification</option></select></TableRow>
      <TableRow label="Assurance criteria / 검증 기준"><input className={INPUT} placeholder="예: GHG Protocol, ISO 14064-3" value={form.criteria} onChange={e => update('criteria', e.target.value)} /></TableRow>

      <div className="mt-5"><SectionTitle>For GHG · 온실가스 검증 정보</SectionTitle></div>
      <TableRow label="GHGs to be included / 대상 온실가스"><div className="flex flex-wrap gap-4 p-3">{P827_GHG_GASES.map(gas => <Check key={gas} label={gas} checked={form.ghgGases.includes(gas)} onChange={() => toggle('ghgGases', gas)} />)}</div></TableRow>
      <TableRow label="Scope of emissions / 배출·제거 범위"><div className="grid gap-2 p-3 sm:grid-cols-2">{[['claim','Claim only'],['direct','Direct Emissions'],['energy_indirect','Energy Indirect Emissions'],['other_indirect','Other Indirect Emissions'],['removals','Removals']].map(([value,label]) => <Check key={value} label={label} checked={form.emissionScopeOptions.includes(value)} onChange={() => toggle('emissionScopeOptions', value)} />)}</div></TableRow>
      <TableRow label="GHG sources / sinks / reservoirs"><input className={INPUT} value={form.sourcesSinks} onChange={e => update('sourcesSinks', e.target.value)} /></TableRow>
      <TableRow label="Relative size of GHG inventory / 예상 배출량 (tCO₂e)"><input className={INPUT} placeholder="예: 125,000 tCO₂e" value={form.inventorySize} onChange={e => update('inventorySize', e.target.value)} /></TableRow>
      <TableRow label="Assertion / Report title / 보고서 명칭"><input className={INPUT} value={form.reportTitle} onChange={e => update('reportTitle', e.target.value)} /></TableRow>
      <TableRow label="Period of Assertion / Report / 검증 대상기간"><input className={INPUT} placeholder="예: 2025년 1월 1일~12월 31일" value={form.reportingPeriod} onChange={e => update('reportingPeriod', e.target.value)} /></TableRow>
      <TableRow label="Intended User / 의도된 사용자"><textarea className={`${INPUT} min-h-20`} value={form.intendedUsers} onChange={e => update('intendedUsers', e.target.value)} /></TableRow>
      <TableRow label="Level of Assurance / 보증 수준"><select className={INPUT} value={form.assuranceLevel} onChange={e => { const value = e.target.value as P827ApplicationInput['assuranceLevel']; update('assuranceLevel', value); if (value === 'limited') { update('materialityType', 'professional'); update('materialityPercent', ''); } }}><option value="limited">Limited / 제한적 보증</option><option value="reasonable">Reasonable / 합리적 보증</option></select></TableRow>
      <TableRow label="Materiality / 중요성"><div className="grid gap-3 p-3 sm:grid-cols-2"><label className="flex items-center gap-2 text-sm font-semibold"><input type="radio" name="materiality" checked={form.materialityType === 'professional'} onChange={() => { update('materialityType', 'professional'); update('materialityPercent', ''); }} />Qualitative - LRQA professional judgement</label><label className="flex items-center gap-2 text-sm font-semibold"><input type="radio" name="materiality" disabled={form.assuranceLevel === 'limited'} checked={form.materialityType === 'quantitative'} onChange={() => update('materialityType', 'quantitative')} />Quantitative <input disabled={form.materialityType !== 'quantitative'} className="w-20 rounded border px-2 py-1" placeholder="5%" value={form.materialityPercent} onChange={e => update('materialityPercent', e.target.value)} /></label></div></TableRow>
      <TableRow label="Assurance Statement deadline / 검증의견서 기한"><input type="date" className={INPUT} value={form.deadline} onChange={e => update('deadline', e.target.value)} /></TableRow>

      <div className="mt-5"><SectionTitle>Business Risk Analysis · LRQA 내부 작성</SectionTitle></div>
      <div className="border border-t-0 border-slate-950 bg-slate-50 p-4 text-sm leading-6 text-slate-600">상업적 위험, 평판 위험 및 오류·누락에 따른 책임 위험은 신청 접수 후 LRQA 내부 담당자가 평가합니다.</div>

      <div className="mt-5"><SectionTitle>Additional Information · 추가 정보</SectionTitle></div>
      <div className="border border-t-0 border-slate-950 bg-slate-100 p-4 text-sm leading-6"><p className="font-bold">다음 자료와 정보를 자유롭게 기재해 주세요.</p><ul className="mt-2 list-disc pl-5"><li>이전 검증보고서·검증의견서·인증서</li><li>제품, 운영, 자회사 및 합작투자 정보</li><li>ISO 9001·14001 등 인증 경영시스템</li><li>주요 이해관계자와 이미 확인된 중요 이슈</li></ul></div>
      <textarea className="min-h-44 w-full border border-t-0 border-slate-950 p-4 text-sm outline-none focus:bg-blue-50" value={form.additionalInfo} onChange={e => update('additionalInfo', e.target.value)} />

      <div className="mt-6 rounded-lg bg-slate-100 p-4"><Check label="개인정보 처리 및 신청정보의 업무상 이용에 동의합니다. *" checked={form.consent} onChange={value => update('consent', value)} /></div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      <button disabled={submitting} className="mt-5 w-full bg-[#0a4a7a] px-5 py-4 font-black text-white hover:bg-[#073858] disabled:opacity-50">{submitting ? '접수 중...' : 'P827 검증 신청서 제출'}</button>
      <footer className="mt-8 flex justify-between border-t pt-4 text-xs text-slate-500"><span>P827 Product Procedure</span><span>LRQA Korea</span><span>Client information form</span></footer>
    </form>
  </main>;
}

function SectionTitle({ children }: { children: React.ReactNode }) { return <h2 className="border border-slate-950 bg-[#d9d9d9] px-3 py-2 text-base font-black">{children}</h2>; }
function TableRow({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid border-x border-b border-slate-950 sm:grid-cols-[35%_65%]"><div className="border-b border-slate-950 bg-white px-3 py-2 text-sm font-bold sm:border-b-0 sm:border-r">{label}</div><div>{children}</div></div>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input className={CHECK} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /><span>{label}</span></label>; }
