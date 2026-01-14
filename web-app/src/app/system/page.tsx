'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CONTRACT_TEMPLATE } from '../../constants/template';
import { generateDocx } from '../../utils/docxGenerator';

// --- Types ---
interface QuotationData {
    company_name: string;
    proposal_date: string;
    proposal_date_korean_long: string;
    proposal_no: string;
    service_description: string;
    lrqa_contact_name: string;
    lrqa_contact_email: string;
    lrqa_contact_phone: string;
    hq_address: string;
    target_sites: string;
    verification_year: string;
    reporting_period_full: string;
    assurance_level: string;
    materiality_level: string;
    audit_rate: string;
    stage1_days: string;
    stage1_cost: string;
    stage2_days: string;
    stage2_cost: string;
    stage3_days: string;
    stage3_cost: string;
    expenses: string;
    total_days: string;
    total_cost: string;
    final_cost: string;
    vat_type: string;
    vat_note_text: string;
    application_fee_text: string;
    quote_validity_days: string;
    client_representative_name: string;
    client_representative_title: string;
    reporting_deadline: string;
}

const DEFAULT_AUDIT_RATE = 1350000;

const ADM_DATA: Record<string, { email: string, phone: string }> = {
    '권대근': { email: 'daekeun.kwon@lrqa.com', phone: '02-3703-7514' },
    '김달': { email: 'dal.kim@lrqa.com', phone: '02-3703-7527' },
};

export default function GeneratorPage() {
    const [formData, setFormData] = useState({
        companyName: '',
        proposalNo: '',
        proposalDate: '',
        serviceDesc: '온실가스 배출량 Scope 1,2 제3자 검증',
        adminName: '권대근',
        hqAddress: '',
        targetSites: '본사 및 대상 사업장',
        vYear: '2025',
        assuranceLevel: '제한적 보증수준 (Limited level of assurance)',
        materialityLevel: '5%',
        auditRate: DEFAULT_AUDIT_RATE,
        s1Days: 1.0,
        s2Days: 3.0,
        s3Days: 2.0,
        expenses: 400000,
        appFeeType: 'exempt',
        appFeeAmount: 720000,
        vatType: '별도',
        validity: 90,
        clientRepName: '',
        clientRepTitle: '대표이사',
        reportingDeadline: '2026년 12월 31일',
        manualFinalCost: 0,
        isManualCost: false,
    });

    const formatNum = (n: number) => n.toLocaleString();

    const formatDateLong = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일`;
    };

    const calculations = useMemo(() => {
        const rate = formData.vatType === '포함' ? formData.auditRate * 1.1 : formData.auditRate;
        const s1Cost = formData.s1Days * rate;
        const s2Cost = formData.s2Days * rate;
        const s3Cost = formData.s3Days * rate;
        const expCost = formData.vatType === '포함' ? formData.expenses * 1.1 : formData.expenses;
        const totalDays = formData.s1Days + formData.s2Days + formData.s3Days;
        const calculatedTotal = Math.floor(s1Cost + s2Cost + s3Cost + expCost);

        return { s1Cost, s2Cost, s3Cost, expCost, totalDays, calculatedTotal };
    }, [formData]);

    useEffect(() => {
        if (!formData.isManualCost) {
            setFormData(prev => ({ ...prev, manualFinalCost: calculations.calculatedTotal }));
        }
    }, [calculations.calculatedTotal, formData.isManualCost]);

    useEffect(() => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        setFormData(prev => ({ ...prev, proposalDate: dateStr, proposalNo: `QR.GHG-${yyyy}${mm}${dd}-01` }));
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerate = () => {
        const rate_text = formatNum(Math.floor(formData.vatType === '포함' ? formData.auditRate * 1.1 : formData.auditRate));
        const vat_note = formData.vatType === '별도'
            ? '부가세(VAT)가 별도이며, 해당되는 요율로 청구됩니다.'
            : '부가세(VAT)가 포함된 금액이며, 해당되는 요율로 청구됩니다.';

        const appFeeText = formData.appFeeType === 'exempt'
            ? `면제 (${formatNum(formData.appFeeAmount)})`
            : `${formatNum(formData.appFeeAmount)}`;

        const adm = ADM_DATA[formData.adminName] || ADM_DATA['권대근'];
        const formatText = (val: string) => (val || '').replace(/ /g, '\u00a0').replace(/\n/g, '<br/>');

        const data: QuotationData = {
            company_name: formatText(formData.companyName),
            proposal_date: formData.proposalDate,
            proposal_date_korean_long: formatDateLong(formData.proposalDate),
            proposal_no: formData.proposalNo,
            service_description: formatText(formData.serviceDesc),
            lrqa_contact_name: formData.adminName,
            lrqa_contact_email: adm.email,
            lrqa_contact_phone: adm.phone,
            hq_address: formatText(formData.hqAddress),
            target_sites: formatText(formData.targetSites),
            verification_year: formData.vYear,
            reporting_period_full: `${formData.vYear}년 1월 ~ 12월 (12개월)`,
            assurance_level: formData.assuranceLevel,
            materiality_level: formData.materialityLevel,
            audit_rate: rate_text,
            stage1_days: formData.s1Days.toFixed(1),
            stage1_cost: formatNum(Math.floor(calculations.s1Cost)),
            stage2_days: formData.s2Days.toFixed(1),
            stage2_cost: formatNum(Math.floor(calculations.s2Cost)),
            stage3_days: formData.s3Days.toFixed(1),
            stage3_cost: formatNum(Math.floor(calculations.s3Cost)),
            expenses: formatNum(Math.floor(calculations.expCost)),
            total_days: calculations.totalDays.toFixed(1),
            total_cost: formatNum(Math.floor(calculations.calculatedTotal)),
            final_cost: formatNum(formData.manualFinalCost),
            vat_type: formData.vatType,
            vat_note_text: formatText(vat_note),
            application_fee_text: formatText(appFeeText),
            quote_validity_days: formData.validity.toString(),
            client_representative_name: formatText(formData.clientRepName),
            client_representative_title: formatText(formData.clientRepTitle),
            reporting_deadline: formatText(formData.reportingDeadline),
        };

        let rendered = CONTRACT_TEMPLATE;
        Object.entries(data).forEach(([key, val]) => {
            const placeholder = `{{ ${key} }}`;
            // Wrap in dynamic-value span for font consistency across browsers
            const wrappedVal = `<span class="dynamic-value">${val}</span>`;
            rendered = rendered.split(placeholder).join(wrappedVal);
        });

        // Forced Print Rules:
        // 1. Force A4 Portrait and zero margins
        // 2. Hide everything after the 17th page div (.pf:nth-child(17) is the last one)
        // 3. Ensure no weird ghost artifacts trigger 18th page
        const printStyles = `
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .pf {
      margin: 0 auto !important;
      box-shadow: none !important;
      page-break-after: always !important;
      page-break-inside: avoid !important;
    }
    /* Force consistent font for dynamic input to fix split font weights/sizes */
    .dynamic-value {
      font-family: "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", Dotum, sans-serif !important;
      font-weight: 500 !important;
      text-decoration: none !important;
      display: inline-block !important; /* Helps with spacing preservation */
    }
    /* Radical fix for 18th page: hide everything beyond 17 elements */
    .pf:nth-child(n+18) {
      display: none !important;
    }
    /* Hide pdf2htmlEX leftovers */
    #sidebar, .pi, .loading-indicator {
      display: none !important;
    }
  }
</style>
`;
        rendered = rendered.replace('</head>', `${printStyles}</head>`);

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(rendered);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 1000);
        }
    };

    const handleDownloadDocx = () => {
        const rate_text = formatNum(Math.floor(formData.vatType === '포함' ? formData.auditRate * 1.1 : formData.auditRate));
        const vat_note = formData.vatType === '별도'
            ? '부가세(VAT)가 별도이며, 해당되는 요율로 청구됩니다.'
            : '부가세(VAT)가 포함된 금액이며, 해당되는 요율로 청구됩니다.';

        const appFeeText = formData.appFeeType === 'exempt'
            ? `면제 (${formatNum(formData.appFeeAmount)})`
            : `${formatNum(formData.appFeeAmount)}`;

        const adm = ADM_DATA[formData.adminName] || ADM_DATA['권대근'];

        const rawText = (val: string) => (val || '').trim();

        const data: QuotationData = {
            company_name: rawText(formData.companyName),
            proposal_date: formData.proposalDate,
            proposal_date_korean_long: formatDateLong(formData.proposalDate),
            proposal_no: formData.proposalNo,
            service_description: rawText(formData.serviceDesc),
            lrqa_contact_name: formData.adminName,
            lrqa_contact_email: adm.email,
            lrqa_contact_phone: adm.phone,
            hq_address: rawText(formData.hqAddress),
            target_sites: rawText(formData.targetSites),
            verification_year: formData.vYear,
            reporting_period_full: `${formData.vYear}년 1월 ~ 12월 (12개월)`,
            assurance_level: formData.assuranceLevel,
            materiality_level: formData.materialityLevel,
            audit_rate: rate_text,
            stage1_days: formData.s1Days.toFixed(1),
            stage1_cost: formatNum(Math.floor(calculations.s1Cost)),
            stage2_days: formData.s2Days.toFixed(1),
            stage2_cost: formatNum(Math.floor(calculations.s2Cost)),
            stage3_days: formData.s3Days.toFixed(1),
            stage3_cost: formatNum(Math.floor(calculations.s3Cost)),
            expenses: formatNum(Math.floor(calculations.expCost)),
            total_days: calculations.totalDays.toFixed(1),
            total_cost: formatNum(Math.floor(calculations.calculatedTotal)),
            final_cost: formatNum(formData.manualFinalCost),
            vat_type: formData.vatType,
            vat_note_text: rawText(vat_note),
            application_fee_text: rawText(appFeeText),
            quote_validity_days: formData.validity.toString(),
            client_representative_name: rawText(formData.clientRepName),
            client_representative_title: rawText(formData.clientRepTitle),
            reporting_deadline: rawText(formData.reportingDeadline),
        };

        generateDocx(data);
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans selection:bg-blue-100">
            <div className="h-1.5 bg-blue-600 w-full fixed top-0 z-50"></div>

            <main className="max-w-6xl mx-auto px-4 py-12">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        LRQA <span className="text-blue-600">Quotation System</span>
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">

                        {/* 1. Services */}
                        <section className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Service Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-600">서비스 용역 설명</label>
                                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.serviceDesc} onChange={(e) => handleChange('serviceDesc', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600">담당 심사원</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                                        value={formData.adminName}
                                        onChange={(e) => handleChange('adminName', e.target.value)}
                                    >
                                        <option value="권대근">권대근 (LRQA)</option>
                                        <option value="김달">김달 (LRQA)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600">발행 일자</label>
                                    <input type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" value={formData.proposalDate} onChange={(e) => handleChange('proposalDate', e.target.value)} />
                                </div>
                            </div>
                        </section>

                        {/* 2. Client */}
                        <section className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Client Details</h2>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600">고객사 명칭</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="회사명 입력" value={formData.companyName} onChange={(e) => handleChange('companyName', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600">대표자 성함</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="홍길동" value={formData.clientRepName} onChange={(e) => handleChange('clientRepName', e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600">본사 주소</label>
                                    <textarea rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 resize-none font-sans" placeholder="주소를 입력하세요 (띄어쓰기 반영됨)" value={formData.hqAddress} onChange={(e) => handleChange('hqAddress', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600">본사 및 대상 사업장</label>
                                    <textarea
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium font-sans focus:ring-2 focus:ring-blue-500 outline-none transition-all overflow-hidden"
                                        placeholder="본사 및 대상 사업장 (줄바꿈 반영됨)"
                                        value={formData.targetSites}
                                        onChange={(e) => {
                                            handleChange('targetSites', e.target.value);
                                            // Auto-expand height
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        style={{ minHeight: '80px' }}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 3. Technical */}
                        <section className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Technical Scope</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600">중요성 기준 (Materiality)</label>
                                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium" value={formData.materialityLevel} onChange={(e) => handleChange('materialityLevel', e.target.value)}>
                                        <option value="5%">5%</option>
                                        <option value="10%">10%</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600">보증 수준 (Assurance)</label>
                                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium" value={formData.assuranceLevel} onChange={(e) => handleChange('assuranceLevel', e.target.value)}>
                                        <option value="제한적 보증수준 (Limited level of assurance)">제한적 (Limited)</option>
                                        <option value="합리적 보증수준 (Reasonable level of assurance)">합리적 (Reasonable)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600">보고 마감기한</label>
                                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium" value={formData.reportingDeadline} onChange={(e) => handleChange('reportingDeadline', e.target.value)} placeholder="2026년 12월 31일" />
                                </div>
                            </div>
                        </section>

                        {/* 4. Financial */}
                        <section className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Man-days & Costs</h2>
                            <div className="space-y-8">
                                <div className="grid grid-cols-3 gap-4">
                                    {['s1Days', 's2Days', 's3Days'].map((field, i) => (
                                        <div key={field} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Stage {i + 1} MD</label>
                                            <input type="number" step="0.1" className="bg-transparent text-xl font-bold w-full outline-none" value={(formData as any)[field]} onChange={(e) => handleChange(field, parseFloat(e.target.value) || 0)} />
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600">심사 요율 (₩)</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold" value={formData.auditRate.toLocaleString()} onChange={(e) => handleChange('auditRate', parseInt(e.target.value.replace(/,/g, '')) || 0)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600">제경비 (₩)</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold" value={formData.expenses.toLocaleString()} onChange={(e) => handleChange('expenses', parseInt(e.target.value.replace(/,/g, '')) || 0)} />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Summary */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-[#1e293b] rounded-2xl p-8 text-white shadow-xl">
                                <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Quote Summary</h3>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl">
                                        <span className="text-xs font-bold text-slate-400 uppercase">합계 (Sum)</span>
                                        <span className="text-lg font-bold text-white">₩{formatNum(calculations.calculatedTotal)}</span>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">최종 제안 금액 (수정 가능)</span>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full bg-slate-800 border-2 border-blue-500/30 rounded-xl px-4 py-3 text-2xl font-black text-blue-400 outline-none focus:border-blue-500 transition-all"
                                                value={formData.manualFinalCost.toLocaleString()}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value.replace(/,/g, '')) || 0;
                                                    setFormData(prev => ({ ...prev, manualFinalCost: val, isManualCost: true }));
                                                }}
                                            />
                                            <button
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-white"
                                                onClick={() => setFormData(prev => ({ ...prev, isManualCost: false }))}
                                            >
                                                Reset
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleChange('vatType', formData.vatType === '별도' ? '포함' : '별도')} className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800 px-3 py-1 rounded-md">
                                                VAT {formData.vatType} 선택됨
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 mt-8">
                                    <button
                                        onClick={handleGenerate}
                                        className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                                    >
                                        제안서 PDF 인쇄
                                    </button>
                                    <button
                                        onClick={handleDownloadDocx}
                                        className="w-full border-2 border-blue-500/50 hover:bg-blue-500/10 py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span>Word 제안서 다운로드</span>
                                        <span className="text-xs opacity-60">(.docx)</span>
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 text-blue-900 text-[11px] leading-relaxed font-medium">
                                <span>ℹ️</span>
                                <p>
                                    인쇄 미리보기 시 <b>용지: A4</b>, <b>방향: 세로</b>가 자동 고정되도록 설정되었습니다.<br />
                                    추가 여백이 보일 경우 <b>여백: 최소</b>를 선택해 주세요.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
