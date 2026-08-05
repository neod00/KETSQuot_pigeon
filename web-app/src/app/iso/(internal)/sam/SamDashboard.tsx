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
  sourceMemo: '',
  briefing: emptyPair(),
  accomplishments: emptyPair(),
  customerMeetings: emptyPair(),
  pipelineChanges: emptyPair(),
  blockers: emptyPair(),
  nextActions: emptyPair(),
  owner: 'Dal',
  dueDate: '',
  managerSupport: emptyPair(),
  uncategorized: emptyPair(),
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
    title: 'SAM Account Review',
    subtitle: '핵심 변화와 의사결정 항목을 먼저 보고, 필요할 때 활동·Pipeline·Action 근거를 펼쳐봅니다.',
    briefing: '핵심 브리핑',
    change: '최근 진행현황',
    pipeline: '연결 Pipeline',
    risk: '현재 Risk',
    next: '다음 조치',
    support: '매니저 지원 요청',
    lastUpdate: '최근 업데이트',
    nextReview: '다음 검토',
    stale: '업데이트 필요',
    noUpdate: '등록된 진행 업데이트가 없습니다.',
    recentActivity: '최근 활동',
    pipelineDetail: 'Pipeline 상세',
    actionStakeholder: 'Action · Stakeholder',
    noPipeline: '정확한 회사·계열사·별칭 기준으로 연결된 Pipeline이 없습니다.',
    coverage: '계열사 Pipeline 커버리지',
    noActions: '등록된 Action 또는 Stakeholder가 없습니다.',
    owner: '담당',
    due: '기한',
    meeting: '고객 미팅',
    pipelineChange: 'Pipeline 변화',
  },
  en: {
    title: 'SAM Account Review',
    subtitle: 'Start with key changes and decisions, then expand the supporting activity, pipeline and action detail.',
    briefing: 'Executive Briefing',
    change: 'Latest Progress',
    pipeline: 'Linked Pipeline',
    risk: 'Current Risk',
    next: 'Next Actions',
    support: 'Manager Support Required',
    lastUpdate: 'Last Update',
    nextReview: 'Next Review',
    stale: 'Update Required',
    noUpdate: 'No progress update has been registered.',
    recentActivity: 'Recent Activity',
    pipelineDetail: 'Pipeline Detail',
    actionStakeholder: 'Actions & Stakeholders',
    noPipeline: 'No pipeline is linked by an exact account, affiliate, alias or manual match.',
    coverage: 'Affiliate Pipeline Coverage',
    noActions: 'No action or stakeholder has been registered.',
    owner: 'Owner',
    due: 'Due',
    meeting: 'Customer Meeting',
    pipelineChange: 'Pipeline Change',
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

const pipelineMatchLabel = (matchedBy: SamAccountView['pipeline'][number]['matchedBy']) => ({
  account: 'Parent명 일치',
  affiliate: '계열사명 일치',
  alias: '별칭 일치',
  manual: '수동 연결',
})[matchedBy];

function PipelineRelationshipNode({
  label,
  secondary,
  aliases = [],
  records,
  parent = false,
}: {
  label: string;
  secondary?: string;
  aliases?: string[];
  records: SamAccountView['pipeline'];
  parent?: boolean;
}) {
  const amount = records.reduce((sum, record) => sum + record.amount, 0);
  const hasPipeline = records.length > 0;
  return (
    <details className={`group border-b border-slate-200 last:border-b-0 ${parent ? 'border-l-4 border-l-teal-600' : 'border-l-4 border-l-slate-200'}`}>
      <summary className="grid min-h-16 cursor-pointer list-none gap-3 px-4 py-3 hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm text-slate-950">{label}</strong>
            <span className={`border px-2 py-0.5 text-xs font-bold ${hasPipeline ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
              {hasPipeline ? 'Pipeline 있음' : 'Pipeline 없음'}
            </span>
          </div>
          {(secondary || aliases.length > 0) && (
            <p className="mt-1 truncate text-xs text-slate-500" title={[secondary, aliases.length ? `별칭: ${aliases.join(', ')}` : ''].filter(Boolean).join(' · ')}>
              {[secondary, aliases.length ? `별칭: ${aliases.join(', ')}` : ''].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div className="text-left sm:min-w-20 sm:text-right">
          <p className="text-xs text-slate-500">연결 건수</p>
          <p className="font-bold text-slate-950">{records.length}건</p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:min-w-32 sm:justify-end">
          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-500">Pipeline</p>
            <p className="font-bold text-slate-950">{formatKrw(amount)}</p>
          </div>
          <span className="text-slate-400 transition-transform group-open:rotate-180">⌄</span>
        </div>
      </summary>
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
        {hasPipeline ? (
          <div className="divide-y divide-slate-200">
            {records.map((record) => (
              <div key={record.id} className="grid gap-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <strong>{record.companyName || '-'}</strong>
                  <p className="mt-0.5 text-slate-700">{record.opportunityName || record.product || '-'}</p>
                  <p className="mt-1 text-xs text-slate-500">{record.product || '-'} · {record.stage || '-'} · {record.quotedAt || '-'}</p>
                  <p className="mt-1 text-xs font-semibold text-teal-700">{pipelineMatchLabel(record.matchedBy)}</p>
                </div>
                <strong className="whitespace-nowrap sm:text-right">{formatKrw(record.amount)}</strong>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-slate-500">현재 세일즈 현황에서 일치하는 Pipeline이 없습니다.</p>}
      </div>
    </details>
  );
}

function PipelineRelationshipMap({ account }: { account: SamAccountView }) {
  const parentRecords = account.pipeline.filter((record) => !record.matchedAffiliateId);
  const affiliateRows = account.affiliates.map((affiliate) => ({
    affiliate,
    records: account.pipeline.filter((record) => record.matchedAffiliateId === affiliate.id),
  }));
  const linkedAffiliates = affiliateRows.filter((row) => row.records.length > 0).length;
  const totalAmount = account.pipeline.reduce((sum, record) => sum + record.amount, 0);
  return (
    <section className="mt-6 border border-slate-300 bg-white" aria-labelledby="relationship-map-title">
      <div className="grid border-b border-slate-300 bg-slate-950 text-white lg:grid-cols-[minmax(0,1fr)_repeat(3,auto)] lg:items-center">
        <div className="p-4 sm:p-5">
          <p className="text-xs font-bold uppercase text-teal-300">Account relationship map</p>
          <h4 id="relationship-map-title" className="mt-1 text-lg font-bold">{account.name.ko || account.name.en} 관계사 · Pipeline 맵</h4>
          <p className="mt-1 text-xs text-slate-300">Parent명, 계열사명, 별칭의 정확 일치와 수동 연결을 기준으로 표시합니다.</p>
        </div>
        <div className="border-t border-slate-700 px-4 py-3 lg:border-l lg:border-t-0"><p className="text-xs text-slate-400">그룹 Pipeline</p><p className="font-bold">{formatKrw(totalAmount)}</p></div>
        <div className="border-t border-slate-700 px-4 py-3 lg:border-l lg:border-t-0"><p className="text-xs text-slate-400">연결 건수</p><p className="font-bold">{account.pipeline.length}건</p></div>
        <div className="border-t border-slate-700 px-4 py-3 lg:border-l lg:border-t-0"><p className="text-xs text-slate-400">계열사 커버리지</p><p className="font-bold">{linkedAffiliates} / {account.affiliates.length}</p></div>
      </div>
      <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">PARENT</div>
      <PipelineRelationshipNode label={`${account.name.ko || account.name.en} 직접 연결`} secondary={account.name.en} records={parentRecords} parent />
      <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">AFFILIATES · {account.affiliates.length}</div>
      {affiliateRows.map(({ affiliate, records }) => (
        <PipelineRelationshipNode key={affiliate.id} label={affiliate.nameKo || affiliate.nameEn} secondary={affiliate.nameEn} aliases={affiliate.aliases} records={records} />
      ))}
      {!account.affiliates.length && <p className="px-4 py-6 text-sm text-slate-500">등록된 관계사·계열사가 없습니다. 오른쪽 계열사 관리에서 추가해 주세요.</p>}
    </section>
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
                <h4 className="font-bold">계열사 매핑 관리</h4>
                <p className="mt-1 text-xs leading-5 text-slate-500">계열사 한글명·영문명·별칭을 등록하면 세일즈 현황의 회사명과 자동으로 비교합니다. 추가 후 변경 저장을 눌러주세요.</p>
                <p className="mt-3 border-y border-slate-200 py-2 text-sm"><strong>{draft.affiliates.length}개</strong> 계열사 등록</p>
                <div className="mt-3 space-y-2">{draft.affiliates.map((affiliate) => <div key={affiliate.id} className="border-b pb-2 text-sm"><strong>{affiliate.nameKo || affiliate.nameEn}</strong><div className="text-xs text-slate-500">{affiliate.nameEn} {affiliate.aliases.length ? `· 별칭 ${affiliate.aliases.join(', ')}` : ''}</div></div>)}</div>
                <div className="mt-3 grid gap-2"><input className="border p-2 text-sm" placeholder="계열사 한글명" value={affiliateDraft.nameKo} onChange={(e) => setAffiliateDraft({ ...affiliateDraft, nameKo: e.target.value })} /><input className="border p-2 text-sm" placeholder="Affiliate English name" value={affiliateDraft.nameEn} onChange={(e) => setAffiliateDraft({ ...affiliateDraft, nameEn: e.target.value })} /><input className="border p-2 text-sm" placeholder="별칭, 쉼표로 구분" value={affiliateDraft.aliases} onChange={(e) => setAffiliateDraft({ ...affiliateDraft, aliases: e.target.value })} /><button type="button" onClick={addAffiliate} className="border px-3 py-2 text-sm font-bold">계열사 추가</button></div>
              </div>
            </aside>
          </div>
          <PipelineRelationshipMap account={draft} />
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
  type UpdateTextKey =
    | 'briefing' | 'accomplishments' | 'customerMeetings' | 'pipelineChanges'
    | 'blockers' | 'nextActions' | 'managerSupport' | 'uncategorized';
  type OrganizedResult = Record<UpdateTextKey, { ko: string; en: string }> & {
    status: SamProgressStatus;
    dueDate: string;
  };

  const [integratedMemo, setIntegratedMemo] = useState('');
  const [organizeMode, setOrganizeMode] = useState<'append' | 'replace'>('append');
  const [organizing, setOrganizing] = useState(false);
  const [organizeMessage, setOrganizeMessage] = useState('');

  useEffect(() => {
    if (!updateDraft.sourceMemo) {
      setIntegratedMemo('');
      setOrganizeMessage('');
    }
  }, [updateDraft.sourceMemo]);

  const pair = (key: UpdateTextKey) => (updateDraft[key] || emptyPair()) as SamBilingualText;
  const setPair = (key: UpdateTextKey, value: SamBilingualText) =>
    setUpdateDraft({ ...updateDraft, [key]: value });
  const mergePair = (current: SamBilingualText, incoming: { ko: string; en: string }) => ({
    ko: organizeMode === 'append'
      ? [current.ko.trim(), incoming.ko.trim()].filter(Boolean).join('\n')
      : incoming.ko.trim(),
    en: organizeMode === 'append'
      ? [current.en.trim(), incoming.en.trim()].filter(Boolean).join('\n')
      : incoming.en.trim(),
    status: 'review' as const,
  });

  const organizeMemo = async () => {
    if (!integratedMemo.trim()) return;
    setOrganizing(true);
    setOrganizeMessage('');
    try {
      const response = await fetch('/api/iso/sam/organize-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memo: integratedMemo,
          accountName: account.name.ko || account.name.en,
          consent: true,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '통합 메모를 정리하지 못했습니다.');
      const result = payload.result as OrganizedResult;
      const next = { ...updateDraft };
      const keys: UpdateTextKey[] = [
        'briefing', 'accomplishments', 'customerMeetings', 'pipelineChanges',
        'blockers', 'nextActions', 'managerSupport', 'uncategorized',
      ];
      keys.forEach((key) => {
        next[key] = mergePair(pair(key), result[key]);
      });
      next.sourceMemo = organizeMode === 'append'
        ? [updateDraft.sourceMemo?.trim(), integratedMemo.trim()].filter(Boolean).join('\n\n')
        : integratedMemo.trim();
      next.status = result.status;
      if (result.dueDate) next.dueDate = result.dueDate;
      setUpdateDraft(next);
      setOrganizeMessage('항목별 한국어·영문 초안을 만들었습니다. 아래 내용을 검토한 뒤 저장해 주세요.');
    } catch (error) {
      setOrganizeMessage(error instanceof Error ? error.message : '통합 메모를 정리하지 못했습니다.');
    } finally {
      setOrganizing(false);
    }
  };

  return (
    <section className="mt-8 border-t border-slate-300 pt-6">
      <h3 className="text-lg font-bold">진행현황 업데이트</h3>
      <p className="mt-1 text-sm text-slate-500">업데이트는 누적 보관되며 회의 모드에서 지난 회의 이후 변경사항으로 표시됩니다.</p>

      <div className="mt-4 border-l-4 border-blue-700 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="font-bold text-slate-950">통합 활동 메모</h4>
            <p className="text-sm text-slate-500">완료한 일, 고객 미팅, Pipeline 변화, Risk와 다음 할 일을 평소 문장으로 한 번에 입력하세요.</p>
          </div>
          <span className="mt-1 self-start border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-bold text-teal-800">AI 분류 · 영문 초안</span>
        </div>
        <textarea
          className="mt-3 min-h-36 w-full resize-y border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-900"
          placeholder="예: 8월 3일 현대차 환경팀과 미팅했고 2027년 GHG 갱신 범위를 논의했다. 견적은 다음 주 금요일까지 제출 예정이며 가격 자료는 매니저 지원이 필요하다."
          value={integratedMemo}
          onChange={(event) => setIntegratedMemo(event.target.value)}
        />
        <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="inline-flex self-start border border-slate-300 bg-slate-100 p-1" role="group" aria-label="정리 결과 반영 방식">
            <button type="button" onClick={() => setOrganizeMode('append')} className={`min-h-9 px-3 text-sm font-bold ${organizeMode === 'append' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>기존 내용에 추가</button>
            <button type="button" onClick={() => setOrganizeMode('replace')} className={`min-h-9 px-3 text-sm font-bold ${organizeMode === 'replace' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>기존 내용 교체</button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="text-xs leading-5 text-slate-600">
              버튼을 누르면 입력한 Account 활동 메모가 정리 목적으로 OpenAI API에 전송됩니다.
            </p>
            <button
              type="button"
              disabled={organizing || !integratedMemo.trim()}
              onClick={() => void organizeMemo()}
              className="min-h-10 shrink-0 bg-blue-700 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {organizing ? '정리 중...' : 'AI로 항목 정리'}
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">AI 결과는 아래 편집칸에만 반영되며, 진행현황 추가 버튼을 누르기 전까지 저장되지 않습니다.</p>
        {organizeMessage && <p className="mt-2 border-l-2 border-teal-500 pl-2 text-sm font-semibold text-slate-700">{organizeMessage}</p>}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <label className="text-sm font-semibold">기준일<input type="date" className="mt-1 w-full border p-2" value={updateDraft.date || ''} onChange={(e) => setUpdateDraft({ ...updateDraft, date: e.target.value })} /></label>
        <label className="text-sm font-semibold">상태<select className="mt-1 w-full border p-2" value={updateDraft.status} onChange={(e) => setUpdateDraft({ ...updateDraft, status: e.target.value as SamProgressStatus })}><option value="on-track">정상</option><option value="watch">관찰</option><option value="at-risk">위험</option></select></label>
        <label className="text-sm font-semibold">담당자<input className="mt-1 w-full border p-2" value={updateDraft.owner || ''} onChange={(e) => setUpdateDraft({ ...updateDraft, owner: e.target.value })} /></label>
        <label className="text-sm font-semibold">완료 예정일<input type="date" className="mt-1 w-full border p-2" value={updateDraft.dueDate || ''} onChange={(e) => setUpdateDraft({ ...updateDraft, dueDate: e.target.value })} /></label>
      </div>
      <div className="mt-4 space-y-4">
        <BilingualEditor label="핵심 브리핑" value={pair('briefing')} onChange={(value) => setPair('briefing', value)} />
        <BilingualEditor label="이번 기간 성과" value={pair('accomplishments')} onChange={(value) => setPair('accomplishments', value)} />
        <BilingualEditor label="고객 미팅" value={pair('customerMeetings')} onChange={(value) => setPair('customerMeetings', value)} />
        <BilingualEditor label="Pipeline 변화" value={pair('pipelineChanges')} onChange={(value) => setPair('pipelineChanges', value)} />
        <BilingualEditor label="현재 장애요인" value={pair('blockers')} onChange={(value) => setPair('blockers', value)} />
        <BilingualEditor label="다음 조치" value={pair('nextActions')} onChange={(value) => setPair('nextActions', value)} />
        <BilingualEditor label="매니저 지원 요청" value={pair('managerSupport')} onChange={(value) => setPair('managerSupport', value)} />
        <BilingualEditor label="미분류 메모" value={pair('uncategorized')} onChange={(value) => setPair('uncategorized', value)} />
      </div>
      <button type="button" disabled={busy || organizing} onClick={onAdd} className="mt-4 bg-teal-700 px-5 py-2 text-sm font-bold text-white disabled:bg-slate-300">진행현황 추가</button>
      <div className="mt-6 space-y-3">
        {account.updates.map((update) => (
          <article key={update.id} className="border-l-4 border-slate-300 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <strong>{update.date}</strong>
              <span className={`border px-2 py-0.5 text-xs font-bold ${statusClass[update.status]}`}>{statusLabel[update.status]}</span>
              <span className="text-xs text-slate-500">{update.owner}</span>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm">{update.briefing?.ko || update.accomplishments.ko || update.nextActions.ko || '내용 없음'}</p>
          </article>
        ))}
        {!account.updates.length && <p className="text-sm text-slate-500">등록된 진행현황이 없습니다.</p>}
      </div>
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
  const field = (value?: SamBilingualText) =>
    value?.[language]?.trim() || (language === 'en' ? 'Translation pending' : '내용 없음');
  const statusText = (status: SamProgressStatus) => language === 'ko'
    ? statusLabel[status]
    : ({ 'on-track': 'On track', watch: 'Watch', 'at-risk': 'At risk' })[status];
  const cadenceText = (cadence: SamReviewCadence) => language === 'ko'
    ? ({ weekly: '매주', biweekly: '격주', monthly: '매월' })[cadence]
    : ({ weekly: 'Weekly', biweekly: 'Biweekly', monthly: 'Monthly' })[cadence];
  const matchText = (match: SamAccountView['pipeline'][number]['matchedBy']) => {
    const values = language === 'ko'
      ? { account: 'Account 일치', affiliate: '계열사 일치', alias: '별칭 일치', manual: '수동 연결' }
      : { account: 'Account match', affiliate: 'Affiliate match', alias: 'Alias match', manual: 'Manual link' };
    return values[match];
  };

  return (
    <section className="mt-5">
      <div className="flex flex-col gap-3 border-b border-slate-300 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold text-teal-700">MANAGER REVIEW</p>
          <h3 className="mt-1 text-xl font-bold">{labels.title}</h3>
          <p className="max-w-3xl text-sm text-slate-500">{labels.subtitle}</p>
        </div>
        <div className="inline-flex self-start border border-slate-300 bg-slate-100 p-1 sm:self-auto">
          <button type="button" onClick={() => setLanguage('ko')} className={`px-4 py-2 text-sm font-bold ${language === 'ko' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>한국어</button>
          <button type="button" onClick={() => setLanguage('en')} className={`px-4 py-2 text-sm font-bold ${language === 'en' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>English</button>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {accounts.map((account) => {
          const update = account.updates[0];
          const lastUpdate = update?.date || '';
          const age = lastUpdate
            ? Math.floor((Date.now() - new Date(`${lastUpdate}T00:00:00`).getTime()) / 86400000)
            : Number.POSITIVE_INFINITY;
          const stale = age > 30;
          const status = update?.status || (account.atRisk ? 'at-risk' : 'on-track');
          const progress = update ? field(update.accomplishments) : labels.noUpdate;
          const briefing = update?.briefing && (update.briefing.ko || update.briefing.en)
            ? field(update.briefing)
            : update
              ? field(update.accomplishments)
              : field(account.qbrOutcome.ko || account.qbrOutcome.en ? account.qbrOutcome : account.growthStrategy);
          const nextAction = update ? field(update.nextActions) : field(account.growthStrategy);
          const support = update ? field(update.managerSupport) : '-';
          const accountName = language === 'ko' ? account.name.ko : account.name.en;
          const pipelineAmount = account.pipeline.reduce((sum, record) => sum + record.amount, 0);
          const linkedAffiliates = new Set(account.pipeline
            .map((record) => record.matchedAffiliateId)
            .filter((id): id is string => Boolean(id))).size;

          return (
            <article key={account.id} className="border border-slate-300 bg-white">
              <header className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg font-bold">{accountName}</h4>
                    <span className={`border px-2 py-1 text-xs font-bold ${statusClass[status]}`}>{statusText(status)}</span>
                    {stale && <span className="border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900">{labels.stale}</span>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {account.manager} · {cadenceText(account.reviewCadence)}
                    {' · '}{labels.lastUpdate}: {lastUpdate || '-'}
                    {' · '}{labels.nextReview}: {account.nextReviewDate || account.nextQbrDate || '-'}
                  </p>
                </div>
                <button type="button" onClick={() => onOpen(account.id)} className="min-h-9 self-start border border-slate-300 px-3 text-xs font-bold hover:bg-slate-50">
                  {language === 'ko' ? 'Account 상세' : 'Account Details'}
                </button>
              </header>

              <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
                <p className="text-xs font-bold uppercase text-teal-700">{labels.briefing}</p>
                <p className="mt-2 max-w-5xl whitespace-pre-line text-sm font-semibold leading-6 text-slate-900">{briefing}</p>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-5">
                <div className="p-4">
                  <p className="text-xs font-bold text-slate-500">{labels.change}</p>
                  <p className="mt-2 whitespace-pre-line text-sm">{progress}</p>
                </div>
                <div className="border-t p-4 md:border-l md:border-t-0">
                  <p className="text-xs font-bold text-slate-500">{labels.pipeline}</p>
                  <p className="mt-2 font-bold">{formatKrw(pipelineAmount)}</p>
                  <p className="text-xs text-slate-500">{account.pipeline.length} {language === 'ko' ? '건 연결' : 'linked records'}</p>
                  <p className="mt-1 text-xs font-semibold text-teal-700">
                    {labels.coverage}: {linkedAffiliates} / {account.affiliates.length}
                  </p>
                </div>
                <div className="border-t p-4 xl:border-l xl:border-t-0">
                  <p className="text-xs font-bold text-slate-500">{labels.risk}</p>
                  <p className="mt-2 whitespace-pre-line text-sm">{update?.blockers && (update.blockers.ko || update.blockers.en) ? field(update.blockers) : field(account.risk)}</p>
                </div>
                <div className="border-t p-4 md:border-l xl:border-t-0">
                  <p className="text-xs font-bold text-slate-500">{labels.next}</p>
                  <p className="mt-2 whitespace-pre-line text-sm">{nextAction}</p>
                  {(update?.owner || update?.dueDate) && <p className="mt-2 text-xs text-slate-500">{labels.owner}: {update?.owner || '-'} · {labels.due}: {update?.dueDate || '-'}</p>}
                </div>
                <div className="border-t p-4 xl:border-l xl:border-t-0">
                  <p className="text-xs font-bold text-slate-500">{labels.support}</p>
                  <p className="mt-2 whitespace-pre-line text-sm">{support}</p>
                </div>
              </div>

              <div className="grid border-t border-slate-200 lg:grid-cols-3">
                <details className="group border-b border-slate-200 lg:border-b-0 lg:border-r">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-bold hover:bg-slate-50">
                    <span>{labels.recentActivity}</span>
                    <span className="text-slate-400 group-open:rotate-180">⌄</span>
                  </summary>
                  <div className="space-y-3 border-t border-slate-200 px-4 py-4">
                    {account.updates.slice(0, 3).map((item) => (
                      <div key={item.id} className="border-l-2 border-teal-500 pl-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong>{item.date}</strong>
                          <span className={`border px-1.5 py-0.5 text-[11px] font-bold ${statusClass[item.status]}`}>{statusText(item.status)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-line">{item.briefing && (item.briefing.ko || item.briefing.en) ? field(item.briefing) : field(item.accomplishments)}</p>
                        {(item.customerMeetings.ko || item.customerMeetings.en) && <p className="mt-1 text-xs text-slate-600"><strong>{labels.meeting}:</strong> {field(item.customerMeetings)}</p>}
                        {(item.pipelineChanges.ko || item.pipelineChanges.en) && <p className="mt-1 text-xs text-slate-600"><strong>{labels.pipelineChange}:</strong> {field(item.pipelineChanges)}</p>}
                      </div>
                    ))}
                    {!account.updates.length && <p className="text-sm text-slate-500">{labels.noUpdate}</p>}
                  </div>
                </details>

                <details className="group border-b border-slate-200 lg:border-b-0 lg:border-r">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-bold hover:bg-slate-50">
                    <span>{labels.pipelineDetail} · {account.pipeline.length}</span>
                    <span className="text-slate-400 group-open:rotate-180">⌄</span>
                  </summary>
                  <div className="border-t border-slate-200">
                    {account.pipeline.length > 0 ? (
                      <div className="max-h-80 overflow-auto">
                        {account.pipeline.map((record) => (
                          <div key={record.id} className="border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
                            <div className="flex items-start justify-between gap-3">
                              <strong>{record.companyName || '-'}</strong>
                              <strong className="whitespace-nowrap">{formatKrw(record.amount)}</strong>
                            </div>
                            <p className="mt-1">{record.opportunityName || record.product || '-'}</p>
                            <p className="mt-1 text-xs text-slate-500">{record.product || '-'} · {record.stage || '-'} · {record.quotedAt || '-'}</p>
                            <p className="mt-1 text-xs font-semibold text-teal-700">{record.matchedEntityName || accountName} · {matchText(record.matchedBy)}</p>
                          </div>
                        ))}
                      </div>
                    ) : <p className="px-4 py-5 text-sm text-slate-500">{labels.noPipeline}</p>}
                  </div>
                </details>

                <details className="group">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-bold hover:bg-slate-50">
                    <span>{labels.actionStakeholder}</span>
                    <span className="text-slate-400 group-open:rotate-180">⌄</span>
                  </summary>
                  <div className="space-y-4 border-t border-slate-200 px-4 py-4">
                    {account.actions.map((action) => (
                      <div key={action.id} className="text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <strong>{field(action.goal)}</strong>
                          <span className={`border px-1.5 py-0.5 text-[11px] font-bold ${action.status === 'done' ? statusClass['on-track'] : action.status === 'at-risk' ? statusClass['at-risk'] : 'border-slate-200 bg-slate-50 text-slate-700'}`}>{action.status}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{labels.owner}: {action.owner || '-'} · {labels.due}: {action.dueDate || '-'}</p>
                      </div>
                    ))}
                    {account.contacts.map((contact) => (
                      <div key={contact.id} className="border-t border-slate-100 pt-3 text-sm">
                        <strong>{contact.name}</strong>
                        <p className="text-xs text-slate-500">{field(contact.role)} · {contact.supportStatus} · {contact.influence}</p>
                        {(contact.action.ko || contact.action.en) && <p className="mt-1 text-xs">{field(contact.action)}</p>}
                      </div>
                    ))}
                    {!account.actions.length && !account.contacts.length && (
                      update
                        ? <div className="text-sm"><strong>{labels.next}</strong><p className="mt-1 whitespace-pre-line">{nextAction}</p><p className="mt-2 text-xs text-slate-500">{labels.owner}: {update.owner || '-'} · {labels.due}: {update.dueDate || '-'}</p></div>
                        : <p className="text-sm text-slate-500">{labels.noActions}</p>
                    )}
                  </div>
                </details>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
