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
        <p className="mt-2 text-sm leading-6 text-slate-600">고객 정보와 견적·계약 문서를 다루는 내부 사용자 전용 화면입니다.</p>
        <LoginForm returnTo={returnTo} />
      </section>
    </main>
  );
}
