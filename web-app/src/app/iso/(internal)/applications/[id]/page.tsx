import Link from 'next/link';
import { notFound } from 'next/navigation';
import IsoApplicationFormReplica from '@/components/IsoApplicationFormReplica';
import { findIsoApplication } from '@/lib/isoApplications';
import { listIsoQuoteDrafts } from '@/lib/isoQuoteDrafts';
import StartQuoteButton from './StartQuoteButton';

export const dynamic = 'force-dynamic';

export default async function IsoApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await findIsoApplication(id);
  if (!application) notFound();
  const drafts = await listIsoQuoteDrafts(id);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/iso/applications" className="text-sm font-bold text-teal-700 hover:underline">신청서 접수함</Link>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{application.companyName}</h2>
          <p className="mt-1 font-mono text-xs text-slate-500">{application.id} · {application.submittedAt || '신청일시 미입력'}</p>
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

      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">고객 제출 신청서</h3>
          <p className="mt-1 text-sm text-slate-500">고객이 제출한 화면과 같은 서식으로 표시됩니다.</p>
        </div>
        <span className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-600">읽기 전용</span>
      </div>

      <IsoApplicationFormReplica application={application} />

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
    </main>
  );
}