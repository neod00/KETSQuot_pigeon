'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function AccessRequestForm() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== passwordConfirm) {
      setError('비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/iso/auth/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '사용 신청을 접수하지 못했습니다.');
      setSubmittedEmail(payload.request.email);
      setPassword('');
      setPasswordConfirm('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '사용 신청을 접수하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedEmail) {
    return (
      <div className="mt-6">
        <div className="rounded-md border border-teal-200 bg-teal-50 p-5" role="status">
          <p className="font-bold text-teal-900">사용 신청이 접수되었습니다.</p>
          <p className="mt-2 text-sm leading-6 text-teal-900">
            <strong>{submittedEmail}</strong> 계정은 관리자 승인 후 사용할 수 있습니다.
            승인되면 신청할 때 설정한 비밀번호로 로그인해 주세요.
          </p>
        </div>
        <Link
          href="/iso/login"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-teal-700 px-4 font-bold text-white hover:bg-teal-800"
        >
          로그인 화면으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="request-name" className="mb-1 block text-sm font-semibold text-slate-700">이름</label>
        <input
          id="request-name"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          required
          minLength={2}
          maxLength={60}
        />
      </div>
      <div>
        <label htmlFor="request-email" className="mb-1 block text-sm font-semibold text-slate-700">LRQA 이메일</label>
        <input
          id="request-email"
          type="email"
          autoComplete="email"
          placeholder="name@lrqa.com"
          pattern=".+@lrqa\.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          required
        />
      </div>
      <div>
        <label htmlFor="request-password" className="mb-1 block text-sm font-semibold text-slate-700">비밀번호</label>
        <input
          id="request-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          required
          minLength={10}
        />
        <p className="mt-1 text-xs leading-5 text-slate-500">영문과 숫자를 포함해 10자 이상 입력해 주세요.</p>
      </div>
      <div>
        <label htmlFor="request-password-confirm" className="mb-1 block text-sm font-semibold text-slate-700">비밀번호 확인</label>
        <input
          id="request-password-confirm"
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          required
          minLength={10}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-teal-700 px-4 py-2.5 font-bold text-white hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60"
      >
        {submitting ? '신청 중...' : '사용 신청하기'}
      </button>
      <p className="text-center text-sm text-slate-600">
        이미 승인된 계정이 있나요?{' '}
        <Link href="/iso/login" className="font-bold text-teal-700 underline-offset-2 hover:underline">로그인</Link>
      </p>
    </form>
  );
}
