'use client';

import { useMemo, useState } from 'react';
import type { SamAccountView } from '@/lib/samTypes';
import { reportPeriodStart, samReportRows } from '@/lib/samReportBrief';

export default function SamReportBrief({ accounts, onOpen }: { accounts: SamAccountView[]; onOpen: (id: string) => void }) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const now = new Date();
  const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const start = reportPeriodStart(period, now);
  const rows = useMemo(() => samReportRows(accounts, start, end), [accounts, start, end]);
  const reportText = [
    `${period === 'week' ? '주간' : '월간'} SAM 진행 보고 초안 (${start} ~ ${end})`,
    ...rows.map(row => `${row.accountName} / ${row.source} (${row.date}): ${row.description}${row.nextAction ? ` · 다음 조치: ${row.nextAction}` : ''}`),
    ...(note.trim() ? [`SAM 판단 및 매니저 지원 요청: ${note.trim()}`] : []),
  ].join('\n');

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="mt-5 border border-slate-300 bg-white p-4 sm:p-5" aria-labelledby="sam-report-brief-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="sam-report-brief-title" className="text-lg font-bold text-slate-950">보고 기간의 변경·활동</h3>
          <p className="mt-1 text-sm text-slate-600">등록된 진행현황과 연결된 견적의 견적일을 근거로 모았습니다.</p>
        </div>
        <label className="text-sm font-semibold text-slate-700">보고 기간
          <select className="ml-2 border border-slate-300 bg-white px-3 py-2" value={period} onChange={event => { setPeriod(event.target.value as 'week' | 'month'); setCopied(false); }}>
            <option value="week">최근 7일</option><option value="month">이번 달</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs font-semibold text-teal-700">{start} ~ {end} · {rows.length}건</p>
      <div className="mt-3 max-h-72 overflow-y-auto border-y border-slate-200">
        {rows.length ? rows.map(row => (
          <div key={row.id} className="grid gap-1 border-b border-slate-100 px-2 py-3 text-sm last:border-b-0 md:grid-cols-[150px_100px_minmax(0,1fr)] md:gap-3">
            <button type="button" className="text-left font-bold text-teal-800 hover:underline" onClick={() => onOpen(row.accountId)}>{row.accountName}</button>
            <span className="text-xs text-slate-500">{row.date} · {row.source}</span>
            <span>{row.description}{row.nextAction && <span className="block text-xs text-slate-600">다음: {row.nextAction}</span>}</span>
          </div>
        )) : <p className="px-2 py-6 text-sm text-slate-500">이 기간에 기록된 진행현황이나 견적이 없습니다.</p>}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <h4 className="text-sm font-bold">국문 보고 초안</h4>
          <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap border border-slate-200 bg-slate-50 p-3 font-sans text-sm leading-6">{reportText}</pre>
        </div>
        <div>
          <label htmlFor="sam-report-note" className="text-sm font-bold">SAM 판단 · 매니저 지원 요청</label>
          <textarea id="sam-report-note" className="mt-2 min-h-32 w-full border border-slate-300 p-2 text-sm" value={note} onChange={event => { setNote(event.target.value); setCopied(false); }} placeholder="관계 변화, 기회, 지원 요청을 보완하세요." />
          <button type="button" disabled={!rows.length && !note.trim()} onClick={() => void copyReport()} className="mt-2 min-h-10 border border-teal-700 bg-teal-700 px-4 text-sm font-bold text-white disabled:opacity-50">초안 복사</button>
          {copied && <p role="status" className="mt-2 text-xs font-semibold text-teal-800">클립보드에 복사했습니다. 내용을 확인한 뒤 보고에 사용하세요.</p>}
        </div>
      </div>
    </section>
  );
}
