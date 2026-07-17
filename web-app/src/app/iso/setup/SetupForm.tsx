'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function SetupForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!token) return setError('초대 토큰이 없습니다. 관리자에게 새 초대 링크를 요청해주세요.');
    if (password !== confirmPassword) return setError('비밀번호 확인이 일치하지 않습니다.');
    setSubmitting(true);
    try {
      const response = await fetch('/api/iso/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '계정을 설정하지 못했습니다.');
      setMessage(`${payload.email} 계정이 준비되었습니다.`);
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : '계정을 설정하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (message) return (
    <div className="mt-6 rounded-md border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-900">
      <p>{message}</p>
      <Link href="/iso/login" className="mt-4 inline-flex rounded-md bg-teal-700 px-4 py-2 text-white">로그인하기</Link>
    </div>
  );

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="new-password" className="mb-1 block text-sm font-semibold text-slate-700">새 비밀번호</label>
        <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} minLength={10} className="w-full rounded-md border border-slate-300 px-3 py-2.5" required />
        <p className="mt-1 text-xs text-slate-500">영문과 숫자를 포함하여 10자 이상</p>
      </div>
      <div>
        <label htmlFor="confirm-password" className="mb-1 block text-sm font-semibold text-slate-700">비밀번호 확인</label>
        <input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2.5" required />
      </div>
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
      <button type="submit" disabled={submitting} className="w-full rounded-md bg-teal-700 px-4 py-2.5 font-bold text-white disabled:opacity-60">{submitting ? '설정 중...' : '비밀번호 설정'}</button>
    </form>
  );
}
