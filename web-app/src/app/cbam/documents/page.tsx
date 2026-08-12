'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_CBAM_DAY_RATE,
  DEFAULT_CBAM_EXPENSES,
  clientTypeLabel,
  complexityLabel,
  formatKrw,
  serviceTypeLabel,
  type StoredCbamApplication,
} from '@/lib/cbam';

const cell: React.CSSProperties = { border: '0.5pt solid #475569', padding: '7px 8px', verticalAlign: 'top' };
const headingCell: React.CSSProperties = { ...cell, background: '#e2e8f0', fontWeight: 700 };

export default function CbamDocumentsPage() {
  const [application, setApplication] = useState<StoredCbamApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [documentType, setDocumentType] = useState<'quote' | 'contract'>('quote');
  const [quotedDays, setQuotedDays] = useState('0');
  const [dayRate, setDayRate] = useState(DEFAULT_CBAM_DAY_RATE.toLocaleString());
  const [expenses, setExpenses] = useState(DEFAULT_CBAM_EXPENSES.toLocaleString());
  const [discount, setDiscount] = useState('0');
  const [vatMode, setVatMode] = useState<'separate' | 'included'>('separate');
  const [validityDays, setValidityDays] = useState('30');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDocumentType(params.get('type') === 'contract' ? 'contract' : 'quote');
    const reference = params.get('ref');
    if (!reference) { setLoadError('신청서 접수번호가 없습니다.'); setLoading(false); return; }
    fetch(`/api/cbam/applications?ref=${encodeURIComponent(reference)}`, { cache: 'no-store' })
      .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.message || '신청서를 불러오지 못했습니다.'); return result.application as StoredCbamApplication; })
      .then(parsed => { setApplication(parsed); setQuotedDays(String(parsed.quotedDays)); })
      .catch(caught => setLoadError(caught instanceof Error ? caught.message : '신청서를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const cost = useMemo(() => {
    const days = Number(quotedDays.replace(/,/g, '')) || 0;
    const rate = Number(dayRate.replace(/,/g, '')) || 0;
    const expenseValue = Number(expenses.replace(/,/g, '')) || 0;
    const discountValue = Number(discount.replace(/,/g, '')) || 0;
    const subtotal = Math.max(days * rate + expenseValue - discountValue, 0);
    const vat = vatMode === 'included' ? Math.round(subtotal / 11) : Math.round(subtotal * 0.1);
    const total = vatMode === 'included' ? subtotal : subtotal + vat;
    return { days, rate, expenseValue, discountValue, subtotal, vat, total };
  }, [dayRate, discount, expenses, quotedDays, vatMode]);

  if (loading) return <main className="grid min-h-screen place-items-center bg-slate-100 p-6"><p className="font-bold text-slate-600">신청서 데이터를 불러오는 중...</p></main>;
  if (!application) return <main className="grid min-h-screen place-items-center bg-slate-100 p-6"><div className="max-w-lg rounded-2xl bg-white p-8 text-center shadow"><h1 className="text-2xl font-black">문서 데이터를 찾을 수 없습니다.</h1><p className="mt-3 text-slate-600">{loadError || '내부 관리 화면에서 신청서를 선택한 뒤 문서 생성을 실행해 주세요.'}</p><Link className="mt-6 inline-block rounded-lg bg-slate-950 px-4 py-3 font-bold text-white" href="/cbam/admin">내부 관리로 이동</Link></div></main>;

  const date = new Date().toISOString().slice(0, 10);
  const quoteNumber = application.reference.replace('CBAM-', 'Q-CBAM-');

  return (
    <main className="min-h-screen bg-slate-100 py-8 text-slate-950">
      <section className="no-print mx-auto mb-7 max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">Document workspace</p><h1 className="mt-1 text-2xl font-black">CBAM 견적·계약 문서 생성</h1></div><Link href="/cbam/admin" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold">내부 관리로 돌아가기</Link></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Control label="문서 종류"><select value={documentType} onChange={e => setDocumentType(e.target.value as 'quote' | 'contract')}><option value="quote">견적서</option><option value="contract">서비스 계약서</option></select></Control>
          <Control label="최종 검증일수"><input value={quotedDays} onChange={e => setQuotedDays(e.target.value)} /></Control>
          <Control label="MD 단가"><input value={dayRate} onChange={e => setDayRate(e.target.value)} /></Control>
          <Control label="제경비/출장비"><input value={expenses} onChange={e => setExpenses(e.target.value)} /></Control>
          <Control label="할인 금액"><input value={discount} onChange={e => setDiscount(e.target.value)} /></Control>
          <Control label="VAT"><select value={vatMode} onChange={e => setVatMode(e.target.value as 'separate' | 'included')}><option value="separate">별도</option><option value="included">포함</option></select></Control>
          <Control label="견적 유효기간(일)"><input value={validityDays} onChange={e => setValidityDays(e.target.value)} /></Control>
          <button onClick={() => window.print()} className="self-end rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-black text-white hover:bg-teal-800">인쇄 / PDF 저장</button>
        </div>
      </section>

      {documentType === 'quote'
        ? <QuoteDocument application={application} date={date} quoteNumber={quoteNumber} cost={cost} validityDays={validityDays} />
        : <ContractDocument application={application} date={date} quoteNumber={quoteNumber} cost={cost} />}

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .cbam-document { box-shadow: none !important; margin: 0 !important; break-after: page; }
        }
      `}</style>
    </main>
  );
}

type Cost = { days: number; rate: number; expenseValue: number; discountValue: number; subtotal: number; vat: number; total: number };

function QuoteDocument({ application, date, quoteNumber, cost, validityDays }: { application: StoredCbamApplication; date: string; quoteNumber: string; cost: Cost; validityDays: string }) {
  return <article className="cbam-document relative mx-auto min-h-[297mm] w-[210mm] bg-white px-[16mm] py-[16mm] shadow-2xl">
    <DocumentHeader eyebrow="CBAM SERVICES" title="CBAM 검증 서비스 견적서" number={quoteNumber} date={date} />
    <p className="mt-7 text-[10.5pt] leading-7"><strong>{application.companyName}</strong> {application.contactName} 귀하<br />귀 사가 제공한 CBAM 서비스 신청정보를 기준으로 아래와 같이 검증 서비스를 제안합니다.</p>
    <Section title="1. 고객 및 검증 범위" />
    <InfoTable rows={[
      ['고객 유형', clientTypeLabel(application.clientType)], ['요청 서비스', serviceTypeLabel(application.serviceType)],
      ['대상 연도', application.verificationYears.join(', ')], ['CBAM 상품', application.cbamGoods.join(', ') || '-'],
      ['CN 코드', application.cnCodes || '-'], ['검증 대상 사업장', application.sites || '-'],
    ]} />
    <Section title="2. 검증일수 산정" />
    <table className="w-full border-collapse text-center text-[9.5pt]"><thead><tr><th style={headingCell}>복잡도</th><th style={headingCell}>SARA / Stage 1</th><th style={headingCell}>Stage 2·3</th><th style={headingCell}>기술검토</th><th style={headingCell}>최종 견적일수</th></tr></thead><tbody><tr><td style={cell}>{complexityLabel(application.complexity)}</td><td style={cell}>{application.saraDays.toFixed(2)}</td><td style={cell}>{application.verificationDays.toFixed(2)}</td><td style={cell}>{application.technicalReviewDays.toFixed(2)}</td><td style={{...cell, fontWeight: 700, background: '#ccfbf1'}}>{cost.days.toFixed(1)} MD</td></tr></tbody></table>
    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-[8.8pt] leading-5"><strong>주요 산정근거</strong><ul className="mt-1 list-disc pl-5">{application.basis.slice(0, 5).map((item, index) => <li key={index}>{item}</li>)}</ul></div>
    <Section title="3. 비용" />
    <table className="w-full border-collapse text-[9.5pt]"><thead><tr><th style={headingCell}>구분</th><th style={headingCell}>수량</th><th style={headingCell}>단가</th><th style={headingCell}>금액</th></tr></thead><tbody><AmountRow label="CBAM 검증 서비스" quantity={`${cost.days.toFixed(1)} MD`} rate={cost.rate} amount={cost.days * cost.rate}/><AmountRow label="제경비/출장비" quantity="1식" amount={cost.expenseValue}/>{cost.discountValue > 0 && <AmountRow label="할인" quantity="-" amount={-cost.discountValue}/>}<tr className="font-bold"><td style={{...cell, background:'#e2e8f0'}} colSpan={3}>공급가액</td><td style={{...cell, textAlign:'right'}}>{formatKrw(cost.subtotal)}</td></tr><tr className="font-bold"><td style={{...cell, background:'#e2e8f0'}} colSpan={3}>VAT</td><td style={{...cell, textAlign:'right'}}>{formatKrw(cost.vat)}</td></tr><tr className="bg-slate-950 font-bold text-white"><td style={cell} colSpan={3}>총 계약금액</td><td style={{...cell, textAlign:'right'}}>{formatKrw(cost.total)}</td></tr></tbody></table>
    <Section title="4. 제안 조건" />
    <ol className="list-decimal space-y-1 pl-5 text-[9.5pt] leading-6"><li>본 견적은 신청 시 제공한 범위와 P1173 CBAM Verifier Day Framework에 따른 예비 산정입니다.</li><li>증빙팩, MMD, 공정 및 데이터 흐름 검토 결과에 따라 추가 일수와 비용이 발생할 수 있습니다.</li><li>독립 기술검토는 모든 CBAM 검증 업무의 필수 검토 단계로 산정에 포함했습니다.</li><li>실제 검증 서비스의 제공 여부는 적용 규정, 인정 범위 및 검증자 적격성 확인을 전제로 합니다.</li><li>본 견적의 유효기간은 발행일로부터 {validityDays}일이며 VAT는 상기 표와 같습니다.</li></ol>
    <DocumentFooter />
  </article>;
}

function ContractDocument({ application, date, quoteNumber, cost }: { application: StoredCbamApplication; date: string; quoteNumber: string; cost: Cost }) {
  return <article className="cbam-document relative mx-auto min-h-[297mm] w-[210mm] bg-white px-[16mm] py-[16mm] shadow-2xl">
    <DocumentHeader eyebrow="P1173 · SERVICE AGREEMENT" title="CBAM 검증 서비스 계약서" number={quoteNumber} date={date} />
    <p className="mt-7 text-[10pt] leading-6">본 계약은 로이드인증원(이하 “LRQA”)과 <strong>{application.companyName}</strong>(이하 “고객”) 간 CBAM 관련 {serviceTypeLabel(application.serviceType)} 제공 조건을 정합니다.</p>
    <Section title="1. 서비스 및 범위" /><InfoTable rows={[[ '서비스', serviceTypeLabel(application.serviceType) ], ['고객 유형', clientTypeLabel(application.clientType)], ['검증 범위', `${application.verificationYears.join(', ')}년 · ${application.cbamGoods.join(', ') || 'CBAM 상품'} · ${application.cnCodes || 'CN 코드 별도 확정'}`], ['사업장', application.sites || '계약 검토 시 확정'], ['보증수준', '합리적 보증(적용 규정 및 최종 계약 검토에 따름)'], ['검증일수', `${cost.days.toFixed(1)} MD (기술검토 포함)`], ['계약금액', `${formatKrw(cost.total)} (VAT 포함 최종액)`]]} />
    <Section title="2. 고객의 책임" /><ol className="list-decimal space-y-1 pl-5 text-[9.3pt] leading-5"><li>고객은 검증에 필요한 원자료, 계산자료, MMD, 통제절차 및 증빙팩을 정확하고 완전하게 제공합니다.</li><li>고객은 사업장, 생산공정, 모니터링 방법론 또는 제출 데이터에 중대한 변경이나 오류가 있음을 알게 된 경우 즉시 LRQA에 통지합니다.</li><li>고객은 필요한 정보, 담당자, 사업장과 계측설비에 합리적인 접근을 제공합니다.</li><li>증빙팩의 지연·누락, 예상보다 복잡한 데이터 흐름, 오류·부적합 또는 추가 확인이 필요한 경우 추가 검증일수와 비용이 발생할 수 있습니다.</li></ol>
    <Section title="3. LRQA의 책임" /><ol className="list-decimal space-y-1 pl-5 text-[9.3pt] leading-5"><li>LRQA는 적용 가능한 CBAM 규정과 내부 P1173 절차에 따라 문서·데이터 검토, 인터뷰, 현장 또는 원격 활동을 수행합니다.</li><li>해당 서비스가 정식 검증인 경우, 적용 요건 충족과 인정범위 확인을 전제로 검증보고서 및 검증의견서를 발행합니다.</li><li>LRQA는 적격한 인력을 배정하고 독립 기술검토를 수행합니다.</li></ol>
    <Section title="4. 일정·추가 업무·현장방문" /><p className="text-[9.3pt] leading-5">검증은 Stage 1(SARA 및 계획), Stage 2·3(검증 및 보고), 독립 기술검토 순으로 수행합니다. 현장방문 방식은 위험분석과 최신 적용 규정에 따라 결정합니다. 가상 방문 또는 현장방문 면제가 적용되더라도 충분한 증거와 합리적 보증을 확보하지 못하면 추가 활동을 요청할 수 있습니다.</p>
    <Section title="5. 비용 및 지급" /><p className="text-[9.3pt] leading-5">총 계약금액은 <strong>{formatKrw(cost.total)}</strong>이며, 청구서 발행일로부터 30일 이내 지급합니다. 별도 합의가 없는 출장 및 추가 업무 비용은 실제 발생액 또는 승인된 추가 견적에 따라 청구합니다.</p>
    <Section title="6. 비밀유지·책임·계약 종료" /><p className="text-[9.3pt] leading-5">양 당사자는 서비스 수행 과정에서 취득한 비공개 정보를 기밀로 유지합니다. 적용 법령, 인정기관 요구 또는 서비스 수행에 필요한 경우는 예외로 합니다. 계약 종료, 책임한도, 불가항력, 반부패, 준거법 등 일반 조건은 LRQA의 최종 승인본 서비스 계약 조건을 따릅니다.</p>
    <div className="mt-8 grid grid-cols-2 gap-8 text-[9pt]"><Signature title={`고객: ${application.companyName}`} /><Signature title="LRQA" /></div>
    <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-[8pt] leading-4 text-amber-900"><strong>내부 검토 주의:</strong> 본 화면은 P1173 Service Agreement의 핵심 업무조건을 반영한 생성 초안입니다. 서명 전 LRQA 승인권자와 법무/계약 담당자가 원본 영문 계약 조항, 인정 주체, 준거법 및 최신 CBAM 규정을 확인해야 합니다.</div>
    <DocumentFooter />
  </article>;
}

function DocumentHeader({ eyebrow, title, number, date }: { eyebrow: string; title: string; number: string; date: string }) { return <header><div className="h-1.5 w-full bg-teal-600"/><div className="mt-5 flex items-start justify-between gap-6"><div><p className="text-[8pt] font-bold tracking-[0.22em] text-teal-700">{eyebrow}</p><h1 className="mt-2 text-[24pt] font-black tracking-tight">{title}</h1></div><dl className="text-right text-[8.5pt] leading-5"><div><dt className="inline text-slate-500">문서번호 </dt><dd className="inline font-bold">{number}</dd></div><div><dt className="inline text-slate-500">발행일 </dt><dd className="inline font-bold">{date}</dd></div></dl></div></header>; }
function Section({ title }: { title: string }) { return <h2 className="mb-2 mt-6 border-l-4 border-teal-600 pl-2 text-[11pt] font-black">{title}</h2>; }
function InfoTable({ rows }: { rows: string[][] }) { return <table className="w-full border-collapse text-[9.3pt]"><tbody>{rows.map(([label,value]) => <tr key={label}><td style={{...headingCell, width:'25%'}}>{label}</td><td style={cell} className="whitespace-pre-line">{value}</td></tr>)}</tbody></table>; }
function AmountRow({ label, quantity, rate, amount }: { label: string; quantity: string; rate?: number; amount: number }) { return <tr><td style={cell}>{label}</td><td style={cell}>{quantity}</td><td style={{...cell, textAlign:'right'}}>{rate ? formatKrw(rate) : '-'}</td><td style={{...cell, textAlign:'right'}}>{formatKrw(amount)}</td></tr>; }
function Control({ label, children }: { label: string; children: React.ReactElement<{ className?: string }> }) { return <label className="block text-xs font-bold text-slate-600"><span>{label}</span><span className="mt-1 block">{children}</span><style jsx>{`input,select{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.6rem .7rem;color:#0f172a;background:white}`}</style></label>; }
function Signature({ title }: { title: string }) { return <div><p className="border-b border-slate-500 pb-2 font-bold">{title}</p><div className="mt-4 space-y-3"><p>성명/직위: __________________________</p><p>서명: ______________________________</p><p>일자: ______________________________</p></div></div>; }
function DocumentFooter() { return <footer className="absolute bottom-[10mm] left-[16mm] right-[16mm] border-t border-slate-300 pt-2 text-[7.5pt] text-slate-500"><div className="flex justify-between"><span className="font-bold text-teal-700">LRQA · YOUR FUTURE. OUR FOCUS.</span><span>로이드인증원 · lrqa.com</span></div></footer>; }
