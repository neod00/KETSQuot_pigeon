'use client';

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { MAX_SAM_MAIL_FILES, parseSamMailFile, type ParsedSamMail } from '@/lib/samMailFiles';
import { MAX_SAM_MAIL_CONTENT } from '@/lib/samMailUpload';

type UploadState = 'reading' | 'ready' | 'processing' | 'done' | 'duplicate' | 'error';
type UploadItem = {
  key: string;
  fileName: string;
  state: UploadState;
  message?: ParsedSamMail;
  content?: string;
  detail?: string;
};
const stateLabels: Record<UploadState, string> = {
  reading: '파일 읽는 중', ready: '정리 대기', processing: 'AI 정리 중',
  done: '초안 생성 완료', duplicate: '중복 제외', error: '확인 필요',
};
const mailContent = (mail: ParsedSamMail) =>
  `[메일]\n제목: ${mail.subject}\n발신: ${mail.from}\n수신: ${mail.to}\n일시: ${mail.receivedAt}\n본문:\n${mail.body}`;

export type SamMailUploadHandle = { addFiles: (files: File[]) => Promise<void> };
export default function SamMailUpload({ accountId, accountName, onUploaded, onBusyChange, ref, authToken, outlookPane = false }: {
  accountId: string;
  accountName: string;
  onUploaded: () => Promise<void>;
  onBusyChange: (busy: boolean) => void;
  ref?: Ref<SamMailUploadHandle>;
  authToken?: string;
  outlookPane?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  const locked = useRef(false);
  const stop = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const dragDepth = useRef(0);
  const busyCallback = useRef(onBusyChange);
  busyCallback.current = onBusyChange;
  const [items, setItems] = useState<UploadItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stop.current = true;
      abort.current?.abort();
      busyCallback.current(false);
    };
  }, []);

  const setWorking = (value: boolean) => {
    locked.current = value;
    setBusy(value);
    busyCallback.current(value);
  };
  const updateItem = (key: string, change: Partial<UploadItem>) => {
    if (alive.current) setItems(current => current.map(item => item.key === key ? { ...item, ...change } : item));
  };

  const addFiles = async (files: File[]) => {
    if (locked.current) return;
    if (!files.length) {
      setNotice('Outlook에서 메일 파일이 전달되지 않았습니다. 메일을 PC 폴더에 .eml 또는 .msg로 저장한 뒤 여기에 끌어 놓거나 파일 선택을 이용해 주세요.');
      return;
    }
    if (items.length + files.length > MAX_SAM_MAIL_FILES) {
      setNotice(`한 번에 최대 ${MAX_SAM_MAIL_FILES}개까지 준비할 수 있습니다. 현재 ${items.length}개, 추가 선택 ${files.length}개입니다. 완료 목록을 비우거나 파일 수를 줄여 주세요.`);
      return;
    }
    setWorking(true);
    setNotice('');
    const incoming: UploadItem[] = files.map(file => ({ key: crypto.randomUUID(), fileName: file.name, state: 'reading' }));
    setItems(current => [...current, ...incoming]);
    const seen = new Set(items.filter(item => item.message && item.state !== 'error').map(item => item.message!.id));
    try {
      for (const [index, file] of files.entries()) {
        if (!alive.current) break;
        const key = incoming[index].key;
        try {
          const message = await parseSamMailFile(file);
          const content = mailContent(message);
          if (content.length > MAX_SAM_MAIL_CONTENT) {
            throw new Error(`메일 내용이 분석 한도 ${MAX_SAM_MAIL_CONTENT.toLocaleString('ko-KR')}자를 넘습니다. 긴 과거 인용문을 정리한 메일 파일로 다시 올려 주세요. 내용은 전송하지 않았습니다.`);
          }
          if (seen.has(message.id)) {
            updateItem(key, { state: 'duplicate', message, detail: '현재 목록에 같은 메일이 있습니다.' });
          } else {
            seen.add(message.id);
            updateItem(key, { state: 'ready', message, content });
          }
        } catch (error) {
          updateItem(key, { state: 'error', detail: error instanceof Error ? error.message : '메일 파일을 읽지 못했습니다.' });
        }
      }
    } finally {
      if (alive.current) setWorking(false);
      if (input.current) input.current.value = '';
    }
  };

  useImperativeHandle(ref, () => ({ addFiles }));

  const analyze = async (retry = false) => {
    if (locked.current) return;
    const pending = items.filter(item => item.message && item.content && (item.state === 'ready' || (retry && item.state === 'error')));
    if (!pending.length) return;
    setWorking(true);
    setProcessing(true);
    setNotice('');
    stop.current = false;
    let created = 0;
    let duplicates = 0;
    let errors = 0;
    let attempted = 0;
    try {
      for (const item of pending) {
        if (stop.current || !alive.current) break;
        updateItem(item.key, { state: 'processing', detail: undefined });
        const controller = new AbortController();
        abort.current = controller;
        const timeout = window.setTimeout(() => controller.abort(), 120_000);
        attempted++;
        try {
          const mail = item.message!;
          const response = await fetch('/api/iso/sam/mail', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
            signal: controller.signal,
            body: JSON.stringify({
              accountId, source: 'eml-upload',
              messages: [{ id: mail.id, subject: mail.subject, from: mail.from, to: mail.to, receivedAt: mail.receivedAt }],
              content: item.content,
            }),
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || `메일 분석 요청에 실패했습니다 (${response.status}).`);
          if (payload.duplicate) {
            duplicates++;
            updateItem(item.key, { state: 'duplicate', detail: '이 Account에서 이미 처리한 메일입니다.' });
          } else if (payload.draft) {
            created++;
            updateItem(item.key, { state: 'done', detail: '아래 AI 검토 대기에서 결과를 확인하세요.' });
          } else {
            throw new Error('분석 결과를 확인하지 못했습니다. 다시 시도해 주세요.');
          }
        } catch (error) {
          if (!alive.current) break;
          errors++;
          updateItem(item.key, {
            state: 'error',
            detail: error instanceof Error && error.name === 'AbortError'
              ? '응답 대기 시간이 초과됐습니다. 다시 시도하면 이미 처리된 메일은 중복 제외됩니다.'
              : error instanceof Error ? error.message : '분석하지 못했습니다. 다시 시도해 주세요.',
          });
        } finally {
          window.clearTimeout(timeout);
          abort.current = null;
        }
      }
      if (alive.current) {
        setNotice(`초안 생성 ${created}건 · 중복 제외 ${duplicates}건 · 실패 ${errors}건${attempted < pending.length ? ` · 남은 ${pending.length - attempted}건은 대기 중입니다.` : ''}`);
        try {
          await onUploaded();
        } catch {
          setNotice(current => `${current} 결과 목록을 불러오지 못했습니다. ‘초안 새로고침’을 눌러 주세요.`);
        }
      }
    } finally {
      if (alive.current) {
        setProcessing(false);
        setWorking(false);
      }
    }
  };

  const ready = items.filter(item => item.state === 'ready').length;
  const retryable = items.filter(item => item.state === 'error' && item.message && item.content).length;
  return (
    <section aria-label="Account 메일 업로드" className="mt-4 border border-blue-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-950">{outlookPane ? 'Outlook 메일 가져오기' : '메일 파일 업로드'}</h4>
          <p className="mt-1 text-sm text-slate-600">등록할 Account: <strong className="text-blue-800">{accountName}</strong></p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">여러 메일 한 번에 · .eml / .msg</span>
      </div>
      <div
        className={`mt-4 rounded-lg border-2 border-dashed px-4 py-7 text-center transition-colors ${dragging ? 'border-blue-600 bg-blue-100' : 'border-blue-300 bg-blue-50/60'} ${busy ? 'opacity-60' : ''}`}
        onDragEnter={event => { event.preventDefault(); if (!busy) { dragDepth.current++; setDragging(true); } }}
        onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = busy ? 'none' : 'copy'; }}
        onDragLeave={event => { event.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }}
        onDrop={event => {
          event.preventDefault(); dragDepth.current = 0; setDragging(false);
          const files = Array.from(event.dataTransfer.files);
          // Office.js delivers Outlook drops separately; its native DOM event may have no files.
          if (!busy && (files.length || !outlookPane)) void addFiles(files);
        }}
      >
        <p className="text-base font-bold text-slate-900">이 Account의 메일을 여기에 끌어 놓으세요</p>
        <p className="mt-2 text-sm text-slate-600">{outlookPane ? 'Outlook 메일 목록에서 선택한 메일을 이 SAM 패널 안으로 끌어 놓으세요.' : 'Outlook 폴더에서 선택한 메일 또는 PC에 저장한 메일 파일'}</p>
        <input ref={input} type="file" aria-label="메일 파일 선택" accept=".eml,.msg,message/rfc822,application/vnd.ms-outlook" multiple className="sr-only" disabled={busy} onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ''; if (files.length) void addFiles(files); }} />
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="mt-4 min-h-11 rounded border border-blue-700 bg-white px-5 text-sm font-bold text-blue-800 hover:bg-blue-50 disabled:opacity-50">메일 파일 선택</button>
        <p className="mt-3 text-xs text-slate-500">한 번에 {MAX_SAM_MAIL_FILES}개 · 파일당 최대 10MB · 본문과 기본 정보 분석</p>
      </div>
      <details className="mt-3 text-sm text-slate-600">
        <summary className="cursor-pointer font-semibold text-slate-700">.eml / .msg는 무엇인가요? 직접 드래그가 안 되나요?</summary>
        <div className="mt-2 space-y-2 rounded bg-slate-50 p-3 text-xs leading-5">
          <p>.eml과 .msg는 제목·보낸 사람·날짜·본문을 담은 메일 한 통의 파일 형식입니다. 화면 캡처나 첨부파일만을 뜻하지 않습니다.</p>
          <p>{outlookPane ? '새 Outlook과 웹 Outlook에서는 메일 목록의 메일을 이 추가기능 패널로 끌어 놓으세요. 패널 상단에 ‘Outlook 드래그 연결 준비 완료’가 표시되는지 확인하세요.' : 'Outlook 버전과 브라우저에 따라 직접 드래그가 지원되지 않을 수 있습니다. 메일을 PC 폴더로 끌어 저장하거나 Outlook의 ‘다른 이름으로 저장’을 사용한 뒤, 저장된 파일을 여기에 올려 주세요.'}</p>
          <p>이미 만들어 둔 Account별 Outlook 폴더를 그대로 사용하세요. 한 Account의 메일을 먼저 올린 뒤 다른 Account로 바꾸어 반복하면 됩니다. 받은 메일과 보낸 답장을 함께 올리면 대화 흐름을 더 잘 정리할 수 있습니다.</p>
          <p>메일에 첨부된 PDF·Excel 등의 내용은 이번 분석에 포함되지 않습니다. 파일을 추가하면 제목과 본문을 먼저 확인할 수 있고, ‘AI로 정리’를 누를 때 분석을 위해 메일 내용이 전송됩니다.</p>
        </div>
      </details>

      {items.length > 0 && <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold">선택한 메일 {items.length}개 <span className="font-normal text-slate-500">· 정리 대기 {ready}개</span></p>
          <button type="button" disabled={busy} onClick={() => { setItems([]); setNotice(''); }} className="min-h-9 px-2 text-xs font-semibold text-slate-600 underline disabled:opacity-50">업로드 목록 비우기</button>
        </div>
        <ul className="mt-2 max-h-[420px] divide-y divide-slate-200 overflow-y-auto rounded border border-slate-200">
          {items.map(item => <li key={item.key} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold text-slate-900">{item.message?.subject || item.fileName}</p>
                <p className="mt-1 break-words text-xs text-slate-500">{item.message ? [item.message.from, item.message.receivedAt, item.fileName].filter(Boolean).join(' · ') : item.fileName}</p>
              </div>
              <span className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${item.state === 'error' ? 'bg-amber-50 text-amber-900' : item.state === 'done' ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-700'}`}>{stateLabels[item.state]}</span>
              {!busy && <button type="button" aria-label={`${item.fileName} 목록에서 제거`} onClick={() => setItems(current => current.filter(row => row.key !== item.key))} className="shrink-0 px-1 text-xs text-slate-500 hover:text-red-700">제거</button>}
            </div>
            {item.detail && <p className={`mt-2 text-xs ${item.state === 'error' ? 'text-amber-900' : 'text-slate-600'}`}>{item.detail}</p>}
            {item.message?.warnings.map(warning => <p key={warning} className="mt-1 text-xs text-amber-900">{warning}</p>)}
            {item.message && <details className="mt-2 text-xs text-slate-600"><summary className="cursor-pointer">본문 미리보기</summary><p className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-slate-50 p-3">{item.message.body}</p></details>}
          </li>)}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" disabled={busy || ready === 0} onClick={() => void analyze()} className="min-h-11 rounded bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800 disabled:bg-slate-300">{processing ? 'AI 정리 중…' : `선택한 메일 ${ready}개 AI로 정리`}</button>
          {retryable > 0 && <button type="button" disabled={busy} onClick={() => void analyze(true)} className="min-h-11 rounded border border-amber-400 px-4 text-sm font-bold text-amber-900 disabled:opacity-50">실패한 메일 다시 시도</button>}
          {processing && <button type="button" onClick={() => { stop.current = true; setNotice('현재 메일 처리가 끝나면 중지합니다. 남은 메일은 계속 정리할 수 있습니다.'); }} className="min-h-11 px-3 text-sm text-slate-600 underline">현재 메일까지만 처리</button>}
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">선택한 Account에 메일별 AI 초안을 만듭니다. 같은 메일을 다시 올리면 중복을 확인합니다. {outlookPane ? '분석 결과는 SAM 웹사이트에서 검토·승인하여 이력에 반영하세요.' : '분석 결과는 아래에서 검토한 뒤 이력에 반영할 수 있습니다.'}</p>
      </div>}
      <p role="status" aria-live="polite" className="mt-3 text-sm font-semibold text-slate-700">{notice || (busy ? '파일별 처리 상태를 확인해 주세요. 처리 중에는 Account를 유지합니다.' : '')}</p>
    </section>
  );
}
