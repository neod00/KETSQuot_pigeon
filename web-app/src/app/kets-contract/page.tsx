'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { generateKetsDocx } from '../../utils/docxGenerator';
import GenerationHistory, { saveHistoryRecord } from '../../components/GenerationHistory';

// --- Types ---
interface KetsContractData {
    company_name: string;
    proposal_date: string;
    proposal_no: string;
    lrqa_contact_name: string;
    lrqa_contact_email: string;
    lrqa_contact_phone: string;
    hq_address: string;
    target_sites: string;
    ghg_declaration_period: string;
    materiality: string;
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
    // 공평성 자가진단표 관련 필드
    business_registration: string;
    client_contact: string;
    industry_type: string;
}

const DEFAULT_AUDIT_RATE = 1050000;

const ADM_DATA: Record<string, { email: string, phone: string }> = {
    '권대근': { email: 'daekeun.kwon@lrqa.com', phone: '02-3703-7514' },
    '김달': { email: 'dal.kim@lrqa.com', phone: '02-3703-7527' },
};

export default function KetsContractPage() {
    const [formData, setFormData] = useState({
        companyName: '',
        proposalNo: '',
        proposalDate: '',
        adminName: '권대근',
        hqAddress: '',
        targetSites: '본사 및 대상 사업장',
        ghgDeclarationPeriod: '2025년 01월 01일~2025년 12월 31일',
        materiality: '5%',
        auditRate: DEFAULT_AUDIT_RATE,
        s1Days: 1.0,
        s2Days: 5.0,
        s3Days: 3.0,
        expenses: 600000,
        vatType: '별도',
        manualFinalCost: 0,
        isManualCost: false,
        // 공평성 자가진단표 관련 필드
        businessRegistration: '',
        clientContact: '',
        industryType: '',
    });

    const formatNum = (n: number) => n.toLocaleString();

    // 합계 일수: 소수점 둘째자리가 0이면 제외 (9.50 → 9.5, 9.25 → 9.25)
    const formatTotalDays = (num: number) => {
        const fixed2 = num.toFixed(2);
        return fixed2.endsWith('0') ? num.toFixed(1) : fixed2;
    };

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
        setFormData(prev => ({ ...prev, proposalDate: dateStr, proposalNo: `QR.KETS-${yyyy}${mm}${dd}-01` }));
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // 이력 저장 헬퍼
    const saveToHistory = () => {
        saveHistoryRecord(
            'kets-contract', 'K-ETS 계약서',
            formData.companyName, formData.manualFinalCost, formData.vatType,
            formData,
            { s1Days: formData.s1Days, s2Days: formData.s2Days, s3Days: formData.s3Days, expenses: formData.expenses, auditRate: formData.auditRate }
        );
    };

    const handleDownloadDocx = (sourceData?: any) => {
        const fd = sourceData || formData;
        const adm = ADM_DATA[fd.adminName] || ADM_DATA['권대근'];
        const rawText = (val: string) => (val || '').trim();

        // 재계산 (sourceData에서 불러온 경우)
        const rate = fd.vatType === '포함' ? fd.auditRate * 1.1 : fd.auditRate;
        const s1Cost = fd.s1Days * rate;
        const s2Cost = fd.s2Days * rate;
        const s3Cost = fd.s3Days * rate;
        const expCost = fd.vatType === '포함' ? fd.expenses * 1.1 : fd.expenses;
        const totalDays = fd.s1Days + fd.s2Days + fd.s3Days;
        const calculatedTotal = Math.floor(s1Cost + s2Cost + s3Cost + expCost);

        const data: KetsContractData = {
            company_name: rawText(fd.companyName),
            proposal_date: formatDateLong(fd.proposalDate),
            proposal_no: fd.proposalNo,
            lrqa_contact_name: fd.adminName,
            lrqa_contact_email: adm.email,
            lrqa_contact_phone: adm.phone,
            hq_address: rawText(fd.hqAddress),
            target_sites: rawText(fd.targetSites),
            ghg_declaration_period: rawText(fd.ghgDeclarationPeriod),
            materiality: fd.materiality,
            stage1_days: fd.s1Days.toFixed(1),
            stage1_cost: formatNum(Math.floor(s1Cost)),
            stage2_days: fd.s2Days.toFixed(1),
            stage2_cost: formatNum(Math.floor(s2Cost)),
            stage3_days: fd.s3Days.toFixed(1),
            stage3_cost: formatNum(Math.floor(s3Cost)),
            expenses: formatNum(Math.floor(expCost)),
            total_days: formatTotalDays(totalDays),
            total_cost: formatNum(Math.floor(calculatedTotal)),
            final_cost: formatNum(fd.manualFinalCost),
            vat_type: fd.vatType,
            business_registration: rawText(fd.businessRegistration),
            client_contact: rawText(fd.clientContact),
            industry_type: rawText(fd.industryType),
        };

        generateKetsDocx(data, fd.companyName);
        if (!sourceData) saveToHistory();
    };

    const handlePrintPdf = async (sourceData?: any) => {
        const fd = sourceData || formData;
        const adm = ADM_DATA[fd.adminName] || ADM_DATA['권대근'];
        const formatText = (val: string) => (val || '').replace(/ /g, '\u00a0').replace(/\n/g, '<br/>');

        // 재계산
        const rate = fd.vatType === '포함' ? fd.auditRate * 1.1 : fd.auditRate;
        const s1Cost = fd.s1Days * rate;
        const s2Cost = fd.s2Days * rate;
        const s3Cost = fd.s3Days * rate;
        const expCost = fd.vatType === '포함' ? fd.expenses * 1.1 : fd.expenses;
        const totalDays = fd.s1Days + fd.s2Days + fd.s3Days;
        const calculatedTotal = Math.floor(s1Cost + s2Cost + s3Cost + expCost);

        const data: Record<string, string> = {
            company_name: formatText(fd.companyName),
            proposal_date: formatDateLong(fd.proposalDate),
            proposal_no: fd.proposalNo,
            lrqa_contact_name: fd.adminName,
            lrqa_contact_email: adm.email,
            lrqa_contact_phone: adm.phone,
            hq_address: formatText(fd.hqAddress),
            target_sites: formatText(fd.targetSites),
            ghg_declaration_period: formatText(fd.ghgDeclarationPeriod),
            materiality: fd.materiality,
            stage1_days: fd.s1Days.toFixed(1) + ' days',
            stage1_cost: formatNum(Math.floor(s1Cost)),
            stage2_days: fd.s2Days.toFixed(1) + ' days',
            stage2_cost: formatNum(Math.floor(s2Cost)),
            stage3_days: fd.s3Days.toFixed(1) + ' days',
            stage3_cost: formatNum(Math.floor(s3Cost)),
            expenses: formatNum(Math.floor(expCost)),
            total_days: formatTotalDays(totalDays) + ' days',
            total_cost: formatNum(Math.floor(calculatedTotal)),
            final_cost: formatNum(fd.manualFinalCost),
            vat_type: `VAT ${fd.vatType}`,
            business_registration: formatText(fd.businessRegistration),
            client_contact: formatText(fd.clientContact),
            industry_type: formatText(fd.industryType),
        };

        try {
            const response = await fetch('/K-ETSemission_template.html');
            let htmlContent = await response.text();

            const pdfFileName = `LRQA_온실가스 명세서 검증 제안서 계약서_${fd.companyName || "기업명"}`.replace(/[/\\?%*:|"<>]/g, '-');
            htmlContent = htmlContent.replace('<head>', `<head><title>${pdfFileName}</title>`);

            Object.entries(data).forEach(([key, val]) => {
                const placeholder = `{${key}}`;
                const wrappedVal = `<span class="dynamic-value">${val}</span>`;
                htmlContent = htmlContent.split(placeholder).join(wrappedVal);
            });

            const printStyles = `
<style>
  @page { size: A4 portrait; margin: 0; }
  @media print {
    html, body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .pf { margin: 0 auto !important; box-shadow: none !important; page-break-after: always !important; page-break-inside: avoid !important; }
    .dynamic-value { font-family: "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", Dotum, sans-serif !important; font-weight: 500 !important; text-decoration: none !important; display: inline !important; white-space: nowrap !important; }
    #sidebar, .pi, .loading-indicator { display: none !important; }
  }
</style>
`;
            htmlContent = htmlContent.replace('</head>', `${printStyles}</head>`);

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                setTimeout(() => { printWindow.print(); }, 1000);
            }
            if (!sourceData) saveToHistory();
        } catch (error) {
            console.error('Failed to load HTML template:', error);
            alert('PDF 템플릿을 불러올 수 없습니다.');
        }
    };

    // 이력에서 불러오기 (폼 채움)
    const handleHistoryRestore = (savedFormData: any) => {
        setFormData(savedFormData);
    };

    // 이력에서 다시 생성 (바로 PDF)
    const handleHistoryRegenerate = (savedFormData: any) => {
        handlePrintPdf(savedFormData);
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans selection:bg-emerald-100">
            <div className="h-1.5 bg-emerald-600 w-full fixed top-0 z-50"></div>

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Link href="/" className="text-slate-500 hover:text-emerald-600 transition-colors font-medium flex items-center gap-1 group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Home
                        </Link>
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            K-ETS 명세서 검증 <span className="text-emerald-600">계약서 생성기</span>
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-4">

                        {/* 1. Service Overview */}
                        <section className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Service Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600">담당 심사원</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                                        value={formData.adminName}
                                        onChange={(e) => handleChange('adminName', e.target.value)}
                                    >
                                        <option value="권대근">권대근 (LRQA)</option>
                                        <option value="김달">김달 (LRQA)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600">제안서 번호</label>
                                    <input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="QR.KETS-YYYYMMDD-01" value={formData.proposalNo} onChange={(e) => handleChange('proposalNo', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600">발행 일자</label>
                                    <input type="date" className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" value={formData.proposalDate} onChange={(e) => handleChange('proposalDate', e.target.value)} />
                                </div>
                            </div>
                        </section>

                        {/* 2. Client */}
                        <section className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Client Details</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">고객사 명칭</label>
                                        <input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200" placeholder="회사명 입력" value={formData.companyName} onChange={(e) => handleChange('companyName', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">사업자(법인)등록번호</label>
                                        <input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200" placeholder="000-00-00000" value={formData.businessRegistration} onChange={(e) => handleChange('businessRegistration', e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">담당자/연락처</label>
                                        <input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200" placeholder="홍길동 / 010-1234-5678" value={formData.clientContact} onChange={(e) => handleChange('clientContact', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">업종</label>
                                        <input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200" placeholder="제조업, 서비스업 등" value={formData.industryType} onChange={(e) => handleChange('industryType', e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">중요성 기준 (Materiality)</label>
                                        <select className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium" value={formData.materiality} onChange={(e) => handleChange('materiality', e.target.value)}>
                                            <option value="2%">2%</option>
                                            <option value="2.5%">2.5%</option>
                                            <option value="5%">5%</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600">본사 주소</label>
                                    <textarea rows={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 resize-none font-sans" placeholder="주소를 입력하세요 (띄어쓰기 반영됨)" value={formData.hqAddress} onChange={(e) => handleChange('hqAddress', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600">본사 및 대상 사업장</label>
                                    <textarea
                                        rows={2}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium font-sans focus:ring-2 focus:ring-emerald-500 outline-none transition-all overflow-hidden"
                                        placeholder="본사 및 대상 사업장 (줄바꿈 반영됨)"
                                        value={formData.targetSites}
                                        onChange={(e) => {
                                            handleChange('targetSites', e.target.value);
                                            // Auto-expand height
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        style={{ minHeight: '60px' }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600">온실가스 선언이 적용되는 기간</label>
                                    <input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.ghgDeclarationPeriod} onChange={(e) => handleChange('ghgDeclarationPeriod', e.target.value)} placeholder="2025년 01월 01일~2025년 12월 31일" />
                                </div>
                            </div>
                        </section>

                        {/* 3. Man-days & Costs */}
                        <section className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Man-days & Costs</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                    {['s1Days', 's2Days', 's3Days'].map((field, i) => (
                                        <div key={field} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Stage {i + 1} MD</label>
                                            <input type="number" step="0.1" className="bg-transparent text-lg font-bold w-full outline-none" value={(formData as any)[field]} onChange={(e) => handleChange(field, parseFloat(e.target.value) || 0)} />
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">심사 요율 (₩)</label>
                                        <input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold" value={formData.auditRate.toLocaleString()} onChange={(e) => handleChange('auditRate', parseInt(e.target.value.replace(/,/g, '')) || 0)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">제경비 (₩)</label>
                                        <input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold" value={formData.expenses.toLocaleString()} onChange={(e) => handleChange('expenses', parseInt(e.target.value.replace(/,/g, '')) || 0)} />
                                    </div>
                                </div>
                                {/* VAT 선택 */}
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <label className="text-xs font-bold text-emerald-700 mb-2 block">부가가치세 (VAT) 구분</label>
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="vatType"
                                                value="별도"
                                                checked={formData.vatType === '별도'}
                                                onChange={(e) => handleChange('vatType', e.target.value)}
                                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm font-medium text-slate-700">VAT 별도 (기본)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="vatType"
                                                value="포함"
                                                checked={formData.vatType === '포함'}
                                                onChange={(e) => handleChange('vatType', e.target.value)}
                                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm font-medium text-slate-700">VAT 포함</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Summary */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-[#064e3b] rounded-2xl p-8 text-white shadow-xl">
                                <h3 className="text-emerald-300 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Quote Summary</h3>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-emerald-900/50 p-4 rounded-xl">
                                        <span className="text-xs font-bold text-emerald-300 uppercase">합계 (Sum)</span>
                                        <span className="text-lg font-bold text-white">₩{formatNum(calculations.calculatedTotal)}</span>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-black text-emerald-400 uppercase">최종 제안 금액 (수정 가능)</span>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full bg-emerald-900 border-2 border-emerald-500/30 rounded-xl px-4 py-3 text-2xl font-black text-emerald-300 outline-none focus:border-emerald-400 transition-all"
                                                value={formData.manualFinalCost.toLocaleString()}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value.replace(/,/g, '')) || 0;
                                                    setFormData(prev => ({ ...prev, manualFinalCost: val, isManualCost: true }));
                                                }}
                                            />
                                            <button
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-400 hover:text-white"
                                                onClick={() => setFormData(prev => ({ ...prev, isManualCost: false }))}
                                            >
                                                Reset
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleChange('vatType', formData.vatType === '별도' ? '포함' : '별도')} className="text-[10px] font-bold text-emerald-300 hover:text-white bg-emerald-900 px-3 py-1 rounded-md">
                                                VAT {formData.vatType} 선택됨
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 mt-8">
                                    <button
                                        onClick={() => handlePrintPdf()}
                                        className="w-full bg-emerald-500 hover:bg-emerald-400 py-4 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                                    >
                                        제안서 PDF 인쇄
                                    </button>
                                    <button
                                        onClick={() => handleDownloadDocx()}
                                        className="w-full border-2 border-emerald-500/50 hover:bg-emerald-500/10 py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span>Word 계약서 다운로드</span>
                                        <span className="text-xs opacity-60">(.docx)</span>
                                    </button>
                                </div>
                            </div>

                            {/* 생성 이력 */}
                            <GenerationHistory
                                pageType="kets-contract"
                                pageLabel="K-ETS 계약서"
                                onRestore={handleHistoryRestore}
                                onRegenerate={handleHistoryRegenerate}
                            />

                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3 text-emerald-900 text-[11px] leading-relaxed font-medium">
                                <span>ℹ️</span>
                                <p>
                                    K-ETS 명세서 검증 계약서를 생성합니다.<br />
                                    템플릿 기반으로 Word 파일이 자동 생성됩니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
