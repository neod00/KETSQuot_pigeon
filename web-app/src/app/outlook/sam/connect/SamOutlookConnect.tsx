'use client';

import { useEffect, useState } from 'react';
import LoginForm from '../../../iso/login/LoginForm';
import { loadSamOffice } from '@/lib/samOfficeBridge';

export default function SamOutlookConnect({ nonce }: { nonce: string }) {
  const [login, setLogin] = useState(false);
  const validNonce = /^[\w-]{32,64}$/.test(nonce);
  const [message, setMessage] = useState('SAM 연결을 확인하고 있습니다.');
  useEffect(() => {
    let active = true;
    if (!validNonce) return;
    void loadSamOffice().then(async office => {
      const response = await fetch('/api/iso/sam/outlook/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nonce }), cache: 'no-store' });
      if (!active) return;
      if (response.status === 401) { setLogin(true); setMessage('기존 업무 포털의 SAM 관리자 계정으로 로그인하세요.'); return; }
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'SAM 연결을 완료하지 못했습니다.');
      office.context.ui.messageParent(JSON.stringify({ type: 'sam-outlook-connected', ...payload }), { targetOrigin: window.location.origin });
      setMessage('연결되었습니다. Outlook SAM 패널로 돌아가세요.');
    }).catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [nonce, validNonce]);
  return <main className="mx-auto max-w-md px-5 py-8"><p className="text-xs font-bold text-teal-700">LRQA SAM · Outlook 연결</p><h1 className="mt-2 text-xl font-bold">SAM 포털 로그인</h1><p role="status" className="mt-4 text-sm leading-6 text-slate-600">{validNonce ? message : 'Outlook SAM 패널의 연결 버튼으로 다시 열어 주세요.'}</p>{login && <LoginForm returnTo={`/outlook/sam/connect?nonce=${encodeURIComponent(nonce)}`} />}</main>;
}
