import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findIsoApplication } from '@/lib/isoApplications';
import { listIsoQuoteDrafts } from '@/lib/isoQuoteDrafts';
import StartQuoteButton from './StartQuoteButton';

export const dynamic = 'force-dynamic';

const auditTypeLabel: Record<string, string> = {
  new_certification: '신규 인증',
  renewal: '갱신 심사',
  transfer: '전환 인증',
};

const Value = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="border-b border-slate-100 py-3">
    <dt className="text-xs font-bold text-slate-500">{label}</dt>
    <dd className="mt-1 break-words text-sm font-semibold text-slate-900">{value || '-'}</dd>
  </div>
);

export default async function IsoApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await findIsoApplication(id);
  if (!application) notFound();
  const drafts = await listIsoQuoteDrafts(id);

  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/iso/applications" className="text-sm font-bold text-teal-700 hover:underline">신청서 접수함</Link>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{application.companyName}</h2>
          <p className="mt-1 font-mono text-xs text-slate-500">{application.id}</p>
        </div>
        <StartQuoteButton applicationId={application.id} disabled={!application.quoteReady} />
      </div>

      {!application.quoteReady && (
        <section className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <h3 className="font-bold text-amber-900">견적 전 정보 보완 필요</h3>
          <p className="mt-1 text-sm text-amber-800">{application.missingFields.join(', ')}</p>
        </section>
      )}
      {!application.dataConsent && (
        <section className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          데이터 처리 동의가 확인되지 않았습니다. 고객 발송 전 원본 신청서를 확인해야 합니다.
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-md border border-slate-200 bg-white p-5 lg:col-span-2">
          <h3 className="text-base font-bold text-slate-900">신청서 검토</h3>
          <dl className="mt-2 grid gap-x-6 sm:grid-cols-2">
            <Value label="회사명(영문)" value={application.companyNameEn} />
            <Value label="신청일시" value={application.submittedAt} />
            <Value label="담당자" value={application.contactName} />
            <Value label="이메일" value={application.contactEmail} />
            <Value label="전화" value={application.mobilePhone || application.contactPhone} />
            <Value label="심사 유형 후보" value={auditTypeLabel[application.auditType] || application.auditType} />
            <Value label="ISO 표준" value={application.standards.join(', ') || application.otherStandards} />
            <Value label="사업장 / 직원" value={`${application.siteCount}개 / ${application.employeeCount}명`} />
            <Value label="본사 주소" value={application.siteAddress} />
            <Value label="희망 일정" value={application.desiredAuditDate} />
            <div className="sm:col-span-2"><Value label="인증 범위" value={application.scope} /></div>
            <div className="sm:col-span-2"><Value label="활동 내용" value={application.activityDescription} /></div>
          </dl>
        </section>

        <aside className="space-y-5">
          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h3 className="text-base font-bold text-slate-900">검토 플래그</h3>
            <dl className="mt-2">
              <Value label="기존 인증" value={application.existingCertification ? '있음' : '없음'} />
              <Value label="기존 인증기관" value={application.existingCertificationBody} />
              <Value label="인증 만료일" value={application.certificationExpiryDate} />
              <Value label="LRQA 전환 요청" value={application.transferRequested ? '예' : '아니요'} />
              <Value label="컨설턴트" value={[application.consultantName, application.consultingOrg].filter(Boolean).join(' / ')} />
            </dl>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h3 className="text-base font-bold text-slate-900">견적 초안 이력</h3>
            <div className="mt-3 space-y-2">
              {drafts.map((draft) => (
                <Link key={draft.id} href={`/iso?draftId=${draft.id}`} className="block rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50">
                  <p className="font-mono text-xs font-bold text-slate-700">{draft.id}</p>
                  <p className="mt-1 text-xs text-slate-500">v{draft.version} · {draft.status}</p>
                </Link>
              ))}
              {drafts.length === 0 && <p className="text-sm text-slate-500">아직 생성된 초안이 없습니다.</p>}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
