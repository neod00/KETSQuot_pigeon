'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { parseSalesWorkbook } from '@/lib/salesWorkbook';
import type { D365AutomationResult, D365Fields, D365Status, SalesRecord, SalesRecordInput, SalesStage } from '@/lib/salesTypes';

type Mode = 'sales' | 'd365';
type BridgeState = 'checking' | 'online' | 'offline';
type TableView = 'summary' | 'excel';
type SortDirection = 'asc' | 'desc';

const BRIDGE_URL = 'http://127.0.0.1:3000';
type LocalRequestInit = RequestInit & { targetAddressSpace?: 'loopback' };
const bridgeFetch = (path: string, init: RequestInit = {}) => fetch(
  BRIDGE_URL + path,
  { targetAddressSpace: 'loopback', ...init } as LocalRequestInit,
);
const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());
const isDynamicsUrl = (value: string) => /^https:\/\/[^/]+\.dynamics\.com(?:\/|$)/i.test(value.trim());

const STAGE_LABELS: Record<SalesStage, string> = {
  new: '신규',
  'quote-preparing': '견적 준비',
  'quote-sent': '견적 발송',
  'follow-up': '후속 진행',
  won: 'Won',
  lost: 'Lost',
  'on-hold': '보류',
};

const D365_LABELS: Record<D365Status, string> = {
  'not-ready': '미검증',
  ready: '준비 완료',
  running: '생성 중',
  success: '완료',
  warning: '확인 필요',
  failed: '실패',
};

const STAGE_CLASSES: Record<SalesStage, string> = {
  new: 'bg-slate-100 text-slate-700 border-slate-200',
  'quote-preparing': 'bg-blue-50 text-blue-800 border-blue-200',
  'quote-sent': 'bg-cyan-50 text-cyan-800 border-cyan-200',
  'follow-up': 'bg-amber-50 text-amber-800 border-amber-200',
  won: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  lost: 'bg-rose-50 text-rose-800 border-rose-200',
  'on-hold': 'bg-slate-100 text-slate-600 border-slate-300',
};

const D365_CLASSES: Record<D365Status, string> = {
  'not-ready': 'bg-slate-100 text-slate-600 border-slate-200',
  ready: 'bg-teal-50 text-teal-800 border-teal-200',
  running: 'bg-blue-50 text-blue-800 border-blue-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  failed: 'bg-rose-50 text-rose-800 border-rose-200',
};

const EXCEL_COLUMNS = [
  { letter: 'A', key: 'innovation', label: '이노베이션', minWidth: 120 },
  { letter: 'B', key: 'product', label: 'Product', minWidth: 140 },
  { letter: 'C', key: 'category', label: '구분', minWidth: 90 },
  { letter: 'D', key: 'sf', label: 'SF', minWidth: 90 },
  { letter: 'E', key: 'quotedAt', label: 'DATE', minWidth: 110 },
  { letter: 'F', key: 'quoteNumber', label: 'Q.No.', minWidth: 180 },
  { letter: 'G', key: 'deadline', label: '기한', minWidth: 100 },
  { letter: 'H', key: 'companyName', label: '업체명', minWidth: 220 },
  { letter: 'I', key: 'accountName', label: 'Account', minWidth: 180 },
  { letter: 'J', key: 'opportunityName', label: 'Opportunity', minWidth: 200 },
  { letter: 'K', key: 'contactName', label: '담당자', minWidth: 130 },
  { letter: 'L', key: 'telephone', label: 'tel', minWidth: 130 },
  { letter: 'M', key: 'mobile', label: 'HP', minWidth: 140 },
  { letter: 'N', key: 'email', label: 'e-mail', minWidth: 220 },
  { letter: 'O', key: 'contactHistory', label: '통화내역', minWidth: 320 },
  { letter: 'P', key: 'nextAction', label: '이후 진행', minWidth: 240 },
  { letter: 'Q', key: 'consultingFollowUp', label: '컨설팅FU', minWidth: 160 },
  { letter: 'R', key: 'leadSource', label: 'Lead source', minWidth: 150 },
  { letter: 'S', key: 'contract', label: 'Contract', minWidth: 130 },
  { letter: 'T', key: 'mpApproval', label: 'MP승인', minWidth: 110 },
  { letter: 'U', key: 'quoteMandays', label: '견적MD', minWidth: 100 },
  { letter: 'V', key: 'application6sv', label: '신청/6SV', minWidth: 130 },
  { letter: 'W', key: 'amountExcludingExpenses', label: '금액(출장비제외)', minWidth: 160 },
  { letter: 'X', key: 'amountIncludingExpenses', label: '금액(출장비포함)', minWidth: 160 },
  { letter: 'Y', key: 'quoteReviewResult', label: 'Q검토결과', minWidth: 220 },
] as const;

type ExcelColumnKey = typeof EXCEL_COLUMNS[number]['key'];
type SortKey = ExcelColumnKey | 'originalOwner' | 'stage' | 'd365Status';
type SortState = { key: SortKey; direction: SortDirection };

const emptyD365: D365Fields = {
  status: 'not-ready',
  accountMode: 'existing',
  accountUrl: '',
  firstName: '',
  lastName: '',
  leadSource: 'Client meeting',
  areaOfInterest: 'Request Quote/Transfer to LRQA',
  primaryBusinessStream: 'Assessment',
  primaryService: 'Management System Solutions',
  closeDate: '',
  country: 'South Korea',
  opportunityRecordType: 'LRQA BOS Opportunity',
  opportunityType: 'New',
  forecastCategory: 'Pipeline',
  clientFacingOffice: 'Seoul',
  assignTo: '',
  street1: '',
  city: '',
  postalCode: '',
};

const emptyRecord: Partial<SalesRecordInput> = {
  product: '',
  category: '신규',
  quotedAt: new Date().toISOString().slice(0, 10),
  quoteNumber: '',
  companyName: '',
  contactName: '',
  mobile: '',
  email: '',
  contactHistory: '',
  nextAction: '',
  leadSource: '',
  quoteMandays: 0,
  amountExcludingExpenses: 0,
  amountIncludingExpenses: 0,
  quoteReviewResult: '',
  originalOwner: '',
  won: false,
  d365Matched: false,
  retentionExpansion: '',
  stage: 'new',
  d365: emptyD365,
};

const won = (value: number) => `${Math.round(value).toLocaleString('ko-KR')}원`;
const compactWon = (value: number) => value >= 100_000_000
  ? `${(value / 100_000_000).toFixed(1)}억원`
  : `${(value / 1_000_000).toFixed(1)}백만원`;

const displayOwner = (value: string) => {
  const owner = value.trim();
  if (!owner || owner.length > 40 || /[@#\d,]/.test(owner)) return '';
  if (/^(pipeline|renewal|won|lost|new)$/i.test(owner)) return '';
  return owner;
};

const excelCellValue = (record: SalesRecord, key: ExcelColumnKey) => {
  const value = record[key];
  if (key === 'amountExcludingExpenses' || key === 'amountIncludingExpenses') return won(Number(value) || 0);
  if (key === 'quoteMandays') return `${Number(value || 0).toFixed(1)} MD`;
  return String(value ?? '').trim() || '-';
};
const sortRecordValue = (record: SalesRecord, key: SortKey): string | number => {
  if (key === 'd365Status') return record.d365?.status || 'not-ready';
  if (key === 'originalOwner') return displayOwner(record.originalOwner);
  if (key === 'stage') return record.stage;
  return record[key] ?? '';
};

const compareSalesRecords = (a: SalesRecord, b: SalesRecord, sort: SortState) => {
  const aValue = sortRecordValue(a, sort.key);
  const bValue = sortRecordValue(b, sort.key);
  const comparison = typeof aValue === 'number' && typeof bValue === 'number'
    ? aValue - bValue
    : String(aValue).localeCompare(String(bValue), 'ko', { numeric: true, sensitivity: 'base' });
  return sort.direction === 'asc' ? comparison : -comparison;
};

const splitContactName = (name: string) => {
  const cleaned = name.replace(/(대표|실장|부장|차장|과장|대리|책임|팀장|주무관|교수|프로|사원|님)/g, '').trim();
  if (!cleaned) return { firstName: '', lastName: '' };
  if (/^[가-힣]{2,4}$/.test(cleaned)) return { firstName: cleaned.slice(1), lastName: cleaned.slice(0, 1) };
  const parts = cleaned.split(/\s+/);
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.at(-1) || cleaned };
};

const isD365Processed = (record: SalesRecord) => Boolean(
  record.d365Matched || record.d365?.status === 'success' || isDynamicsUrl(record.opportunityName),
);

const d365Issues = (record: SalesRecord) => {
  const issues: string[] = [];
  const d365 = record.d365 || emptyD365;
  if (isD365Processed(record)) issues.push('D365 생성/매칭 완료');
  else if (d365.status === 'warning') issues.push('D365 검토 필요');
  else if (d365.status === 'running') issues.push('이미 실행 중');
  if (!record.companyName) issues.push('업체명');
  if (!record.contactName && !d365.lastName) issues.push('담당자명');
  if (!record.email) issues.push('이메일');
  if (!record.mobile) issues.push('휴대전화');
  if (!record.product) issues.push('Product');
  if (!record.amountIncludingExpenses) issues.push('Sales Value');
  if (!d365.closeDate) issues.push('Close Date');
  if (!d365.primaryService) issues.push('Primary Service');
  if (d365.accountMode === 'existing' && !d365.accountUrl) issues.push('Account URL');
  return issues;
};

const d365Payload = (record: SalesRecord) => {
  const d365 = { ...emptyD365, ...record.d365 };
  const names = splitContactName(record.contactName);
  const storedNameIsDefault = !d365.firstName && d365.lastName === record.contactName;
  const opportunityTopic = record.opportunityName && !isHttpUrl(record.opportunityName)
    ? record.opportunityName
    : [record.companyName, record.product, record.category || '인증'].filter(Boolean).join(' - ');
  const existingAccountUrl = d365.accountUrl || (isDynamicsUrl(record.accountName) ? record.accountName : '');
  const common = {
    Topic: opportunityTopic,
    'First Name': storedNameIsDefault ? names.firstName : d365.firstName || names.firstName,
    'Last Name': storedNameIsDefault ? names.lastName : d365.lastName || names.lastName,
    Email: record.email,
    'Mobile Phone': record.mobile,
    'Lead Source': d365.leadSource,
    'Area of Interest': d365.areaOfInterest,
    'Primary Business Stream': d365.primaryBusinessStream,
    'Primary Service': d365.primaryService,
    'Sales Value': String(record.amountIncludingExpenses),
    'Close Date': d365.closeDate,
    Country: d365.country,
    'Opportunity Record Type': d365.opportunityRecordType,
    'Opportunity Type': d365.opportunityType,
    'Forecast Category': d365.forecastCategory,
    'Client Facing Office': d365.clientFacingOffice,
    'Assign To': d365.assignTo,
  };
  return d365.accountMode === 'new' ? {
    ...common,
    mode: 'new-account',
    'Business Name': record.companyName,
    'Street 1': d365.street1,
    City: d365.city,
    'ZIP/Postal Code': d365.postalCode,
  } : {
    ...common,
    'Account Name': isDynamicsUrl(record.accountName) ? record.companyName : record.accountName || record.companyName,
    'Account URL': existingAccountUrl,
  };
};

function Icon({ name }: { name: 'table' | 'cloud' | 'plus' | 'upload' | 'search' | 'check' | 'play' | 'arrow' | 'edit' | 'trash' | 'refresh' }) {
  const paths: Record<string, React.ReactNode> = {
    table: <><path d="M3 5h18v14H3z"/><path d="M3 10h18M8 5v14"/></>,
    cloud: <><path d="M17.5 19H6a4 4 0 0 1-.4-8 6.5 6.5 0 0 1 12.6-1.5A4.8 4.8 0 0 1 17.5 19Z"/><path d="m9 15 2 2 4-4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M5 20h14"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    play: <path d="m8 5 11 7-11 7Z"/>,
    arrow: <><path d="M5 12h14m-5-5 5 5-5 5"/></>,
    edit: <><path d="M12 20h9"/><path d="m16.5 3.5 4 4L8 20H4v-4Z"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7"/><path d="M10 11v5m4-5v5"/></>,
    refresh: <><path d="M20 11a8 8 0 1 0-2 5"/><path d="M20 4v7h-7"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">{paths[name]}</svg>;
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded border px-2 py-1 text-xs font-bold ${className}`}>{children}</span>;
}

function SortLabel({ label, sortKey, sort, onSort, align = 'left', ariaLabel }: {
  label: React.ReactNode;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right';
  ariaLabel?: string;
}) {
  const active = sort.key === sortKey;
  const indicator = active ? (sort.direction === 'asc' ? '↑' : '↓') : '↕';
  const alignment = align === 'right' ? 'justify-end text-right' : 'justify-start text-left';

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={'inline-flex w-full items-center gap-1.5 whitespace-nowrap font-bold hover:text-blue-700 ' + alignment}
      aria-label={(ariaLabel || (typeof label === 'string' ? label : '열')) + ' 정렬'}
    >
      <span>{label}</span>
      <span aria-hidden="true" className={active ? 'text-blue-700' : 'text-slate-400'}>{indicator}</span>
    </button>
  );
}

export default function SalesDashboard() {
  const [mode, setMode] = useState<Mode>('sales');
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<'all' | SalesStage>('all');
  const [owner, setOwner] = useState('all');
  const [tableView, setTableView] = useState<TableView>('summary');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<SortState>({ key: 'quotedAt', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editor, setEditor] = useState<Partial<SalesRecordInput> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bridge, setBridge] = useState<BridgeState>('checking');
  const [bridgeError, setBridgeError] = useState('');
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/iso/sales', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '세일즈 목록을 불러오지 못했습니다.');
      setRecords(payload.records || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '세일즈 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const checkBridge = async () => {
    setBridge('checking');
    setBridgeError('');
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      const response = await bridgeFetch('/api/health', { signal: controller.signal });
      window.clearTimeout(timeout);
      setBridge(response.ok ? 'online' : 'offline');
    } catch (error) {
      setBridge('offline');
      setBridgeError(error instanceof DOMException && error.name === 'AbortError'
        ? '브리지 응답 시간이 초과되었습니다. 잠시 후 다시 확인해 주세요.'
        : '브라우저의 로컬 네트워크 접근 권한을 허용한 뒤 다시 확인해 주세요.');
    }
  };

  useEffect(() => { void loadRecords(); }, []);
  useEffect(() => { if (mode === 'd365') void checkBridge(); }, [mode]);

  const owners = useMemo(() => Array.from(new Set(records.map((record) => displayOwner(record.originalOwner)).filter(Boolean))).sort(), [records]);
  const filtered = useMemo(() => records.filter((record) => {
    const haystack = [record.companyName, record.quoteNumber, record.contactName, record.email, record.product].join(' ').toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (stage === 'all' || record.stage === stage) && (owner === 'all' || displayOwner(record.originalOwner) === owner);
  }), [records, query, stage, owner]);
  const sortedRecords = useMemo(() => [...filtered].sort((a, b) => compareSalesRecords(a, b, sort)), [filtered, sort]);
  const pageCount = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRecords = useMemo(
    () => sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, pageSize, sortedRecords],
  );
  const selectedRecords = useMemo(() => records.filter((record) => selected.has(record.id)), [records, selected]);
  const readyRecords = useMemo(() => selectedRecords.filter((record) => d365Issues(record).length === 0), [selectedRecords]);

  const pipeline = useMemo(() => records.filter((record) => !['won', 'lost'].includes(record.stage)).reduce((sum, record) => sum + record.amountIncludingExpenses, 0), [records]);
  const monthPrefix = new Date().toISOString().slice(0, 7);
  const monthRecords = useMemo(() => records.filter((record) => record.quotedAt.startsWith(monthPrefix)), [records, monthPrefix]);
  const d365Pending = useMemo(() => records.filter((record) => !isD365Processed(record)).length, [records]);

  const toggle = (id: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const toggleAll = () => setSelected((current) => pageRecords.every((record) => current.has(record.id))
    ? new Set([...current].filter((id) => !pageRecords.some((record) => record.id === id)))
    : new Set([...current, ...pageRecords.map((record) => record.id)]));

  const changeSort = (key: SortKey) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
    setPage(1);
  };

  const openEditor = (record?: SalesRecord) => {
    setEditingId(record?.id || null);
    setEditor(record ? { ...record, d365: { ...emptyD365, ...record.d365 } } : { ...emptyRecord, d365: { ...emptyD365 } });
  };

  const saveEditor = async () => {
    if (!editor?.companyName) return setMessage('업체명을 입력해 주세요.');
    setSaving(true);
    try {
      const response = await fetch(editingId ? `/api/iso/sales/${editingId}` : '/api/iso/sales', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? editor : { record: editor }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '저장하지 못했습니다.');
      setEditor(null);
      setMessage('세일즈 데이터를 저장했습니다.');
      await loadRecords();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (record: SalesRecord) => {
    if (!window.confirm(`${record.companyName} 세일즈 데이터를 삭제할까요?`)) return;
    const response = await fetch(`/api/iso/sales/${record.id}`, { method: 'DELETE' });
    if (response.ok) {
      setSelected((current) => new Set([...current].filter((id) => id !== record.id)));
      await loadRecords();
    }
  };

  const importWorkbook = async (file?: File) => {
    if (!file) return;
    setMessage('Excel의 Quot_2026 시트를 분석하고 있습니다.');
    try {
      const imported = await parseSalesWorkbook(file);
      if (!imported.length) throw new Error('가져올 세일즈 행이 없습니다.');
      const response = await fetch('/api/iso/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: imported }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Excel 데이터를 저장하지 못했습니다.');
      setMessage(`${payload.imported || imported.length}개 행을 가져왔습니다. 같은 견적번호·업체·Product는 갱신했습니다.`);
      await loadRecords();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Excel을 가져오지 못했습니다.');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const patchD365 = async (record: SalesRecord, patch: Partial<D365Fields>) => {
    const response = await fetch(`/api/iso/sales/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ d365: { ...record.d365, ...patch }, d365Matched: patch.status === 'success' || record.d365Matched }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'D365 결과를 저장하지 못했습니다.');
    setRecords((current) => current.map((item) => item.id === record.id ? payload.record : item));
    return payload.record as SalesRecord;
  };

  const runD365 = async () => {
    if (bridge !== 'online' || !readyRecords.length) return;
    if (!window.confirm(String(readyRecords.length) + '건의 Lead와 Opportunity를 실제 D365에 생성할까요?')) return;
    setRunning(true);
    setLogs([]);
    for (const original of readyRecords) {
      let record = original;
      try {
        setLogs((items) => [...items, `${record.companyName}: 자동화를 시작합니다.`]);
        record = await patchD365(record, { status: 'running', error: '' });
        const response = await bridgeFetch('/api/start-automation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(d365Payload(record)),
        });
        const result = await response.json() as D365AutomationResult;
        if (!response.ok || !result.success) throw new Error(result.error || 'D365 자동화가 실패했습니다.');
        const warningType = result.warningType || (result.sanctionWarning ? 'sanction' : undefined);
        const status: D365Status = warningType ? 'warning' : 'success';
        const warningMessage = result.warningMessage || (
          warningType === 'duplicate'
            ? 'D365 중복 규칙으로 Qualify가 중단됐습니다. 기존 Contact 또는 Opportunity를 확인해 주세요.'
            : warningType === 'sanction'
              ? 'Sanction Warning으로 Qualify가 중단됐습니다. D365에서 Lead를 확인해 주세요.'
              : warningType
                ? 'Lead는 저장됐지만 Opportunity 생성 여부를 확인해야 합니다.'
                : ''
        );
        await patchD365(record, {
          status,
          leadUrl: result.leadUrl,
          opportunityUrl: result.opportunityUrl,
          error: warningMessage,
          lastRunAt: new Date().toISOString(),
        });
        const resultLabel = status === 'success' ? 'Lead와 Opportunity 생성 완료' : warningMessage;
        setLogs((items) => [...items, `${record.companyName}: ${resultLabel}`]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '자동화 실패';
        await patchD365(record, { status: 'failed', error: errorMessage, lastRunAt: new Date().toISOString() }).catch(() => undefined);
        setLogs((items) => [...items, `${record.companyName}: 실패 - ${errorMessage}`]);
      }
    }
    setRunning(false);
  };

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-300 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">LRQA Sales Operations</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">세일즈 현황 및 D365 생성</h2>
          <p className="mt-1 text-sm text-slate-600">견적 진행 기록을 공유하고 선택한 건을 D365 Lead와 Opportunity로 생성합니다.</p>
        </div>
        <div className="inline-flex w-fit border border-slate-300 bg-slate-200 p-1" role="tablist">
          <button type="button" onClick={() => setMode('sales')} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold ${mode === 'sales' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}><Icon name="table"/>세일즈 현황</button>
          <button type="button" onClick={() => setMode('d365')} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold ${mode === 'd365' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}><Icon name="cloud"/>D365 생성 <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800">{selected.size}</span></button>
        </div>
      </div>

      {message && <div className="mb-4 flex items-center justify-between border-l-4 border-teal-500 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-900"><span>{message}</span><button type="button" onClick={() => setMessage('')} className="px-2 text-lg" aria-label="안내 닫기">×</button></div>}

      {mode === 'sales' ? (
        <div className="space-y-4">
          <section className="grid border border-slate-300 bg-white sm:grid-cols-3">
            <div className="border-b border-slate-200 p-4 sm:border-b-0 sm:border-r"><p className="text-xs font-bold text-slate-500">진행 파이프라인</p><p className="mt-1 text-xl font-bold text-slate-950">{compactWon(pipeline)}</p><p className="mt-1 text-xs text-slate-500">Won·Lost 제외, 출장비 포함</p></div>
            <div className="border-b border-slate-200 p-4 sm:border-b-0 sm:border-r"><p className="text-xs font-bold text-slate-500">이번 달 견적</p><p className="mt-1 text-xl font-bold text-slate-950">{compactWon(monthRecords.reduce((sum, record) => sum + record.amountIncludingExpenses, 0))}</p><p className="mt-1 text-xs text-slate-500">{monthRecords.length}건 · {monthRecords.reduce((sum, record) => sum + record.quoteMandays, 0).toFixed(1)} MD</p></div>
            <div className="p-4"><p className="text-xs font-bold text-slate-500">D365 처리 대기</p><p className="mt-1 text-xl font-bold text-slate-950">{d365Pending}건</p><p className="mt-1 text-xs text-slate-500">검증 전 또는 실행 대기 상태</p></div>
          </section>

          <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 flex-1 lg:max-w-md"><span className="pointer-events-none absolute left-3 top-2.5 text-slate-400"><Icon name="search"/></span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="업체명, 담당자, 견적번호 검색" className="h-10 w-full border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-600"/></label>
              <select value={stage} onChange={(event) => { setStage(event.target.value as 'all' | SalesStage); setPage(1); }} className="h-10 border border-slate-300 bg-white px-3 text-sm"><option value="all">전체 상태</option>{Object.entries(STAGE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <select value={owner} onChange={(event) => { setOwner(event.target.value); setPage(1); }} className="h-10 border border-slate-300 bg-white px-3 text-sm"><option value="all">전체 담당자</option>{owners.map((item) => <option key={item}>{item}</option>)}</select>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex h-10 border border-slate-300 bg-slate-100 p-1" role="group" aria-label="세일즈 표시 방식">
                <button type="button" onClick={() => { setTableView('summary'); setPage(1); }} className={`px-3 text-xs font-bold ${tableView === 'summary' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}>요약</button>
                <button type="button" onClick={() => { setTableView('excel'); setPage(1); }} className={`px-3 text-xs font-bold ${tableView === 'excel' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}>Excel A-Y</button>
              </div>
              <input ref={fileInput} type="file" accept=".xlsx" className="hidden" onChange={(event) => void importWorkbook(event.target.files?.[0])}/>
              <button type="button" onClick={() => fileInput.current?.click()} className="inline-flex h-10 items-center gap-2 border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><Icon name="upload"/>Excel 가져오기</button>
              <button type="button" onClick={() => openEditor()} className="inline-flex h-10 items-center gap-2 bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800"><Icon name="plus"/>신규 세일즈</button>
            </div>
          </section>

          {selected.size > 0 && <section className="flex flex-col gap-3 border border-blue-300 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-bold text-blue-950">{selected.size}건 선택 <span className="ml-2 font-normal text-blue-700">D365 필수값을 검증한 뒤 실행할 수 있습니다.</span></p><button type="button" onClick={() => setMode('d365')} className="inline-flex h-9 items-center justify-center gap-2 bg-blue-700 px-4 text-sm font-bold text-white"><Icon name="arrow"/>D365 생성 준비</button></section>}

          <section className="overflow-hidden border border-slate-300 bg-white">
            {tableView === 'summary' ? (
              <div className="max-h-[58vh] overflow-auto">
                <table className="min-w-[1040px] w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-20 bg-slate-100 text-xs font-bold text-slate-600">
                    <tr>
                      <th className="w-11 bg-slate-100 px-3 py-3"><input type="checkbox" aria-label="현재 페이지 전체 선택" checked={pageRecords.length > 0 && pageRecords.every((record) => selected.has(record.id))} onChange={toggleAll}/></th>
                      <th className="bg-slate-100 px-3 py-3"><SortLabel label="업체 / 견적" sortKey="companyName" sort={sort} onSort={changeSort}/></th>
                      <th className="bg-slate-100 px-3 py-3"><SortLabel label="Product / 구분" sortKey="product" sort={sort} onSort={changeSort}/></th>
                      <th className="bg-slate-100 px-3 py-3"><SortLabel label="담당" sortKey="originalOwner" sort={sort} onSort={changeSort}/></th>
                      <th className="bg-slate-100 px-3 py-3"><SortLabel label="진행 상태" sortKey="stage" sort={sort} onSort={changeSort}/></th>
                      <th className="bg-slate-100 px-3 py-3"><SortLabel label="견적 금액" sortKey="amountIncludingExpenses" sort={sort} onSort={changeSort} align="right"/></th>
                      <th className="bg-slate-100 px-3 py-3"><SortLabel label="D365" sortKey="d365Status" sort={sort} onSort={changeSort}/></th>
                      <th className="w-24 bg-slate-100 px-3 py-3 text-center">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pageRecords.map((record) => <tr key={record.id} className="hover:bg-slate-50"><td className="px-3 py-3"><input type="checkbox" checked={selected.has(record.id)} onChange={() => toggle(record.id)} aria-label={`${record.companyName} 선택`}/></td><td className="px-3 py-3"><p className="font-bold text-slate-900">{record.companyName || '-'}</p><p className="mt-0.5 text-xs text-slate-500">{record.quoteNumber || '견적번호 없음'} · {record.quotedAt || '일자 없음'}</p></td><td className="px-3 py-3"><p className="font-semibold text-slate-800">{record.product || '-'}</p><p className="text-xs text-slate-500">{record.category || '-'}</p></td><td className="px-3 py-3"><p className="font-semibold text-slate-800">{displayOwner(record.originalOwner) || '-'}</p><p className="text-xs text-slate-500">{record.contactName || '-'}</p></td><td className="px-3 py-3"><Badge className={STAGE_CLASSES[record.stage]}>{STAGE_LABELS[record.stage]}</Badge></td><td className="px-3 py-3 text-right"><p className="font-bold tabular-nums text-slate-900">{won(record.amountIncludingExpenses)}</p><p className="text-xs text-slate-500">{record.quoteMandays.toFixed(1)} MD</p></td><td className="px-3 py-3"><Badge className={isD365Processed(record) ? D365_CLASSES.success : D365_CLASSES[record.d365?.status || 'not-ready']}>{isD365Processed(record) ? '매칭 완료' : D365_LABELS[record.d365?.status || 'not-ready']}</Badge></td><td className="px-3 py-3"><div className="flex justify-center gap-1"><button type="button" onClick={() => openEditor(record)} className="grid h-8 w-8 place-items-center border border-slate-300 text-slate-600 hover:bg-slate-100" title="수정"><Icon name="edit"/></button><button type="button" onClick={() => void deleteRecord(record)} className="grid h-8 w-8 place-items-center border border-slate-300 text-rose-700 hover:bg-rose-50" title="삭제"><Icon name="trash"/></button></div></td></tr>)}
                    {!loading && filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-500">표시할 세일즈 데이터가 없습니다. Excel을 가져오거나 신규 세일즈를 등록해 주세요.</td></tr>}
                    {loading && <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-500">세일즈 데이터를 불러오는 중입니다.</td></tr>}
                  </tbody>
                </table>
              </div>
            ) : (
              <ExcelDataTable records={pageRecords} selected={selected} loading={loading} sort={sort} onSort={changeSort} onToggle={toggle} onToggleAll={toggleAll} onEdit={openEditor} onDelete={(record) => void deleteRecord(record)}/>
            )}
            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 xl:flex-row xl:items-center xl:justify-between">
              <span>전체 {records.length}건 · 필터 {filtered.length}건 · 페이지 {currentPage}/{pageCount}</span>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 font-semibold text-slate-600">
                  페이지당
                  <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="h-8 border border-slate-300 bg-white px-2 text-xs text-slate-700" aria-label="페이지당 표시 건수">
                    <option value={25}>25건</option>
                    <option value={50}>50건</option>
                    <option value={100}>100건</option>
                  </select>
                </label>
                <button type="button" aria-label="첫 페이지" disabled={currentPage <= 1} onClick={() => setPage(1)} className="h-8 border border-slate-300 bg-white px-2 font-bold text-slate-700 disabled:text-slate-300">처음</button>
                <button type="button" aria-label="이전 페이지" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="h-8 border border-slate-300 bg-white px-3 font-bold text-slate-700 disabled:text-slate-300">이전</button>
                <span className="min-w-24 text-center font-semibold text-slate-700">{(currentPage - 1) * pageSize + (pageRecords.length ? 1 : 0)}-{Math.min(currentPage * pageSize, filtered.length)}</span>
                <button type="button" aria-label="다음 페이지" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="h-8 border border-slate-300 bg-white px-3 font-bold text-slate-700 disabled:text-slate-300">다음</button>
                <button type="button" aria-label="마지막 페이지" disabled={currentPage >= pageCount} onClick={() => setPage(pageCount)} className="h-8 border border-slate-300 bg-white px-2 font-bold text-slate-700 disabled:text-slate-300">마지막</button>
              </div>
              <span>필터 합계 {won(filtered.reduce((sum, record) => sum + record.amountIncludingExpenses, 0))} · {filtered.reduce((sum, record) => sum + record.quoteMandays, 0).toFixed(1)} MD</span>
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-4">
          <section className="grid border border-slate-300 bg-white sm:grid-cols-3">
            <div className="border-b border-slate-200 p-4 sm:border-b-0 sm:border-r"><p className="text-xs font-bold text-slate-500">선택</p><p className="mt-1 text-xl font-bold text-slate-950">{selectedRecords.length}건</p><p className="mt-1 text-xs text-slate-500">Lead + Opportunity 생성 대상</p></div>
            <div className="border-b border-slate-200 p-4 sm:border-b-0 sm:border-r"><p className="text-xs font-bold text-slate-500">생성 준비 완료</p><p className="mt-1 text-xl font-bold text-teal-800">{readyRecords.length}건</p><p className="mt-1 text-xs text-slate-500">필수값과 Account 방식 확인</p></div>
            <div className="p-4"><p className="text-xs font-bold text-slate-500">검토 필요</p><p className="mt-1 text-xl font-bold text-amber-800">{selectedRecords.length - readyRecords.length}건</p><p className="mt-1 text-xs text-slate-500">해당 행을 수정하면 다시 검증됩니다.</p></div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,.6fr)]">
            <div className="border border-slate-300 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><h3 className="font-bold text-slate-900">생성 대기열</h3><button type="button" onClick={() => setMode('sales')} className="text-sm font-bold text-blue-700">목록에서 선택 변경</button></div>
              <div className="divide-y divide-slate-200">
                {selectedRecords.map((record, index) => {
                  const issues = d365Issues(record);
                  return <div key={record.id} className="grid gap-3 px-4 py-4 md:grid-cols-[32px_minmax(0,1fr)_auto_auto] md:items-center"><span className="grid h-7 w-7 place-items-center bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</span><div className="min-w-0"><p className="truncate font-bold text-slate-900">{record.companyName}</p><p className="mt-0.5 truncate text-xs text-slate-500">{record.product} · {won(record.amountIncludingExpenses)} · {record.d365.accountMode === 'new' ? '신규 Account' : '기존 Account'}</p>{isD365Processed(record) ? <p className="mt-1 text-xs font-semibold text-teal-700">이미 D365에 매칭되거나 생성된 건입니다.</p> : issues.length > 0 && <p className="mt-1 text-xs font-semibold text-rose-700">필요: {issues.join(', ')}</p>}</div><Badge className={isD365Processed(record) ? D365_CLASSES.success : issues.length ? D365_CLASSES.failed : D365_CLASSES.ready}>{isD365Processed(record) ? '처리 완료' : issues.length ? '정보 부족' : '준비 완료'}</Badge><button type="button" onClick={() => openEditor(record)} className="inline-flex h-8 items-center justify-center gap-1 border border-slate-300 px-2 text-xs font-bold text-slate-700"><Icon name="edit"/>수정</button></div>;
                })}
                {selectedRecords.length === 0 && <div className="px-4 py-16 text-center text-sm text-slate-500">세일즈 현황에서 D365 생성 대상을 선택해 주세요.</div>}
              </div>
            </div>

            <aside className="border border-slate-300 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><div><h3 className="font-bold text-slate-900">D365 Local Bridge</h3><p className="mt-0.5 text-xs text-slate-500">이 PC의 Edge 로그인 세션 사용</p></div><Badge className={bridge === 'online' ? D365_CLASSES.success : bridge === 'checking' ? D365_CLASSES.running : D365_CLASSES.failed}>{bridge === 'online' ? '연결됨' : bridge === 'checking' ? '확인 중' : '연결 안 됨'}</Badge></div>
              <div className="border-b border-slate-200 p-4"><button type="button" onClick={() => void checkBridge()} className="inline-flex h-9 w-full items-center justify-center gap-2 border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50"><Icon name="refresh"/>브리지 다시 확인</button>{bridge === 'offline' && <p className="mt-3 bg-amber-50 p-3 text-xs leading-5 text-amber-900">{bridgeError || 'D365_auto/start_dashboard.bat을 실행하고 D365 전용 Edge 로그인을 확인해 주세요.'}</p>}</div>
              <div className="border-b border-slate-200 p-4"><div className="flex justify-between text-sm"><span className="text-slate-600">실행 가능</span><strong>{readyRecords.length}건</strong></div><div className="mt-2 flex justify-between text-sm"><span className="text-slate-600">예상 시간</span><strong>약 {Math.max(1, readyRecords.length)}~{Math.max(2, readyRecords.length * 2)}분</strong></div><button type="button" disabled={bridge !== 'online' || running || readyRecords.length === 0} onClick={() => void runD365()} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"><Icon name="play"/>{running ? 'D365 생성 중' : 'D365 자동 생성 실행'}</button></div>
              <div className="p-4"><h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">실행 로그</h4><div className="mt-3 max-h-64 space-y-2 overflow-y-auto text-xs leading-5 text-slate-700">{logs.map((log, index) => <p key={`${log}-${index}`} className="border-l-2 border-teal-500 pl-2">{log}</p>)}{logs.length === 0 && <p className="text-slate-400">실행을 시작하면 회사별 진행 결과가 표시됩니다.</p>}</div></div>
            </aside>
          </section>
        </div>
      )}

      {editor && <EditorModal value={editor} onChange={setEditor} onClose={() => setEditor(null)} onSave={() => void saveEditor()} saving={saving}/>} 
    </main>
  );
}

function ExcelDataTable({ records, selected, loading, sort, onSort, onToggle, onToggleAll, onEdit, onDelete }: {
  records: SalesRecord[];
  selected: Set<string>;
  loading: boolean;
  sort: SortState;
  onSort: (key: SortKey) => void;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onEdit: (record: SalesRecord) => void;
  onDelete: (record: SalesRecord) => void;
}) {
  const totalWidth = EXCEL_COLUMNS.reduce((sum, column) => sum + column.minWidth, 0) + 128;

  return (
    <div>
      <div className="flex flex-col gap-1 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="text-sm font-bold text-slate-900">Excel 원본 열 A-Y</h3><p className="mt-0.5 text-xs text-slate-500">가로로 이동하여 가져온 25개 항목을 모두 확인할 수 있습니다.</p></div>
        <p className="text-xs font-semibold text-slate-500">현재 페이지 {records.length}건</p>
      </div>
      <div className="max-h-[58vh] overflow-auto">
        <table className="border-collapse text-left text-xs" style={{ minWidth: totalWidth }}>
          <thead className="sticky top-0 z-20 bg-slate-100 text-slate-700">
            <tr>
              <th className="sticky left-0 top-0 z-30 w-12 border-r border-slate-300 bg-slate-100 px-3 py-3"><input type="checkbox" aria-label="현재 페이지 전체 선택" checked={records.length > 0 && records.every((record) => selected.has(record.id))} onChange={onToggleAll}/></th>
              {EXCEL_COLUMNS.map((column) => <th key={column.letter} className="bg-slate-100 px-3 py-2.5" style={{ minWidth: column.minWidth, width: column.minWidth }}><SortLabel label={<><span className="inline-grid h-5 min-w-5 place-items-center bg-slate-200 px-1 text-[10px] text-slate-600">{column.letter}</span><span>{column.label}</span></>} sortKey={column.key} sort={sort} onSort={onSort} ariaLabel={column.letter + ' ' + column.label}/></th>)}
              <th className="sticky right-0 top-0 z-30 w-20 border-l border-slate-300 bg-slate-100 px-3 py-3 text-center">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {records.map((record) => <tr key={record.id} className="group hover:bg-blue-50/40">
              <td className="sticky left-0 z-10 border-r border-slate-300 bg-white px-3 py-3 group-hover:bg-blue-50"><input type="checkbox" checked={selected.has(record.id)} onChange={() => onToggle(record.id)} aria-label={`${record.companyName} 선택`}/></td>
              {EXCEL_COLUMNS.map((column) => {
                const value = excelCellValue(record, column.key);
                const longText = column.key === 'contactHistory' || column.key === 'nextAction' || column.key === 'quoteReviewResult';
                return <td key={column.letter} className={`border-r border-slate-100 px-3 py-3 align-top text-slate-700 ${longText ? 'whitespace-normal leading-5' : 'whitespace-nowrap'}`} title={value}><span className={longText ? 'block max-h-16 overflow-hidden' : ''}>{value}</span></td>;
              })}
              <td className="sticky right-0 z-10 border-l border-slate-300 bg-white px-2 py-3 group-hover:bg-blue-50"><div className="flex justify-center gap-1"><button type="button" onClick={() => onEdit(record)} className="grid h-8 w-8 place-items-center border border-slate-300 text-slate-600 hover:bg-slate-100" title="수정"><Icon name="edit"/></button><button type="button" onClick={() => onDelete(record)} className="grid h-8 w-8 place-items-center border border-slate-300 text-rose-700 hover:bg-rose-50" title="삭제"><Icon name="trash"/></button></div></td>
            </tr>)}
            {!loading && records.length === 0 && <tr><td colSpan={EXCEL_COLUMNS.length + 2} className="px-4 py-16 text-center text-slate-500">표시할 세일즈 데이터가 없습니다.</td></tr>}
            {loading && <tr><td colSpan={EXCEL_COLUMNS.length + 2} className="px-4 py-16 text-center text-slate-500">세일즈 데이터를 불러오는 중입니다.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditorModal({ value, onChange, onClose, onSave, saving }: { value: Partial<SalesRecordInput>; onChange: (value: Partial<SalesRecordInput>) => void; onClose: () => void; onSave: () => void; saving: boolean }) {
  const d365 = { ...emptyD365, ...(value.d365 || {}) };
  const field = (key: keyof SalesRecordInput, next: string | number | boolean) => onChange({ ...value, [key]: next });
  const d365Field = (key: keyof D365Fields, next: string) => onChange({ ...value, d365: { ...d365, [key]: next, status: 'not-ready' } });
  const inputClass = 'h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600';
  const textareaClass = 'min-h-20 w-full border border-slate-300 bg-white p-3 text-sm leading-5 outline-none focus:border-blue-600';
  const labelClass = 'space-y-1 text-xs font-bold text-slate-600';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-7xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div><h3 className="text-lg font-bold text-slate-950">세일즈 데이터 편집</h3><p className="mt-0.5 text-xs text-slate-500">Excel A-Y 원본 항목과 D365 매핑 정보를 함께 관리합니다.</p></div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center border border-slate-300 text-xl text-slate-600" aria-label="닫기">×</button>
        </header>
        <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,.45fr)]">
          <section>
            <div className="mb-3 flex items-end justify-between border-b border-slate-200 pb-2"><div><h4 className="text-sm font-bold text-slate-900">Excel A-Y 세일즈 정보</h4><p className="mt-0.5 text-xs text-slate-500">열 문자는 업로드한 Quot_2026 시트와 동일합니다.</p></div><span className="text-xs font-bold text-blue-700">25개 필드</span></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <label className={labelClass}>A · 이노베이션<input className={inputClass} value={value.innovation || ''} onChange={(e) => field('innovation', e.target.value)}/></label>
              <label className={labelClass}>B · Product<input className={inputClass} value={value.product || ''} onChange={(e) => field('product', e.target.value)}/></label>
              <label className={labelClass}>C · 구분<input className={inputClass} value={value.category || ''} onChange={(e) => field('category', e.target.value)}/></label>
              <label className={labelClass}>D · SF<input className={inputClass} value={value.sf || ''} onChange={(e) => field('sf', e.target.value)}/></label>
              <label className={labelClass}>E · DATE<input type="date" className={inputClass} value={value.quotedAt || ''} onChange={(e) => field('quotedAt', e.target.value)}/></label>
              <label className={labelClass}>F · Q.No.<input className={inputClass} value={value.quoteNumber || ''} onChange={(e) => field('quoteNumber', e.target.value)}/></label>
              <label className={labelClass}>G · 기한<input className={inputClass} value={value.deadline || ''} onChange={(e) => field('deadline', e.target.value)}/></label>
              <label className={labelClass}>H · 업체명 *<input className={inputClass} value={value.companyName || ''} onChange={(e) => field('companyName', e.target.value)}/></label>
              <label className={labelClass}>I · Account<input className={inputClass} value={value.accountName || ''} onChange={(e) => field('accountName', e.target.value)}/></label>
              <label className={labelClass}>J · Opportunity<input className={inputClass} value={value.opportunityName || ''} onChange={(e) => field('opportunityName', e.target.value)}/></label>
              <label className={labelClass}>K · 담당자<input className={inputClass} value={value.contactName || ''} onChange={(e) => field('contactName', e.target.value)}/></label>
              <label className={labelClass}>L · tel<input className={inputClass} value={value.telephone || ''} onChange={(e) => field('telephone', e.target.value)}/></label>
              <label className={labelClass}>M · HP<input className={inputClass} value={value.mobile || ''} onChange={(e) => field('mobile', e.target.value)}/></label>
              <label className={labelClass}>N · e-mail<input type="email" className={inputClass} value={value.email || ''} onChange={(e) => field('email', e.target.value)}/></label>
              <label className={`${labelClass} sm:col-span-2 xl:col-span-3`}>O · 통화내역<textarea className={textareaClass} value={value.contactHistory || ''} onChange={(e) => field('contactHistory', e.target.value)}/></label>
              <label className={`${labelClass} sm:col-span-2 xl:col-span-3`}>P · 이후 진행<textarea className={textareaClass} value={value.nextAction || ''} onChange={(e) => field('nextAction', e.target.value)}/></label>
              <label className={labelClass}>Q · 컨설팅FU<input className={inputClass} value={value.consultingFollowUp || ''} onChange={(e) => field('consultingFollowUp', e.target.value)}/></label>
              <label className={labelClass}>R · Lead source<input className={inputClass} value={value.leadSource || ''} onChange={(e) => field('leadSource', e.target.value)}/></label>
              <label className={labelClass}>S · Contract<input className={inputClass} value={value.contract || ''} onChange={(e) => field('contract', e.target.value)}/></label>
              <label className={labelClass}>T · MP승인<input className={inputClass} value={value.mpApproval || ''} onChange={(e) => field('mpApproval', e.target.value)}/></label>
              <label className={labelClass}>U · 견적MD<input type="number" step="0.1" className={inputClass} value={value.quoteMandays || 0} onChange={(e) => field('quoteMandays', Number(e.target.value))}/></label>
              <label className={labelClass}>V · 신청/6SV<input className={inputClass} value={value.application6sv || ''} onChange={(e) => field('application6sv', e.target.value)}/></label>
              <label className={labelClass}>W · 금액(출장비제외)<input type="number" className={inputClass} value={value.amountExcludingExpenses || 0} onChange={(e) => field('amountExcludingExpenses', Number(e.target.value))}/></label>
              <label className={labelClass}>X · 금액(출장비포함)<input type="number" className={inputClass} value={value.amountIncludingExpenses || 0} onChange={(e) => field('amountIncludingExpenses', Number(e.target.value))}/></label>
              <label className={`${labelClass} sm:col-span-2 xl:col-span-3`}>Y · Q검토결과<textarea className={textareaClass} value={value.quoteReviewResult || ''} onChange={(e) => field('quoteReviewResult', e.target.value)}/></label>
            </div>
          </section>

          <div className="space-y-6">
            <section>
              <h4 className="mb-3 border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">내부 관리</h4>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className={labelClass}>진행 상태<select className={inputClass} value={value.stage || 'new'} onChange={(e) => field('stage', e.target.value as SalesStage)}>{Object.entries(STAGE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
                <label className={labelClass}>LRQA 담당자 (Z)<input className={inputClass} value={value.originalOwner || ''} onChange={(e) => field('originalOwner', e.target.value)}/></label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={Boolean(value.won)} onChange={(e) => field('won', e.target.checked)}/>Won 처리</label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={Boolean(value.d365Matched)} onChange={(e) => field('d365Matched', e.target.checked)}/>D365 매칭 확인</label>
              </div>
            </section>

            <section>
              <h4 className="mb-3 border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">D365 매핑</h4>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className={labelClass}>Account 처리 방식<div className="grid grid-cols-2 border border-slate-300 bg-slate-100 p-1"><button type="button" onClick={() => d365Field('accountMode', 'existing')} className={`h-9 text-sm font-bold ${d365.accountMode === 'existing' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>기존 Account</button><button type="button" onClick={() => d365Field('accountMode', 'new')} className={`h-9 text-sm font-bold ${d365.accountMode === 'new' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>신규 Account</button></div></label>
                {d365.accountMode === 'existing' ? <label className={labelClass}>Account URL *<input className={inputClass} value={d365.accountUrl} onChange={(e) => d365Field('accountUrl', e.target.value)} placeholder="https://lrqa.crm4.dynamics.com/..."/></label> : <><label className={labelClass}>Street 1<input className={inputClass} value={d365.street1} onChange={(e) => d365Field('street1', e.target.value)}/></label><label className={labelClass}>City<input className={inputClass} value={d365.city} onChange={(e) => d365Field('city', e.target.value)}/></label><label className={labelClass}>ZIP/Postal Code<input className={inputClass} value={d365.postalCode} onChange={(e) => d365Field('postalCode', e.target.value)}/></label></>}
                <label className={labelClass}>First Name<input className={inputClass} value={d365.firstName} onChange={(e) => d365Field('firstName', e.target.value)}/></label>
                <label className={labelClass}>Last Name<input className={inputClass} value={d365.lastName} onChange={(e) => d365Field('lastName', e.target.value)}/></label>
                <label className={labelClass}>Close Date *<input type="date" className={inputClass} value={d365.closeDate} onChange={(e) => d365Field('closeDate', e.target.value)}/></label>
                <label className={labelClass}>Assign To<input className={inputClass} value={d365.assignTo} onChange={(e) => d365Field('assignTo', e.target.value)}/></label>
                <label className={labelClass}>D365 Lead Source<input className={inputClass} value={d365.leadSource} onChange={(e) => d365Field('leadSource', e.target.value)}/></label>
                <label className={labelClass}>Area of Interest<input className={inputClass} value={d365.areaOfInterest} onChange={(e) => d365Field('areaOfInterest', e.target.value)}/></label>
                <label className={labelClass}>Primary Business Stream<input className={inputClass} value={d365.primaryBusinessStream} onChange={(e) => d365Field('primaryBusinessStream', e.target.value)}/></label>
                <label className={labelClass}>Primary Service<input className={inputClass} value={d365.primaryService} onChange={(e) => d365Field('primaryService', e.target.value)}/></label>
                <label className={labelClass}>Opportunity Record Type<input className={inputClass} value={d365.opportunityRecordType} onChange={(e) => d365Field('opportunityRecordType', e.target.value)}/></label>
                <label className={labelClass}>Opportunity Type<input className={inputClass} value={d365.opportunityType} onChange={(e) => d365Field('opportunityType', e.target.value)}/></label>
                <label className={labelClass}>Forecast Category<input className={inputClass} value={d365.forecastCategory} onChange={(e) => d365Field('forecastCategory', e.target.value)}/></label>
                <label className={labelClass}>Client Facing Office<input className={inputClass} value={d365.clientFacingOffice} onChange={(e) => d365Field('clientFacingOffice', e.target.value)}/></label>
                <label className={labelClass}>Country<input className={inputClass} value={d365.country} onChange={(e) => d365Field('country', e.target.value)}/></label>
              </div>
            </section>
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4"><button type="button" onClick={onClose} className="h-10 border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700">취소</button><button type="button" disabled={saving} onClick={onSave} className="h-10 bg-blue-700 px-5 text-sm font-bold text-white disabled:bg-slate-300">{saving ? '저장 중' : '저장'}</button></footer>
      </div>
    </div>
  );
}