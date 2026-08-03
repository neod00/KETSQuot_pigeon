'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  SamAccountView,
  SamBilingualText,
  SamDocument,
  SamProgressStatus,
  SamProgressUpdate,
  SamReviewCadence,
} from '@/lib/samTypes';

type View = 'dashboard' | 'accounts' | 'detail' | 'meeting' | 'translation' | 'documents';
type Language = 'ko' | 'en';
type BilingualKey =
  | 'name' | 'sector' | 'internalSponsor' | 'clientSponsor' | 'qbrOutcome' | 'attendees'
  | 'visitOutcome' | 'opportunity' | 'dealStage' | 'dealValueNote' | 'risk'
  | 'growthStrategy' | 'crossSell' | 'notes';

const bilingualKeys: Array<{ key: BilingualKey; ko: string; en: string }> = [
  { key: 'name', ko: 'Account 이름', en: 'Account Name' },
  { key: 'sector', ko: '산업', en: 'Sector' },
  { key: 'internalSponsor', ko: '내부 Sponsor', en: 'Internal Executive Sponsor' },
  { key: 'clientSponsor', ko: '고객 Sponsor', en: 'Client Executive Sponsor(s)' },
  { key: 'qbrOutcome', ko: '최근 QBR 주요 결과', en: 'Last QBR - Key Outcomes' },
  { key: 'attendees', ko: 'LRQA 참석자', en: 'Who Attended' },
  { key: 'visitOutcome', ko: '방문 목적 및 결과', en: 'Visit Purpose & Outcome' },
  { key: 'opportunity', ko: 'Opportunity', en: 'Opportunity Name' },
  { key: 'dealStage', ko: 'Deal Stage', en: 'Deal Stage' },
  { key: 'dealValueNote', ko: 'Deal Value 설명', en: 'Deal Value Note' },
  { key: 'risk', ko: 'Risk', en: 'Risk' },
  { key: 'growthStrategy', ko: 'Account 성장전략', en: 'Account Growth Strategy' },
  { key: 'crossSell', ko: 'Cross-sell / Upsell', en: 'Cross-Sell / Upsell Plans' },
  { key: 'notes', ko: '추가 메모', en: 'Additional Notes' },
];

const emptyPair = (): SamBilingualText => ({ ko: '', en: '', status: 'review' });
const emptyUpdate = (): Partial<SamProgressUpdate> => ({
  date: new Date().toISOString().slice(0, 10),
  status: 'on-track',
  accomplishments: emptyPair(),
  customerMeetings: emptyPair(),
  pipelineChanges: emptyPair(),
  blockers: emptyPair(),
  nextActions: emptyPair(),
  owner: 'Dal',
  dueDate: '',
  managerSupport: emptyPair(),
});

const statusLabel: Record<SamProgressStatus, string> = {
  'on-track': '정상',
  watch: '관찰',
  'at-risk': '위험',
};

const statusClass: Record<SamProgressStatus, string> = {
  'on-track': 'border-teal-200 bg-teal-50 text-teal-800',
  watch: 'border-amber-200 bg-amber-50 text-amber-900',
  'at-risk': 'border-red-200 bg-red-50 text-red-800',
};

const formatUsd = (value: number) => value > 0
  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
  : 'TBD';

const formatKrw = (value: number) => value > 0
  ? `${new Intl.NumberFormat('ko-KR').format(value)}원`
  : '0원';

const meetingLabels = {
  ko: {
    title: 'SAM Account Review', change: '최근 진행현황', pipeline: '연결 Pipeline',
    risk: '현재 Risk', next: '다음 조치', support: '매니저 지원 요청',
    noUpdate: '등록된 진행 업데이트가 없습니다.',
  },
  en: {
    title: 'SAM Account Review', change: 'Latest Progress', pipeline: 'Linked Pipeline',
    risk: 'Current Risk', next: 'Next Actions', support: 'Manager Support Required',
    noUpdate: 'No progress update has been registered.',
  },
};

function BilingualEditor({
  label,
  value,
  onChange,
  multiline = true,
}: {
  label: string;
  value: SamBilingualText;
  onChange: (value: SamBilingualText) => void;
  multiline?: boolean;
}) {
  const Control = multiline ? 'textarea' : 'input';
  return (
    <div className="grid gap-3 border-b border-slate-200 pb-4 md:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700">
        {label} · 한국어 원문
        <Control
          className="mt-1 min-h-11 w-full border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900"
          value={value.ko}
          onChange={(event) => onChange({ ...value, ko: event.target.value, status: 'review' })}
        />
      </label>
      <label className="text-sm font-semibold text-slate-700">
        English output
        <Control
          className="mt-1 min-h-11 w-full border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900"
          value={value.en}
          onChange={(event) => onChange({ ...value, en: event.target.value, status: 'review' })}
        />
        <span className={`mt-1 inline-flex border px-2 py-0.5 text-xs ${value.status === 'approved' ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
          {value.status === 'approved' ? '영문 승인 완료' : '영문 재검토'}
        </span>
      </label>
    </div>
  );
}

export default function SamDashboard() {
  const [accounts, setAccounts] = useState<SamAccountView[]>([]);
  const [documents, setDocuments] = useState<SamDocument[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<SamAccountView | null>(null);
  const [language, setLanguage] = useState<Language>('ko');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newAccount, setNewAccount] = useState({
    nameKo: '', nameEn: '', sectorKo: '', sectorEn: '', manager: 'Dal',
    cadence: 'biweekly' as SamReviewCadence,
  });
  const [updateDraft, setUpdateDraft] = useState<Partial<SamProgressUpdate>>(emptyUpdate);
  const [affiliateDraft, setAffiliateDraft] = useState({ nameKo: '', nameEn: '', aliases: '' });
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const response = await fetch('/api/iso/sam', { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'SAM 데이터를 불러오지 못했습니다.');
    setAccounts(payload.accounts || []);
    setDocuments(payload.documents || []);
    setSelectedId((current) => current || payload.accounts?.[0]?.id || '');
  }, []);

  useEffect(() => { void load().catch((error) => setMessage(error.message)); }, [load]);
  useEffect(() => {
    const selected = accounts.find((account) => account.id === selectedId);
    if (selected) setDraft(structuredClone(selected));
  }, [accounts, selectedId]);

  const filtered = useMemo(() => accounts.filter((account) => {
    const haystack = [account.name.ko, account.name.en, account.sector.ko, account.sector.en, account.manager, account.opportunity.ko, account.opportunity.en].join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase());
  }), [accounts, query]);
  const activePipeline = accounts.reduce((sum, account) => sum + account.activePipelineUsd, 0);
  const translationReady = accounts.filter((account) => bilingualKeys.every(({ key }) => account[key].status === 'approved' && account[key].en)).length;

  const openAccount = (id: string, nextView: View = 'detail') => {
    setSelectedId(id);
    setView(nextView);
  };

  const saveDraft = async (nextDraft = draft) => {
    if (!nextDraft) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/iso/sam/${nextDraft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: Object.fromEntries(Object.entries(nextDraft).filter(([key]) => !['pipeline', 'activePipelineUsd'].includes(key))) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Account를 저장하지 못했습니다.');
      await load();
      setMessage('Account 변경사항을 저장했습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '저장하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const createAccount = async () => {
    if (!newAccount.nameKo.trim() && !newAccount.nameEn.trim()) return;
    setBusy(true);
    try {
      const response = await fetch('/api/iso/sam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: {
            name: { ko: newAccount.nameKo, en: newAccount.nameEn, status: newAccount.nameEn ? 'approved' : 'review' },
            sector: { ko: newAccount.sectorKo, en: newAccount.sectorEn, status: newAccount.sectorEn ? 'approved' : 'review' },
            manager: newAccount.manager,
            reviewCadence: newAccount.cadence,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Account를 추가하지 못했습니다.');
      await load();
      setSelectedId(payload.account.id);
      setShowNew(false);
      setView('detail');
      setMessage('신규 Account를 추가했습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Account를 추가하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const addUpdate = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/iso/sam/${selectedId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ update: updateDraft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '진행현황을 저장하지 못했습니다.');
      setUpdateDraft(emptyUpdate());
      await load();
      setMessage('진행현황을 추가했습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '진행현황을 저장하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const addAffiliate = () => {
    if (!draft || (!affiliateDraft.nameKo.trim() && !affiliateDraft.nameEn.trim())) return;
    const next = {
      ...draft,
      affiliates: [...draft.affiliates, {
        id: crypto.randomUUID(),
        nameKo: affiliateDraft.nameKo.trim(),
        nameEn: affiliateDraft.nameEn.trim(),
        aliases: affiliateDraft.aliases.split(',').map((value) => value.trim()).filter(Boolean),
      }],
    };
    setDraft(next);
    setAffiliateDraft({ nameKo: '', nameEn: '', aliases: '' });
  };

  const importExcel = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.set('file', file);
      const response = await fetch('/api/iso/sam/import', { method: 'POST', body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Excel을 가져오지 못했습니다.');
      await load();
      setMessage(`${payload.imported}개 Account를 가져왔습니다. 신규 ${payload.created}개, 갱신 ${payload.updated}개입니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Excel을 가져오지 못했습니다.');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const approveAll = async () => {
    if (!draft) return;
    const next = structuredClone(draft);
    bilingualKeys.forEach(({ key }) => { next[key].status = next[key].en.trim() ? 'approved' : 'review'; });
    setDraft(next);
    await saveDraft(next);
  };

  const generateEnglishDraft = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const fields = bilingualKeys.map(({ key }) => ({ key, ko: draft[key].ko })).filter((field) => field.ko);
      const response = await fetch('/api/iso/sam/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '영문 초안을 생성하지 못했습니다.');
      const next = structuredClone(draft);
      bilingualKeys.forEach(({ key }) => {
        if (payload.translations?.[key]) next[key] = { ...next[key], en: payload.translations[key], status: 'review' };
      });
      setDraft(next);
      setMessage('영문 초안을 만들었습니다. 검토 후 승인해 주세요.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '영문 초안을 생성하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const nav = (value: View, label: string) => (
    <button
      type="button"
      onClick={() => setView(value)}
      className={`min-h-10 border-b-2 px-3 text-sm font-bold ${view === value ? 'border-teal-600 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
    >
      {label}
    </button>
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4 border-b border-slate-300 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-teal-700">Strategic account management</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">SAM Business</h2>
          <p className="mt-1 text-sm text-slate-600">한국어 진행현황을 관리하고 승인된 영문으로 회의·Excel·PPTX를 제공합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileInput} type="file" accept=".xlsx" className="hidden" onChange={(event) => void importExcel(event.target.files?.[0])} />
          <button type="button" onClick={() => fileInput.current?.click()} className="min-h-10 border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700">Excel 가져오기</button>
          <button type="button" onClick={() => setShowNew(true)} className="min-h-10 bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800">+ Account 추가</button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap border-b border-slate-200">
        {nav('dashboard', '대시보드')}
        {nav('accounts', 'Strategic Accounts')}
        {nav('meeting', '회의 모드')}
        {nav('translation', '영문 검토')}
        {nav('documents', '출력·문서')}
      </div>

      {message && <div role="status" className="mt-4 border-l-4 border-teal-600 bg-teal-50 px-4 py-3 text-sm text-teal-950">{message}</div>}

      {showNew && (
        <section className="mt-5 border border-blue-200 bg-white p-5">
          <div className="flex items-center justify-between"><h3 className="font-bold text-slate-950">신규 Strategic Account</h3><button type="button" onClick={() => setShowNew(false)} className="text-sm text-slate-500">닫기</button></div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="text-sm font-semibold">Account 이름(한글)<input className="mt-1 w-full border p-2" value={newAccount.nameKo} onChange={(e) => setNewAccount({ ...newAccount, nameKo: e.target.value })} /></label>
            <label className="text-sm font-semibold">Account Name(English)<input className="mt-1 w-full border p-2" value={newAccount.nameEn} onChange={(e) => setNewAccount({ ...newAccount, nameEn: e.target.value })} /></label>
            <label className="text-sm font-semibold">검토 주기<select className="mt-1 w-full border p-2" value={newAccount.cadence} onChange={(e) => setNewAccount({ ...newAccount, cadence: e.target.value as SamReviewCadence })}><option value="weekly">매주</option><option value="biweekly">격주</option><option value="monthly">월간</option></select></label>
            <label className="text-sm font-semibold">산업(한글)<input className="mt-1 w-full border p-2" value={newAccount.sectorKo} onChange={(e) => setNewAccount({ ...newAccount, sectorKo: e.target.value })} /></label>
            <label className="text-sm font-semibold">Sector(English)<input className="mt-1 w-full border p-2" value={newAccount.sectorEn} onChange={(e) => setNewAccount({ ...newAccount, sectorEn: e.target.value })} /></label>
            <label className="text-sm font-semibold">SAM 담당자<input className="mt-1 w-full border p-2" value={newAccount.manager} onChange={(e) => setNewAccount({ ...newAccount, manager: e.target.value })} /></label>
          </div>
          <button type="button" disabled={busy} onClick={() => void createAccount()} className="mt-4 min-h-10 bg-blue-700 px-5 text-sm font-bold text-white disabled:bg-slate-300">Account 생성</button>
        </section>
      )}

      {view === 'dashboard' && (
        <section className="mt-5">
          <div className="grid border border-slate-300 bg-white sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4"><p className="text-xs font-bold text-slate-500">Strategic Accounts</p><p className="mt-1 text-2xl font-bold">{accounts.length}</p></div>
            <div className="border-t p-4 sm:border-l sm:border-t-0"><p className="text-xs font-bold text-slate-500">연결 Active Pipeline</p><p className="mt-1 text-2xl font-bold">{formatKrw(activePipeline)}</p></div>
            <div className="border-t p-4 lg:border-l lg:border-t-0"><p className="text-xs font-bold text-slate-500">At Risk</p><p className="mt-1 text-2xl font-bold text-red-700">{accounts.filter((account) => account.atRisk).length}</p></div>
            <div className="border-t p-4 sm:border-l lg:border-t-0"><p className="text-xs font-bold text-slate-500">영문 출력 준비</p><p className="mt-1 text-2xl font-bold">{translationReady} / {accounts.length}</p></div>
          </div>
          <div className="mt-5 flex items-end justify-between"><div><h3 className="font-bold text-slate-950">매니저 검토 대상</h3><p className="text-sm text-slate-500">위험, 최근 변경, 다음 일정과 Pipeline을 한 화면에서 확인합니다.</p></div><button type="button" onClick={() => setView('meeting')} className="border border-slate-300 px-3 py-2 text-sm font-bold">회의 모드 열기</button></div>
          <AccountTable accounts={accounts} onOpen={openAccount} />
        </section>
      )}

      {view === 'accounts' && (
        <section className="mt-5">
          <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input className="min-h-10 border border-slate-300 bg-white px-3" placeholder="회사명, Sponsor, Opportunity 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
            <span className="self-center text-sm text-slate-500">총 {filtered.length}개</span>
          </div>
          <AccountTable accounts={filtered} onOpen={openAccount} />
        </section>
      )}

      {view === 'detail' && draft && (
        <section className="mt-5">
          <div className="flex flex-col gap-3 border-b border-slate-300 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-xs font-bold text-teal-700">ACCOUNT DETAIL</p><h3 className="mt-1 text-xl font-bold">{draft.name.ko} <span className="text-base font-normal text-slate-500">/ {draft.name.en}</span></h3></div>
            <div className="flex gap-2"><button type="button" onClick={() => setView('translation')} className="border px-3 py-2 text-sm font-bold">영문 검토</button><button type="button" disabled={busy} onClick={() => void saveDraft()} className="bg-blue-700 px-4 py-2 text-sm font-bold text-white">변경 저장</button></div>
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-4">
              {bilingualKeys.slice(0, 4).map((field) => <BilingualEditor key={field.key} label={field.ko} value={draft[field.key]} multiline={!['name', 'sector'].includes(field.key)} onChange={(value) => setDraft({ ...draft, [field.key]: value })} />)}
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-sm font-semibold">최근 QBR<input type="date" className="mt-1 w-full border p-2" value={draft.lastQbrDate} onChange={(e) => setDraft({ ...draft, lastQbrDate: e.target.value })} /></label>
                <label className="text-sm font-semibold">다음 QBR<input type="date" className="mt-1 w-full border p-2" value={draft.nextQbrDate} onChange={(e) => setDraft({ ...draft, nextQbrDate: e.target.value })} /></label>
                <label className="text-sm font-semibold">검토 주기<select className="mt-1 w-full border p-2" value={draft.reviewCadence} onChange={(e) => setDraft({ ...draft, reviewCadence: e.target.value as SamReviewCadence })}><option value="weekly">매주</option><option value="biweekly">격주</option><option value="monthly">월간</option></select></label>
              </div>
              {bilingualKeys.slice(4).map((field) => <BilingualEditor key={field.key} label={field.ko} value={draft[field.key]} onChange={(value) => setDraft({ ...draft, [field.key]: value })} />)}
            </div>
            <aside className="space-y-5">
              <div className="border border-slate-300 bg-white p-4">
                <h4 className="font-bold">Pipeline 연결 기준</h4>
                <p className="mt-1 text-xs text-slate-500">아래 그룹명·계열사·별칭의 정확 일치 또는 수동 연결만 집계합니다.</p>
                <div className="mt-3 space-y-2">{draft.affiliates.map((affiliate) => <div key={affiliate.id} className="border-b pb-2 text-sm"><strong>{affiliate.nameKo || affiliate.nameEn}</strong><div className="text-xs text-slate-500">{affiliate.nameEn} {affiliate.aliases.length ? `· 별칭 ${affiliate.aliases.join(', ')}` : ''}</div></div>)}</div>
                <div className="mt-3 grid gap-2"><input className="border p-2 text-sm" placeholder="계열사 한글명" value={affiliateDraft.nameKo} onChange={(e) => setAffiliateDraft({ ...affiliateDraft, nameKo: e.target.value })} /><input className="border p-2 text-sm" placeholder="Affiliate English name" value={affiliateDraft.nameEn} onChange={(e) => setAffiliateDraft({ ...affiliateDraft, nameEn: e.target.value })} /><input className="border p-2 text-sm" placeholder="별칭, 쉼표로 구분" value={affiliateDraft.aliases} onChange={(e) => setAffiliateDraft({ ...affiliateDraft, aliases: e.target.value })} /><button type="button" onClick={addAffiliate} className="border px-3 py-2 text-sm font-bold">계열사 추가</button></div>
              </div>
              <div className="border border-slate-300 bg-white p-4">
                <h4 className="font-bold">연결된 Pipeline</h4>
                <p className="mt-1 text-xl font-bold">{formatKrw(draft.activePipelineUsd)}</p>
                <div className="mt-3 space-y-2">{draft.pipeline.map((record) => <div key={record.id} className="border-t pt-2 text-sm"><strong>{record.companyName}</strong><p>{record.product || record.opportunityName}</p><p className="text-xs text-slate-500">{record.matchedBy} · {formatKrw(record.amount)}</p></div>)}{!draft.pipeline.length && <p className="text-sm text-slate-500">정확히 연결된 세일즈 데이터가 없습니다.</p>}</div>
              </div>
            </aside>
          </div>
          <ProgressSection account={draft} updateDraft={updateDraft} setUpdateDraft={setUpdateDraft} onAdd={() => void addUpdate()} busy={busy} />
        </section>
      )}

      {view === 'meeting' && (
        <MeetingMode accounts={accounts} language={language} setLanguage={setLanguage} onOpen={(id) => openAccount(id, 'detail')} />
      )}

      {view === 'translation' && draft && (
        <section className="mt-5">
          <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-bold text-teal-700">BILINGUAL REVIEW</p><h3 className="mt-1 text-xl font-bold">{draft.name.ko} 영문 검토</h3><p className="text-sm text-slate-500">오른쪽 승인 영문만 본사 제출용 Excel과 PPTX에 사용됩니다.</p></div>
            <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void generateEnglishDraft()} className="border px-3 py-2 text-sm font-bold">영문 자동초안</button><button type="button" disabled={busy} onClick={() => void approveAll()} className="bg-blue-700 px-4 py-2 text-sm font-bold text-white">전체 영문 승인</button></div>
          </div>
          <div className="mt-5 space-y-4">{bilingualKeys.map((field) => <BilingualEditor key={field.key} label={field.ko} value={draft[field.key]} multiline={!['name', 'sector'].includes(field.key)} onChange={(value) => setDraft({ ...draft, [field.key]: value })} />)}</div>
          <button type="button" onClick={() => void saveDraft()} className="mt-5 bg-blue-700 px-5 py-2 text-sm font-bold text-white">검토 내용 저장</button>
        </section>
      )}

      {view === 'documents' && (
        <section className="mt-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-slate-300 bg-white p-5"><h3 className="font-bold">Account Tracker Excel</h3><p className="mt-2 text-sm text-slate-600">APAC Summary·SEA·SA 시트를 유지하고 Korea A–T를 승인 영문으로 출력합니다.</p><form action="/api/iso/sam/export/excel" method="get"><button type="submit" className="mt-5 inline-flex bg-blue-700 px-4 py-2 text-sm font-bold text-white">영문 Excel 생성</button></form></div>
            <div className="border border-slate-300 bg-white p-5"><h3 className="font-bold">Account Plan PPTX</h3><p className="mt-2 text-sm text-slate-600">선택 Account의 영문 데이터로 LRQA 6장 Account Plan을 생성합니다.</p><select className="mt-3 w-full border p-2" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name.en}</option>)}</select>{selectedId && <a href={`/api/iso/sam/export/pptx/${selectedId}`} className="mt-3 inline-flex bg-blue-700 px-4 py-2 text-sm font-bold text-white">영문 PPTX 생성</a>}</div>
          </div>
          <h3 className="mt-7 font-bold">문서·버전 이력</h3>
          <div className="mt-3 overflow-x-auto border border-slate-300 bg-white"><table className="w-full min-w-[650px] text-sm"><thead className="bg-slate-100 text-left"><tr><th className="p-3">파일</th><th className="p-3">Account</th><th className="p-3">버전</th><th className="p-3">생성일</th><th className="p-3">작업</th></tr></thead><tbody>{documents.map((document) => <tr key={document.id} className="border-t"><td className="p-3 font-semibold">{document.fileName}</td><td className="p-3">{document.accountName}</td><td className="p-3">v{document.version}</td><td className="p-3">{new Date(document.createdAt).toLocaleString('ko-KR')}</td><td className="p-3"><a href={`/api/iso/sam/documents/${document.id}`} className="font-bold text-blue-700">다운로드</a></td></tr>)}{!documents.length && <tr><td colSpan={5} className="p-10 text-center text-slate-500">생성된 문서가 없습니다.</td></tr>}</tbody></table></div>
        </section>
      )}
    </main>
  );
}

function AccountTable({ accounts, onOpen }: { accounts: SamAccountView[]; onOpen: (id: string) => void }) {
  return (
    <div className="mt-3 overflow-x-auto border border-slate-300 bg-white">
      <table className="w-full min-w-[850px] text-sm">
        <thead className="bg-slate-100 text-left text-xs text-slate-600"><tr><th className="p-3">Account</th><th className="p-3">SAM</th><th className="p-3">Next QBR</th><th className="p-3">Opportunity</th><th className="p-3 text-right">Pipeline</th><th className="p-3">Risk</th><th className="p-3">최근 수정</th></tr></thead>
        <tbody>{accounts.map((account) => <tr key={account.id} onClick={() => onOpen(account.id)} className="cursor-pointer border-t hover:bg-slate-50"><td className="min-w-[150px] p-3"><strong>{account.name.ko}</strong><p className="text-xs text-slate-500">{account.name.en}</p></td><td className="whitespace-nowrap p-3">{account.manager}</td><td className="max-w-[240px] p-3"><p className="line-clamp-2" title={account.nextQbrDate}>{account.nextQbrDate || '미정'}</p></td><td className="max-w-[260px] p-3"><p className="line-clamp-2">{account.opportunity.ko || '-'}</p></td><td className="whitespace-nowrap p-3 text-right font-bold">{account.activePipelineUsd > 0 ? formatKrw(account.activePipelineUsd) : formatUsd(account.dealValueUsd)}</td><td className="whitespace-nowrap p-3"><span className={`border px-2 py-1 text-xs font-bold ${account.atRisk ? statusClass['at-risk'] : statusClass['on-track']}`}>{account.atRisk ? 'At Risk' : '정상'}</span></td><td className="whitespace-nowrap p-3 text-xs text-slate-500">{new Date(account.updatedAt).toLocaleDateString('ko-KR')}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function ProgressSection({
  account, updateDraft, setUpdateDraft, onAdd, busy,
}: {
  account: SamAccountView;
  updateDraft: Partial<SamProgressUpdate>;
  setUpdateDraft: (value: Partial<SamProgressUpdate>) => void;
  onAdd: () => void;
  busy: boolean;
}) {
  const pair = (key: 'accomplishments' | 'customerMeetings' | 'pipelineChanges' | 'blockers' | 'nextActions' | 'managerSupport') =>
    (updateDraft[key] || emptyPair()) as SamBilingualText;
  const setPair = (key: 'accomplishments' | 'customerMeetings' | 'pipelineChanges' | 'blockers' | 'nextActions' | 'managerSupport', value: SamBilingualText) =>
    setUpdateDraft({ ...updateDraft, [key]: value });
  return (
    <section className="mt-8 border-t border-slate-300 pt-6">
      <h3 className="text-lg font-bold">진행현황 업데이트</h3>
      <p className="mt-1 text-sm text-slate-500">업데이트는 누적 보관되며 회의 모드에서 지난 회의 이후 변경사항으로 표시됩니다.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-4"><label className="text-sm font-semibold">기준일<input type="date" className="mt-1 w-full border p-2" value={updateDraft.date || ''} onChange={(e) => setUpdateDraft({ ...updateDraft, date: e.target.value })} /></label><label className="text-sm font-semibold">상태<select className="mt-1 w-full border p-2" value={updateDraft.status} onChange={(e) => setUpdateDraft({ ...updateDraft, status: e.target.value as SamProgressStatus })}><option value="on-track">정상</option><option value="watch">관찰</option><option value="at-risk">위험</option></select></label><label className="text-sm font-semibold">담당자<input className="mt-1 w-full border p-2" value={updateDraft.owner || ''} onChange={(e) => setUpdateDraft({ ...updateDraft, owner: e.target.value })} /></label><label className="text-sm font-semibold">완료 예정일<input type="date" className="mt-1 w-full border p-2" value={updateDraft.dueDate || ''} onChange={(e) => setUpdateDraft({ ...updateDraft, dueDate: e.target.value })} /></label></div>
      <div className="mt-4 space-y-4"><BilingualEditor label="이번 기간 성과" value={pair('accomplishments')} onChange={(value) => setPair('accomplishments', value)} /><BilingualEditor label="고객 미팅" value={pair('customerMeetings')} onChange={(value) => setPair('customerMeetings', value)} /><BilingualEditor label="Pipeline 변화" value={pair('pipelineChanges')} onChange={(value) => setPair('pipelineChanges', value)} /><BilingualEditor label="현재 장애요인" value={pair('blockers')} onChange={(value) => setPair('blockers', value)} /><BilingualEditor label="다음 조치" value={pair('nextActions')} onChange={(value) => setPair('nextActions', value)} /><BilingualEditor label="매니저 지원 요청" value={pair('managerSupport')} onChange={(value) => setPair('managerSupport', value)} /></div>
      <button type="button" disabled={busy} onClick={onAdd} className="mt-4 bg-teal-700 px-5 py-2 text-sm font-bold text-white disabled:bg-slate-300">진행현황 추가</button>
      <div className="mt-6 space-y-3">{account.updates.map((update) => <article key={update.id} className="border-l-4 border-slate-300 bg-white p-4"><div className="flex flex-wrap items-center gap-2"><strong>{update.date}</strong><span className={`border px-2 py-0.5 text-xs font-bold ${statusClass[update.status]}`}>{statusLabel[update.status]}</span><span className="text-xs text-slate-500">{update.owner}</span></div><p className="mt-2 text-sm">{update.accomplishments.ko || update.nextActions.ko || '내용 없음'}</p></article>)}{!account.updates.length && <p className="text-sm text-slate-500">등록된 진행현황이 없습니다.</p>}</div>
    </section>
  );
}

function MeetingMode({
  accounts, language, setLanguage, onOpen,
}: {
  accounts: SamAccountView[];
  language: Language;
  setLanguage: (value: Language) => void;
  onOpen: (id: string) => void;
}) {
  const labels = meetingLabels[language];
  const field = (value: SamBilingualText) => value[language] || (language === 'en' ? 'Translation pending' : '내용 없음');
  return (
    <section className="mt-5">
      <div className="flex flex-col gap-3 border-b border-slate-300 pb-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold text-teal-700">MANAGER REVIEW</p><h3 className="mt-1 text-xl font-bold">{labels.title}</h3><p className="text-sm text-slate-500">{language === 'ko' ? '실제 진행현황, Pipeline, Risk와 다음 조치를 회의용으로 정리합니다.' : 'Review live progress, linked pipeline, risks and next actions.'}</p></div><div className="inline-flex border border-slate-300 bg-slate-100 p-1"><button type="button" onClick={() => setLanguage('ko')} className={`px-4 py-2 text-sm font-bold ${language === 'ko' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>한국어</button><button type="button" onClick={() => setLanguage('en')} className={`px-4 py-2 text-sm font-bold ${language === 'en' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>English</button></div></div>
      <div className="mt-5 space-y-5">{accounts.map((account) => {
        const update = account.updates[0];
        const progress = update ? field(update.accomplishments) : labels.noUpdate;
        const nextAction = update ? field(update.nextActions) : field(account.growthStrategy);
        const support = update ? field(update.managerSupport) : '-';
        const status = update?.status || (account.atRisk ? 'at-risk' : 'on-track');
        return <article key={account.id} className="border border-slate-300 bg-white"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4"><div><h4 className="text-lg font-bold">{language === 'ko' ? account.name.ko : account.name.en}</h4><p className="text-xs text-slate-500">{account.manager} · {account.reviewCadence}</p></div><div className="flex items-center gap-2"><span className={`border px-2 py-1 text-xs font-bold ${statusClass[status]}`}>{language === 'ko' ? statusLabel[status] : status.replace('-', ' ')}</span><button type="button" onClick={() => onOpen(account.id)} className="border px-3 py-1.5 text-xs font-bold">{language === 'ko' ? '상세' : 'Details'}</button></div></header><div className="grid md:grid-cols-2 lg:grid-cols-5"><div className="p-4"><p className="text-xs font-bold text-slate-500">{labels.change}</p><p className="mt-2 text-sm">{progress}</p></div><div className="border-t p-4 md:border-l md:border-t-0"><p className="text-xs font-bold text-slate-500">{labels.pipeline}</p><p className="mt-2 font-bold">{account.activePipelineUsd > 0 ? formatKrw(account.activePipelineUsd) : formatUsd(account.dealValueUsd)}</p><p className="text-xs text-slate-500">{account.pipeline.length} linked records</p></div><div className="border-t p-4 lg:border-l lg:border-t-0"><p className="text-xs font-bold text-slate-500">{labels.risk}</p><p className="mt-2 text-sm">{field(account.risk)}</p></div><div className="border-t p-4 md:border-l lg:border-t-0"><p className="text-xs font-bold text-slate-500">{labels.next}</p><p className="mt-2 text-sm">{nextAction}</p></div><div className="border-t p-4 lg:border-l lg:border-t-0"><p className="text-xs font-bold text-slate-500">{labels.support}</p><p className="mt-2 text-sm">{support}</p></div></div></article>;
      })}</div>
    </section>
  );
}
