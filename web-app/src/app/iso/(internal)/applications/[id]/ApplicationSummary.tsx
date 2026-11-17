import type { ReactNode } from 'react';
import type { IsoApplication } from '@/lib/isoTypes';
import { fieldIsVisible, ISO_37001_FIELDS, ISO_37301_FIELDS, ISO_PERSONNEL_ROLES, personnelTotals, siteLabel, type ApplicationField, type IsoComplianceSupplement } from '@/lib/isoComplianceApplication';
import styles from './ApplicationReview.module.css';

function Answer({ value }: { value: string | number }) {
  const text = String(value);
  return text.length > 260 ? <details className={styles.longAnswer}><summary><span>{text.slice(0, 180)}…</span><strong>전체 내용 보기</strong></summary><p>{text}</p></details> : <>{text}</>;
}
function Rows({ entries }: { entries: Array<[string, string | number | undefined]> }) {
  const filled = entries.filter(([, value]) => value !== undefined && String(value).trim() !== '');
  return <dl>{filled.map(([label, value]) => <div key={label} className={styles.row}><dt>{label}</dt><dd><Answer value={value!} /></dd></div>)}</dl>;
}
function Card({ title, wide, children }: { title: string; wide?: boolean; children: ReactNode }) { return <section className={`${styles.card} ${wide ? styles.wide : ''}`}><h3>{title}</h3>{children}</section>; }
function Supplement({ title, data, fields, sites }: { title: string; data: IsoComplianceSupplement; fields: ApplicationField[]; sites: number }) {
  const rows = data.personnel.map((row, i) => ({ ...row, role: ISO_PERSONNEL_ROLES[i] })).filter(row => row.counts.some(value => value !== '') || row.note);
  return <Card title={title}><div className={styles.answers}><Rows entries={fields.filter(field => fieldIsVisible(field, data.fields, fields)).map(field => [field.label, data.fields[field.key]])} /></div>
    {rows.length > 0 && <details className={styles.personnel}><summary>직무별·사업장별 인원표</summary><div className={styles.scroll}><table><thead><tr><th scope="col">직무</th>{Array.from({ length: sites }, (_, i) => <th key={i} scope="col">{siteLabel(i)}</th>)}<th scope="col">비고</th></tr></thead><tbody>{rows.map(row => <tr key={row.role}><th scope="row">{row.role}</th>{Array.from({ length: sites }, (_, i) => <td key={i}>{row.counts[i] ?? ''}</td>)}<td>{row.note}</td></tr>)}</tbody><tfoot><tr><th scope="row">합계</th>{personnelTotals(data.personnel, sites).map((value, i) => <td key={i}>{value}</td>)}<td /></tr></tfoot></table></div></details>}
  </Card>;
}
export default function ApplicationSummary({ application: a }: { application: IsoApplication }) {
  const form = a.complianceApplication;
  return <div className={styles.grid}>
    <Card title="회사 및 담당자"><Rows entries={[
      ['회사명', a.companyName], ['영문명', a.companyNameEn], ['사업자등록번호', a.businessRegistrationNumber], ['주소', a.siteAddress],
      ['담당자', a.contactName], ['이메일', a.contactEmail], ['전화', a.contactPhone], ['휴대폰', a.mobilePhone],
    ]} /></Card>
    <Card title="신청 정보"><Rows entries={[
      ['신청 규격', a.standards.join(', ') || a.otherStandards], ['사업장 수', `${a.siteCount}개`], ['전체 직원', `${a.employeeCount}명`], ['희망 심사', a.desiredAuditDate],
      ['기존 인증', a.existingCertification ? '보유' : '미보유'], ['인증기관', a.existingCertificationBody], ['인증 만료일', a.certificationExpiryDate],
      ['컨설턴트', [a.consultingOrg, a.consultantName].filter(Boolean).join(' · ')], ['데이터 처리 동의', a.dataConsent ? '동의' : '확인 필요'],
    ]} /></Card>
    <Card title="인증범위" wide><div className={styles.scope}><Answer value={a.scope || '미입력'} /></div>{form?.common.scopeEn && <div className={styles.scope}><Answer value={form.common.scopeEn} /></div>}</Card>
    {form?.antiBribery && <Supplement title="ISO 37001 추가 정보" data={form.antiBribery} fields={ISO_37001_FIELDS} sites={form.sites.length} />}
    {form?.compliance && <Supplement title="ISO 37301 추가 정보" data={form.compliance} fields={ISO_37301_FIELDS} sites={form.sites.length} />}
    <Card title="사업장" wide>{form ? form.sites.map((site, i) => <div key={i} className={styles.site}><strong>{siteLabel(i)}</strong><Rows entries={[[ '주소', site.address ], [ '직원 수', site.totalEmployees ? `${site.totalEmployees}명` : undefined ], ['활동', site.processes]]} /></div>) : <p className={styles.scope}>{a.siteList || a.siteAddress || '미입력'}</p>}</Card>
  </div>;
}
