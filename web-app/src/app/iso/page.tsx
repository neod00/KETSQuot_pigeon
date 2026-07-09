'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { generateIsoQuoteDocx } from '../../utils/isoQuoteDocxGenerator';

const DEFAULT_RATE = 1300000;
const DEFAULT_EXPENSES = 300000;
const DEFAULT_CERT_FEE = 450000;

type StandardKey = 'ISO 9001' | 'ISO 14001' | 'ISO 45001' | 'ISO 27001' | 'ISO 50001';
type DocumentType = 'quote' | 'contract';

const ISO_STANDARDS: StandardKey[] = ['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 27001', 'ISO 50001'];

const parseNumber = (value: string) => {
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) => `${Math.round(value || 0).toLocaleString()}원`;
const formatDays = (value: number) => `${(Number.isFinite(value) ? value : 0).toFixed(1)} MD`;

const formatDateKorean = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
};

const auditTypeLabel = (value: string) => {
  const labels: Record<string, string> = {
    new_certification: '신규 인증',
    renewal: '갱신 인증',
    transfer: '전환 인증',
    scope_extension: '범위 확장',
    renewal_or_transfer_review: '갱신 인증',
    existing_certification_review: '갱신 인증',
  };
  return labels[value] || value || '신규 인증';
};

const toInputNumber = (value: unknown, fallback: string) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
};

const isRenewalQuote = (auditType: string) => auditType.includes('갱신');
const isSurveillanceQuote = (auditType: string) => auditType.includes('사후');
const isCurrentCycleQuote = (auditType: string) => isRenewalQuote(auditType) || isSurveillanceQuote(auditType);

export default function ISOQuotePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [documentType, setDocumentType] = useState<DocumentType>('quote');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [docId, setDocId] = useState(() => `OPP-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`);
  const [issueDate, setIssueDate] = useState(today);
  const [auditType, setAuditType] = useState('신규 인증');
  const [standards, setStandards] = useState<StandardKey[]>(['ISO 9001']);
  const [scope, setScope] = useState('경영시스템 인증심사');
  const [siteName, setSiteName] = useState('본사');
  const [siteAddress, setSiteAddress] = useState('');
  const [siteCount, setSiteCount] = useState('1');
  const [employeeCount, setEmployeeCount] = useState('50');
  const [stage1Days, setStage1Days] = useState('1.0');
  const [stage2Days, setStage2Days] = useState('2.0');
  const [surveillanceDays, setSurveillanceDays] = useState('1.0');
  const [recertDays, setRecertDays] = useState('2.0');
  const [dayRate, setDayRate] = useState(DEFAULT_RATE.toLocaleString());
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES.toLocaleString());
  const [certFee, setCertFee] = useState(DEFAULT_CERT_FEE.toLocaleString());
  const [discount, setDiscount] = useState('0');
  const [vatType, setVatType] = useState<'별도' | '포함'>('별도');
  const [contractYears, setContractYears] = useState('3');
  const [paymentTerms, setPaymentTerms] = useState('송장 일자로부터 30일 이내 현금으로 지급');
  const [validity, setValidity] = useState('1개월');
  const [importMessage, setImportMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if (!data) return;

    try {
      const imported = JSON.parse(decodeURIComponent(data));
      setCompanyName(imported.companyName || '');
      setContactPerson(imported.contactPerson || '');
      setAuditType(auditTypeLabel(imported.auditType));
      if (Array.isArray(imported.standards)) {
        const importedStandards = imported.standards.filter((item: string) => ISO_STANDARDS.includes(item as StandardKey)) as StandardKey[];
        if (importedStandards.length > 0) setStandards(importedStandards);
      }
      setScope(imported.scope || '경영시스템 인증심사');
      setSiteName(imported.siteName || '본사');
      setSiteAddress(imported.siteAddress || '');
      setSiteCount(toInputNumber(imported.siteCount, '1'));
      setEmployeeCount(toInputNumber(imported.employeeCount, '50'));
      setStage1Days(toInputNumber(imported.stage1Days, '1.0'));
      setStage2Days(toInputNumber(imported.stage2Days, '2.0'));
      setSurveillanceDays(toInputNumber(imported.surveillanceDays, '1.0'));
      setRecertDays(toInputNumber(imported.recertDays, '2.0'));
      setDayRate(toInputNumber(imported.dayRate, DEFAULT_RATE.toLocaleString()));
      setExpenses(toInputNumber(imported.expenses, DEFAULT_EXPENSES.toLocaleString()));
      setCertFee(toInputNumber(imported.certFee, DEFAULT_CERT_FEE.toLocaleString()));
      setDiscount(toInputNumber(imported.discount, '0'));
      setVatType(imported.vatType === 'included' || imported.vatType === '포함' ? '포함' : '별도');
      setContractYears(String(imported.contractYears || '3'));
      setPaymentTerms(imported.paymentTerms || '송장 일자로부터 30일 이내 현금으로 지급');
      setImportMessage('Intake에서 전달된 ISO 입력값을 불러왔습니다. 고객 발송 전 심사일수, 단가, 경비, 할인, VAT를 검토하세요.');
    } catch {
      setImportMessage('전달된 Intake 데이터를 읽지 못했습니다. URL data 파라미터를 확인하세요.');
    }
  }, []);

  const rate = parseNumber(dayRate);
  const expensesValue = parseNumber(expenses);
  const hasExpenses = expenses.trim() !== '' && expensesValue > 0;
  const certFeeValue = parseNumber(certFee);
  const discountValue = parseNumber(discount);
  const stage1 = parseFloat(stage1Days) || 0;
  const stage2 = parseFloat(stage2Days) || 0;
  const surveillance = parseFloat(surveillanceDays) || 0;
  const recert = parseFloat(recertDays) || 0;
  const initialDays = stage1 + stage2;
  const currentCycleQuote = isCurrentCycleQuote(auditType);
  const renewalQuote = isRenewalQuote(auditType);
  const activeAuditDays = currentCycleQuote ? (renewalQuote ? recert : surveillance) : initialDays;

  const quote = useMemo(() => {
    const initialAuditFee = initialDays * rate;
    const annualSurveillanceFee = surveillance * rate;
    const recertificationFee = recert * rate;
    const activeAuditFee = currentCycleQuote ? (renewalQuote ? recertificationFee : annualSurveillanceFee) : initialAuditFee;
    const subtotal = activeAuditFee + (hasExpenses ? expensesValue : 0) + certFeeValue;
    const discounted = Math.max(subtotal - discountValue, 0);
    const vat = vatType === '포함' ? Math.round(discounted / 11) : Math.round(discounted * 0.1);
    const total = vatType === '포함' ? discounted : discounted + vat;

    return { initialAuditFee, annualSurveillanceFee, recertificationFee, activeAuditFee, subtotal, discounted, vat, total };
  }, [certFeeValue, currentCycleQuote, discountValue, expensesValue, hasExpenses, initialDays, rate, recert, renewalQuote, surveillance, vatType]);

  const toggleStandard = (standard: StandardKey) => {
    setStandards(current => {
      if (current.includes(standard)) {
        const next = current.filter(item => item !== standard);
        return next.length > 0 ? next : current;
      }
      return [...current, standard];
    });
  };

  const handleDownloadWord = async () => {
    if (documentType === 'contract') {
      alert('계약서 서식이 아직 제공되지 않았습니다. 서식이 추가되면 같은 화면에서 계약서를 생성하도록 연결하겠습니다.');
      return;
    }

    try {
      await generateIsoQuoteDocx({
        companyName,
        contactPerson,
        docId,
        issueDate,
        auditType,
        standards,
        scope,
        siteName,
        siteAddress,
        employeeCount,
        stage1Days: stage1,
        stage2Days: stage2,
        surveillanceDays: surveillance,
        recertDays: recert,
        dayRate: rate,
        expenses: hasExpenses ? expensesValue : 0,
        certFee: certFeeValue,
        discount: discountValue,
        vatType,
        contractYears,
        paymentTerms,
        validity,
      });
    } catch (error) {
      console.error(error);
      alert('ISO 견적서 Word 파일 생성 중 오류가 발생했습니다.');
    }
  };

  const handlePrint = () => window.print();
  const documentTitle = documentType === 'quote' ? 'ISO 인증 심사 견적서' : 'ISO 인증 계약서';
  const totalNote = hasExpenses ? `VAT ${vatType}` : `제경비/VAT ${vatType}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center">
      <div className="no-print w-full max-w-6xl p-6 sm:p-8 bg-white shadow-lg my-8 rounded-xl border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">LRQA ISO 견적/계약서 생성기</h1>
            <p className="mt-1 text-sm text-slate-500">문서 종류를 선택한 뒤 ISO 심사 비용 정보를 입력하고 Word 또는 PDF로 출력합니다.</p>
          </div>
          <Link href="/" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            포털로 돌아가기
          </Link>
        </div>

        {importMessage && <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">{importMessage}</div>}

        <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-bold text-slate-700">문서 종류</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className={`cursor-pointer rounded-lg border p-4 ${documentType === 'quote' ? 'border-blue-500 bg-white ring-2 ring-blue-100' : 'border-slate-200 bg-white'}`}>
              <input className="mr-2" type="radio" name="documentType" checked={documentType === 'quote'} onChange={() => setDocumentType('quote')} />
              <span className="font-bold">견적서</span>
              <span className="ml-2 text-xs text-slate-500">제공된 LRQA 심사 견적서 Word 서식 사용</span>
            </label>
            <label className={`cursor-pointer rounded-lg border p-4 ${documentType === 'contract' ? 'border-blue-500 bg-white ring-2 ring-blue-100' : 'border-slate-200 bg-white'}`}>
              <input className="mr-2" type="radio" name="documentType" checked={documentType === 'contract'} onChange={() => setDocumentType('contract')} />
              <span className="font-bold">계약서</span>
              <span className="ml-2 text-xs text-slate-500">서식 제공 후 활성화 예정</span>
            </label>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">1. 기본 정보</h2>
            <TextInput label="고객사명" value={companyName} onChange={setCompanyName} />
            <TextInput label="담당자명" value={contactPerson} onChange={setContactPerson} />
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="문서 번호" value={docId} onChange={setDocId} />
              <div>
                <label className="block text-sm font-medium text-slate-600">발행 일자</label>
                <input type="date" className="mt-1 w-full rounded-md border p-2" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">심사 유형</label>
              <select className="mt-1 w-full rounded-md border p-2" value={auditType} onChange={e => setAuditType(e.target.value)}>
                <option>신규 인증</option>
                <option>갱신 인증</option>
                <option>전환 인증</option>
                <option>범위 확장</option>
                <option>사후 심사</option>
              </select>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">2. 인증 범위</h2>
            <div>
              <label className="block text-sm font-medium text-slate-600">ISO 표준</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {ISO_STANDARDS.map(standard => (
                  <label key={standard} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    <input type="checkbox" checked={standards.includes(standard)} onChange={() => toggleStandard(standard)} />
                    {standard}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">인증 범위</label>
              <textarea className="mt-1 h-20 w-full rounded-md border p-2" value={scope} onChange={e => setScope(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="사업장명" value={siteName} onChange={setSiteName} />
              <TextInput label="사업장 수" value={siteCount} onChange={setSiteCount} />
            </div>
            <TextInput label="사업장 주소" value={siteAddress} onChange={setSiteAddress} />
            <TextInput label="직원 수" value={employeeCount} onChange={setEmployeeCount} />
          </section>
        </div>

        <section className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold text-slate-800">3. 심사일수 및 비용</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <NumberInput label="Stage 1 일수" value={stage1Days} onChange={setStage1Days} />
            <NumberInput label="Stage 2 일수" value={stage2Days} onChange={setStage2Days} />
            <NumberInput label="사후심사 일수/년" value={surveillanceDays} onChange={setSurveillanceDays} />
            <NumberInput label="갱신심사 일수" value={recertDays} onChange={setRecertDays} />
            <NumberInput label="Manday 단가" value={dayRate} onChange={setDayRate} />
            <NumberInput label="제경비/출장비" value={expenses} onChange={setExpenses} />
            <NumberInput label="인증비/관리비" value={certFee} onChange={setCertFee} />
            <NumberInput label="할인 금액" value={discount} onChange={setDiscount} />
          </div>
          <div className="mt-4 flex flex-wrap gap-5">
            <label className="inline-flex items-center gap-2"><input type="radio" name="isoVatType" checked={vatType === '별도'} onChange={() => setVatType('별도')} /> VAT 별도</label>
            <label className="inline-flex items-center gap-2"><input type="radio" name="isoVatType" checked={vatType === '포함'} onChange={() => setVatType('포함')} /> VAT 포함</label>
          </div>
        </section>

        <section className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold text-slate-800">4. 조건</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-600">계약 기간</label>
              <select className="mt-1 w-full rounded-md border p-2" value={contractYears} onChange={e => setContractYears(e.target.value)}>
                <option value="1">1년</option>
                <option value="3">3년</option>
              </select>
            </div>
            <TextInput label="지급 조건" value={paymentTerms} onChange={setPaymentTerms} />
            <TextInput label="견적 유효기간" value={validity} onChange={setValidity} />
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
          <button onClick={handleDownloadWord} className="rounded-lg bg-blue-700 px-4 py-3 font-bold text-white shadow-md hover:bg-blue-800">
            {documentType === 'quote' ? 'Word 견적서 다운로드' : '계약서 서식 준비 중'}
          </button>
          <button onClick={handlePrint} className="rounded-lg border border-slate-300 px-4 py-3 font-bold text-slate-700 hover:bg-slate-50">
            현재 미리보기 인쇄 / PDF 저장
          </button>
        </div>
      </div>

      <div className="invoice-container mb-20 bg-white shadow-2xl" style={{ width: '210mm', minHeight: '297mm' }}>
        <div className="page-content" style={{ padding: '18mm 15mm 42mm' }}>
          <HeaderLine />
          <div style={{ textAlign: 'center', margin: '22px 0' }}>
            <h1 style={{ fontSize: '23pt', fontWeight: 'bold' }}>{documentTitle}</h1>
            {documentType === 'contract' && <p style={{ color: '#64748b' }}>계약서 Word 서식은 추후 제공 예정입니다.</p>}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
            <tbody>
              <tr><td style={{ width: '60px' }}>수신:</td><td style={{ fontWeight: 'bold' }}>{companyName || '고객사명'}</td><td style={{ textAlign: 'right' }}>{docId}</td></tr>
              <tr><td>참조:</td><td>{contactPerson || '담당자'} 귀하</td><td></td></tr>
              <tr><td>발신:</td><td>로이드인증원(LRQA)</td><td style={{ textAlign: 'right' }}>{formatDateKorean(issueDate)}</td></tr>
            </tbody>
          </table>
          <hr style={{ border: '0.5pt solid black' }} />

          <SectionTitle number="1" title="인증심사 범위" />
          <InfoTable rows={[
            ['적용 표준', standards.join(', ')],
            ['심사 유형', auditType],
            ['인증 범위', scope],
            ['사업장', `${siteName || '본사'} / ${siteCount || '1'}개`],
            ['사업장 주소', siteAddress || '-'],
            ['직원 수', `${employeeCount || '0'}명`],
            ['계약 기간', `${contractYears}년`],
          ]} />

          <SectionTitle number="2" title="심사 비용" />
          <table style={{ width: '100%', border: '1.2pt solid black', borderCollapse: 'collapse', textAlign: 'center', fontSize: '9.5pt' }}>
            <thead><tr style={{ background: '#f3f4f6' }}><th style={cellHeader}>구분</th><th style={cellHeader}>심사일수</th><th style={cellHeader}>금액</th><th style={cellHeader}>비고</th></tr></thead>
            <tbody>
              {currentCycleQuote ? (
                <QuoteRow
                  label={renewalQuote ? '갱신심사' : '사후관리 심사'}
                  days={activeAuditDays}
                  amount={renewalQuote ? quote.recertificationFee : quote.annualSurveillanceFee}
                  note={renewalQuote ? '3년 주기 갱신' : '12개월 주기'}
                />
              ) : (
                <QuoteRow
                  label="최초 인증심사(Stage 1 + Stage 2)"
                  days={initialDays}
                  amount={quote.initialAuditFee}
                  note={`Stage 1 ${stage1Days} MD / Stage 2 ${stage2Days} MD, 사후관리 ${surveillanceDays} MD`}
                />
              )}
              {hasExpenses && <SimpleAmountRow label="제경비/출장비" amount={expensesValue} />}
              <SimpleAmountRow label="인증비/관리비" amount={certFeeValue} />
              {discountValue > 0 && <SimpleAmountRow label="할인 금액" amount={-discountValue} />}
              <tr style={{ background: '#e0ffff', fontWeight: 'bold' }}><td style={cell}>합계</td><td style={cell}>{formatDays(activeAuditDays)}</td><td style={amountCell}>{formatCurrency(quote.discounted)}</td><td style={cell}>{totalNote}</td></tr>
              <tr style={{ background: '#000080', color: 'white', fontWeight: 'bold' }}><td style={cell}>최종 금액</td><td style={cell}>{formatDays(activeAuditDays)}</td><td style={amountCell}>{formatCurrency(quote.total)}</td><td style={cell}>{vatType === '별도' ? `VAT ${formatCurrency(quote.vat)} 별도` : 'VAT 포함'}</td></tr>
            </tbody>
          </table>

          <SectionTitle number="3" title="조건" />
          <div style={{ fontSize: '10pt', lineHeight: '1.55' }}>
            <p>1) 본 견적은 제공된 정보에 근거한 제안이며, 최종 심사일수와 비용은 신청서 검토 및 계약 검토 결과에 따라 조정될 수 있습니다.</p>
            <p>2) 지급 조건은 {paymentTerms}입니다.</p>
            <p>3) 견적 유효기간은 발행일로부터 {validity}입니다.</p>
            <p>4) 심사는 LRQA의 공평성 및 인증 절차에 따라 수행되며, 본 문서는 인증 결과를 보장하지 않습니다.</p>
          </div>
        </div>
        <Footer />
      </div>

      <style jsx>{`
        .invoice-container { position: relative; }
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
          .no-print { display: none !important; }
          .invoice-container { margin: 0 !important; box-shadow: none !important; width: 210mm !important; }
        }
      `}</style>
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><label className="block text-sm font-medium text-slate-600">{label}</label><input className="mt-1 w-full rounded-md border p-2" value={value} onChange={e => onChange(e.target.value)} /></div>;
}

function NumberInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><label className="block text-xs font-medium text-slate-500">{label}</label><input className="mt-1 w-full rounded border p-2" value={value} onChange={e => onChange(e.target.value)} /></div>;
}

function HeaderLine() {
  return <div style={{ textAlign: 'right' }}><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAqQAAAAECAYAAABYxS1uAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABFSURBVGhD7daxDcAwDANB7eUdPWJWcQxIRQq1SnUPXMcBGGs/BwAA/hTfugEAAEyqK5p1AwAAmFRXNOsGAAAwqa7oLeIFcQTbLvA45s8AAAAASUVORK5CYII=" width="100%" height="4" alt="" /></div>;
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return <p style={{ margin: '18px 0 8px', fontWeight: 'bold', fontSize: '11pt' }}>({number}) {title}</p>;
}

function InfoTable({ rows }: { rows: string[][] }) {
  return <table style={{ width: '100%', border: '1.2pt solid black', borderCollapse: 'collapse', fontSize: '9.5pt' }}><tbody>{rows.map(([label, value]) => <tr key={label}><td style={{ ...cell, width: '28%', background: '#f3f4f6', fontWeight: 'bold' }}>{label}</td><td style={{ ...cell, textAlign: 'left' }}>{value}</td></tr>)}</tbody></table>;
}

const cell: React.CSSProperties = { border: '0.5pt solid black', padding: '6px' };
const cellHeader: React.CSSProperties = { ...cell, fontWeight: 'bold' };
const amountCell: React.CSSProperties = { ...cell, textAlign: 'right', paddingRight: '8px' };

function QuoteRow({ label, days, amount, note }: { label: string; days: number; amount: number; note: string }) {
  return <tr><td style={cell}>{label}</td><td style={cell}>{formatDays(days)}</td><td style={amountCell}>{formatCurrency(amount)}</td><td style={cell}>{note}</td></tr>;
}

function SimpleAmountRow({ label, amount }: { label: string; amount: number }) {
  return <tr><td style={cell}>{label}</td><td style={cell}>-</td><td style={amountCell}>{formatCurrency(amount)}</td><td style={cell}></td></tr>;
}

function Footer() {
  return <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '35mm', background: 'white', borderTop: '1px solid #ddd', padding: '10px 15mm 0', boxSizing: 'border-box' }}><table style={{ width: '100%' }}><tbody><tr><td style={{ width: '85px', verticalAlign: 'middle', padding: '5px 0' }}><img src="https://www.lrqa.com/cdn-cgi/image/width=300,format=auto/globalassets/logos/lrqa-white-logo---dark-background-cropped.png" style={{ width: '85px', height: 'auto', display: 'block', backgroundColor: '#000', padding: '5px' }} alt="LRQA Logo" /></td><td style={{ verticalAlign: 'top', paddingLeft: '10px' }}><p style={{ margin: 0, fontSize: '11pt', color: '#3b8ede', fontWeight: 'bold' }}>YOUR FUTURE. OUR FOCUS.</p><p style={{ margin: 0, fontSize: '8pt' }}>for more information or call <strong>+82 (0)2 736 6231</strong></p></td><td style={{ textAlign: 'right', verticalAlign: 'top', fontSize: '9pt', color: '#666' }}><p style={{ margin: 0, fontWeight: 'bold' }}>로이드인증원</p><p style={{ margin: 0 }}>서울특별시 중구 소월로 2길 30 T타워 2층</p></td></tr></tbody></table></div>;
}