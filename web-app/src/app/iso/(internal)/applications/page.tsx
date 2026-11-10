import ApplicationsClient from './ApplicationsClient';
import Link from 'next/link';
import { loadIsoApplicationInbox } from '@/lib/isoApplications';
import type { IsoApplication } from '@/lib/isoTypes';

export const dynamic = 'force-dynamic';

export default async function IsoApplicationsPage() {
  let applications: IsoApplication[] = [];
  let error = '';
  let legacyUnavailable = false;
  try {
    ({ applications, legacyUnavailable } = await loadIsoApplicationInbox());
  } catch (fetchError) {
    console.error(fetchError);
    error = '운영 신청서 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">신청서 접수함</h2>
          <p className="mt-1 text-sm text-slate-600">고객 신청서를 검토하고 견적 초안을 시작합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2"><a href="https://lrqa-iso-application.netlify.app/" target="_blank" rel="noreferrer" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">기존 고객 신청서</a><Link href="/iso/apply" target="_blank" className="rounded-md bg-teal-700 px-3 py-2 text-sm font-bold text-white hover:bg-teal-800">ISO 37001 · 37301 신청서</Link></div>
      </div>
      {legacyUnavailable && <p role="status" className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">기존 사이트의 신청서를 불러오지 못해 앱에서 접수한 신청서만 표시합니다. 잠시 후 새로고침해 주세요.</p>}
      <section className="overflow-hidden rounded-md border border-slate-200 shadow-sm">
        {error ? <p className="bg-red-50 px-4 py-8 text-center font-semibold text-red-700">{error}</p> : <ApplicationsClient applications={applications} />}
      </section>
    </main>
  );
}
