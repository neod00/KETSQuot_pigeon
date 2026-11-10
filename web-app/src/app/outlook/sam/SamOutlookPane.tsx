'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SamMailUpload, { type SamMailUploadHandle } from '../../iso/(internal)/sam/SamMailUpload';
import { loadSamOffice, readSamOutlookDialogMessage, samOfficeDroppedFiles } from '@/lib/samOfficeBridge';
import type { SamBilingualText, SamMailDraft } from '@/lib/samTypes';

type Connection = { token: string; username: string; expiresAt: number };
type Account = { id: string; name: SamBilingualText };
export default function SamOutlookPane() {
  const [office, setOffice] = useState<typeof Office | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState('');
  const [drafts, setDrafts] = useState<SamMailDraft[]>([]);
  const [message, setMessage] = useState('Outlook 연결을 확인하고 있습니다.');
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [dropReady, setDropReady] = useState(false);
  const upload = useRef<SamMailUploadHandle>(null);
  const dialog = useRef<Office.Dialog | null>(null);
  const busyRef = useRef(false);
  const changeBusy = useCallback((value: boolean) => { busyRef.current = value; setBusy(value); }, []);

  useEffect(() => {
    let active = true;
    void loadSamOffice().then(api => {
      if (!active) return;
      if (!api.context.mailbox) { setMessage('Outlook에서 메일을 연 뒤 앱 메뉴의 SAM을 실행해 주세요.'); return; }
      setOffice(api); setMessage('SAM 연결을 누르고 기존 업무 포털 관리자 계정으로 로그인하세요.');
    }).catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; dialog.current?.close(); };
  }, []);

  useEffect(() => {
    if (!office) return;
    let active = true;
    const handleDrop = (event: Office.DragAndDropEventArgs) => {
      if (!active || event.dragAndDropEventData.type !== 'drop') return;
      if (busyRef.current) { setMessage('현재 메일 처리가 끝난 뒤 추가해 주세요.'); return; }
      if (!upload.current) { setMessage('SAM에 연결하고 Account를 먼저 선택해 주세요.'); return; }
      try {
        const files = samOfficeDroppedFiles(event);
        if (files.length) void upload.current.addFiles(files);
      } catch (error) { setMessage(error instanceof Error ? error.message : '메일을 가져오지 못했습니다.'); }
    };
    const itemChanged = () => { /* The explicitly selected SAM account stays fixed when Outlook selection changes. */ };
    office.context.mailbox.addHandlerAsync(office.EventType.DragAndDropEvent, handleDrop, result => {
      if (active) {
        setDropReady(result.status === office.AsyncResultStatus.Succeeded);
        if (result.status === office.AsyncResultStatus.Failed) setMessage(`Outlook 드래그 연결을 등록하지 못했습니다: ${result.error.message}`);
      }
    });
    office.context.mailbox.addHandlerAsync(office.EventType.ItemChanged, itemChanged);
    return () => {
      active = false;
      office.context.mailbox.removeHandlerAsync(office.EventType.DragAndDropEvent);
      office.context.mailbox.removeHandlerAsync(office.EventType.ItemChanged);
    };
  }, [office]);

  useEffect(() => {
    if (!connection) return;
    const controller = new AbortController();
    void fetch('/api/iso/sam/outlook/accounts', { headers: { Authorization: `Bearer ${connection.token}` }, signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Account를 불러오지 못했습니다.');
        setAccounts(payload.accounts || []);
        setMessage('Account를 선택한 뒤 메일을 끌어 넣으세요.');
      }).catch(error => { if (error.name !== 'AbortError') setMessage(error.message); });
    return () => controller.abort();
  }, [connection]);

  useEffect(() => {
    if (!connection) return;
    const timer = window.setTimeout(() => {
      setConnection(null); setSelected(''); setAccounts([]); setDrafts([]);
      setMessage('SAM 연결 시간이 만료됐습니다. 다시 연결해 주세요.');
    }, Math.max(0, connection.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [connection]);

  const refreshDrafts = useCallback(async () => {
    if (!connection || !selected) return;
    const response = await fetch(`/api/iso/sam/mail?accountId=${encodeURIComponent(selected)}`, { headers: { Authorization: `Bearer ${connection.token}` }, cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || '초안을 불러오지 못했습니다.');
    setDrafts((payload.drafts || []).filter((draft: SamMailDraft) => draft.status === 'pending'));
  }, [connection, selected]);

  useEffect(() => {
    let active = true;
    if (!selected || !connection) return;
    void fetch(`/api/iso/sam/mail?accountId=${encodeURIComponent(selected)}`, { headers: { Authorization: `Bearer ${connection.token}` }, cache: 'no-store' })
      .then(async response => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error); return payload; })
      .then(payload => { if (active) setDrafts((payload.drafts || []).filter((draft: SamMailDraft) => draft.status === 'pending')); })
      .catch(error => { if (active) setMessage(error.message || '초안을 불러오지 못했습니다.'); });
    return () => { active = false; };
  }, [connection, selected]);

  const connect = () => {
    if (!office || connecting) return;
    setConnecting(true);
    const nonce = crypto.randomUUID();
    office.context.ui.displayDialogAsync(`${window.location.origin}/outlook/sam/connect?nonce=${nonce}`, { height: 65, width: 35, displayInIframe: false }, result => {
      if (result.status === office.AsyncResultStatus.Failed) { setConnecting(false); setMessage(`로그인 창을 열지 못했습니다: ${result.error.message}`); return; }
      const opened = result.value;
      dialog.current = opened;
      opened.addEventHandler(office.EventType.DialogMessageReceived, arg => {
        if (!('message' in arg)) return;
        const verified = readSamOutlookDialogMessage(arg.message, arg.origin, window.location.origin, nonce);
        if (!verified) { setMessage('로그인 응답을 확인하지 못했습니다. 패널에서 다시 연결해 주세요.'); return; }
        setConnection(verified); setSelected(''); setAccounts([]); setDrafts([]);
        opened.close(); dialog.current = null; setConnecting(false);
      });
      opened.addEventHandler(office.EventType.DialogEventReceived, () => { dialog.current = null; setConnecting(false); });
    });
  };

  const account = accounts.find(value => value.id === selected);
  return <main className="mx-auto min-h-screen max-w-3xl bg-slate-50 px-3 py-5 text-slate-900">
    <header className="border-b border-slate-200 pb-4">
      <p className="text-xs font-bold uppercase text-teal-700">LRQA Korea · Outlook</p>
      <h1 className="mt-1 text-2xl font-bold">SAM 메일 정리</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Account를 선택하고 관련 메일을 이 패널에 끌어 넣으세요. 메일을 바꿔 열어도 패널을 유지하려면 위쪽 고정 핀을 누르세요.</p>
    </header>
    <p role="status" className="my-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm">{message}</p>
    <p className="mb-3 text-xs text-slate-500">{dropReady ? 'Outlook 드래그 연결 준비 완료' : 'Outlook 드래그 연결 대기'}</p>
    {!connection ? <button type="button" disabled={!office || connecting} onClick={connect} className="min-h-11 w-full rounded bg-blue-700 px-4 font-bold text-white disabled:bg-slate-300">{connecting ? '로그인 창 확인 중…' : 'SAM 연결'}</button> : <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600"><span>{connection.username} · 연결됨</span><button type="button" disabled={busy} onClick={() => { setConnection(null); setSelected(''); setAccounts([]); setDrafts([]); setMessage('SAM 연결을 종료했습니다.'); }} className="min-h-9 underline disabled:opacity-50">연결 해제</button></div>
      <label className="block text-sm font-bold">메일을 등록할 Account<select value={selected} disabled={busy} onChange={event => { setSelected(event.target.value); setDrafts([]); }} className="mt-2 min-h-11 w-full rounded border border-slate-300 bg-white px-3"><option value="">Account를 선택하세요</option>{accounts.map(value => <option key={value.id} value={value.id}>{value.name.ko || value.name.en}</option>)}</select></label>
      {account && <SamMailUpload key={account.id} ref={upload} accountId={account.id} accountName={account.name.ko || account.name.en} authToken={connection.token} outlookPane onBusyChange={changeBusy} onUploaded={refreshDrafts} />}
      {selected && <section className="mt-5"><div className="flex items-center justify-between"><h2 className="font-bold">AI 검토 대기 {drafts.length}건</h2><button type="button" disabled={busy} className="min-h-9 text-xs underline" onClick={() => void refreshDrafts().catch(error => setMessage(error.message))}>새로고침</button></div>{drafts.map(draft => <article key={draft.id} className="mt-3 rounded border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">{draft.messageRefs.map(ref => ref.subject).join(' / ')}</p><p className="mt-2 whitespace-pre-line text-sm">{draft.analysis.briefing.ko || draft.analysis.nextActions.ko || 'SAM에서 초안 내용을 확인해 주세요.'}</p></article>)}<a href="/iso/sam" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-blue-800 underline">SAM 웹사이트에서 초안 검토·승인</a></section>}
    </>}
    <details className="mt-6 border-t border-slate-200 pt-3 text-xs leading-6 text-slate-600"><summary className="cursor-pointer font-semibold">설치 및 사용 안내</summary><p className="mt-2">메일을 하나 연 뒤 Outlook의 앱 메뉴에서 SAM을 실행하세요. SAM 연결에는 기존 업무 포털 관리자 계정을 사용합니다. 받은 메일과 보낸 답장을 함께 가져오면 문맥을 확인하기 좋습니다.</p><p>메일 내용은 ‘AI로 정리’를 누를 때 분석을 위해 전송됩니다. 추가기능은 Graph나 전달용 이메일 주소를 사용하지 않습니다.</p><a href="/outlook/sam-outlook.xml" download="sam-outlook.xml" className="font-bold text-blue-800 underline">sam-outlook.xml 설치 파일 다운로드</a></details>
  </main>;
}
