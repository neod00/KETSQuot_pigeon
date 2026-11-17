import Link from 'next/link';
import { notFound } from 'next/navigation';
import AuditDurationSummary from '@/components/AuditDurationSummary';
import ApplicationAdjDownloadButton from './ApplicationAdjDownloadButton';
import IsoApplicationFormReplica from '@/components/IsoApplicationFormReplica';
import IsoComplianceApplicationForm from '@/components/IsoComplianceApplicationForm';
import { calculateAuditDuration } from '@/lib/auditDurationEngine';
import { findIsoApplication, toAuditDurationInput } from '@/lib/isoApplications';
import { listIsoQuoteDrafts } from '@/lib/isoQuoteDrafts';
import StartQuoteButton from './StartQuoteButton';
import PrintApplicationButton from './PrintApplicationButton';
import ApplicationReviewTabs from './ApplicationReviewTabs';
import ApplicationSummary from './ApplicationSummary';
import styles from './ApplicationReview.module.css';

export const dynamic = 'force-dynamic';

export default async function IsoApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await findIsoApplication(id);
  if (!application) notFound();
  const drafts = await listIsoQuoteDrafts(id);
  const auditInput = toAuditDurationInput(application);
  const auditDuration = calculateAuditDuration(auditInput);

  return (
    <main className={`iso-application-detail ${styles.detail}`}>
      <div className={styles.header}>
        <div>
          <Link href="/iso/applications" className="text-sm font-bold text-teal-700 hover:underline">신청서 접수함</Link>
          <h2>{application.companyName}</h2>
          <div className={styles.badges}>{application.standards.map(standard => <span className={styles.badge} key={standard}>{standard}</span>)}</div>
          <p className={styles.meta}>{application.id} · {application.submittedAt || '신청일시 미입력'}</p>
        </div>
        <div className={styles.actions}><PrintApplicationButton /><StartQuoteButton applicationId={application.id} disabled={!application.quoteReady} /></div>
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

      <ApplicationReviewTabs
        summary={<ApplicationSummary application={application} />}
        form={application.complianceApplication
          ? <IsoComplianceApplicationForm submitted={application.complianceApplication} collapsible />
          : <IsoApplicationFormReplica application={application} collapsible />}
        calculation={<>
          <section className="mb-6">
            <div className="mb-3">
              <h3 className="text-lg font-bold text-slate-900">견적 사전 산정</h3>
              <p className="mt-1 text-sm text-slate-500">
                신청서의 규격, 직원 수와 사업장 수를 기준으로 계산했습니다. 견적 초안을 만들면 아래 값과 근거가 함께 전달됩니다.
              </p>
            </div>
            <AuditDurationSummary result={auditDuration} />
            <ApplicationAdjDownloadButton application={application} auditInput={auditInput} auditResult={auditDuration} />
          </section>
          <section className="mt-6 border-t border-slate-200 pt-5">
            <h3 className="text-base font-bold text-slate-900">견적 초안 이력</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {drafts.map((draft) => (
                <Link key={draft.id} href={`/iso?draftId=${draft.id}`} className="block rounded-md border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50">
                  <p className="font-mono text-xs font-bold text-slate-700">{draft.id}</p>
                  <p className="mt-1 text-xs text-slate-500">v{draft.version} · {draft.status}</p>
                </Link>
              ))}
              {drafts.length === 0 && <p className="text-sm text-slate-500">아직 생성된 초안이 없습니다.</p>}
            </div>
          </section>
        </>}
      />
    </main>
  );
}
