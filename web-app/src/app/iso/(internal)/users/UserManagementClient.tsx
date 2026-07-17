'use client';

import { FormEvent, useState } from 'react';
import type { InternalInvitationSummary, InternalUserSummary } from '@/lib/internalUsers';

const formatDate = (value: string) => new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value));

export default function UserManagementClient({ initialUsers, initialInvitations }: { initialUsers: InternalUserSummary[]; initialInvitations: InternalInvitationSummary[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [email, setEmail] = useState('');
  const [setupUrl, setSetupUrl] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setSetupUrl('');
    try {
      const response = await fetch('/api/iso/auth/invitations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '초대를 만들지 못했습니다.');
      setSetupUrl(payload.setupUrl);
      setInvitations(current => [payload.invitation, ...current.filter(item => item.email !== payload.invitation.email)]);
      setEmail('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '초대를 만들지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (userEmail: string) => {
    if (!window.confirm(`${userEmail} 계정을 삭제하시겠습니까?`)) return;
    const response = await fetch('/api/iso/auth/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: userEmail }) });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error || '사용자를 삭제하지 못했습니다.');
    setUsers(current => current.filter(item => item.email !== userEmail));
    setInvitations(current => current.filter(item => item.email !== userEmail));
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">팀원 계정 관리</h2>
        <p className="mt-1 text-sm text-slate-600">LRQA 이메일을 초대하고 생성된 링크를 해당 팀원에게 전달하세요.</p>
      </div>
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={invite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1"><label htmlFor="invite-email" className="mb-1 block text-sm font-semibold text-slate-700">팀원 LRQA 이메일</label><input id="invite-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@lrqa.com" pattern=".+@lrqa\.com" className="w-full rounded-md border border-slate-300 px-3 py-2.5" required /></div>
          <button type="submit" disabled={submitting} className="min-h-11 rounded-md bg-teal-700 px-5 font-bold text-white disabled:opacity-60">{submitting ? '생성 중...' : '초대 링크 생성'}</button>
        </form>
        {message && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{message}</p>}
        {setupUrl && <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-4"><p className="text-sm font-bold text-teal-900">이 링크를 팀원에게 전달하세요. 링크는 7일간 유효합니다.</p><div className="mt-2 flex gap-2"><input readOnly value={setupUrl} className="min-w-0 flex-1 rounded border border-teal-300 bg-white px-3 py-2 text-sm" /><button type="button" onClick={() => navigator.clipboard.writeText(setupUrl)} className="rounded-md bg-teal-700 px-4 text-sm font-bold text-white">복사</button></div></div>}
      </section>

      <section className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4"><h3 className="font-bold text-slate-900">등록된 팀원 ({users.length})</h3></div>
        <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-600"><tr><th className="px-5 py-3">이메일</th><th className="px-5 py-3">등록일</th><th className="px-5 py-3 text-right">관리</th></tr></thead><tbody>{users.map(user => <tr key={user.email}><td className="border-t border-slate-100 px-5 py-3 font-semibold">{user.email}</td><td className="border-t border-slate-100 px-5 py-3">{formatDate(user.createdAt)}</td><td className="border-t border-slate-100 px-5 py-3 text-right"><button type="button" onClick={() => remove(user.email)} className="rounded border border-red-200 px-3 py-1.5 font-bold text-red-700">삭제</button></td></tr>)}{users.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-center text-slate-500">등록된 팀원이 없습니다.</td></tr>}</tbody></table></div>
      </section>

      {invitations.length > 0 && <section className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-5"><h3 className="font-bold text-amber-900">설정 대기 중 ({invitations.length})</h3><ul className="mt-3 space-y-2 text-sm text-amber-900">{invitations.map(item => <li key={item.email} className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{item.email}</span><span>{formatDate(item.expiresAt)} 만료</span></li>)}</ul></section>}
    </main>
  );
}
