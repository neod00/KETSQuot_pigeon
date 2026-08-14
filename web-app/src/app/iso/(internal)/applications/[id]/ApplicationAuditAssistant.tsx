'use client';

import { useState } from 'react';
import type { IsoAuditAnalysis } from '@/lib/isoTypes';

const list = (title: string, values: string[], tone: 'amber' | 'red' | 'slate' = 'slate') => {
  if (!values.length) return null;
  const styles = {
    amber: 'border-amber-200 bg-amber-50 text-amber-950',
    red: 'border-red-200 bg-red-50 text-red-950',
    slate: 'border-slate-200 bg-slate-50 text-slate-800',
  };
  return (
    <section className={`rounded-md border px-3 py-3 ${styles[tone]}`}>
      <h4 className="text-sm font-bold">{title}</h4>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {values.map((value, index) => <li key={`${title}-${index}`}>{value}</li>)}
      </ul>
    </section>
  );
};

export default function ApplicationAuditAssistant({
  applicationId,
  initialAnalysis,
}: {
  applicationId: string;
  initialAnalysis: IsoAuditAnalysis | null;
}) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scopeConcerns = analysis?.scopeConcerns || [];
  const eaCodeCandidates = analysis?.eaCandidates || [];

  const analyse = async () => {
    setLoading(true);
    setMessage('신청서 전체 내용을 기준으로 AI 검토 중입니다...');
    try {
      const response = await fetch(`/api/iso/audit-analysis/${encodeURIComponent(applicationId)}`, { method: 'POST' });
      const payload = await response.json() as { analysis?: IsoAuditAnalysis; error?: string };
      if (!response.ok || !payload.analysis) throw new Error(payload.error || 'AI 검토를 완료하지 못했습니다.');
      setAnalysis(payload.analysis);
      setMessage('AI 제안이 준비되었습니다. 내용을 확인한 뒤 승인하면 다음 견적 초안부터 반영됩니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'AI 검토를 완료하지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const approve = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/iso/audit-analysis/${encodeURIComponent(applicationId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      const payload = await response.json() as { analysis?: IsoAuditAnalysis; error?: string };
      if (!response.ok || !payload.analysis) throw new Error(payload.error || 'AI 제안을 승인하지 못했습니다.');
      setAnalysis(payload.analysis);
      setMessage('AI 제안을 승인했습니다. 새 견적 초안에만 반영되며, 최종 검토 책임은 담당자에게 있습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'AI 제안을 승인하지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const copyEmail = async () => {
    if (!analysis?.clientEmailDraft) return;
    await navigator.clipboard.writeText(analysis.clientEmailDraft);
    setMessage('고객 확인 메일 초안을 클립보드에 복사했습니다.');
  };

  return (
    <section className="mb-6 border border-teal-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-teal-100 bg-teal-50 px-4 py-4">
        <div>
          <h3 className="font-bold text-slate-900">AI 신청서 검토</h3>
          <p className="mt-1 text-sm text-slate-600">신청서 전체 내용에서 누락 정보, 범위·다사업장·통합심사 확인사항, 고객 질의를 제안합니다. 자동 확정하지 않습니다.</p>
        </div>
        <button type="button" onClick={analyse} disabled={loading} className="rounded-md bg-teal-700 px-3 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:bg-slate-300">
          {loading ? '검토 중...' : 'AI 전체 신청서 검토'}
        </button>
      </div>
      <div className="space-y-3 px-4 py-4">
        {analysis ? (
          <>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold text-slate-900">검토 요약</h4>
                <span className={`rounded px-2 py-1 text-xs font-bold ${analysis.status === 'approved' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'}`}>
                  {analysis.status === 'approved' ? '승인됨' : '검토 대기'}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{analysis.summary || '요약이 생성되지 않았습니다.'}</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {list('보완 필요 정보', analysis.missingInformation, 'amber')}
              {list('고객 확인 질문', analysis.questionsForClient, 'slate')}
              {list('리스크 / 검토 유의사항', analysis.riskFlags, 'red')}
            </div>
            {(analysis.suggestedScope || scopeConcerns.length > 0) && (
              <section className="rounded-md border border-blue-200 bg-blue-50 px-3 py-3 text-blue-950">
                <h4 className="text-sm font-bold">인증범위 검토 제안</h4>
                {analysis.suggestedScope && <p className="mt-2 text-sm leading-6">{analysis.suggestedScope}</p>}
                {scopeConcerns.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {scopeConcerns.map((value, index) => <li key={`scope-${index}`}>{value}</li>)}
                  </ul>
                )}
                <p className="mt-2 text-xs font-medium">LRMS03-03-04A 기준의 초안입니다. 실제 활동과 제한사항은 담당자가 최종 확인해야 합니다.</p>
              </section>
            )}
            {eaCodeCandidates.length > 0 && (
              <section className="rounded-md border border-violet-200 bg-violet-50 px-3 py-3 text-violet-950">
                <h4 className="text-sm font-bold">EA 코드 후보</h4>
                <p className="mt-1 text-sm">AI가 신청서와 기존 ADJ EA/NACE 목록을 대조해 제안한 후보입니다. 심사자 보조용이며 자동 확정되거나 ADJ에 자동 입력되지 않습니다.</p>
                <div className="mt-3 grid gap-2 lg:grid-cols-3">
                  {eaCodeCandidates.map((candidate) => (
                    <article key={candidate.code} className="border border-violet-200 bg-white px-3 py-2">
                      <p className="font-mono text-xs font-bold text-violet-800">{candidate.code}</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{candidate.title}</p>
                      {candidate.applicableStandards.length > 0 && <p className="mt-1 text-xs text-slate-600">{candidate.applicableStandards.join(', ')}</p>}
                      {candidate.rationale && <p className="mt-2 text-xs leading-5 text-slate-700">{candidate.rationale}</p>}
                    </article>
                  ))}
                </div>
                <a href="/adj" target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-violet-800 underline">ADJ EA 코드 조회 열기</a>
              </section>
            )}
            {analysis.clientEmailDraft && (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">고객 정보 보완 메일 초안</h4>
                  <button type="button" onClick={copyEmail} className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">메일 초안 복사</button>
                </div>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">{analysis.clientEmailDraft}</pre>
              </div>
            )}
            {analysis.status !== 'approved' && (
              <button type="button" onClick={approve} disabled={loading} className="rounded-md border border-teal-700 bg-white px-3 py-2 text-sm font-bold text-teal-800 hover:bg-teal-50 disabled:border-slate-300 disabled:text-slate-400">
                AI 제안 승인 후 새 견적 초안에 반영
              </button>
            )}
          </>
        ) : <p className="text-sm text-slate-600">아직 AI 검토 결과가 없습니다. 원본 신청서와 결정론적 산정값은 별도로 보존됩니다.</p>}
        {message && <p className="text-sm font-medium text-slate-700">{message}</p>}
      </div>
    </section>
  );
}
