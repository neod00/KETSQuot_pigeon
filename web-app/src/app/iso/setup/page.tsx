import SetupForm from './SetupForm';

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-sm font-bold text-teal-700">LRQA INTERNAL</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">팀원 계정 설정</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">초대받은 LRQA 이메일 계정의 비밀번호를 설정합니다.</p>
        <SetupForm token={String(params.token || '')} />
      </section>
    </main>
  );
}
