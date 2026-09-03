'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CoordinationCategory,
  CoordinationItem,
  CoordinationItemStatus,
  CoordinationSyncStatus,
} from '@/lib/coordinationTypes';

type ViewFilter = 'active' | CoordinationItemStatus | 'all';

const priorityStyle = {
  P0: 'border-rose-200 bg-rose-50 text-rose-800',
  P1: 'border-amber-200 bg-amber-50 text-amber-800',
  P2: 'border-slate-200 bg-slate-50 text-slate-700',
};

const categoryLabel: Record<CoordinationCategory, string> = {
  urgent: '긴급',
  reply: '회신',
  deadline: '기한',
  waiting: '대기',
  reference: '참고',
  newsletter: '뉴스레터',
  personal: '개인',
};

const statusLabel: Record<CoordinationItemStatus, string> = {
  new: '신규',
  reviewed: '검토됨',
  done: '완료',
  ignored: '제외',
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(parsed);
};

const dueLabel = (value: string) => {
  if (!value) return '';
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
  if (value < today) return `${value} · 기한 경과`;
  if (value === today) return `${value} · 오늘`;
  return value;
};

export default function CoordinationDashboard() {
  const [items, setItems] = useState<CoordinationItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<CoordinationSyncStatus | null>(null);
  const [syncConfigured, setSyncConfigured] = useState(false);
  const [issuedKey, setIssuedKey] = useState('');
  const [filter, setFilter] = useState<ViewFilter>('active');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const [itemsResponse, syncResponse] = await Promise.all([
        fetch('/api/iso/coordination/items', { cache: 'no-store' }),
        fetch('/api/iso/coordination/sync', { cache: 'no-store' }),
      ]);
      const itemsPayload = await itemsResponse.json();
      const syncPayload = await syncResponse.json();
      if (!itemsResponse.ok) throw new Error(itemsPayload.error || '업무 항목을 불러오지 못했습니다.');
      if (!syncResponse.ok) throw new Error(syncPayload.error || '동기화 상태를 불러오지 못했습니다.');
      setItems(itemsPayload.items || []);
      setSyncStatus(syncPayload.status || null);
      setSyncConfigured(Boolean(syncPayload.syncConfigured));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '대시보드를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visibleItems = useMemo(() => items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'active') return item.status === 'new' || item.status === 'reviewed';
    return item.status === filter;
  }).sort((left, right) => {
    const priority = { P0: 0, P1: 1, P2: 2 };
    return priority[left.priority] - priority[right.priority] || right.createdAt.localeCompare(left.createdAt);
  }), [filter, items]);

  const active = items.filter((item) => item.status === 'new' || item.status === 'reviewed');
  const stats = {
    urgent: active.filter((item) => item.priority === 'P0').length,
    reply: active.filter((item) => item.category === 'reply').length,
    deadline: active.filter((item) => item.category === 'deadline' || item.dueDate).length,
    waiting: active.filter((item) => item.category === 'waiting').length,
  };

  const updateStatus = async (id: string, status: CoordinationItemStatus) => {
    setMessage('');
    const response = await fetch('/api/iso/coordination/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || '상태를 변경하지 못했습니다.');
      return;
    }
    setItems((current) => current.map((item) => item.id === id ? payload.item : item));
  };

  const issueSyncKey = async () => {
    setMessage('');
    setIssuedKey('');
    const response = await fetch('/api/iso/coordination/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'issue-sync-key' }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || '수집기 키를 만들지 못했습니다.');
      return;
    }
    setIssuedKey(payload.key || '');
    setSyncConfigured(true);
  };

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setMessage(`${label}을(를) 클립보드에 복사했습니다.`);
  };

  return (
    <main className="min-h-screen bg-[#eef2f5] text-slate-950">
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6">
        <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-xl">
          <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">Private · read-only inbox coordination</p>
              <h2 className="mt-2 text-3xl font-black">나의 조정 에이전트</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                전체 받은편지함을 분류해 회신, 기한, 대기 업무를 정리합니다. 메일 원문과 첨부파일은 저장하지 않으며 실제 발송·삭제·이동·일정 등록을 수행하지 않습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void load()} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10">새로고침</button>
              <button type="button" onClick={() => void issueSyncKey()} className="rounded-lg bg-teal-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-teal-300">
                {syncConfigured ? '수집기 키 다시 만들기' : 'Outlook 수집기 연결'}
              </button>
            </div>
          </div>
          <div className="grid gap-px bg-white/10 sm:grid-cols-4">
            <Stat label="긴급" value={stats.urgent} tone="rose" />
            <Stat label="회신 필요" value={stats.reply} tone="teal" />
            <Stat label="기한 업무" value={stats.deadline} tone="amber" />
            <Stat label="회신 대기" value={stats.waiting} tone="slate" />
          </div>
        </section>

        {message && <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{message}</div>}

        {issuedKey && (
          <section className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <h3 className="font-black text-amber-950">새 수집기 키가 만들어졌습니다</h3>
            <p className="mt-1 text-sm text-amber-900">이 키는 다시 표시되지 않습니다. 로컬 설정 파일에 저장하면 기존 키는 즉시 무효화됩니다.</p>
            <div className="mt-3 flex gap-2">
              <input readOnly value={issuedKey} className="min-w-0 flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-xs" />
              <button type="button" onClick={() => void copy(issuedKey, '수집기 키')} className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-bold text-white">복사</button>
            </div>
          </section>
        )}

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black">조정 업무</h3>
                <p className="mt-1 text-sm text-slate-500">AI 결과는 초안입니다. 원문을 확인한 후 상태를 변경하세요.</p>
              </div>
              <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
                {([
                  ['active', '진행 중'], ['new', '신규'], ['reviewed', '검토됨'], ['done', '완료'], ['ignored', '제외'], ['all', '전체'],
                ] as Array<[ViewFilter, string]>).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === value ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>
                ))}
              </div>
            </div>

            {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">불러오는 중...</div>
              : visibleItems.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><p className="font-bold text-slate-700">표시할 업무가 없습니다.</p><p className="mt-2 text-sm text-slate-500">Outlook 수집기를 실행하거나 다른 필터를 선택해 주세요.</p></div>
              : <div className="space-y-3">{visibleItems.map((item) => <CoordinationCard key={item.id} item={item} onStatus={updateStatus} onCopy={copy} />)}</div>}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-black">Outlook 동기화</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <Info label="수집 범위" value="전체 받은편지함 · 중요/기타" />
                <Info label="예약" value="평일 09:00 · 12:30 · 16:30" />
                <Info label="최근 시도" value={formatDateTime(syncStatus?.attemptedAt)} />
                <Info label="최근 완료" value={formatDateTime(syncStatus?.completedAt)} />
                <Info label="최근 생성" value={syncStatus ? `${syncStatus.itemsCreated}건` : '-'} />
              </dl>
              {syncStatus?.error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-800">{syncStatus.error}</p>}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-black">안전 원칙</h3>
              <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-600">
                <li>• 본인 최고관리자 계정만 접근</li>
                <li>• 원문·첨부파일 서버 미저장</li>
                <li>• 메일 발송·삭제·이동 없음</li>
                <li>• 동일 메시지 중복 분석 방지</li>
                <li>• AI 초안은 사람 검토 후 사용</li>
              </ul>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'rose' | 'teal' | 'amber' | 'slate' }) {
  const color = { rose: 'text-rose-300', teal: 'text-teal-300', amber: 'text-amber-300', slate: 'text-slate-200' }[tone];
  return <div className="bg-white/5 px-6 py-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className={`mt-1 text-3xl font-black ${color}`}>{value}</p></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><dt className="text-slate-500">{label}</dt><dd className="text-right font-bold text-slate-800">{value}</dd></div>;
}

function CoordinationCard({
  item,
  onStatus,
  onCopy,
}: {
  item: CoordinationItem;
  onStatus: (id: string, status: CoordinationItemStatus) => Promise<void>;
  onCopy: (value: string, label: string) => Promise<void>;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${priorityStyle[item.priority]}`}>{item.priority}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{categoryLabel[item.category]}</span>
            <span className="text-xs font-semibold text-slate-400">{statusLabel[item.status]}</span>
          </div>
          <h4 className="mt-3 text-lg font-black leading-6">{item.subject}</h4>
          <p className="mt-1 text-sm text-slate-500">{item.sender} · {formatDateTime(item.receivedAt || item.createdAt)}</p>
        </div>
        {item.dueDate && <span className={`rounded-lg px-3 py-2 text-xs font-black ${dueLabel(item.dueDate).includes('경과') || dueLabel(item.dueDate).includes('오늘') ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'}`}>{dueLabel(item.dueDate)}</span>}
      </div>

      <p className="mt-4 whitespace-pre-line text-sm font-semibold leading-6 text-slate-800">{item.summary}</p>
      {item.recommendedAction && <div className="mt-4 rounded-xl bg-teal-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-teal-800">추천 행동</p><p className="mt-1 text-sm leading-6 text-teal-950">{item.recommendedAction}</p></div>}
      {item.draftReply && <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><summary className="cursor-pointer text-sm font-black">회신 초안</summary><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{item.draftReply}</p><button type="button" onClick={() => void onCopy(item.draftReply, '회신 초안')} className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold hover:bg-slate-100">초안 복사</button></details>}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        {item.webLink && <a href={item.webLink} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">Outlook 원문</a>}
        <button type="button" onClick={() => void onStatus(item.id, 'reviewed')} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50">검토됨</button>
        <button type="button" onClick={() => void onStatus(item.id, 'done')} className="rounded-lg border border-teal-300 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-50">완료</button>
        <button type="button" onClick={() => void onStatus(item.id, 'ignored')} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50">제외</button>
        {(item.status === 'done' || item.status === 'ignored') && <button type="button" onClick={() => void onStatus(item.id, 'new')} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">다시 열기</button>}
      </div>
    </article>
  );
}
