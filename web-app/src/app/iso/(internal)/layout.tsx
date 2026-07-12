import Link from 'next/link';
import { requireIsoAdmin } from '@/lib/isoAuth';

export default async function IsoInternalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireIsoAdmin('/iso/applications');

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs font-bold text-teal-700">LRQA INTERNAL</p>
            <h1 className="text-lg font-bold text-slate-900">ISO 신청·견적 관리</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-1 text-sm font-semibold">
            <Link href="/iso/applications" className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">신청서 접수함</Link>
            <Link href="/iso/documents" className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">생성 문서</Link>
            <Link href="/iso" className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">빈 견적 작성</Link>
            <form action="/api/iso/auth/logout" method="post">
              <button type="submit" className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50">로그아웃</button>
            </form>
          </nav>
          <p className="w-full text-right text-xs text-slate-500">{session.username} 계정</p>
        </div>
      </header>
      {children}
    </div>
  );
}
