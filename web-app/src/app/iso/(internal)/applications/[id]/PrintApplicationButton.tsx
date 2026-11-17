'use client';

export default function PrintApplicationButton() {
  return <button type="button" onClick={() => window.print()} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">신청서 인쇄 / PDF 저장</button>;
}
