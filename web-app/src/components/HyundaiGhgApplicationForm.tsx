'use client';

import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import HyundaiGhgFields from './HyundaiGhgFields';
import { createHyundaiGhgInput, customerTypeLabel, parseHyundaiGhgInput, type CustomerType } from '@/lib/hyundai-ghg';

export default function HyundaiGhgApplicationForm({ customerType }: { customerType: CustomerType }) {
  const [form, setForm] = useState(() => createHyundaiGhgInput(customerType));
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try {
      const input = parseHyundaiGhgInput(form);
      const response = await fetch('/api/hyundai-ghg/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || '신청서를 제출하지 못했습니다.');
      setReference(payload.reference);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (caught) { setError(caught instanceof Error ? caught.message : '제출하지 못했습니다. 입력 내용은 유지됩니다. 다시 시도해 주세요.'); }
    finally { setSaving(false); }
  }
  return <main className="min-h-screen bg-[#eef2f5] pb-16 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-5"><Image src="/lrqa-logo.png" width={42} height={42} alt="LRQA" /><div><p className="text-xs font-bold tracking-wide text-teal-700">LRQA KOREA</p><p className="text-sm font-semibold">현대차 협력사 GHG검증 신청</p></div></div></header>
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-5">
      {reference ? <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm" aria-live="polite"><div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-teal-100 text-xl text-teal-800">✓</div><h1 className="text-2xl font-bold">신청서가 접수되었습니다.</h1><p className="mt-4 text-sm text-slate-600">담당자가 신청 내용을 검토한 후 입력하신 연락처로 안내드립니다.</p><div className="mt-6 rounded-lg bg-slate-100 p-5"><p className="text-xs text-slate-600">접수번호 · {customerTypeLabel(customerType)}</p><p className="mt-2 break-all text-lg font-bold text-teal-800">{reference}</p></div><p className="mt-4 text-xs text-slate-500">접수 확인을 위해 접수번호를 보관해 주세요.</p></section> : <>
        <div className="mb-6"><p className="text-xs font-bold tracking-widest text-teal-700">GHG VERIFICATION</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">{customerTypeLabel(customerType)} {customerType === 'existing' ? '간편 신청' : '검증 신청'}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{customerType === 'existing' ? '이전에 LRQA를 통해 온실가스 검증을 받으신 업체를 위한 신청서입니다. 기본정보와 전년 대비 변동사항을 알려 주세요.' : 'LRQA 온실가스 검증을 처음 신청하는 현대차 협력사를 위한 신청서입니다. 검증 범위와 대상 사업장 정보를 알려 주세요.'}</p></div>
        <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><p className="mb-6 text-xs text-slate-500">* 표시는 필수 입력 항목입니다.</p><HyundaiGhgFields value={form} onChange={setForm} disabled={saving} showConsent />{error && <p role="alert" className="mt-5 rounded-lg bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}<button disabled={saving} className="mt-6 min-h-12 w-full rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-teal-900 disabled:opacity-60">{saving ? '접수 중…' : '검증 신청서 제출'}</button></form>
      </>}
      <footer className="mt-7 text-center text-xs text-slate-500">LRQA Korea · Commercial Operations</footer>
    </div>
  </main>;
}
