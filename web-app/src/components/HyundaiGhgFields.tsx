'use client';

import { useId, type ReactNode } from 'react';
import { CHANGE_TYPES, SCOPE3_CATEGORIES, getTargetYears, type HyundaiGhgInput } from '@/lib/hyundai-ghg';

export const GHG_INPUT = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base font-normal sm:text-sm text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100';

function Field({ title, children }: { title: string; children: ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-700">{title}{children}</label>;
}

export default function HyundaiGhgFields({ value, onChange, disabled = false, showConsent = false }: { value: HyundaiGhgInput; onChange: (value: HyundaiGhgInput) => void; disabled?: boolean; showConsent?: boolean }) {
  const id = useId();
  const update = <K extends keyof HyundaiGhgInput>(key: K, next: HyundaiGhgInput[K]) => onChange({ ...value, [key]: next });
  const year = new Date().getFullYear();
  const years = Array.from({ length: year - 1998 }, (_, index) => String(year + 1 - index));
  const selectedYears = getTargetYears(value);
  const setYears = (selection: string[]) => {
    const next = [...new Set(selection)].sort();
    onChange({ ...value, targetYears: next, targetYear: next[0] || '' });
  };
  return <fieldset disabled={disabled} className="min-w-0 space-y-7">
    <section aria-labelledby={`${id}-basic`}><h2 id={`${id}-basic`} className="mb-4 text-base font-bold text-slate-950">01. 기본정보</h2><div className="grid gap-4 sm:grid-cols-2">
      <Field title="회사명 *"><input required maxLength={300} autoComplete="organization" className={GHG_INPUT} value={value.companyName} onChange={e => update('companyName', e.target.value)} /></Field>
      <Field title="담당자명 *"><input required maxLength={300} autoComplete="name" className={GHG_INPUT} value={value.contactName} onChange={e => update('contactName', e.target.value)} /></Field>
      <Field title="연락처 *"><input required type="tel" maxLength={300} autoComplete="tel" className={GHG_INPUT} placeholder="010-0000-0000" value={value.phone} onChange={e => update('phone', e.target.value)} /></Field>
      <Field title="이메일 *"><input required type="email" maxLength={300} autoComplete="email" className={GHG_INPUT} placeholder="name@company.com" value={value.email} onChange={e => update('email', e.target.value)} /></Field>
      {value.customerType === 'new' && <div className="sm:col-span-2"><Field title="회사 주소 *"><input required maxLength={300} autoComplete="street-address" className={GHG_INPUT} value={value.address} onChange={e => update('address', e.target.value)} /></Field></div>}
    </div></section>
    <section aria-labelledby={`${id}-scope`} className="border-t border-slate-200 pt-6"><h2 id={`${id}-scope`} className="mb-4 text-base font-bold text-slate-950">02. 검증대상년도 및 범위</h2>
      {value.customerType === 'existing' ? <fieldset aria-describedby={`${id}-years-help`}>
        <legend className="text-sm font-semibold text-slate-700">검증대상년도 *</legend>
        <div className="mt-2 flex min-h-11 max-w-xl flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-100">
          {selectedYears.map(item => <span key={item} className="inline-flex items-center gap-1 rounded-md bg-teal-50 py-1 pl-2.5 pr-1 text-sm font-medium text-teal-900">
            {item}년<button type="button" aria-label={`${item}년 선택 해제`} className="grid h-10 w-10 place-items-center sm:h-6 sm:w-6 rounded text-teal-700 hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700 disabled:cursor-default" onClick={() => setYears(selectedYears.filter(year => year !== item))}><span aria-hidden="true">×</span></button>
          </span>)}
          <select aria-label="검증대상년도 추가" value="" disabled={disabled || selectedYears.length === years.length} onChange={e => { if (e.target.value) setYears([...selectedYears, e.target.value]); }} className="min-h-11 min-w-32 flex-1 sm:min-h-8 border-0 bg-transparent py-1 pl-1 pr-6 text-base text-slate-600 sm:text-sm outline-none sm:flex-none">
            <option value="">{selectedYears.length ? '+ 연도 추가' : '연도 선택'}</option>
            {years.filter(item => !selectedYears.includes(item)).map(item => <option key={item} value={item}>{item}년</option>)}
          </select>
        </div>
        <p id={`${id}-years-help`} className="mt-2 text-xs leading-5 text-slate-500">여러 연도를 추가할 수 있습니다.</p>
        <span aria-live="polite" className="sr-only">{selectedYears.length ? `${selectedYears.length}개년 선택됨` : '선택한 연도가 없습니다.'}</span>
      </fieldset> : <div className="max-w-xs"><Field title="검증대상년도 *"><select required className={GHG_INPUT} value={value.targetYear} onChange={e => onChange({ ...value, targetYear: e.target.value, targetYears: e.target.value ? [e.target.value] : [] })}><option value="">연도를 선택해 주세요</option>{years.map(item => <option key={item} value={item}>{item}년 배출량</option>)}</select></Field></div>}
      <fieldset className="mt-5"><legend className="text-sm font-semibold text-slate-700">이번에 신청하는 검증 범위 * <span className="font-normal text-slate-500">(복수 선택)</span></legend><div className="mt-3 grid gap-3 sm:grid-cols-3">{[1, 2, 3].map(scope => <label key={scope} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 ${value.scopes.includes(scope) ? 'border-teal-600 bg-teal-50' : 'border-slate-200 bg-white'}`}><input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-teal-700" checked={value.scopes.includes(scope)} onChange={e => { const scopes = e.target.checked ? [...value.scopes, scope].sort() : value.scopes.filter(item => item !== scope); onChange({ ...value, scopes, scope3Categories: scopes.includes(3) ? value.scope3Categories : [] }); }} /><span><strong className="block text-sm">Scope {scope}</strong><span className="mt-1 block text-xs text-slate-600">{['직접배출', '전력·열 등 에너지 간접배출', '기타 간접배출'][scope - 1]}</span></span></label>)}</div></fieldset>
      {value.scopes.includes(3) && <fieldset className="mt-5 rounded-lg border border-teal-200 bg-teal-50/40 p-4"><legend className="px-1 text-sm font-semibold text-teal-900">Scope 3 검증대상 카테고리 *</legend><p className="mb-3 text-xs leading-5 text-slate-600">이번 검증에 포함하려는 카테고리를 하나 이상 선택해 주세요.</p><div className="grid gap-2 sm:grid-cols-2">{SCOPE3_CATEGORIES.map(category => <label key={category.id} className="flex min-h-11 cursor-pointer items-start gap-2 rounded-md bg-white p-2.5 text-xs leading-5 text-slate-700"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-teal-700" checked={value.scope3Categories.includes(category.id)} onChange={e => update('scope3Categories', e.target.checked ? [...value.scope3Categories, category.id] : value.scope3Categories.filter(item => item !== category.id))} /><span><strong className="mr-1 text-teal-800">{category.id}.</strong>{category.label.replace(/ [A-Z].*$/, '')}</span></label>)}</div></fieldset>}
    </section>
    <section aria-labelledby={`${id}-detail`} className="border-t border-slate-200 pt-6"><h2 id={`${id}-detail`} className="mb-4 text-base font-bold text-slate-950">03. {value.customerType === 'existing' ? '전년 대비 변동사항' : '사업장 및 활동정보'}</h2>
      {value.customerType === 'existing' ? <div className="space-y-4"><Field title="전년도 검증 대비 변경 여부 *"><select required className={GHG_INPUT} value={value.changeStatus} onChange={e => onChange({ ...value, changeStatus: e.target.value as HyundaiGhgInput['changeStatus'], changeTypes: [], changeDetails: '' })}><option value="">변경 여부를 선택해 주세요</option><option value="none">변동 없음</option><option value="changed">변동 있음</option><option value="unknown">확인 필요</option></select></Field>
        {value.changeStatus === 'changed' && <><fieldset><legend className="mb-2 text-sm font-semibold text-slate-700">변동 유형 * (복수 선택)</legend><div className="flex flex-wrap gap-2">{CHANGE_TYPES.map(type => <label key={type} className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" className="accent-teal-700" checked={value.changeTypes.includes(type)} onChange={e => update('changeTypes', e.target.checked ? [...value.changeTypes, type] : value.changeTypes.filter(item => item !== type))} />{type}</label>)}</div></fieldset><Field title="변동 내용 *"><textarea required maxLength={5000} rows={4} className={GHG_INPUT} placeholder="예: 신규 사업장 추가, 생산설비 변경, Scope 3 검증범위 확대 등" value={value.changeDetails} onChange={e => update('changeDetails', e.target.value)} /></Field></>}
        {value.changeStatus === 'unknown' && <Field title="확인이 필요한 사항 (선택)"><textarea maxLength={5000} rows={3} className={GHG_INPUT} value={value.changeDetails} onChange={e => update('changeDetails', e.target.value)} /></Field>}
      </div> : <div className="space-y-4"><Field title="검증대상 사업장 및 소재지 *"><textarea required maxLength={5000} rows={3} className={GHG_INPUT} placeholder="사업장별 명칭과 소재지를 한 줄씩 입력해 주세요." value={value.sites} onChange={e => update('sites', e.target.value)} /></Field><Field title="주요 제품 및 공정 *"><textarea required maxLength={5000} rows={3} className={GHG_INPUT} placeholder="주요 제품과 생산공정을 간단히 적어 주세요." value={value.activities} onChange={e => update('activities', e.target.value)} /></Field></div>}
    </section>
    <section className="border-t border-slate-200 pt-6"><Field title="추가 요청사항 (선택)"><textarea maxLength={5000} rows={3} className={GHG_INPUT} value={value.additionalNotes} onChange={e => update('additionalNotes', e.target.value)} /></Field></section>
    {showConsent && <section className="rounded-lg bg-slate-100 p-4"><p className="mb-3 text-xs leading-5 text-slate-600">입력하신 회사 및 담당자 정보는 LRQA의 검증 신청 접수, 검토 및 관련 연락을 위해 이용됩니다.</p><label className="flex items-start gap-3 text-sm font-medium text-slate-800"><input required type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-teal-700" checked={value.consent} onChange={e => update('consent', e.target.checked)} /><span>개인정보 처리 및 신청정보의 업무상 이용에 동의합니다. *</span></label></section>}
  </fieldset>;
}
