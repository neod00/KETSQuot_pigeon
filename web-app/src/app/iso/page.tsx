'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { generateIsoQuoteDocx } from '../../utils/isoQuoteDocxGenerator';
import { generateIsoContractDocx } from '../../utils/isoContractDocxGenerator';
import type { IsoQuoteDraft, IsoQuoteDraftStatus, IsoQuoteInput } from '../../lib/isoTypes';
import {
  calculateIsoQuoteCost,
  futureAuditHeader,
  isCurrentCycleQuote,
  isRenewalQuote,
} from '../../lib/isoQuoteRules';

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

const getStandardDisplay = (standard: string) =>
  STANDARD_VERSION[standard as StandardKey] || standard;

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
  const [customStandard, setCustomStandard] = useState('');
  const [customStandardInput, setCustomStandardInput] = useState<StandardCostInput>(defaultCostInput);
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
  const [activeDraftId, setActiveDraftId] = useState('');
  const [activeApplicationId, setActiveApplicationId] = useState('');
  const [draftVersion, setDraftVersion] = useState(1);
  const [draftStatus, setDraftStatus] = useState<IsoQuoteDraftStatus>('draft');
  const [draftMessage, setDraftMessage] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('data');
    const requestedDraftId = params.get('draftId');

    const applyImported = (input: IsoQuoteInput) => {
      const imported = input as IsoQuoteInput & Record<string, unknown>;
      const importedStandards = Array.isArray(imported.standards)
        ? imported.standards.filter((item: string) => ISO_STANDARDS.includes(item as StandardKey)) as StandardKey[]
        : [];
      const nextStandards: StandardKey[] = importedStandards.length > 0 ? importedStandards : ['ISO 9001'];
      const importedCustomStandard = String(
        imported.customStandard ||
        (Array.isArray(imported.standards)
          ? imported.standards.find((item: string) => typeof item === 'string' && !ISO_STANDARDS.includes(item as StandardKey))
          : '') ||
        '',
      ).trim();

      setCompanyName(imported.companyName || '');
      setContactPerson(imported.contactPerson || '');
      setAuditType(auditTypeLabel(imported.auditType));
      if (importedStandards.length > 0) setStandards(importedStandards);
      setCustomStandard(importedCustomStandard);
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
      setValidity(imported.validity || '1개월');
      setSignerTitle(imported.signerTitle || '대표이사');
      setCustomerPhone(imported.customerPhone || '');
      setCustomerEmail(imported.customerEmail || '');
      setPostalCode(imported.postalCode || '');
      setBusinessRegistrationNumber(imported.businessRegistrationNumber || '');
      setBillingAddress(imported.billingAddress || '');

      if (importedCustomStandard) {
        const importedCustomCost = Array.isArray(imported.standardCosts)
          ? imported.standardCosts.find((item) => item.standard === importedCustomStandard)
          : undefined;
        setCustomStandardInput({
          stage1Days: toInputNumber(importedCustomCost?.stage1Days, '1.0'),
          stage2Days: toInputNumber(importedCustomCost?.stage2Days, '2.0'),
          surveillanceDays: toInputNumber(importedCustomCost?.surveillanceDays, '1.0'),
          recertDays: toInputNumber(importedCustomCost?.recertDays, '2.0'),
          dayRate: toInputNumber(importedCustomCost?.dayRate, DEFAULT_RATE.toLocaleString()),
        });
      }

      setStandardInputs(current => {
        const next = { ...current };
        nextStandards.forEach((standard) => {
          const importedCost = Array.isArray(imported.standardCosts)
            ? imported.standardCosts.find((item) => item.standard === standard)
            : undefined;
          next[standard] = {
            stage1Days: toInputNumber(importedCost?.stage1Days, '1.0'),
            stage2Days: toInputNumber(importedCost?.stage2Days, '2.0'),
            surveillanceDays: toInputNumber(importedCost?.surveillanceDays, '1.0'),
            recertDays: toInputNumber(importedCost?.recertDays, '2.0'),
            dayRate: toInputNumber(importedCost?.dayRate, DEFAULT_RATE.toLocaleString()),
          };
        });
        return next;
      });
    };

    const loadInput = async () => {
      if (requestedDraftId) {
        setDraftLoading(true);
        try {
          const response = await fetch(`/api/iso/quote-drafts/${encodeURIComponent(requestedDraftId)}`, { cache: 'no-store' });
          if (response.status === 401) {
            const returnTo = window.location.pathname + window.location.search;
            window.location.assign(`/iso/login?returnTo=${encodeURIComponent(returnTo)}`);
            return;
          }
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error || '견적 초안을 불러오지 못했습니다.');
          const draft = payload.draft as IsoQuoteDraft;
          setActiveDraftId(draft.id);
          setActiveApplicationId(draft.applicationId);
          setDraftVersion(draft.version);
          setDraftStatus(draft.status);
          applyImported(draft.quoteInput);
          setImportMessage('신청서에 연결된 견적 초안을 불러왔습니다. 심사일수와 비용을 검토한 뒤 저장하세요.');
        } catch (error) {
          setImportMessage(error instanceof Error ? error.message : '견적 초안을 불러오지 못했습니다.');
        } finally {
          setDraftLoading(false);
        }
        return;
      }

      if (!encodedData) return;
      try {
        applyImported(JSON.parse(decodeURIComponent(encodedData)) as IsoQuoteInput);
        setImportMessage('Intake에서 전달된 ISO 입력값을 불러왔습니다. 고객 발송 전 규격별 심사일수, 단가, 경비, 할인, VAT를 검토하세요.');
      } catch {
        setImportMessage('전달된 Intake 데이터를 읽지 못했습니다. URL data 파라미터를 확인하세요.');
      }
    };

    void loadInput();
  }, []);

  const expensesValue = parseNumber(expenses);
  const hasExpenses = expenses.trim() !== '' && expensesValue > 0;
  const certFeeValue = parseNumber(certFee);
  const discountValue = parseNumber(discount);
  const currentCycleQuote = isCurrentCycleQuote(auditType);
  const renewalQuote = isRenewalQuote(auditType);

  const customStandardName = customStandard.trim();

  const standardCostRows = useMemo(() => {
    const selectedInputs: Array<{ standard: string; input: StandardCostInput }> = standards.map((standard) => ({
      standard,
      input: standardInputs[standard] || defaultCostInput(),
    }));
    if (customStandardName) selectedInputs.push({ standard: customStandardName, input: customStandardInput });

    return selectedInputs.map(({ standard, input }) => {
      const stage1Days = parseDays(input.stage1Days);
      const stage2Days = parseDays(input.stage2Days);
      const surveillanceDays = parseDays(input.surveillanceDays);
      const recertDays = parseDays(input.recertDays);
      const dayRate = parseNumber(input.dayRate);
      const calculated = calculateIsoQuoteCost({
        standard,
        stage1Days,
        stage2Days,
        surveillanceDays,
        recertDays,
        dayRate,
      }, auditType);

      return {
        standard,
        label: getStandardDisplay(standard) + ' ' + auditPhrase(auditType),
        input,
        stage1Days,
        stage2Days,
        surveillanceDays,
        recertDays,
        dayRate,
        ...calculated,
      };
    });
  }, [auditType, customStandardInput, customStandardName, standardInputs, standards]);

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

  const updateCustomStandardInput = (field: CostField, value: string) => {
    setCustomStandardInput(current => ({ ...current, [field]: value }));
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

  const getCurrentQuoteInput = (): IsoQuoteInput => ({
    companyName,
    contactPerson,
    auditType,
    standards,
    customStandard: customStandardName || undefined,
    scope,
    siteName,
    siteAddress,
    siteCount: Math.max(1, Number.parseInt(siteCount.replace(/[^0-9]/g, ''), 10) || 1),
    employeeCount: Math.max(0, Number.parseInt(employeeCount.replace(/[^0-9]/g, ''), 10) || 0),
    customerPhone,
    customerEmail,
    postalCode,
    businessRegistrationNumber,
    billingAddress,
    standardCosts: standardCostRows.map((row) => ({
      standard: row.standard,
      stage1Days: row.stage1Days,
      stage2Days: row.stage2Days,
      surveillanceDays: row.surveillanceDays,
      recertDays: row.recertDays,
      dayRate: row.dayRate,
    })),
    expenses: hasExpenses ? expensesValue : 0,
    certFee: certFeeValue,
    discount: discountValue,
    vatType,
    contractYears,
    paymentTerms,
    validity,
    signerTitle,
  });

  const saveDraft = async (status: IsoQuoteDraftStatus) => {
    if (!activeDraftId) return;
    setDraftMessage('저장 중...');
    try {
      const response = await fetch(`/api/iso/quote-drafts/${encodeURIComponent(activeDraftId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteInput: getCurrentQuoteInput(), status }),
      });
      if (response.status === 401) {
        const returnTo = window.location.pathname + window.location.search;
        window.location.assign(`/iso/login?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '견적 초안을 저장하지 못했습니다.');
      setDraftVersion(payload.draft.version);
      setDraftStatus(payload.draft.status);
      setDraftMessage(status === 'draft' ? '초안을 저장했습니다.' : status === 'review_requested' ? '내부 검토 요청 상태로 저장했습니다.' : '내부 승인 완료 상태로 저장했습니다.');
    } catch (error) {
      setDraftMessage(error instanceof Error ? error.message : '견적 초안을 저장하지 못했습니다.');
    }
  };

  const saveGeneratedDocument = async (blob: Blob, fileName: string) => {
    if (!activeDraftId) return;

    const parseResponse = async (response: Response) => {
      const text = await response.text();
      try {
        return JSON.parse(text) as { error?: string };
      } catch {
        return { error: response.ok ? '' : 'Netlify가 문서 업로드를 처리하지 못했습니다.' };
      }
    };

    const toBase64 = (bytes: Uint8Array) => {
      let binary = '';
      const batchSize = 0x8000;
      for (let offset = 0; offset < bytes.length; offset += batchSize) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + batchSize));
      }
      return btoa(binary);
    };

    const chunkSize = 512 * 1024;
    const partCount = Math.ceil(blob.size / chunkSize);
    const uploadId = `UP-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`;

    for (let partIndex = 0; partIndex < partCount; partIndex += 1) {
      const part = blob.slice(partIndex * chunkSize, Math.min(blob.size, (partIndex + 1) * chunkSize));
      const response = await fetch('/api/iso/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chunk',
          uploadId,
          partIndex,
          partCount,
          data: toBase64(new Uint8Array(await part.arrayBuffer())),
        }),
      });
      const payload = await parseResponse(response);
      if (!response.ok) throw new Error(payload.error || `문서 조각 ${partIndex + 1} 업로드에 실패했습니다.`);
      setDraftMessage(`내부 문서함 업로드 중 ${partIndex + 1}/${partCount}`);
    }

    const response = await fetch('/api/iso/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'finalize',
        uploadId,
        partCount,
        fileName,
        contentType: blob.type,
        applicationId: activeApplicationId,
        draftId: activeDraftId,
        documentType,
        version: draftVersion,
        companyName,
        standards: standardCostRows.map((row) => row.standard),
      }),
    });
    const payload = await parseResponse(response);
    if (!response.ok) throw new Error(payload.error || '생성 문서를 내부 문서함에 저장하지 못했습니다.');
  };
  const handleDownloadWord = async () => {
    if (documentType === 'contract' && !companyName.trim()) {
      alert('계약서 생성을 위해 고객사명을 입력해주세요.');
      return;
    }
    if (activeDraftId && draftStatus !== 'approved') {
      alert('신청서 연결 문서는 내부 승인 완료 후 생성할 수 있습니다.');
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
        standards: standardCostRows.map(row => row.standard),
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

      const generated = documentType === 'contract'
        ? await generateIsoContractDocx({
            ...documentData,
            signerTitle,
            customerPhone,
            customerEmail,
            postalCode,
            businessRegistrationNumber,
            billingAddress,
          })
        : await generateIsoQuoteDocx(documentData);

      if (generated && activeDraftId) {
        try {
          await saveGeneratedDocument(generated.blob, generated.fileName);
          setDraftMessage('Word 문서를 다운로드하고 내부 문서함에도 저장했습니다.');
        } catch (storageError) {
          setDraftMessage(storageError instanceof Error ? storageError.message : '다운로드는 완료했지만 내부 문서함 저장에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error(error);
      const reason = error instanceof Error ? error.message : '알 수 없는 오류';
      setDraftMessage(`Word 파일 생성 실패: ${reason}`);
      alert('ISO ' + (documentType === 'contract' ? '계약서' : '견적서') + ' Word 파일 생성 중 오류가 발생했습니다.');
    }
  };

  const handleOpenAdj = () => {
    const supportedStandards = standards.filter(standard =>
      ['ISO 9001', 'ISO 14001', 'ISO 45001'].includes(standard),
    );
    const otherStandards = [
      ...standards.filter(standard => !supportedStandards.includes(standard)),
      ...(customStandardName ? [customStandardName] : []),
    ];
    const parsedSiteCount = Math.max(1, Math.min(100, Number.parseInt(siteCount, 10) || 1));
    const parsedEmployeeCount = Math.max(0, Number.parseInt(employeeCount.replace(/[^0-9]/g, ''), 10) || 0);
    const sites = Array.from({ length: parsedSiteCount }, (_, index) => ({
      name: index === 0 ? (siteName || 'Main Site') : `Site ${index + 1}`,
      type: 'Permanent',
      address: index === 0 ? siteAddress : '',
      scope,
      riskJustification: '',
      samplingNote: '',
      headcount: { fullTime: index === 0 ? parsedEmployeeCount : 0, partTime: 0, contractors: 0 },
      employeeReductionReason: '',
      furtherReductionJustification: '',
    }));
    const notes = [
      contactPerson ? `Customer contact: ${contactPerson}` : '',
      auditType ? `Audit type: ${auditType}` : '',
    ].filter(Boolean).join('\n');

    localStorage.setItem('adj-builder-prefill', JSON.stringify({
      createdAt: Date.now(),
      data: {
        client: {
          name: companyName,
          contactPerson,
          createdDate: issueDate,
          contractId: 'New',
          opportunity: docId,
          comments: notes,
          scope,
        },
        standards: supportedStandards,
        integration: {
          otherStandards: otherStandards.length > 0,
          otherStandardsText: otherStandards.join(', '),
        },
        transfer: {
          isToa: auditType.includes('전환'),
          stage: auditType.includes('전환') ? auditType : '',
        },
        sites,
      },
    }));
    window.open('/iso/adj', '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => window.print();
  const totalNote = hasExpenses ? `VAT ${vatType}` : `제경비/VAT ${vatType}`;
  const futureAuditColumn = futureAuditHeader(auditType);
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center">
      <div className="no-print w-full max-w-6xl p-6 sm:p-8 bg-white shadow-lg my-8 rounded-xl border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">LRQA ISO 견적/계약서 생성기</h1>
            <p className="mt-1 text-sm text-slate-500">문서 종류를 선택한 뒤 ISO 심사 비용 정보를 입력하고 Word 또는 PDF로 출력합니다.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/iso/applications" target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">신청서 접수함</Link>
            <Link href="/iso/documents" target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">문서함</Link>
            <button type="button" onClick={handleOpenAdj} className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-600">
              ADJ 작성
            </button>
            <Link href="/" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              포털로 돌아가기
            </Link>
          </div>
        </div>

        {importMessage && <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">{importMessage}</div>}

        {draftLoading && <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">견적 초안을 불러오는 중입니다...</div>}

        {activeDraftId && (
          <section className="mt-4 border-y border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-bold text-slate-700">{activeDraftId}</p>
                <p className="mt-1 text-sm text-slate-600">v{draftVersion} · {draftStatus === 'draft' ? '초안' : draftStatus === 'review_requested' ? '검토 요청' : '승인 완료'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => saveDraft('draft')} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">초안 저장</button>
                <button type="button" onClick={() => saveDraft('review_requested')} className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800 hover:bg-amber-100">검토 요청</button>
                <button type="button" onClick={() => saveDraft('approved')} className="rounded-md bg-teal-700 px-3 py-2 text-sm font-bold text-white hover:bg-teal-800">승인 완료</button>
              </div>
            </div>
            {draftMessage && <p className="mt-2 text-sm font-semibold text-slate-700">{draftMessage}</p>}
          </section>
        )}

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

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-slate-800">1. 기본 정보</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-3"><TextInput label="고객사명" value={companyName} onChange={setCompanyName} /></div>
            <div className="md:col-span-3"><TextInput label="담당자명" value={contactPerson} onChange={setContactPerson} /></div>
            <div className="md:col-span-2"><TextInput label="문서 번호" value={docId} onChange={setDocId} /></div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600">발행 일자</label>
              <input type="date" className="mt-1 w-full rounded-md border p-2" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600">심사 유형</label>
              <select className="mt-1 w-full rounded-md border p-2" value={auditType} onChange={e => setAuditType(e.target.value)}>
                <option>신규 인증</option>
                <option>갱신 인증</option>
                <option>전환 인증</option>
                <option>범위 확장</option>
                <option>사후 심사</option>
              </select>
            </div>
          </div>
        </section>

        <section className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold text-slate-800">2. 인증 범위</h2>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-600">ISO 표준</label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ISO_STANDARDS.map(standard => (
                <label key={standard} className="flex min-h-11 items-center gap-2 rounded-md border bg-white p-2 text-sm">
                  <input type="checkbox" checked={standards.includes(standard)} onChange={() => toggleStandard(standard)} />
                  {standard}
                </label>
              ))}
              <label className="min-h-11 rounded-md border bg-white px-2 py-1.5">
                <span className="block text-xs font-medium text-slate-500">기타 표준</span>
                <input
                  className="mt-0.5 w-full border-0 bg-transparent p-0 text-sm outline-none"
                  value={customStandard}
                  onChange={e => setCustomStandard(e.target.value)}
                  placeholder="예: ISO 22301:2019"
                />
              </label>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-600">인증 범위</label>
            <textarea className="mt-1 h-24 w-full rounded-md border p-2" value={scope} onChange={e => setScope(e.target.value)} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-2"><TextInput label="사업장명" value={siteName} onChange={setSiteName} /></div>
            <div><TextInput label="사업장 수" value={siteCount} onChange={setSiteCount} /></div>
            <div><TextInput label="직원 수" value={employeeCount} onChange={setEmployeeCount} /></div>
            <div className="md:col-span-2"><TextInput label="사업장 주소" value={siteAddress} onChange={setSiteAddress} /></div>
          </div>
        </section>
        <section className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold text-slate-800">3. 심사일수 및 비용</h2>
          <div className="mt-4 space-y-4">
            {standards.map(standard => {
              const input = standardInputs[standard] || defaultCostInput();
              return (
                <div key={standard} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-blue-700">{getStandardDisplay(standard)}</h3>
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
            {customStandardName && (
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                <h3 className="text-sm font-bold text-teal-800">{customStandardName}</h3>
                <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-5">
                  <NumberInput label="Stage 1 일수" value={customStandardInput.stage1Days} onChange={value => updateCustomStandardInput('stage1Days', value)} />
                  <NumberInput label="Stage 2 일수" value={customStandardInput.stage2Days} onChange={value => updateCustomStandardInput('stage2Days', value)} />
                  <NumberInput label="사후심사 일수" value={customStandardInput.surveillanceDays} onChange={value => updateCustomStandardInput('surveillanceDays', value)} />
                  <NumberInput label="갱신심사 일수" value={customStandardInput.recertDays} onChange={value => updateCustomStandardInput('recertDays', value)} />
                  <NumberInput label="Manday 단가" value={customStandardInput.dayRate} onChange={value => updateCustomStandardInput('dayRate', value)} />
                </div>
              </div>
            )}
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
          <button onClick={handleDownloadWord} disabled={Boolean(activeDraftId) && draftStatus !== 'approved'} className="rounded-lg bg-blue-700 px-4 py-3 font-bold text-white shadow-md hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            {documentType === 'quote' ? 'Word 견적서 다운로드' : 'Word 계약서 다운로드'}
          </button>
          <button onClick={handlePrint} className="rounded-lg border border-slate-300 px-4 py-3 font-bold text-slate-700 hover:bg-slate-50">
            현재 미리보기 인쇄 / PDF 저장
          </button>
        </div>
      </div>

      <div className="preview-stage mb-20 w-full overflow-x-auto px-4 pb-6">
        {documentType === 'contract' ? (
          <div className="invoice-container contract-preview mx-auto flex-none bg-white shadow-2xl" style={{ width: '210mm', minHeight: '297mm' }}>
            <div style={{ position: 'relative', minHeight: '297mm', padding: '22mm 20mm', boxSizing: 'border-box', overflow: 'hidden' }}>
              <div style={{ width: '72px', height: '7px', background: '#00a499', marginBottom: '16mm' }} />
              <h1 style={{ margin: 0, maxWidth: '150mm', color: '#008f87', fontSize: '32pt', lineHeight: 1.12, fontWeight: 700 }}>
                LRQA 서비스 제공을<br />위한 제안서
              </h1>
              <div style={{ marginTop: '22mm', display: 'grid', gap: '11mm' }}>
                <p style={{ margin: 0, fontSize: '16pt', fontWeight: 700 }}>{companyName || '고객사명'}</p>
                <p style={{ margin: 0, fontSize: '15pt', fontWeight: 700 }}>
                  {standardCostRows.map(row => getStandardDisplay(row.standard)).join(', ')}
                </p>
                <p style={{ margin: 0, fontSize: '12pt' }}>일자: {formatDateKorean(issueDate)}</p>
                <p style={{ margin: 0, fontSize: '11pt', color: '#475569' }}>{docId}</p>
              </div>
              <div style={{ position: 'absolute', top: '84mm', right: 0, width: '11mm', height: '84mm', background: '#00a499' }} />
              <div style={{ position: 'absolute', left: '20mm', right: '20mm', bottom: '22mm', borderTop: '1px solid #cbd5e1', paddingTop: '7mm', fontSize: '10pt', lineHeight: 1.65 }}>
                <strong>김 달 실장</strong><br />
                사업개발본부 실장 | 로이드인증원(LRQA)<br />
                dal.kim@lrqa.com | +82 2-3703-7527 | +82 10-3776-0837
              </div>
            </div>
          </div>
        ) : (
          <div className="invoice-container quote-preview mx-auto flex-none bg-white shadow-2xl" style={{ width: '210mm', minHeight: '297mm' }}>
            <div className="page-content" style={{ padding: '15mm 12mm 40mm' }}>
              <HeaderLine />
              <div style={{ textAlign: 'center', margin: '15px 0 18px' }}>
                <h1 style={{ margin: 0, fontSize: '20pt', fontWeight: 700 }}>ISO 인증 심사 견적서</h1>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '9.5pt' }}>
                <tbody>
                  <tr><td style={{ width: '58px' }}>수신:</td><td style={{ fontWeight: 700 }}>{companyName || '고객사명'}</td><td style={{ textAlign: 'right' }}>{docId}</td></tr>
                  <tr><td>참조:</td><td>{contactPerson || '담당자'} 귀하</td><td></td></tr>
                  <tr><td>발신:</td><td>로이드인증원(LRQA)</td><td style={{ textAlign: 'right' }}>{formatDateKorean(issueDate)}</td></tr>
                </tbody>
              </table>
              <hr style={{ border: 0, borderTop: '1px solid #111827' }} />

              <SectionTitle number="1" title="인증심사 범위" />
              <InfoTable rows={[
                ['적용 표준', standardCostRows.map(row => getStandardDisplay(row.standard)).join(', ')],
                ['심사 유형', auditType],
                ['인증 범위', scope],
                ['사업장', (siteName || '본사') + ' / ' + (siteCount || '1') + '개'],
                ['사업장 주소', siteAddress || '-'],
                ['직원 수', (employeeCount || '0') + '명'],
              ]} />

              <SectionTitle number="2" title="심사 비용" />
              <table style={{ width: '100%', tableLayout: 'fixed', border: '1.2pt solid black', borderCollapse: 'collapse', textAlign: 'center', fontSize: '8.8pt' }}>
                <colgroup><col style={{ width: '29%' }} /><col style={{ width: '20%' }} /><col style={{ width: '21%' }} /><col style={{ width: '16%' }} /><col style={{ width: '14%' }} /></colgroup>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#2dd4bf' }}>
                    <th style={cellHeader}>비용 항목</th>
                    <th style={cellHeader}>심사 일수</th>
                    <th style={cellHeader}>심사 비용</th>
                    <th style={cellHeader}>{futureAuditColumn.title}<br />({futureAuditColumn.cycle})</th>
                    <th style={cellHeader}>비고</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={cell}>신청비</td><td style={cell}>-</td><td style={cell}>면제(720,000원)</td><td style={cell}>-</td><td style={cell}>무상 제공</td></tr>
                  <tr><td style={cell}>연간 관리 수수료</td><td style={cell}>-</td><td style={amountCell}>{formatCurrency(certFeeValue)}</td><td style={cell}>-</td><td style={cell}>-</td></tr>
                  {standardCostRows.map(row => (
                    <tr key={row.standard}>
                      <td style={cell}>{row.label}</td>
                      <td style={cell}>
                        {row.singleLineAudit ? row.activeAuditDays.toFixed(1) + '일' : <><span>1단계: {row.input.stage1Days}일</span><br /><span>2단계: {row.input.stage2Days}일</span></>}
                      </td>
                      <td style={amountCell}>
                        {row.freeTransfer
                          ? '무상(' + row.activeAuditDays.toFixed(1) + '일, ' + formatCurrency(row.dayRate) + '/일)'
                          : row.singleLineAudit
                            ? formatCurrency(row.activeAuditFee)
                            : <><span>{formatCurrency(row.stage1Fee)}</span><br /><span>{formatCurrency(row.stage2Fee)}</span></>}
                      </td>
                      <td style={cell}>{row.futureAuditDays === null ? '-' : row.futureAuditDays.toFixed(1) + '일'}</td>
                      <td style={cell}>{currentCycleQuote ? (renewalQuote ? '3년 주기' : '12개월 주기') : '-'}</td>
                    </tr>
                  ))}
                  {hasExpenses && <tr><td style={cell}>제경비/출장비</td><td style={cell}>-</td><td style={amountCell}>{formatCurrency(expensesValue)}</td><td style={cell}>-</td><td style={cell}>-</td></tr>}
                  {discountValue > 0 && <tr><td style={cell}>할인 금액</td><td style={cell}>-</td><td style={amountCell}>-{formatCurrency(discountValue)}</td><td style={cell}>-</td><td style={cell}>-</td></tr>}
                  <tr><td style={cell}>고객포털(Client Portal fee)</td><td style={cell}>-</td><td style={cell}>면제(£150)</td><td style={cell}>면제(£150)</td><td style={cell}>무상 제공</td></tr>
                  <tr style={{ background: '#ccfbf1', fontWeight: 700 }}><td style={boldCell}>총합</td><td style={boldCell}>{formatDays(totalAuditDays)}</td><td style={boldAmountCell}>{formatCurrency(quote.discounted)}</td><td style={boldCell}>-</td><td style={boldCell}>{totalNote}</td></tr>
                </tbody>
              </table>

              <SectionTitle number="3" title="조건" />
              <div style={{ fontSize: '9.3pt', lineHeight: 1.55 }}>
                <p style={{ margin: '3px 0' }}>1) 최종 심사일수와 비용은 신청서 및 계약 검토 결과에 따라 조정될 수 있습니다.</p>
                <p style={{ margin: '3px 0' }}>2) 지급 조건은 {paymentTerms}입니다.</p>
                <p style={{ margin: '3px 0' }}>3) 견적 유효기간은 발행일로부터 {validity}입니다.</p>
              </div>
            </div>
            <Footer />
          </div>
        )}
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
  const id = React.useId();
  return <div><label htmlFor={id} className="block text-sm font-medium text-slate-600">{label}</label><input id={id} className="mt-1 w-full rounded-md border p-2" value={value} onChange={e => onChange(e.target.value)} /></div>;
}

function NumberInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = React.useId();
  return <div><label htmlFor={id} className="block text-xs font-medium text-slate-500">{label}</label><input id={id} inputMode="decimal" className="mt-1 w-full rounded border p-2" value={value} onChange={e => onChange(e.target.value)} /></div>;
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
const boldCell: React.CSSProperties = { ...cell, fontWeight: 700 };
const boldAmountCell: React.CSSProperties = { ...amountCell, fontWeight: 700 };


function Footer() {
  return <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '35mm', background: 'white', borderTop: '1px solid #ddd', padding: '10px 15mm 0', boxSizing: 'border-box' }}><table style={{ width: '100%' }}><tbody><tr><td style={{ width: '85px', verticalAlign: 'middle', padding: '5px 0' }}><img src="https://www.lrqa.com/cdn-cgi/image/width=300,format=auto/globalassets/logos/lrqa-white-logo---dark-background-cropped.png" style={{ width: '85px', height: 'auto', display: 'block', backgroundColor: '#000', padding: '5px' }} alt="LRQA Logo" /></td><td style={{ verticalAlign: 'top', paddingLeft: '10px' }}><p style={{ margin: 0, fontSize: '11pt', color: '#3b8ede', fontWeight: 'bold' }}>YOUR FUTURE. OUR FOCUS.</p><p style={{ margin: 0, fontSize: '8pt' }}>for more information or call <strong>+82 (0)2 736 6231</strong></p></td><td style={{ textAlign: 'right', verticalAlign: 'top', fontSize: '9pt', color: '#666' }}><p style={{ margin: 0, fontWeight: 'bold' }}>로이드인증원</p><p style={{ margin: 0 }}>서울특별시 중구 소월로 2길 30 T타워 2층</p></td></tr></tbody></table></div>;
}
