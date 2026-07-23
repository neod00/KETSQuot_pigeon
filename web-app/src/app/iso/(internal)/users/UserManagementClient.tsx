'use client';

import { FormEvent, useMemo, useState } from 'react';
import type {
  InternalAccessRequestSummary,
  InternalInvitationSummary,
  InternalUserSummary,
} from '@/lib/internalUsers';

const formatDate = (value: string) => new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value));

interface UserManagementClientProps {
  initialUsers: InternalUserSummary[];
  initialInvitations: InternalInvitationSummary[];
  initialAccessRequests: InternalAccessRequestSummary[];
}

export default function UserManagementClient({
  initialUsers,
  initialInvitations,
  initialAccessRequests,
}: UserManagementClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [accessRequests, setAccessRequests] = useState(initialAccessRequests);
  const [email, setEmail] = useState('');
  const [setupUrl, setSetupUrl] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success');
  const [submitting, setSubmitting] = useState(false);
  const [processingEmail, setProcessingEmail] = useState('');

  const pendingRequests = useMemo(
    () => accessRequests.filter((item) => item.status === 'pending'),
    [accessRequests],
  );
  const reviewedRequests = useMemo(
    () => accessRequests.filter((item) => item.status !== 'pending').slice(0, 10),
    [accessRequests],
  );

  const showMessage = (text: string, tone: 'success' | 'error') => {
    setMessage(text);
    setMessageTone(tone);
  };

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setSetupUrl('');
    try {
      const response = await fetch('/api/iso/auth/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '초대 링크를 만들지 못했습니다.');
      setSetupUrl(payload.setupUrl);
      setInvitations((current) => [
        payload.invitation,
        ...current.filter((item) => item.email !== payload.invitation.email),
      ]);
      setEmail('');
      showMessage('초대 링크를 생성했습니다.', 'success');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : '초대 링크를 만들지 못했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const review = async (requestEmail: string, action: 'approve' | 'reject') => {
    setProcessingEmail(requestEmail);
    setMessage('');
    try {
      const response = await fetch('/api/iso/auth/access-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: requestEmail, action }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '신청을 처리하지 못했습니다.');
      setAccessRequests((current) => current.map((item) => (
        item.email === requestEmail ? payload.request : item
      )));
      if (payload.user) {
        setUsers((current) => [
          payload.user,
          ...current.filter((item) => item.email !== payload.user.email),
        ].sort((a, b) => a.email.localeCompare(b.email)));
      }
      showMessage(
        action === 'approve'
          ? `${requestEmail} 계정을 승인했습니다.`
          : `${requestEmail} 신청을 거절했습니다.`,
        'success',
      );
    } catch (error) {
      showMessage(error instanceof Error ? error.message : '신청을 처리하지 못했습니다.', 'error');
    } finally {
      setProcessingEmail('');
    }
  };

  const remove = async (userEmail: string) => {
    if (!window.confirm(`${userEmail} 계정을 삭제하시겠습니까?`)) return;
    const response = await fetch('/api/iso/auth/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail }),
    });
    const payload = await response.json();
    if (!response.ok) {
      showMessage(payload.error || '사용자를 삭제하지 못했습니다.', 'error');
      return;
    }
    setUsers((current) => current.filter((item) => item.email !== userEmail));
    setInvitations((current) => current.filter((item) => item.email !== userEmail));
    showMessage(`${userEmail} 계정을 삭제했습니다.`, 'success');
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Access administration</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">팀원 계정 관리</h2>
        <p className="mt-1 text-sm text-slate-600">
          LRQA 팀원의 사용 신청을 검토하고 계정을 관리합니다.
        </p>
      </div>

      {message && (
        <p
          role={messageTone === 'error' ? 'alert' : 'status'}
          className={`mb-5 rounded-md border px-4 py-3 text-sm font-semibold ${
            messageTone === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-teal-200 bg-teal-50 text-teal-900'
          }`}
        >
          {message}
        </p>
      )}

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="font-bold text-slate-900">사용 승인 대기 ({pendingRequests.length})</h3>
            <p className="mt-1 text-sm text-slate-600">
              신청자의 LRQA 재직 여부를 확인한 뒤 승인해 주세요. 비밀번호는 화면에 표시되지 않습니다.
            </p>
          </div>
          <a
            href="/iso/request-access"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            신청 화면 열기
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600">
              <tr>
                <th className="px-5 py-3">신청자</th>
                <th className="px-5 py-3">LRQA 이메일</th>
                <th className="px-5 py-3">신청 일시</th>
                <th className="px-5 py-3 text-right">처리</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((item) => (
                <tr key={item.email}>
                  <td className="border-t border-slate-100 px-5 py-3 font-semibold">{item.displayName}</td>
                  <td className="border-t border-slate-100 px-5 py-3">{item.email}</td>
                  <td className="border-t border-slate-100 px-5 py-3 text-slate-600">{formatDate(item.requestedAt)}</td>
                  <td className="border-t border-slate-100 px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => review(item.email, 'reject')}
                        disabled={processingEmail === item.email}
                        className="min-h-9 rounded-md border border-slate-300 px-3 font-bold text-slate-700 disabled:opacity-50"
                      >
                        거절
                      </button>
                      <button
                        type="button"
                        onClick={() => review(item.email, 'approve')}
                        disabled={processingEmail === item.email}
                        className="min-h-9 rounded-md bg-teal-700 px-4 font-bold text-white disabled:opacity-50"
                      >
                        {processingEmail === item.email ? '처리 중...' : '승인'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingRequests.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                    승인 대기 중인 사용 신청이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="font-bold text-slate-900">관리자 직접 초대</h3>
          <p className="mt-1 text-sm text-slate-600">
            필요한 경우 관리자가 먼저 초대 링크를 만들어 전달할 수도 있습니다.
          </p>
        </div>
        <form onSubmit={invite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="invite-email" className="mb-1 block text-sm font-semibold text-slate-700">팀원 LRQA 이메일</label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@lrqa.com"
              pattern=".+@lrqa\.com"
              className="w-full rounded-md border border-slate-300 px-3 py-2.5"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-11 rounded-md bg-slate-900 px-5 font-bold text-white disabled:opacity-60"
          >
            {submitting ? '생성 중...' : '초대 링크 생성'}
          </button>
        </form>
        {setupUrl && (
          <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-4">
            <p className="text-sm font-bold text-teal-900">이 링크를 팀원에게 전달하세요. 링크는 7일간 유효합니다.</p>
            <div className="mt-2 flex gap-2">
              <input readOnly value={setupUrl} className="min-w-0 flex-1 rounded border border-teal-300 bg-white px-3 py-2 text-sm" />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(setupUrl)}
                className="rounded-md bg-teal-700 px-4 text-sm font-bold text-white"
              >
                복사
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-bold text-slate-900">등록된 팀원 ({users.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600">
              <tr>
                <th className="px-5 py-3">팀원</th>
                <th className="px-5 py-3">이메일</th>
                <th className="px-5 py-3">등록일</th>
                <th className="px-5 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.email}>
                  <td className="border-t border-slate-100 px-5 py-3 font-semibold">{user.displayName || '-'}</td>
                  <td className="border-t border-slate-100 px-5 py-3">{user.email}</td>
                  <td className="border-t border-slate-100 px-5 py-3">{formatDate(user.createdAt)}</td>
                  <td className="border-t border-slate-100 px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => remove(user.email)}
                      className="rounded border border-red-200 px-3 py-1.5 font-bold text-red-700"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-500">등록된 팀원이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {(invitations.length > 0 || reviewedRequests.length > 0) && (
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {reviewedRequests.length > 0 && (
            <div className="rounded-md border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900">최근 처리 내역</h3>
              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {reviewedRequests.map((item) => (
                  <li key={`${item.email}-${item.requestedAt}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span><strong>{item.displayName}</strong> · {item.email}</span>
                    <span className={item.status === 'approved' ? 'font-bold text-teal-700' : 'font-bold text-slate-500'}>
                      {item.status === 'approved' ? '승인' : '거절'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {invitations.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-bold text-amber-900">초대 설정 대기 ({invitations.length})</h3>
              <ul className="mt-3 space-y-2 text-sm text-amber-900">
                {invitations.map((item) => (
                  <li key={item.email} className="flex flex-wrap justify-between gap-2">
                    <span className="font-semibold">{item.email}</span>
                    <span>{formatDate(item.expiresAt)} 만료</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
