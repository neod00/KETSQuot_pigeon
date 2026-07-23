'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function LoginForm({ returnTo }: { returnTo: string }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/iso/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, returnTo }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '로그인하지 못했습니다.');
      window.location.assign(payload.returnTo || '/iso/applications');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '로그인하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="username" className="mb-1 block text-sm font-semibold text-slate-700">LRQA 이메일 또는 관리자 ID</label>
        <input
          id="username"
          autoComplete="username"
          placeholder="name@lrqa.com"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-700">비밀번호</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          required
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
        {submitting ? '로그인 중...' : '로그인'}
      </button>
      <div className="border-t border-slate-200 pt-4 text-center">
        <p className="text-sm text-slate-600">처음 사용하는 LRQA 팀원이신가요?</p>
        <Link
          href="/iso/request-access"
          className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-teal-700 px-4 text-sm font-bold text-teal-800 hover:bg-teal-50"
        >
          팀원 사용 신청
        </Link>
      </div>
    </form>
  );
}
