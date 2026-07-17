import LoginForm from './LoginForm';

export default async function IsoLoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const params = await searchParams;
  const requestedReturnTo = params.returnTo || '';
  const returnTo = requestedReturnTo.startsWith('/') &&
    !requestedReturnTo.startsWith('//') &&
    !requestedReturnTo.startsWith('/iso/login') &&
    !requestedReturnTo.startsWith('/api/')
    ? requestedReturnTo
    : '/';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-sm font-bold text-teal-700">LRQA INTERNAL</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">LRQA 업무 포털</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">관리자는 기존 ID로, 초대받은 팀원은 @lrqa.com 이메일과 설정한 비밀번호로 로그인합니다.</p>
        <LoginForm returnTo={returnTo} />
      </section>
    </main>
  );
}
