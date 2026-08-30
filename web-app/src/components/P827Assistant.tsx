'use client';

import { ChangeEvent, useRef, useState } from 'react';

type Role = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
};

type PendingFile = {
  id: string;
  filename: string;
  mimeType: string;
  dataUrl: string;
  size: number;
};

type FieldSuggestion = {
  field: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
};

type AssistantResult = {
  reply: string;
  fields: FieldSuggestion[];
  scope3Updated: boolean;
  scope3Selected: number[];
  daySuggestion: {
    recommended: boolean;
    stage1: number;
    stage2: number;
    stage3: number;
    expenses: number;
    auditRate: number;
    justification: string;
  };
  missingFields: string[];
  warnings: string[];
  readyToGenerate: boolean;
};

type Props = {
  formData: Record<string, unknown>;
  onApply: (changes: Record<string, unknown>) => void;
};

const FIELD_LABELS: Record<string, string> = {
  companyName: '고객사 명칭',
  clientRepName: '대표자 성함',
  hqAddress: '본사 주소',
  targetSites: '대상 사업장',
  serviceDesc: '서비스 용역 설명',
  vYear: '검증 대상연도',
  ghgDeclarationPeriod: '온실가스 선언 기간',
  assuranceLevel: '보증 수준',
  materialityLevel: '중요성 기준',
  verificationStandard: '검증기준',
  reportingDeadline: '보고 마감기한',
  proposalNo: '제안서 번호',
  proposalDate: '발행일자',
  vatType: 'VAT',
  adminName: '담당 심사원',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'eml', 'txt', 'md'];

const identifier = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function formatSize(size: number) {
  return size < 1024 * 1024 ? `${Math.ceil(size / 1024)}KB` : `${(size / 1024 / 1024).toFixed(1)}MB`;
}

function confidenceLabel(value: FieldSuggestion['confidence']) {
  return ({ high: '높음', medium: '보통', low: '낮음' }[value]);
}

export default function P827Assistant({ formData, onApply }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'P827 견적·계약에 필요한 내용을 대화로 정리해 드립니다. 이메일 본문을 붙여 넣거나 PDF·Word·EML 파일을 첨부하고, 음성으로 말씀하셔도 됩니다.',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const submit = async (text = draft, attachments = files) => {
    const message = text.trim();
    if (!message) return;
    const userMessage: ChatMessage = { id: identifier(), role: 'user', content: message };
    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setFiles([]);
    setError('');
    setResult(null);
    setIsSending(true);
    try {
      const response = await fetch('/api/p827/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          messages: messages.map(({ role, content }) => ({ role, content })),
          form: formData,
          attachments: attachments.map(({ filename, mimeType, dataUrl }) => ({ filename, mimeType, dataUrl })),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.result) throw new Error(payload.message || 'AI 대화에 실패했습니다.');
      const nextResult = payload.result as AssistantResult;
      setResult(nextResult);
      setMessages((current) => [...current, { id: identifier(), role: 'assistant', content: nextResult.reply }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'AI 대화에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    const next: PendingFile[] = [];
    for (const file of selected) {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ACCEPTED_EXTENSIONS.includes(extension)) {
        setError(`${file.name}: PDF, Word, EML, TXT 파일만 첨부할 수 있습니다.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name}: 파일 하나당 5MB 이하만 첨부할 수 있습니다.`);
        continue;
      }
      try {
        next.push({
          id: identifier(),
          filename: file.name,
          mimeType: file.type || (extension === 'eml' ? 'message/rfc822' : 'application/octet-stream'),
          dataUrl: await fileToDataUrl(file),
          size: file.size,
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : '첨부파일을 읽지 못했습니다.');
      }
    }
    if (next.length) setFiles((current) => [...current, ...next].slice(0, 3));
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('이 브라우저에서는 음성 입력을 사용할 수 없습니다.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (!blob.size) return;
        setIsTranscribing(true);
        setError('');
        try {
          const audioForm = new FormData();
          audioForm.append('audio', new File([blob], 'p827-voice.webm', { type: blob.type || 'audio/webm' }));
          const response = await fetch('/api/p827/transcribe', { method: 'POST', body: audioForm });
          const payload = await response.json();
          if (!response.ok || !payload.text) throw new Error(payload.message || '음성을 변환하지 못했습니다.');
          setDraft((current) => current ? `${current}\n${payload.text}` : payload.text);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : '음성을 변환하지 못했습니다.');
        } finally {
          setIsTranscribing(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      streamRef.current = stream;
      setIsRecording(true);
    } catch {
      setError('마이크 권한을 허용한 뒤 다시 시도해 주세요.');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  const applyResult = () => {
    if (!result) return;
    const changes: Record<string, unknown> = {};
    for (const suggestion of result.fields) {
      if (suggestion.value.trim()) changes[suggestion.field] = suggestion.value.trim();
    }
    if (result.scope3Updated) {
      const chosen = new Set(result.scope3Selected);
      changes.scope3Categories = Array.from({ length: 15 }, (_, index) => chosen.has(index + 1));
    }
    if (result.daySuggestion.recommended) {
      changes.s1Days = result.daySuggestion.stage1;
      changes.s2Days = result.daySuggestion.stage2;
      changes.s3Days = result.daySuggestion.stage3;
      if (result.daySuggestion.expenses > 0) changes.expenses = result.daySuggestion.expenses;
      if (result.daySuggestion.auditRate > 0) changes.auditRate = result.daySuggestion.auditRate;
    }
    onApply(changes);
  };

  const sendAttachmentRequest = () => {
    if (!files.length || isSending) return;
    submit(draft || '첨부자료를 바탕으로 P827 견적·계약에 필요한 정보를 정리하고, 누락된 항목을 질문해 주세요.');
  };

  return (
    <section className="overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-4 py-3 sm:px-5">
        <button type="button" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen} className="flex items-center gap-3 text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-700 text-sm text-white">✦</span>
          <span><span className="block text-sm font-black text-slate-950">AI로 P827 정보 입력</span><span className="block text-[11px] text-slate-600">텍스트 · 파일 · 음성으로 초안 정리</span></span>
          <span className="text-sm font-black text-violet-700">{isOpen ? '⌃' : '⌄'}</span>
        </button>
        <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[10px] font-black text-violet-800">GPT-5.6 Luna</span>
      </div>

      {isOpen && <div className="grid gap-0 border-t border-violet-100 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="border-b border-slate-200 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="max-h-[210px] space-y-3 overflow-y-auto pr-1" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'assistant' ? 'bg-slate-100 text-slate-800' : 'ml-auto bg-violet-700 text-white'}`}>
                <p className={`mb-1 text-[10px] font-black uppercase tracking-wider ${message.role === 'assistant' ? 'text-violet-700' : 'text-violet-100'}`}>{message.role === 'assistant' ? 'LRQA AI' : '나'}</p>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
            {isSending && <div className="w-fit rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500">자료를 검토하고 있습니다...</div>}
          </div>

          {files.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {files.map((file) => <span key={file.id} className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-xs font-bold text-violet-900"><span>📎 {file.filename} · {formatSize(file.size)}</span><button type="button" aria-label={`${file.filename} 삭제`} onClick={() => setFiles((current) => current.filter((item) => item.id !== file.id))} className="text-violet-500 hover:text-rose-600">×</button></span>)}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-slate-200 p-2 focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} placeholder="예: 2025년 온실가스 배출량 제3자 검증 견적을 준비하고 싶습니다. 대상 사업장은 2곳이며 Scope 1·2만 해당합니다." className="w-full resize-none border-0 bg-transparent px-2 py-1 text-sm leading-6 outline-none" onKeyDown={(event) => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); submit(); } }} />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
              <div className="flex items-center gap-1">
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.eml,.txt,.md" className="hidden" onChange={handleFiles} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-100">📎 파일</button>
                <button type="button" onClick={isRecording ? stopRecording : startRecording} disabled={isTranscribing} className={`rounded-lg px-3 py-2 text-xs font-black ${isRecording ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'} disabled:opacity-50`}>{isTranscribing ? '변환 중...' : isRecording ? '■ 녹음 종료' : '🎙 음성'}</button>
              </div>
              <button type="button" onClick={() => files.length && !draft.trim() ? sendAttachmentRequest() : submit()} disabled={isSending || (!draft.trim() && !files.length)} className="rounded-lg bg-violet-700 px-4 py-2 text-xs font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-40">{isSending ? '분석 중...' : 'AI에게 보내기'}</button>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">PDF·Word·EML·TXT 파일을 최대 3개, 파일당 5MB까지 첨부할 수 있습니다. Outlook <code>.msg</code> 메일은 <code>.eml</code>로 저장해 첨부해 주세요. 음성은 텍스트로 변환된 뒤 전송 전 수정할 수 있습니다.</p>
          {error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800">{error}</p>}
        </div>

        <aside className="bg-slate-50 p-4 sm:p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">AI 정리 결과</p>
          {!result ? <p className="mt-2 text-xs leading-5 text-slate-500">대화 후 핵심 제안과 추가 확인 항목만 표시합니다.</p> : (
            <div className="mt-3 space-y-3">
              {result.fields.length > 0 && <div><p className="text-xs font-black text-slate-700">반영 제안</p><div className="mt-2 space-y-1.5">{result.fields.slice(0, showDetails ? undefined : 4).map((field, index) => <div key={`${field.field}-${index}`} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2"><div className="flex items-center justify-between gap-2"><span className="text-[11px] font-black text-slate-800">{FIELD_LABELS[field.field] || field.field}</span><span className="text-[10px] font-bold text-violet-700">{confidenceLabel(field.confidence)}</span></div><p className="mt-0.5 break-words text-xs font-medium text-slate-700">{field.value}</p>{showDetails && field.reason && <p className="mt-1 text-[10px] leading-4 text-slate-500">{field.reason}</p>}</div>)}</div></div>}
              {result.daySuggestion.recommended && <div className="rounded-xl border border-teal-200 bg-teal-50 p-3"><div className="flex items-baseline justify-between gap-2"><p className="text-xs font-black text-teal-900">예비 심사일수</p><p className="text-base font-black text-teal-950">{(result.daySuggestion.stage1 + result.daySuggestion.stage2 + result.daySuggestion.stage3).toFixed(1)} MD</p></div><p className="mt-1 text-[11px] font-bold text-teal-800">S1 {result.daySuggestion.stage1} · S2 {result.daySuggestion.stage2} · S3 {result.daySuggestion.stage3}</p>{showDetails && <p className="mt-2 text-[11px] leading-5 text-teal-900">{result.daySuggestion.justification}</p>}</div>}
              {result.missingFields.length > 0 && <div><p className="text-xs font-black text-amber-800">추가 확인</p><ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] leading-5 text-amber-900">{result.missingFields.slice(0, showDetails ? undefined : 2).map((item) => <li key={item}>{item}</li>)}</ul></div>}
              {result.warnings.length > 0 && <div><p className="text-xs font-black text-rose-800">주의</p><ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] leading-5 text-rose-900">{result.warnings.slice(0, showDetails ? undefined : 1).map((item) => <li key={item}>{item}</li>)}</ul></div>}
              {(result.fields.length > 4 || result.missingFields.length > 2 || result.warnings.length > 1 || result.daySuggestion.recommended) && <button type="button" onClick={() => setShowDetails((current) => !current)} className="text-xs font-black text-violet-700 hover:text-violet-900">{showDetails ? '핵심만 보기' : '상세 보기'}</button>}
              {(result.fields.length > 0 || result.daySuggestion.recommended || result.scope3Updated) && <button type="button" onClick={applyResult} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800">제안을 현재 폼에 반영</button>}
              {result.readyToGenerate && <p className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-900">필수 정보가 갖춰졌습니다. 폼 반영 후 견적서·계약서를 생성할 수 있습니다.</p>}
            </div>
          )}
        </aside>
      </div>}
    </section>
  );
}
