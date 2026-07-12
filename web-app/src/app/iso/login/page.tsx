import Link from 'next/link';
import LoginForm from './LoginForm';

export default async function IsoLoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const params = await searchParams;
  const returnTo = params.returnTo?.startsWith('/iso') && !params.returnTo.startsWith('//') ? params.returnTo : '/iso/applications';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-sm font-bold text-teal-700">LRQA INTERNAL</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">ISO 신청서 관리</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">고객 신청서와 견적·계약 문서를 다루는 내부 업무 화면입니다.</p>
        <LoginForm returnTo={returnTo} />
        <Link href="/iso" className="mt-5 block text-center text-sm font-semibold text-slate-500 hover:text-slate-800">빈 견적서 작성 화면으로 돌아가기</Link>
      </section>
    </main>
  );
}
