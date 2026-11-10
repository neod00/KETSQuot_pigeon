'use client';

import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ISO_COMPLIANCE_STANDARDS, ISO_COMPANY_FIELDS, ISO_SITE_FIELDS, ISO_COMMON_SECTIONS,
  ISO_37001_FIELDS, ISO_37301_FIELDS, ISO_PERSONNEL_ROLES, createIsoComplianceApplication,
  createIsoSupplement, fieldIsVisible, parseIsoComplianceApplication, personnelTotals, siteLabel,
  type ApplicationField, type IsoComplianceApplicationInput, type IsoComplianceStandard, type IsoComplianceSupplement,
} from '@/lib/isoComplianceApplication';
import styles from './IsoComplianceApplicationForm.module.css';
const STEPS = ['회사 정보', '담당자·표준', '범위·인증', '인력 현황', '인증 전환', '표준별 정보', '검토·제출'];
const DRAFT_KEY = 'lrqa_iso_compliance_application_v1';
const WizardContext = createContext({ step: 0, readOnly: false });

export default function IsoComplianceApplicationForm({ submitted, submitUrl = '/api/iso/compliance-applications' }: { submitted?: IsoComplianceApplicationInput; submitUrl?: string }) {
  const [draft, setDraft] = useState<IsoComplianceApplicationInput>(createIsoComplianceApplication);
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [dark, setDark] = useState(false);
  const [saveStatus, setSaveStatus] = useState('자동 저장');
  const [ready, setReady] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const pending = useRef(false);
  const form = submitted || draft;
  const readOnly = Boolean(submitted);
  useEffect(() => {
    if (submitted) return;
    queueMicrotask(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
        if (saved?.draft && Array.isArray(saved.draft.sites) && saved.draft.sites.length > 0 && Array.isArray(saved.draft.standards) && saved.draft.common && typeof saved.draft.consent === 'boolean') {
          setDraft(saved.draft); setStep(Math.min(6, Math.max(0, Number(saved.step) || 0))); setSaveStatus('임시저장 불러옴');
        }
        setDark(localStorage.getItem(`${DRAFT_KEY}_dark`) === 'true');
      } catch { /* Browser storage is optional. */ }
      setReady(true);
    });
  }, [submitted]);
  useEffect(() => {
    if (!ready || submitted || reference) return;
    const timer = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, step })); setSaveStatus('저장됨'); }
      catch { setSaveStatus('자동 저장 불가'); }
    }, 500);
    return () => clearTimeout(timer);
  }, [draft, step, ready, submitted, reference]);
  const go = (next: number, validate = false) => {
    if (validate) {
      const controls = formRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[data-step="${step}"] input, [data-step="${step}"] select, [data-step="${step}"] textarea`);
      if (controls) for (const control of controls) if (!control.disabled && !control.checkValidity()) { control.reportValidity(); return; }
      if (step === 1 && form.standards.length === 0) { setError('신청 규격을 선택해 주세요.'); return; }
    }
    setError(''); setStep(next); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const changeCommon = (key: string, value: string) => setDraft(current => ({ ...current, common: { ...current.common, [key]: value } }));
  const toggleStandard = (standard: IsoComplianceStandard) => setDraft(current => {
    const selected = current.standards.includes(standard);
    const key = standard === 'ISO 37001' ? 'antiBribery' : 'compliance';
    return {
      ...current, standards: selected ? current.standards.filter(item => item !== standard) : [...current.standards, standard],
      [key]: selected ? undefined : createIsoSupplement(current.sites.length),
    };
  });
  const resizeSites = (add: boolean) => setDraft(current => {
    const sites = add ? [...current.sites, {}] : current.sites.slice(0, -1);
    const resize = (supplement?: IsoComplianceSupplement) => supplement && ({
      ...supplement,
      personnel: supplement.personnel.map(row => ({ ...row, counts: Array.from({ length: Math.max(5, sites.length) }, (_, i) => i < sites.length ? row.counts[i] || '' : '') })),
    });
    return { ...current, sites, antiBribery: resize(current.antiBribery), compliance: resize(current.compliance) };
  });
  const setSupplement = (key: 'antiBribery' | 'compliance', value: IsoComplianceSupplement) => setDraft(current => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending.current || readOnly) return;
    setError('');
    pending.current = true; setBusy(true);
    try {
      const input = parseIsoComplianceApplication(form);
      const response = await fetch(submitUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      const payload = await response.json() as { reference?: string; message?: string };
      if (!response.ok || !payload.reference) throw new Error(payload.message || '신청서를 접수하지 못했습니다.');
      setReference(payload.reference);
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* Browser storage is optional. */ }
      window.scrollTo({ top: 0, behavior: 'smooth' });
     } catch (caught) {
      setError(caught instanceof Error ? caught.message : '신청서를 접수하지 못했습니다.');
      const invalid = Array.from(formRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea') || []).find(control => !control.disabled && !control.checkValidity());
      if (invalid) { setStep(Number(invalid.closest('[data-step]')?.getAttribute('data-step') || 0)); setTimeout(() => invalid.reportValidity(), 50); }
    }
    finally { pending.current = false; setBusy(false); }
  };

  if (reference) return <div className={styles.success} role="status"><p className={styles.eyebrow}>LRQA · 신청 접수 완료</p><h1>인증 심사 신청서가 접수되었습니다.</h1><p>{form.standards.join(' · ')}</p><p>접수번호 <strong>{reference}</strong></p><p>담당자가 신청 내용을 검토한 후 연락드리겠습니다.</p><button type="button" onClick={() => { setDraft(createIsoComplianceApplication()); setStep(0); setReference(''); }}>새 신청서 작성</button></div>;

  return <WizardContext.Provider value={{ step, readOnly }}><div className={`${styles.formWrap} ${dark ? styles.dark : ''}`}>
    {!readOnly && <><div className={styles.toolbar}><span className={styles.language}>KR 한국어</span><button type="button" onClick={() => { setDark(!dark); try { localStorage.setItem(`${DRAFT_KEY}_dark`, String(!dark)); } catch {} }}>{dark ? '라이트모드' : '다크모드'}</button><button type="button" onClick={() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, step })); setSaveStatus('임시저장 완료'); } catch { setSaveStatus('임시저장 불가'); } }}>임시저장</button></div><nav className={styles.progress} aria-label="신청서 진행 단계"><div className={styles.progressRow}><strong>{step + 1} / 7 · {STEPS[step]}</strong><span role="status">{saveStatus}</span></div><div className={styles.track}><div style={{ width: `${(step + 1) / 7 * 100}%` }} /></div><div className={styles.steps}>{STEPS.map((title, index) => <button key={title} type="button" aria-current={step === index ? 'step' : undefined} onClick={() => go(index)}>{index + 1}. {title}</button>)}</div></nav><header className={styles.header} hidden={step !== 0}><div className={styles.logo}>LRQA</div><h1>인증 심사 신청서</h1><h2>표준 ISO 37001, 37301</h2></header><p hidden={step !== 0} className={styles.intro}>LRQA의 무료 견적을 받고 싶다면 다음 양식을 완전히 작성하여 제출해 주시기 바랍니다.</p></>}
    <form ref={formRef} onSubmit={submit} noValidate className={styles.form}>
      <fieldset disabled={readOnly || busy} className={styles.allFields}>


        <Section title="회사 정보" id="company"><Fields definitions={ISO_COMPANY_FIELDS.filter(field => !['contactName', 'positionDepartment', 'contactPhone', 'fax', 'mobilePhone', 'contactEmail'].includes(field.key))} values={form.common} onChange={changeCommon} prefix="company" /><Fields definitions={ISO_SITE_FIELDS.filter(field => ['address', 'postalCode'].includes(field.key))} values={form.sites[0]} prefix="main-site" onChange={(key, value) => setDraft(current => ({ ...current, sites: current.sites.map((site, i) => i === 0 ? { ...site, [key]: value } : site) }))} /></Section>
        <Section title="연락처 세부 정보" id="contact"><Fields definitions={ISO_COMPANY_FIELDS.filter(field => ['contactName', 'positionDepartment', 'contactPhone', 'fax', 'mobilePhone', 'contactEmail'].includes(field.key))} values={form.common} onChange={changeCommon} prefix="company" /></Section>
        <Section title="신청 규격" id="standards"><div className={styles.standardGrid}>
          {ISO_COMPLIANCE_STANDARDS.map(standard => <label key={standard} className={`${styles.standard} ${form.standards.includes(standard) ? styles.selected : ''}`}><input type="checkbox" checked={form.standards.includes(standard)} onChange={() => toggleStandard(standard)} /><span><strong>{standard}</strong><small>{standard === 'ISO 37001' ? '부패방지경영시스템' : '준법경영시스템'}</small></span></label>)}
        </div><p className={styles.help}>두 규격을 함께 신청할 수 있습니다. 선택한 규격의 추가양식이 아래에 표시됩니다.</p></Section>

        <Section title="사업장 정보" id="sites">
          <p className={styles.help}>추가사업장별 주소, 인원, 활동 및 자원을 입력해 주세요. 건설사의 시공현장은 추가사업장에서 제외합니다. 회사 조직도는 담당자에게 별도로 전달해 주세요.</p>
          {form.sites.map((site, index) => <div key={index} className={styles.site}><h3>{index === 0 ? '주 사업장 / 본사' : `추가사업장 ${index}`}</h3><Fields definitions={index === 0 ? ISO_SITE_FIELDS.filter(field => !['address', 'postalCode'].includes(field.key)) : ISO_SITE_FIELDS} values={site} prefix={`site-${index}`} onChange={(key, value) => setDraft(current => ({ ...current, sites: current.sites.map((item, i) => i === index ? { ...item, [key]: value } : item) }))} /></div>)}
          <p className={styles.total}>전체 사업장 {form.sites.length}개 · 종업원 합계 {form.sites.reduce((sum, site) => sum + Number(site.totalEmployees || 0), 0).toLocaleString()}명</p>
          {!readOnly && <div className={styles.actions}><button type="button" disabled={form.sites.length >= 20} onClick={() => resizeSites(true)}>+ 사업장 추가</button>{form.sites.length > 1 && <button type="button" onClick={() => resizeSites(false)}>마지막 사업장 삭제</button>}</div>}
        </Section>
        {ISO_COMMON_SECTIONS.map((section, index) => <Section key={section.title} title={section.title} id={`common-${index}`}><Fields definitions={section.fields} values={form.common} onChange={changeCommon} prefix={`common-${index}`} /></Section>)}

        {form.standards.includes('ISO 37001') && form.antiBribery && <Section title="ISO 37001 추가양식" id="iso37001" badge="부패방지경영시스템"><Fields definitions={ISO_37001_FIELDS} values={form.antiBribery.fields} prefix="anti-bribery" onChange={(key, value) => setSupplement('antiBribery', { ...form.antiBribery!, fields: { ...form.antiBribery!.fields, [key]: value } })} /><Personnel title="6. 반부패(뇌물) 관련 위험 및 핵심통제 영역에 있는 인원수" supplement={form.antiBribery} siteCount={form.sites.length} prefix="anti-bribery" onChange={value => setSupplement('antiBribery', value)} /></Section>}
        {form.standards.includes('ISO 37301') && form.compliance && <Section title="ISO 37301 추가양식" id="iso37301" badge="준법경영시스템"><Fields definitions={ISO_37301_FIELDS} values={form.compliance.fields} prefix="compliance" onChange={(key, value) => setSupplement('compliance', { ...form.compliance!, fields: { ...form.compliance!.fields, [key]: value } })} /><Personnel title="5. 법규준수 관련 위험 및 핵심통제 영역에 있는 인원수" supplement={form.compliance} siteCount={form.sites.length} prefix="compliance" onChange={value => setSupplement('compliance', value)} /></Section>}

        <Section title="개인정보 수집·이용 및 작성 확인" id="consent"><div className={styles.review}><strong>신청 내용 확인</strong><p>{form.common.companyNameKo || '회사명 미입력'} · {form.standards.join(', ') || '신청 규격 미선택'}</p><p>사업장 {form.sites.length}개 · 종업원 {form.sites.reduce((sum, site) => sum + Number(site.totalEmployees || 0), 0)}명</p><p>{form.common.scopeKo || '인증범위 미입력'}</p><p>상단 단계명을 눌러 입력 내용을 확인하고 수정할 수 있습니다.</p></div><p className={styles.help}>수집 항목: 회사명, 성명, 직함, 부서, 연락처, 이메일주소, 회사주소</p><p className={styles.help}>수집 목적: 인증 및 교육 서비스 제공 절차(인증설문서, 견적서, 계약서 및 인증서), 인증 및 교육 이벤트 안내, 인증·산업동향 및 교육 뉴스레터 발송, 인증 정보 확인, 고객 문의·불만 관리 및 만족도 조사</p><p className={styles.help}>보유기간: 5년. 동의를 거부할 권리가 있으나 거부할 경우 원활한 서비스 제공에 제한을 받을 수 있습니다.</p><p className={styles.help}><a href="https://www.lrqa.com/ko-kr/" target="_blank" rel="noreferrer">LRQA 웹사이트</a>에서 개인정보처리방침을 확인하실 수 있습니다.</p>
          <label className={styles.consent}><input type="checkbox" required checked={form.consent} onChange={event => setDraft(current => ({ ...current, consent: event.target.checked }))} />개인정보 수집·이용에 동의합니다. <span>*</span></label>
          <Fields definitions={[{ key: 'author', label: '작성자', required: true }, { key: 'signatureDate', label: '작성일', type: 'date', required: true }]} values={form.common} onChange={changeCommon} prefix="signature" />
        </Section>
      </fieldset>
      {!readOnly && step === 6 && <div className={styles.submitArea}>{error && <p role="alert" className={styles.error}>{error}</p>}<button type="submit" disabled={busy || form.standards.length === 0}>{busy ? '접수 중…' : '인증 심사 신청서 제출'}</button><button type="button" onClick={() => window.print()}>인쇄 / PDF 저장</button><p className={styles.help}>제출한 신청서는 LRQA 담당자가 확인합니다.</p></div>}
      {!readOnly && <><p role="alert" className={styles.error} hidden={!error}>{step !== 6 ? error : ''}</p><div className={styles.wizardNav}>{step > 0 && <button type="button" onClick={() => go(step - 1)}>이전</button>}{step < 6 && <button className={styles.next} type="button" onClick={() => go(step + 1, true)}>다음</button>}</div></>}
    </form>
  </div></WizardContext.Provider>;
}

function Section({ title, id, badge, children }: { title: string; id: string; badge?: string; children: ReactNode }) {
  const { step, readOnly } = useContext(WizardContext);
  const index = ({ company: 0, contact: 1, standards: 1, 'common-0': 2, 'common-1': 2, sites: 3, 'common-2': 4, iso37001: 5, iso37301: 5, consent: 6 } as Record<string, number>)[id] ?? 0;
  return <section data-step={index} hidden={!readOnly && step !== index} className={styles.section} id={id}><div className={styles.sectionHeader}><h2>{title}</h2>{badge && <span>{badge}</span>}</div>{children}</section>;
}
function Fields({ definitions, values, onChange, prefix }: { definitions: ApplicationField[]; values: Record<string, string>; onChange: (key: string, value: string) => void; prefix: string }) {
  return <div className={styles.grid}>{definitions.filter(field => fieldIsVisible(field, values, definitions)).map(field => {
    const id = `${prefix}-${field.key}`;
    return <div key={field.key} className={`${styles.field} ${field.type === 'textarea' || field.options ? styles.wide : ''}`}><label htmlFor={id}>{field.label}{field.required && <span> *</span>}</label>
      {field.options && field.options.length <= 3 ? <div className={styles.options} role="group" aria-label={field.label}>{field.options.map((option, index) => <label key={option}><input id={index === 0 ? id : `${id}-${index}`} name={id} type="radio" required={field.required} checked={values[field.key] === option} value={option} onChange={() => onChange(field.key, option)} />{option}</label>)}</div>
        : field.options ? <select id={id} required={field.required} value={values[field.key] || ''} onChange={event => onChange(field.key, event.target.value)}><option value="">선택해 주세요</option>{field.options.map(option => <option key={option} value={option}>{option}</option>)}</select>
        : field.type === 'textarea' ? <textarea id={id} required={field.required} rows={3} maxLength={6000} value={values[field.key] || ''} onChange={event => onChange(field.key, event.target.value)} />
          : <input id={id} required={field.required} type={field.type || 'text'} min={field.type === 'number' ? 0 : undefined} max={field.type === 'number' ? 1_000_000 : undefined} step={field.type === 'number' ? 1 : undefined} maxLength={500} value={values[field.key] || ''} onChange={event => onChange(field.key, event.target.value)} />}
    </div>;
  })}</div>;
}
function Personnel({ title, supplement, siteCount, prefix, onChange }: { title: string; supplement: IsoComplianceSupplement; siteCount: number; prefix: string; onChange: (value: IsoComplianceSupplement) => void }) {
  const columns = Math.max(5, siteCount);
  const totals = personnelTotals(supplement.personnel, columns);
  const change = (row: number, column: number, value: string) => onChange({ ...supplement, personnel: supplement.personnel.map((item, index) => index === row ? { ...item, counts: item.counts.map((count, col) => col === column ? value : count) } : item) });
  return <div className={styles.personnel}><h3>{title}</h3><p className={styles.help}>단위: 명. 해당하지 않는 직무는 0을 입력할 수 있습니다. 사업장 정보에 입력한 사업장만 작성할 수 있습니다.</p><div className={styles.tableScroll}><table><caption className={styles.srOnly}>{title}</caption><thead><tr><th scope="col">직무</th>{Array.from({ length: columns }, (_, i) => <th key={i} scope="col">{siteLabel(i)}</th>)}<th scope="col">비고</th></tr></thead><tbody>{ISO_PERSONNEL_ROLES.map((role, row) => <tr key={role}><th scope="row">{role}</th>{Array.from({ length: columns }, (_, column) => <td key={column}><input type="number" min={0} max={1_000_000} step={1} disabled={column >= siteCount} aria-label={`${prefix} ${role} ${siteLabel(column)} 인원`} value={supplement.personnel[row].counts[column] || ''} onChange={event => change(row, column, event.target.value)} /></td>)}<td><input type="text" aria-label={`${prefix} ${role} 비고`} maxLength={1000} value={supplement.personnel[row].note} onChange={event => onChange({ ...supplement, personnel: supplement.personnel.map((item, index) => index === row ? { ...item, note: event.target.value } : item) })} /></td></tr>)}</tbody><tfoot><tr><th scope="row">인원 합계</th>{totals.map((total, i) => <td key={i}>{total}</td>)}<td /></tr></tfoot></table></div></div>;
}
