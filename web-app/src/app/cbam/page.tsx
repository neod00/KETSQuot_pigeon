'use client';

import { FormEvent, useState } from 'react';
import {
  CBAM_GOODS,
  MANAGEMENT_SYSTEMS,
  createDefaultCbamApplication,
  type CbamApplicationInput,
} from '@/lib/cbam';

const FIELD = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100';
const LABEL = 'text-sm font-semibold text-slate-800';

export default function CbamApplicationPage() {
  const [form, setForm] = useState<CbamApplicationInput>(() => createDefaultCbamApplication());
  const [submittedReference, setSubmittedReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const update = <K extends keyof CbamApplicationInput>(key: K, value: CbamApplicationInput[K]) =>
    setForm(current => ({ ...current, [key]: value }));

  const toggleList = (key: 'verificationYears' | 'cbamGoods' | 'managementSystems', value: string) => {
    setForm(current => {
      const values = current[key];
      return { ...current, [key]: values.includes(value) ? values.filter(item => item !== value) : [...values, value] };
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.consent) {
      setError('개인정보 처리 및 신청정보 제공 동의가 필요합니다.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/cbam/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || '신청서를 접수하지 못했습니다.');
      setSubmittedReference(result.application.reference);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '신청서를 접수하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedReference) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-16 text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur">
          <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal-400 text-2xl text-slate-950">✓</div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-teal-300">Application received</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">CBAM 서비스 신청이 접수되었습니다.</h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">접수번호는 <strong className="text-white">{submittedReference}</strong>입니다.</p>
          <div className="mt-8 border-l-4 border-teal-400 bg-white/10 px-5 py-4 text-sm leading-7 text-slate-200">제출된 정보를 바탕으로 LRQA 담당자가 검증 범위와 필요 일수를 검토한 후 일정 및 견적을 안내해 드립니다.</div>
          <button onClick={() => { setForm(createDefaultCbamApplication()); setSubmittedReference(''); }} className="mt-8 rounded-xl bg-teal-400 px-5 py-3 font-bold text-slate-950 hover:bg-teal-300">새 신청서 작성</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f5] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-teal-700">LRQA Korea · CBAM Services</p>
            <p className="mt-1 text-lg font-black">탄소국경조정제도 서비스 신청</p>
          </div>
          <img src="/lrqa-logo.png" alt="LRQA" className="h-12 w-auto bg-slate-950 p-2" />
        </div>
      </header>

      <section className="overflow-hidden bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-teal-300">Carbon Border Adjustment Mechanism</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">CBAM 검증 준비를<br />신청 단계부터 구조화합니다.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">EU 수입자와 제3국 제조사업자의 데이터 범위, CN 코드, 생산공정, MMD 및 연료흐름을 한 번에 접수합니다. 입력 내용은 검증 복잡도와 예비 검증일수 산정에 사용됩니다.</p>
          </div>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/15">
            {[['01', '신청'], ['02', '검토·산정'], ['03', '견적·계약']].map(([number, label]) => <div key={number} className="bg-white/5 p-5"><p className="text-2xl font-black text-teal-300">{number}</p><p className="mt-2 text-sm font-bold">{label}</p></div>)}
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid items-start gap-7 lg:grid-cols-[1fr_330px]">
          <div className="space-y-7">
            <FormSection number="01" title="고객 및 업무 정보" subtitle="Client details & service required">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="고객 유형">
                  <select className={FIELD} value={form.clientType} onChange={e => update('clientType', e.target.value as CbamApplicationInput['clientType'])}>
                    <option value="operator">제3국 제조사업자</option><option value="importer">EU 수입자/CBAM 신고자</option>
                  </select>
                </Field>
                <Field label="요청 서비스">
                  <select className={FIELD} value={form.serviceType} onChange={e => update('serviceType', e.target.value as CbamApplicationInput['serviceType'])}>
                    <option value="pre_verification">사전검증(갭 분석)</option><option value="verification">CBAM 검증</option><option value="other">기타 자문</option>
                  </select>
                </Field>
                <Field label="회사명 *"><input required className={FIELD} value={form.companyName} onChange={e => update('companyName', e.target.value)} /></Field>
                <Field label="담당자명 *"><input required className={FIELD} value={form.contactName} onChange={e => update('contactName', e.target.value)} /></Field>
                <Field label="이메일 *"><input required type="email" className={FIELD} value={form.email} onChange={e => update('email', e.target.value)} /></Field>
                <Field label="전화번호 *"><input required className={FIELD} value={form.phone} onChange={e => update('phone', e.target.value)} /></Field>
                <Field label="등록 국가"><input className={FIELD} value={form.country} onChange={e => update('country', e.target.value)} /></Field>
                <Field label="검증 대상 사업장"><input className={FIELD} placeholder="사업장명, 도시, 국가" value={form.sites} onChange={e => update('sites', e.target.value)} /></Field>
                <div className="sm:col-span-2"><Field label="연락 주소"><input className={FIELD} value={form.address} onChange={e => update('address', e.target.value)} /></Field></div>
              </div>
            </FormSection>

            <FormSection number="02" title="검증 범위" subtitle="Scope & CBAM goods">
              <ChoiceGroup label="검증 대상 데이터 연도" options={['2024','2025','2026','2027','2028','2029','2030','2031']} selected={form.verificationYears} onToggle={value => toggleList('verificationYears', value)} />
              <div className="mt-6"><ChoiceGroup label="CBAM 상품 유형" options={CBAM_GOODS} selected={form.cbamGoods} onToggle={value => toggleList('cbamGoods', value)} /></div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="8자리 CN 코드"><textarea className={`${FIELD} min-h-24`} placeholder="예: 7213 10 00 (여러 개는 줄바꿈)" value={form.cnCodes} onChange={e => update('cnCodes', e.target.value)} /></Field>
                <Field label="예상 내재배출량 (ktCO₂e)"><input type="number" min="0" step="0.01" className={FIELD} value={form.embeddedEmissionsKt} onChange={e => update('embeddedEmissionsKt', e.target.value)} /></Field>
                <Field label="관련 CBAM 상품 사업자 수"><input type="number" min="0" className={FIELD} value={form.operatorCount} onChange={e => update('operatorCount', e.target.value)} /></Field>
                <Field label="관련 CBAM 상품 수"><input type="number" min="0" className={FIELD} value={form.goodsCount} onChange={e => update('goodsCount', e.target.value)} /></Field>
                <Field label="관련 생산공정 수"><input type="number" min="0" className={FIELD} value={form.processCount} onChange={e => update('processCount', e.target.value)} /></Field>
                <Field label="상품 구성"><select className={FIELD} value={form.goodsComplexity} onChange={e => update('goodsComplexity', e.target.value as CbamApplicationInput['goodsComplexity'])}><option value="simple">단순 상품</option><option value="complex">복합 상품</option><option value="both">단순 + 복합 상품</option></select></Field>
              </div>
            </FormSection>

            <FormSection number="03" title="데이터 관리" subtitle="Data management">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="데이터 보관 위치"><input className={FIELD} placeholder="예: 본사 ERP, 사업장 서버" value={form.dataLocation} onChange={e => update('dataLocation', e.target.value)} /></Field>
                <Field label="원자료 수집·처리·보고 담당 인원"><input type="number" min="0" className={FIELD} value={form.dataPersonnel} onChange={e => update('dataPersonnel', e.target.value)} /></Field>
                <Field label="데이터 디지털화 및 원격 접근"><select className={FIELD} value={form.remoteAccess} onChange={e => update('remoteAccess', e.target.value as CbamApplicationInput['remoteAccess'])}><option value="yes">예</option><option value="partial">부분적으로 가능</option><option value="no">아니요</option></select></Field>
                <Field label="EU 커뮤니케이션 템플릿 사용"><select className={FIELD} value={form.communicationTemplate} onChange={e => update('communicationTemplate', e.target.value as CbamApplicationInput['communicationTemplate'])}><option value="all">모든 사업자 사용</option><option value="partial">일부만 사용</option><option value="none">사용하지 않음</option></select></Field>
              </div>
              <div className="mt-6"><ChoiceGroup label="구축·인증된 경영시스템" options={MANAGEMENT_SYSTEMS} selected={form.managementSystems} onToggle={value => toggleList('managementSystems', value)} /></div>
            </FormSection>

            <FormSection number="04" title="생산·배출 및 검증 준비도" subtitle="Fuel streams, emissions & readiness">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="MMD(모니터링 방법론 문서)"><select className={FIELD} value={form.mmdStatus} onChange={e => update('mmdStatus', e.target.value as CbamApplicationInput['mmdStatus'])}><option value="clear">제공 가능하며 명확함</option><option value="complex">제공 가능하나 복잡/불명확</option><option value="none">미제공/미작성</option><option value="not_applicable">해당 없음(수입자)</option></select></Field>
                <Field label="관할권 탄소가격 정보 관련"><select className={FIELD} value={form.carbonPrice} onChange={e => update('carbonPrice', e.target.value as CbamApplicationInput['carbonPrice'])}><option value="no">아니요</option><option value="yes">예</option></select></Field>
                <Field label="내재배출량 기존 인정 검증"><select className={FIELD} value={form.previouslyVerified} onChange={e => update('previouslyVerified', e.target.value as CbamApplicationInput['previouslyVerified'])}><option value="no">아니요</option><option value="yes">예</option></select></Field>
                <Field label="바이오매스 연료흐름"><select className={FIELD} value={form.biomass} onChange={e => update('biomass', e.target.value as CbamApplicationInput['biomass'])}><option value="none">없음</option><option value="used_red_compliant">사용, RED II 기준 충족 자료 있음</option><option value="used_review_needed">사용, 기준 충족 검토 필요</option></select></Field>
                <Field label="생산공정 설명"><textarea className={`${FIELD} min-h-28`} value={form.productionProcesses} onChange={e => update('productionProcesses', e.target.value)} /></Field>
                <Field label="연료흐름 설명"><textarea className={`${FIELD} min-h-28`} value={form.fuelStreams} onChange={e => update('fuelStreams', e.target.value)} /></Field>
              </div>
              <div className="mt-5 flex flex-wrap gap-4">
                <Check checked={form.chp} onChange={value => update('chp', value)} label="열병합발전(CHP) 포함" />
                <Check checked={form.knownClient} onChange={value => update('knownClient', value)} label="LRQA 기존 검증팀이 알고 있는 고객" />
              </div>
            </FormSection>

            <FormSection number="05" title="추가 정보 및 동의" subtitle="Additional information & consent">
              <Field label="추가 참고사항"><textarea className={`${FIELD} min-h-32`} value={form.notes} onChange={e => update('notes', e.target.value)} /></Field>
              <div className="mt-6 rounded-xl bg-slate-100 p-4 text-sm leading-6 text-slate-700">접수된 정보는 CBAM 서비스 적격성 확인, 검증팀 구성, 예비 검증일수 및 견적 산정에 사용됩니다. 제출 자료가 불완전하거나 실제 범위가 다른 경우 검증일수와 비용이 변경될 수 있습니다.</div>
              <div className="mt-5"><Check checked={form.consent} onChange={value => update('consent', value)} label="개인정보 처리 및 신청정보의 업무상 이용에 동의합니다. *" /></div>
              {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
              <button disabled={submitting} className="mt-7 w-full rounded-xl bg-teal-700 px-5 py-4 text-base font-black text-white shadow-lg hover:bg-teal-800 disabled:opacity-50">{submitting ? '접수 중...' : 'CBAM 서비스 신청서 제출'}</button>
            </FormSection>
          </div>

          <aside className="lg:sticky lg:top-5">
            <div className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-xl">
              <div className="border-b border-white/10 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">CBAM resources</p>
                <h2 className="mt-2 text-xl font-black">CBAM 준비 자료</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">신청 전 참고할 수 있는 LRQA 공식 안내 자료입니다.</p>
              </div>
              <nav aria-label="CBAM 참고 자료" className="divide-y divide-white/10">
                <ResourceLink title="CBAM 제도 및 LRQA 지원 서비스" description="적용 대상, 시행 일정과 LRQA 지원 범위를 확인합니다." href="https://www.lrqa.com/ko-kr/carbon-border-adjustment-mechanism-cbam/" />
                <ResourceLink title="기업이 놓치기 쉬운 5가지 준비사항" description="데이터, 공급망 및 검증 준비 과정의 주요 리스크를 살펴봅니다." href="https://www.lrqa.com/ko-kr/insights/articles/five-things-companies-overlook-when-preparing-for-cbam/" />
                <ResourceLink title="CBAM 시행 일정 한눈에 보기" description="주요 규제 일정과 단계별 대응 과제를 확인합니다." href="https://www.lrqa.com/ko-kr/resources/cbam-timeline-infographic/" />
              </nav>
            </div>
            <div className="mt-4 border-l-4 border-teal-600 bg-white p-5 text-sm leading-6 text-slate-700 shadow-sm">제출된 정보를 바탕으로 LRQA 담당자가 검증 범위와 필요 일수를 검토한 후 일정 및 견적을 안내해 드립니다.</div>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs leading-5 text-amber-900"><strong className="block text-sm">2026 규정 안내</strong>실제값 검증은 EU 국가 인정기관이 인정한 독립 검증자가 수행해야 합니다. 본 신청은 계약 및 검증 착수 전 적격성 검토 단계입니다.</div>
          </aside>
        </div>
      </form>
    </main>
  );
}

function FormSection({ number, title, subtitle, children }: { number: string; title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-start gap-4 border-b border-slate-200 px-6 py-5"><span className="text-2xl font-black text-teal-700">{number}</span><div><h2 className="text-xl font-black tracking-tight">{title}</h2><p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{subtitle}</p></div></div><div className="p-6">{children}</div></section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className={LABEL}>{label}</span>{children}</label>; }

function ChoiceGroup({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <fieldset><legend className={LABEL}>{label}</legend><div className="mt-3 flex flex-wrap gap-2">{options.map(option => <label key={option} className={`cursor-pointer rounded-full border px-3 py-2 text-sm font-bold transition ${selected.includes(option) ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-teal-500'}`}><input className="sr-only" type="checkbox" checked={selected.includes(option)} onChange={() => onToggle(option)} />{option}</label>)}</div></fieldset>;
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold text-slate-800"><input className="mt-0.5 h-4 w-4 accent-teal-700" type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /><span>{label}</span></label>;
}

function ResourceLink({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="group block p-6 transition hover:bg-white/10 focus:bg-white/10 focus:outline-none">
      <span className="flex items-start justify-between gap-4">
        <span>
          <span className="block font-bold text-white">{title}</span>
          <span className="mt-2 block text-sm leading-6 text-slate-300">{description}</span>
        </span>
        <span aria-hidden="true" className="text-lg font-bold text-teal-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
      </span>
    </a>
  );
}
