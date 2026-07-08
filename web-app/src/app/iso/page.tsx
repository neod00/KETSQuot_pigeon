'use client';

import React, { useMemo, useState } from 'react';
import { useEffect } from 'react';

const DEFAULT_RATE = 1300000;
const DEFAULT_EXPENSES = 300000;
const DEFAULT_CERT_FEE = 0;

type StandardKey = 'ISO 9001' | 'ISO 14001' | 'ISO 45001' | 'ISO 27001' | 'ISO 50001';

const ISO_STANDARDS: StandardKey[] = ['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 27001', 'ISO 50001'];

const formatCurrency = (value: number) => `${Math.round(value).toLocaleString()}원`;

const parseNumber = (value: string) => {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

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
    scope_extension: '범위 확대',
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

export default function ISOQuotePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [docId, setDocId] = useState(() => `QR.001/DK/I${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`);
  const [issueDate, setIssueDate] = useState(today);
  const [auditType, setAuditType] = useState('신규 인증');
  const [standards, setStandards] = useState<StandardKey[]>(['ISO 9001']);
  const [scope, setScope] = useState('경영시스템 인증심사');
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
  const [vatType, setVatType] = useState('별도');
  const [contractYears, setContractYears] = useState('3');
  const [paymentTerms, setPaymentTerms] = useState('청구서 발행 후 30일 이내 현금 지급');
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
      setVatType(imported.vatType === 'included' ? '포함' : '별도');
      setContractYears(String(imported.contractYears || '3'));
      setPaymentTerms(imported.paymentTerms || '청구서 발행 후 30일 이내 현금 지급');
      setImportMessage('Intake 프로토타입에서 전달된 ISO 견적 입력값을 불러왔습니다. 고객 발송 전 심사일수, 단가, 출장비, 할인, VAT를 검토하세요.');
    } catch (error) {
      setImportMessage('전달된 Intake 데이터를 읽지 못했습니다. URL data 파라미터를 확인하세요.');
    }
  }, []);

  const rate = parseNumber(dayRate);
  const expensesValue = parseNumber(expenses);
  const certFeeValue = parseNumber(certFee);
  const discountValue = parseNumber(discount);
  const stage1 = parseFloat(stage1Days) || 0;
  const stage2 = parseFloat(stage2Days) || 0;
  const surveillance = parseFloat(surveillanceDays) || 0;
  const recert = parseFloat(recertDays) || 0;
  const initialDays = stage1 + stage2;
  const totalCycleDays = initialDays + surveillance * 2 + recert;

  const quote = useMemo(() => {
    const initialAuditFee = initialDays * rate;
    const annualSurveillanceFee = surveillance * rate;
    const recertificationFee = recert * rate;
    const subtotal = initialAuditFee + annualSurveillanceFee * 2 + recertificationFee + expensesValue + certFeeValue;
    const discounted = Math.max(subtotal - discountValue, 0);
    const vat = vatType === '포함' ? Math.round(discounted / 11) : Math.round(discounted * 0.1);
    const total = vatType === '포함' ? discounted : discounted + vat;

    return {
      initialAuditFee,
      annualSurveillanceFee,
      recertificationFee,
      subtotal,
      discounted,
      vat,
      total,
    };
  }, [certFeeValue, discountValue, expensesValue, initialDays, rate, recert, surveillance, vatType]);

  const toggleStandard = (standard: StandardKey) => {
    setStandards(current => {
      if (current.includes(standard)) {
        const next = current.filter(item => item !== standard);
        return next.length > 0 ? next : current;
      }
      return [...current, standard];
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="no-print w-full max-w-5xl p-8 bg-white shadow-lg my-8 rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">LRQA ISO 견적/계약서 생성기</h1>
            <p className="mt-1 text-sm text-gray-500">기존 K-ETS 생성기는 유지하고, ISO 인증 견적 및 계약 조건 화면을 별도 생성합니다.</p>
          </div>
          <a href="/" className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            K-ETS 생성기로 돌아가기
          </a>
        </div>

        {importMessage && (
          <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
            {importMessage}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">1. 기본 정보</h2>
            <div>
              <label className="block text-sm font-medium text-gray-600">회사명</label>
              <input className="mt-1 w-full rounded-md border p-2" value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">담당자명</label>
              <input className="mt-1 w-full rounded-md border p-2" value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">문서 번호</label>
                <input className="mt-1 w-full rounded-md border p-2" value={docId} onChange={e => setDocId(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">발행 일자</label>
                <input type="date" className="mt-1 w-full rounded-md border p-2" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">심사 유형</label>
              <select className="mt-1 w-full rounded-md border p-2" value={auditType} onChange={e => setAuditType(e.target.value)}>
                <option>신규 인증</option>
                <option>갱신 인증</option>
                <option>전환 인증</option>
                <option>범위 확대</option>
                <option>사후 심사</option>
              </select>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">2. 인증 범위</h2>
            <div>
              <label className="block text-sm font-medium text-gray-600">ISO 표준</label>
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
              <label className="block text-sm font-medium text-gray-600">인증 범위</label>
              <textarea className="mt-1 h-20 w-full rounded-md border p-2" value={scope} onChange={e => setScope(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">사업장 수</label>
                <input className="mt-1 w-full rounded-md border p-2" value={siteCount} onChange={e => setSiteCount(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">직원 수</label>
                <input className="mt-1 w-full rounded-md border p-2" value={employeeCount} onChange={e => setEmployeeCount(e.target.value)} />
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-800">3. 심사일수 및 비용</h2>
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
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="isoVatType" value="별도" checked={vatType === '별도'} onChange={e => setVatType(e.target.value)} />
              VAT 별도
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="isoVatType" value="포함" checked={vatType === '포함'} onChange={e => setVatType(e.target.value)} />
              VAT 포함
            </label>
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-800">4. 계약 조건</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-600">계약 기간</label>
              <select className="mt-1 w-full rounded-md border p-2" value={contractYears} onChange={e => setContractYears(e.target.value)}>
                <option value="1">1년</option>
                <option value="3">3년</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">지급 조건</label>
              <input className="mt-1 w-full rounded-md border p-2" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
            </div>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="mt-8 w-full rounded-lg bg-blue-700 px-4 py-3 font-bold text-white shadow-md hover:bg-blue-800"
        >
          ISO 견적/계약서 인쇄 / PDF 저장
        </button>
      </div>

      <div className="invoice-container mb-20 bg-white shadow-2xl" style={{ width: '210mm', minHeight: '297mm' }}>
        <div className="page-content" style={{ padding: '18mm 15mm 42mm' }}>
          <HeaderLine />
          <div style={{ textAlign: 'center', margin: '22px 0' }}>
            <h1 style={{ fontSize: '23pt', fontWeight: 'bold' }}>ISO 경영시스템 인증심사 견적 및 계약 조건</h1>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
            <tbody>
              <tr>
                <td style={{ width: '45px', fontSize: '10pt' }}>수신:</td>
                <td style={{ fontSize: '11pt', fontWeight: 'bold' }}>{companyName || '고객사명'}</td>
                <td style={{ textAlign: 'right', fontSize: '11pt' }}>{docId}</td>
              </tr>
              <tr>
                <td style={{ fontSize: '10pt' }}>참조:</td>
                <td style={{ fontSize: '11pt' }}>{contactPerson || '담당자'} 귀하</td>
                <td></td>
              </tr>
              <tr>
                <td style={{ fontSize: '10pt' }}>발신:</td>
                <td style={{ fontSize: '11pt' }}>로이드인증원(LRQA)</td>
                <td style={{ textAlign: 'right', fontSize: '11pt' }}>{formatDateKorean(issueDate)}</td>
              </tr>
            </tbody>
          </table>
          <hr style={{ border: '0.5pt solid black' }} />

          <ol style={{ marginTop: '18px', paddingLeft: '20px', fontSize: '11pt', lineHeight: '1.55' }}>
            <li>귀 사의 지속가능한 발전을 기원합니다.</li>
            <li>
              귀 사의 {standards.join(', ')} {auditType}과 관련하여 예상되는 인증심사 범위, 비용 및 계약 조건을 아래와 같이 제안드립니다.
            </li>
          </ol>
          <p style={{ textAlign: 'center', margin: '15px 0', fontSize: '11pt' }}>- 아&nbsp;&nbsp;래 -</p>

          <SectionTitle number="1" title="인증심사 범위" />
          <InfoTable
            rows={[
              ['적용 표준', standards.join(', ')],
              ['심사 유형', auditType],
              ['인증 범위', scope],
              ['사업장 수', `${siteCount || '0'}개`],
              ['직원 수', `${employeeCount || '0'}명`],
              ['계약 기간', `${contractYears}년`],
            ]}
          />

          <SectionTitle number="2" title="인증심사 비용" />
          <table style={{ width: '100%', border: '1.2pt solid black', borderCollapse: 'collapse', textAlign: 'center', fontSize: '9.5pt' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={cellHeader}>구분</th>
                <th style={cellHeader}>심사일수</th>
                <th style={cellHeader}>단가</th>
                <th style={cellHeader}>금액</th>
                <th style={cellHeader}>비고</th>
              </tr>
            </thead>
            <tbody>
              <QuoteRow label="최초 인증심사(Stage 1 + Stage 2)" days={initialDays} rate={rate} amount={quote.initialAuditFee} note={`${stage1Days} + ${stage2Days} MD`} />
              <QuoteRow label="1차 사후심사" days={surveillance} rate={rate} amount={quote.annualSurveillanceFee} note="인증 후 1년차" />
              <QuoteRow label="2차 사후심사" days={surveillance} rate={rate} amount={quote.annualSurveillanceFee} note="인증 후 2년차" />
              <QuoteRow label="갱신심사" days={recert} rate={rate} amount={quote.recertificationFee} note="3년 주기 갱신" />
              <SimpleAmountRow label="제경비/출장비" amount={expensesValue} />
              <SimpleAmountRow label="인증비/관리비" amount={certFeeValue} />
              {discountValue > 0 && <SimpleAmountRow label="할인 금액" amount={-discountValue} />}
              <tr style={{ background: '#e0ffff', fontWeight: 'bold' }}>
                <td style={cell}>합계</td>
                <td style={cell}>{totalCycleDays.toFixed(1)} Manday</td>
                <td style={cell}></td>
                <td style={amountCell}>{formatCurrency(quote.discounted)}</td>
                <td style={cell}>VAT {vatType}</td>
              </tr>
              <tr style={{ background: '#000080', color: 'white', fontWeight: 'bold' }}>
                <td style={cell}>최종 계약금액</td>
                <td style={cell}>{totalCycleDays.toFixed(1)} Manday</td>
                <td style={cell}></td>
                <td style={amountCell}>{formatCurrency(quote.total)}</td>
                <td style={cell}>{vatType === '별도' ? `VAT ${formatCurrency(quote.vat)} 별도` : 'VAT 포함'}</td>
              </tr>
            </tbody>
          </table>

          <SectionTitle number="3" title="계약 조건" />
          <div style={{ fontSize: '10pt', lineHeight: '1.55' }}>
            <p>1) 본 견적은 상기 인증 범위와 제공 정보에 근거한 제안이며, 최종 심사일수와 비용은 신청서 검토 및 계약 검토 결과에 따라 조정될 수 있습니다.</p>
            <p>2) 지급 조건은 {paymentTerms}입니다.</p>
            <p>3) 제안서 유효기간은 발행일로부터 30일입니다.</p>
            <p>4) 인증심사는 LRQA의 공평성 및 독립성 원칙에 따라 수행되며, 본 문서는 인증 결과를 보장하지 않습니다.</p>
            <p>5) 고객이 제공한 정보가 실제 심사 범위와 다를 경우 추가 심사일수 또는 비용이 발생할 수 있습니다.</p>
          </div>

          <div style={{ marginTop: '26px', textAlign: 'right' }}>
            <p style={{ fontSize: '10pt' }}>감사합니다.</p>
            <p style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: '5px' }}>로이드인증원</p>
          </div>
        </div>
        <Footer />
      </div>

      <style jsx>{`
        .invoice-container {
          position: relative;
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .invoice-container {
            margin: 0 !important;
            box-shadow: none !important;
            width: 210mm !important;
          }
        }
      `}</style>
    </div>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500">{label}</label>
      <input className="mt-1 w-full rounded border p-2" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function HeaderLine() {
  return (
    <div style={{ textAlign: 'right' }}>
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAqQAAAAECAYAAABYxS1uAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABFSURBVGhD7daxDcAwDANB7eUdPWJWcQxIRQq1SnUPXMcBGGs/BwAA/hTfugEAAEyqK5p1AwAAmFRXNOsGAAAwqa7oLeIFcQTbLvA45s8AAAAASUVORK5CYII=" width="100%" height="4" alt="" />
    </div>
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return <p style={{ margin: '18px 0 8px', fontWeight: 'bold', fontSize: '11pt' }}>({number}) {title}</p>;
}

function InfoTable({ rows }: { rows: string[][] }) {
  return (
    <table style={{ width: '100%', border: '1.2pt solid black', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td style={{ ...cell, width: '28%', background: '#f3f4f6', fontWeight: 'bold' }}>{label}</td>
            <td style={{ ...cell, textAlign: 'left' }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const cell: React.CSSProperties = {
  border: '0.5pt solid black',
  padding: '6px',
};

const cellHeader: React.CSSProperties = {
  ...cell,
  fontWeight: 'bold',
};

const amountCell: React.CSSProperties = {
  ...cell,
  textAlign: 'right',
  paddingRight: '8px',
};

function QuoteRow({ label, days, rate, amount, note }: { label: string; days: number; rate: number; amount: number; note: string }) {
  return (
    <tr>
      <td style={cell}>{label}</td>
      <td style={cell}>{days.toFixed(1)} Manday</td>
      <td style={amountCell}>{formatCurrency(rate)}</td>
      <td style={amountCell}>{formatCurrency(amount)}</td>
      <td style={cell}>{note}</td>
    </tr>
  );
}

function SimpleAmountRow({ label, amount }: { label: string; amount: number }) {
  return (
    <tr>
      <td style={cell}>{label}</td>
      <td style={cell}>-</td>
      <td style={cell}>-</td>
      <td style={amountCell}>{formatCurrency(amount)}</td>
      <td style={cell}></td>
    </tr>
  );
}

function Footer() {
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '35mm',
      background: 'white',
      borderTop: '1px solid #ddd',
      padding: '10px 15mm 0',
      boxSizing: 'border-box',
    }}>
      <table style={{ width: '100%' }}>
        <tbody>
          <tr>
            <td style={{ width: '85px', verticalAlign: 'middle', padding: '5px 0' }}>
              <img
                src="https://www.lrqa.com/cdn-cgi/image/width=300,format=auto/globalassets/logos/lrqa-white-logo---dark-background-cropped.png"
                style={{ width: '85px', height: 'auto', display: 'block', backgroundColor: '#000', padding: '5px' }}
                alt="LRQA Logo"
              />
            </td>
            <td style={{ verticalAlign: 'top', paddingLeft: '10px' }}>
              <p style={{ margin: 0, fontSize: '11pt', color: '#3b8ede', fontWeight: 'bold' }}>YOUR FUTURE. OUR FOCUS.</p>
              <p style={{ margin: 0, fontSize: '8pt' }}>for more information or call <strong>+82 (0)2 736 6231</strong></p>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'top', fontSize: '9pt', color: '#666' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>로이드인증원</p>
              <p style={{ margin: 0 }}>서울특별시 중구 소월로2길 30, 2층 남산트라팰리스 (우) 04637</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
