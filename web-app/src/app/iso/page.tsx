'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { generateIsoQuoteDocx } from '../../utils/isoQuoteDocxGenerator';
import { generateIsoContractDocx } from '../../utils/isoContractDocxGenerator';

const DEFAULT_RATE = 1300000;
const DEFAULT_EXPENSES = 300000;
const DEFAULT_CERT_FEE = 450000;

type StandardKey = 'ISO 9001' | 'ISO 14001' | 'ISO 45001' | 'ISO 27001' | 'ISO 50001';
type DocumentType = 'quote' | 'contract';
type VatType = '별도' | '포함';
type CostField = 'stage1Days' | 'stage2Days' | 'surveillanceDays' | 'recertDays' | 'dayRate';

type StandardCostInput = Record<CostField, string>;

const ISO_STANDARDS: StandardKey[] = ['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 27001', 'ISO 50001'];

const STANDARD_VERSION: Record<StandardKey, string> = {
  'ISO 9001': 'ISO 9001:2015',
  'ISO 14001': 'ISO 14001:2015',
  'ISO 45001': 'ISO 45001:2018',
  'ISO 27001': 'ISO 27001:2022',
  'ISO 50001': 'ISO 50001:2018',
};

const defaultCostInput = (): StandardCostInput => ({
  stage1Days: '1.0',
  stage2Days: '2.0',
  surveillanceDays: '1.0',
  recertDays: '2.0',
  dayRate: DEFAULT_RATE.toLocaleString(),
});

const createDefaultStandardInputs = () =>
  ISO_STANDARDS.reduce((acc, standard) => {
    acc[standard] = defaultCostInput();
    return acc;
  }, {} as Record<StandardKey, StandardCostInput>);

const parseNumber = (value: string) => {
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDays = (value: string) => {
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

const auditPhrase = (auditType: string) => {
  if (auditType.includes('갱신')) return '갱신 심사';
  if (auditType.includes('전환') || auditType.includes('인수')) return '인수인증 심사';
  if (auditType.includes('범위')) return '범위 확장 심사';
  if (auditType.includes('사후')) return '사후관리 심사';
  return '최초 심사';
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
  const [standardInputs, setStandardInputs] = useState<Record<StandardKey, StandardCostInput>>(createDefaultStandardInputs);
  const [scope, setScope] = useState('경영시스템 인증심사');
  const [siteName, setSiteName] = useState('본사');
  const [siteAddress, setSiteAddress] = useState('');
  const [siteCount, setSiteCount] = useState('1');
  const [employeeCount, setEmployeeCount] = useState('50');
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES.toLocaleString());
  const [certFee, setCertFee] = useState(DEFAULT_CERT_FEE.toLocaleString());
  const [discount, setDiscount] = useState('0');
  const [vatType, setVatType] = useState<VatType>('별도');
  const [contractYears, setContractYears] = useState('3');
  const [paymentTerms, setPaymentTerms] = useState('송장 일자로부터 30일 이내 현금으로 지급');
  const [validity, setValidity] = useState('1개월');
  const [signerTitle, setSignerTitle] = useState('대표이사');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [importMessage, setImportMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if (!data) return;

    try {
      const imported = JSON.parse(decodeURIComponent(data));
      const importedStandards = Array.isArray(imported.standards)
        ? imported.standards.filter((item: string) => ISO_STANDARDS.includes(item as StandardKey)) as StandardKey[]
        : [];
      const nextStandards: StandardKey[] = importedStandards.length > 0 ? importedStandards : ['ISO 9001'];

      setCompanyName(imported.companyName || '');
      setContactPerson(imported.contactPerson || '');
      setAuditType(auditTypeLabel(imported.auditType));
      if (importedStandards.length > 0) setStandards(importedStandards);
      setScope(imported.scope || '경영시스템 인증심사');
      setSiteName(imported.siteName || '본사');
      setSiteAddress(imported.siteAddress || '');
      setSiteCount(toInputNumber(imported.siteCount, '1'));
      setEmployeeCount(toInputNumber(imported.employeeCount, '50'));
      setExpenses(toInputNumber(imported.expenses, DEFAULT_EXPENSES.toLocaleString()));
      setCertFee(toInputNumber(imported.certFee, DEFAULT_CERT_FEE.toLocaleString()));
      setDiscount(toInputNumber(imported.discount, '0'));
      setVatType(imported.vatType === 'included' || imported.vatType === '포함' ? '포함' : '별도');
      setContractYears(String(imported.contractYears || '3'));
      setPaymentTerms(imported.paymentTerms || '송장 일자로부터 30일 이내 현금으로 지급');
      setSignerTitle(imported.signerTitle || '대표이사');
      setCustomerPhone(imported.customerPhone || imported.phone || '');
      setCustomerEmail(imported.customerEmail || imported.email || '');
      setPostalCode(imported.postalCode || '');
      setBusinessRegistrationNumber(imported.businessRegistrationNumber || '');
      setBillingAddress(imported.billingAddress || '');
      setStandardInputs(current => {
        const next = { ...current };
        nextStandards.forEach((standard) => {
          const importedCost = Array.isArray(imported.standardCosts)
            ? imported.standardCosts.find((item: { standard?: string }) => item.standard === standard)
            : undefined;
          next[standard] = {
            stage1Days: toInputNumber(importedCost?.stage1Days ?? imported.stage1Days, '1.0'),
            stage2Days: toInputNumber(importedCost?.stage2Days ?? imported.stage2Days, '2.0'),
            surveillanceDays: toInputNumber(importedCost?.surveillanceDays ?? imported.surveillanceDays, '1.0'),
            recertDays: toInputNumber(importedCost?.recertDays ?? imported.recertDays, '2.0'),
            dayRate: toInputNumber(importedCost?.dayRate ?? imported.dayRate, DEFAULT_RATE.toLocaleString()),
          };
        });
        return next;
      });
      setImportMessage('Intake에서 전달된 ISO 입력값을 불러왔습니다. 고객 발송 전 규격별 심사일수, 단가, 경비, 할인, VAT를 검토하세요.');
    } catch {
      setImportMessage('전달된 Intake 데이터를 읽지 못했습니다. URL data 파라미터를 확인하세요.');
    }
  }, []);

  const expensesValue = parseNumber(expenses);
  const hasExpenses = expenses.trim() !== '' && expensesValue > 0;
  const certFeeValue = parseNumber(certFee);
  const discountValue = parseNumber(discount);
  const currentCycleQuote = isCurrentCycleQuote(auditType);
  const renewalQuote = isRenewalQuote(auditType);

  const standardCostRows = useMemo(() => standards.map((standard) => {
    const input = standardInputs[standard] || defaultCostInput();
    const stage1Days = parseDays(input.stage1Days);
    const stage2Days = parseDays(input.stage2Days);
    const surveillanceDays = parseDays(input.surveillanceDays);
    const recertDays = parseDays(input.recertDays);
    const dayRate = parseNumber(input.dayRate);
    const stage1Fee = stage1Days * dayRate;
    const stage2Fee = stage2Days * dayRate;
    const initialAuditFee = stage1Fee + stage2Fee;
    const annualSurveillanceFee = surveillanceDays * dayRate;
    const recertificationFee = recertDays * dayRate;
    const activeAuditDays = currentCycleQuote ? (renewalQuote ? recertDays : surveillanceDays) : stage1Days + stage2Days;
    const activeAuditFee = currentCycleQuote ? (renewalQuote ? recertificationFee : annualSurveillanceFee) : initialAuditFee;

    return {
      standard,
      label: `${STANDARD_VERSION[standard]} ${auditPhrase(auditType)}`,
      input,
      stage1Days,
      stage2Days,
      surveillanceDays,
      recertDays,
      dayRate,
      stage1Fee,
      stage2Fee,
      initialAuditFee,
      annualSurveillanceFee,
      recertificationFee,
      activeAuditDays,
      activeAuditFee,
    };
  }), [auditType, currentCycleQuote, renewalQuote, standardInputs, standards]);

  const totalAuditDays = standardCostRows.reduce((sum, row) => sum + row.activeAuditDays, 0);

  const quote = useMemo(() => {
    const auditFeeTotal = standardCostRows.reduce((sum, row) => sum + row.activeAuditFee, 0);
    const subtotal = auditFeeTotal + (hasExpenses ? expensesValue : 0) + certFeeValue;
    const discounted = Math.max(subtotal - discountValue, 0);
    const vat = vatType === '포함' ? Math.round(discounted / 11) : Math.round(discounted * 0.1);
    const total = vatType === '포함' ? discounted : discounted + vat;

    return { auditFeeTotal, subtotal, discounted, vat, total };
  }, [certFeeValue, discountValue, expensesValue, hasExpenses, standardCostRows, vatType]);

  const updateStandardInput = (standard: StandardKey, field: CostField, value: string) => {
    setStandardInputs(current => ({
      ...current,
      [standard]: {
        ...(current[standard] || defaultCostInput()),
        [field]: value,
      },
    }));
  };

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
    if (documentType === 'contract' && !companyName.trim()) {
      alert('계약서 생성을 위해 고객사명을 입력해주세요.');
      return;
    }

    try {
      const firstRow = standardCostRows[0];
      const documentData = {
        companyName,
        contactPerson,
        docId,
        issueDate,
        auditType,
        standards,
        standardCosts: standardCostRows.map(row => ({
          standard: row.standard,
          stage1Days: row.stage1Days,
          stage2Days: row.stage2Days,
          surveillanceDays: row.surveillanceDays,
          recertDays: row.recertDays,
          dayRate: row.dayRate,
        })),
        scope,
        siteName,
        siteAddress,
        employeeCount,
        stage1Days: firstRow?.stage1Days || 0,
        stage2Days: firstRow?.stage2Days || 0,
        surveillanceDays: firstRow?.surveillanceDays || 0,
        recertDays: firstRow?.recertDays || 0,
        dayRate: firstRow?.dayRate || DEFAULT_RATE,
        expenses: hasExpenses ? expensesValue : 0,
        certFee: certFeeValue,
        discount: discountValue,
        vatType,
        contractYears,
        paymentTerms,
        validity,
      };

      if (documentType === 'contract') {
        await generateIsoContractDocx({
          ...documentData,
          signerTitle,
          customerPhone,
          customerEmail,
          postalCode,
          businessRegistrationNumber,
          billingAddress,
        });
      } else {
        await generateIsoQuoteDocx(documentData);
      }
    } catch (error) {
      console.error(error);
      alert('ISO ' + (documentType === 'contract' ? '계약서' : '견적서') + ' Word 파일 생성 중 오류가 발생했습니다.');
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
          <div className="flex items-center gap-2">
            <Link href="/iso/adj" className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-600">
              ADJ 작성
            </Link>
            <Link href="/" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              포털로 돌아가기
            </Link>
          </div>
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
              <span className="ml-2 text-xs text-slate-500">SEO Assessment Contract Word 서식 사용</span>
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
          <div className="mt-4 space-y-4">
            {standards.map(standard => {
              const input = standardInputs[standard] || defaultCostInput();
              return (
                <div key={standard} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-blue-700">{STANDARD_VERSION[standard]}</h3>
                  <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-5">
                    <NumberInput label="Stage 1 일수" value={input.stage1Days} onChange={value => updateStandardInput(standard, 'stage1Days', value)} />
                    <NumberInput label="Stage 2 일수" value={input.stage2Days} onChange={value => updateStandardInput(standard, 'stage2Days', value)} />
                    <NumberInput label="사후심사 일수" value={input.surveillanceDays} onChange={value => updateStandardInput(standard, 'surveillanceDays', value)} />
                    <NumberInput label="갱신심사 일수" value={input.recertDays} onChange={value => updateStandardInput(standard, 'recertDays', value)} />
                    <NumberInput label="Manday 단가" value={input.dayRate} onChange={value => updateStandardInput(standard, 'dayRate', value)} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
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

        {documentType === 'contract' && (
          <section className="mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold text-slate-800">5. 계약 및 인보이스 정보</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <TextInput label="서명자 직책" value={signerTitle} onChange={setSignerTitle} />
              <TextInput label="휴대폰 번호" value={customerPhone} onChange={setCustomerPhone} />
              <TextInput label="이메일" value={customerEmail} onChange={setCustomerEmail} />
              <TextInput label="우편번호" value={postalCode} onChange={setPostalCode} />
              <TextInput label="사업자등록번호" value={businessRegistrationNumber} onChange={setBusinessRegistrationNumber} />
              <TextInput label="청구 주소 (등록 주소와 다를 경우)" value={billingAddress} onChange={setBillingAddress} />
            </div>
          </section>
        )}

        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
          <button onClick={handleDownloadWord} className="rounded-lg bg-blue-700 px-4 py-3 font-bold text-white shadow-md hover:bg-blue-800">
            {documentType === 'quote' ? 'Word 견적서 다운로드' : 'Word 계약서 다운로드'}
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
            {documentType === 'contract' && <p style={{ color: '#64748b' }}>SEO Assessment Contract 서식으로 Word 계약서를 생성합니다.</p>}
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
            ['적용 표준', standards.map(standard => STANDARD_VERSION[standard]).join(', ')],
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
              {standardCostRows.map(row => (
                <QuoteRow
                  key={row.standard}
                  label={row.label}
                  days={row.activeAuditDays}
                  amount={row.activeAuditFee}
                  note={currentCycleQuote ? (renewalQuote ? '3년 주기 갱신' : '12개월 주기') : `Stage 1 ${row.input.stage1Days} MD / Stage 2 ${row.input.stage2Days} MD, 사후관리 ${row.input.surveillanceDays} MD`}
                />
              ))}
              {hasExpenses && <SimpleAmountRow label="제경비/출장비" amount={expensesValue} />}
              <SimpleAmountRow label="인증비/관리비" amount={certFeeValue} />
              {discountValue > 0 && <SimpleAmountRow label="할인 금액" amount={-discountValue} />}
              <tr style={{ background: '#e0ffff', fontWeight: 'bold' }}><td style={cell}>합계</td><td style={cell}>{formatDays(totalAuditDays)}</td><td style={amountCell}>{formatCurrency(quote.discounted)}</td><td style={cell}>{totalNote}</td></tr>
              <tr style={{ background: '#000080', color: 'white', fontWeight: 'bold' }}><td style={cell}>최종 금액</td><td style={cell}>{formatDays(totalAuditDays)}</td><td style={amountCell}>{formatCurrency(quote.total)}</td><td style={cell}>{vatType === '별도' ? `VAT ${formatCurrency(quote.vat)} 별도` : 'VAT 포함'}</td></tr>
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
  return <div><label className="block text-xs font-medium text-slate-500">{label}</label><input inputMode="decimal" className="mt-1 w-full rounded border p-2" value={value} onChange={e => onChange(e.target.value)} /></div>;
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
