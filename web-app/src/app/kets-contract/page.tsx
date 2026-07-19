'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { generateKetsDocx, type KetsContractType } from '../../utils/docxGenerator';
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
    target_year: string;
    audit_rate: string;
    statement_stage1_days: string;
    statement_stage1_cost: string;
    statement_stage2_days: string;
    statement_stage2_cost: string;
    statement_stage3_days: string;
    statement_stage3_cost: string;
    statement_expenses: string;
    statement_total_days: string;
    statement_total_cost: string;
    statement_final_cost: string;
    plan_stage1_days: string;
    plan_stage1_cost: string;
    plan_stage2_days: string;
    plan_stage2_cost: string;
    plan_stage3_days: string;
    plan_stage3_cost: string;
    plan_expenses: string;
    plan_total_days: string;
    plan_total_cost: string;
    plan_final_cost: string;
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

const CONTRACT_TYPE_LABELS: Record<KetsContractType, string> = {
    statement: '명세서 검증',
    plan: '배출량산정계획서 검증',
    combined: '명세서 + 배출량산정계획서 검증',
};

const calculateFee = (
    s1Days: number,
    s2Days: number,
    s3Days: number,
    expenses: number,
    auditRate: number,
    vatType: string,
) => {
    const rate = vatType === '포함' ? auditRate * 1.1 : auditRate;
    const s1Cost = s1Days * rate;
    const s2Cost = s2Days * rate;
    const s3Cost = s3Days * rate;
    const expCost = vatType === '포함' ? expenses * 1.1 : expenses;
    const totalDays = s1Days + s2Days + s3Days;
    const calculatedTotal = Math.floor(s1Cost + s2Cost + s3Cost + expCost);

    return { s1Cost, s2Cost, s3Cost, expCost, totalDays, calculatedTotal };
};

export default function KetsContractPage() {
    const [formData, setFormData] = useState({
        contractType: 'statement' as KetsContractType,
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
        planS1Days: 1.0,
        planS2Days: 2.5,
        planS3Days: 1.0,
        planExpenses: 600000,
        planManualFinalCost: 0,
        planIsManualCost: false,
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

    const calculations = useMemo(
        () => calculateFee(
            formData.s1Days,
            formData.s2Days,
            formData.s3Days,
            formData.expenses,
            formData.auditRate,
            formData.vatType,
        ),
        [formData.s1Days, formData.s2Days, formData.s3Days, formData.expenses, formData.auditRate, formData.vatType],
    );

    const planCalculations = useMemo(
        () => calculateFee(
            formData.planS1Days,
            formData.planS2Days,
            formData.planS3Days,
            formData.planExpenses,
            formData.auditRate,
            formData.vatType,
        ),
        [formData.planS1Days, formData.planS2Days, formData.planS3Days, formData.planExpenses, formData.auditRate, formData.vatType],
    );

    useEffect(() => {
        if (!formData.isManualCost) {
            setFormData(prev => ({ ...prev, manualFinalCost: calculations.calculatedTotal }));
        }
    }, [calculations.calculatedTotal, formData.isManualCost]);

    useEffect(() => {
        if (formData.contractType === 'combined' && !formData.planIsManualCost) {
            setFormData(prev => ({ ...prev, planManualFinalCost: planCalculations.calculatedTotal }));
        }
    }, [formData.contractType, formData.planIsManualCost, planCalculations.calculatedTotal]);

    useEffect(() => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        setFormData(prev => ({ ...prev, proposalDate: dateStr, proposalNo: `QR.KETS-${yyyy}${mm}${dd}-01` }));
    }, []);

    // 메인페이지 이력에서 넘어온 경우 데이터 복원
    useEffect(() => {
        const raw = localStorage.getItem('history_action');
        if (!raw) return;
        localStorage.removeItem('history_action');
        try {
            const { action, formData: savedData, pageType } = JSON.parse(raw);
            if (pageType !== 'kets-contract') return;
            if (action === 'restore') {
                setFormData(prev => ({
                    ...prev,
                    ...savedData,
                    contractType: savedData.contractType || 'statement',
                    planS1Days: savedData.planS1Days ?? 1.0,
                    planS2Days: savedData.planS2Days ?? 2.5,
                    planS3Days: savedData.planS3Days ?? 1.0,
                    planExpenses: savedData.planExpenses ?? 600000,
                    planManualFinalCost: savedData.planManualFinalCost ?? 0,
                    planIsManualCost: savedData.planIsManualCost ?? false,
                }));
            } else if (action === 'regenerate') {
                const normalized = {
                    ...formData,
                    ...savedData,
                    contractType: savedData.contractType || 'statement',
                    planS1Days: savedData.planS1Days ?? 1.0,
                    planS2Days: savedData.planS2Days ?? 2.5,
                    planS3Days: savedData.planS3Days ?? 1.0,
                    planExpenses: savedData.planExpenses ?? 600000,
                    planManualFinalCost: savedData.planManualFinalCost ?? 0,
                    planIsManualCost: savedData.planIsManualCost ?? false,
                };
                setFormData(normalized);
                setTimeout(() => handleDownloadDocx(normalized), 300);
            }
        } catch { /* ignore */ }
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleContractTypeChange = (contractType: KetsContractType) => {
        const primaryDefaults = contractType === 'plan'
            ? { s1Days: 1.0, s2Days: 2.5, s3Days: 1.0 }
            : contractType === 'combined'
                ? { s1Days: 1.0, s2Days: 3.0, s3Days: 1.0 }
                : { s1Days: 1.0, s2Days: 5.0, s3Days: 3.0 };

        setFormData(prev => ({
            ...prev,
            contractType,
            ...primaryDefaults,
            manualFinalCost: 0,
            isManualCost: false,
            planS1Days: 1.0,
            planS2Days: 2.5,
            planS3Days: 1.0,
            planManualFinalCost: 0,
            planIsManualCost: false,
        }));
    };

    // 이력 저장 헬퍼
    const saveToHistory = () => {
        const isCombined = formData.contractType === 'combined';
        const finalCost = formData.manualFinalCost + (isCombined ? formData.planManualFinalCost : 0);
        saveHistoryRecord(
            'kets-contract', `K-ETS ${CONTRACT_TYPE_LABELS[formData.contractType]} 계약서`,
            formData.companyName, finalCost, formData.vatType,
            formData,
            {
                contractType: formData.contractType,
                s1Days: formData.s1Days,
                s2Days: formData.s2Days,
                s3Days: formData.s3Days,
                expenses: formData.expenses,
                auditRate: formData.auditRate,
                ...(isCombined ? {
                    planS1Days: formData.planS1Days,
                    planS2Days: formData.planS2Days,
                    planS3Days: formData.planS3Days,
                    planExpenses: formData.planExpenses,
                } : {}),
            }
        );
    };

    const handleDownloadDocx = (sourceData?: any) => {
        const fd = sourceData || formData;
        const contractType: KetsContractType = fd.contractType || 'statement';
        const adm = ADM_DATA[fd.adminName] || ADM_DATA['권대근'];
        const rawText = (val: string) => (val || '').trim();
        const primary = calculateFee(
            Number(fd.s1Days) || 0,
            Number(fd.s2Days) || 0,
            Number(fd.s3Days) || 0,
            Number(fd.expenses) || 0,
            Number(fd.auditRate) || 0,
            fd.vatType,
        );
        const plan = calculateFee(
            Number(fd.planS1Days) || 0,
            Number(fd.planS2Days) || 0,
            Number(fd.planS3Days) || 0,
            Number(fd.planExpenses) || 0,
            Number(fd.auditRate) || 0,
            fd.vatType,
        );
        const yearMatch = rawText(fd.ghgDeclarationPeriod).match(/(\d{4})/);
        const targetYear = yearMatch ? `${yearMatch[1]}년` : rawText(fd.ghgDeclarationPeriod);

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
            stage1_days: Number(fd.s1Days).toFixed(1),
            stage1_cost: formatNum(Math.floor(primary.s1Cost)),
            stage2_days: Number(fd.s2Days).toFixed(1),
            stage2_cost: formatNum(Math.floor(primary.s2Cost)),
            stage3_days: Number(fd.s3Days).toFixed(1),
            stage3_cost: formatNum(Math.floor(primary.s3Cost)),
            expenses: formatNum(Math.floor(primary.expCost)),
            total_days: formatTotalDays(primary.totalDays),
            total_cost: formatNum(primary.calculatedTotal),
            final_cost: formatNum(Number(fd.manualFinalCost) || 0),
            vat_type: fd.vatType,
            target_year: targetYear,
            audit_rate: formatNum(Number(fd.auditRate) || 0),
            statement_stage1_days: Number(fd.s1Days).toFixed(1),
            statement_stage1_cost: formatNum(Math.floor(primary.s1Cost)),
            statement_stage2_days: Number(fd.s2Days).toFixed(1),
            statement_stage2_cost: formatNum(Math.floor(primary.s2Cost)),
            statement_stage3_days: Number(fd.s3Days).toFixed(1),
            statement_stage3_cost: formatNum(Math.floor(primary.s3Cost)),
            statement_expenses: formatNum(Math.floor(primary.expCost)),
            statement_total_days: formatTotalDays(primary.totalDays),
            statement_total_cost: formatNum(primary.calculatedTotal),
            statement_final_cost: formatNum(Number(fd.manualFinalCost) || 0),
            plan_stage1_days: Number(fd.planS1Days).toFixed(1),
            plan_stage1_cost: formatNum(Math.floor(plan.s1Cost)),
            plan_stage2_days: Number(fd.planS2Days).toFixed(1),
            plan_stage2_cost: formatNum(Math.floor(plan.s2Cost)),
            plan_stage3_days: Number(fd.planS3Days).toFixed(1),
            plan_stage3_cost: formatNum(Math.floor(plan.s3Cost)),
            plan_expenses: formatNum(Math.floor(plan.expCost)),
            plan_total_days: formatTotalDays(plan.totalDays),
            plan_total_cost: formatNum(plan.calculatedTotal),
            plan_final_cost: formatNum(Number(fd.planManualFinalCost) || 0),
            business_registration: rawText(fd.businessRegistration),
            client_contact: rawText(fd.clientContact),
            industry_type: rawText(fd.industryType),
        };

        generateKetsDocx(data, fd.companyName, contractType);
        if (!sourceData) saveToHistory();
    };

    const handlePrintPdf = async (sourceData?: any) => {
        const fd = sourceData || formData;
        if ((fd.contractType || 'statement') !== 'statement') {
            handleDownloadDocx(sourceData);
            return;
        }
        const adm = ADM_DATA[fd.adminName] || ADM_DATA['권대근'];
        const formatText = (val: string) => (val || '').replace(/ /g, '\u00a0').replace(/\n/g, '<br/>');

        const primary = calculateFee(
            Number(fd.s1Days) || 0,
            Number(fd.s2Days) || 0,
            Number(fd.s3Days) || 0,
            Number(fd.expenses) || 0,
            Number(fd.auditRate) || 0,
            fd.vatType,
        );

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
            stage1_cost: formatNum(Math.floor(primary.s1Cost)),
            stage2_days: fd.s2Days.toFixed(1) + ' days',
            stage2_cost: formatNum(Math.floor(primary.s2Cost)),
            stage3_days: fd.s3Days.toFixed(1) + ' days',
            stage3_cost: formatNum(Math.floor(primary.s3Cost)),
            expenses: formatNum(Math.floor(primary.expCost)),
            total_days: formatTotalDays(primary.totalDays) + ' days',
            total_cost: formatNum(primary.calculatedTotal),
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
        setFormData(prev => ({
            ...prev,
            ...savedFormData,
            contractType: savedFormData.contractType || 'statement',
            planS1Days: savedFormData.planS1Days ?? 1.0,
            planS2Days: savedFormData.planS2Days ?? 2.5,
            planS3Days: savedFormData.planS3Days ?? 1.0,
            planExpenses: savedFormData.planExpenses ?? 600000,
            planManualFinalCost: savedFormData.planManualFinalCost ?? 0,
            planIsManualCost: savedFormData.planIsManualCost ?? false,
        }));
    };

    // 이력에서 다시 생성 (바로 Word)
    const handleHistoryRegenerate = (savedFormData: any) => {
        handleDownloadDocx(savedFormData);
    };

    const isCombined = formData.contractType === 'combined';
    const calculatedDisplayTotal = calculations.calculatedTotal + (isCombined ? planCalculations.calculatedTotal : 0);
    const finalDisplayTotal = formData.manualFinalCost + (isCombined ? formData.planManualFinalCost : 0);
    const feeGroups = isCombined
        ? [
            {
                key: 'statement',
                title: '명세서 검증 비용',
                dayFields: ['s1Days', 's2Days', 's3Days'],
                expenseField: 'expenses',
                calculatedTotal: calculations.calculatedTotal,
            },
            {
                key: 'plan',
                title: '배출량산정계획서 검증 비용',
                dayFields: ['planS1Days', 'planS2Days', 'planS3Days'],
                expenseField: 'planExpenses',
                calculatedTotal: planCalculations.calculatedTotal,
            },
        ]
        : [
            {
                key: 'primary',
                title: CONTRACT_TYPE_LABELS[formData.contractType],
                dayFields: ['s1Days', 's2Days', 's3Days'],
                expenseField: 'expenses',
                calculatedTotal: calculations.calculatedTotal,
            },
        ];
    const finalAmountInputs = isCombined
        ? [
            { label: '명세서 최종 제안 금액', valueField: 'manualFinalCost', manualField: 'isManualCost' },
            { label: '배출량산정계획서 최종 제안 금액', valueField: 'planManualFinalCost', manualField: 'planIsManualCost' },
        ]
        : [
            { label: '최종 제안 금액 (수정 가능)', valueField: 'manualFinalCost', manualField: 'isManualCost' },
        ];

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#f1f5f9] pb-28 text-slate-900 font-sans selection:bg-emerald-100 lg:pb-0">
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
                            K-ETS 검증 <span className="text-emerald-600">계약서 생성기</span>
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-4">

                        {/* 1. Service Overview */}
                        <section className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Service Overview</h2>
                            <div className="mb-4 space-y-1">
                                <label className="text-xs font-bold text-slate-600">계약서 서식</label>
                                <select
                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                                    value={formData.contractType}
                                    onChange={(e) => handleContractTypeChange(e.target.value as KetsContractType)}
                                >
                                    <option value="statement">온실가스 명세서 검증</option>
                                    <option value="plan">온실가스 배출량산정계획서 검증</option>
                                    <option value="combined">온실가스 명세서 + 배출량산정계획서 검증</option>
                                </select>
                            </div>
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
                            <div className="space-y-5">
                                {feeGroups.map((group, groupIndex) => (
                                    <div key={group.key} className={groupIndex > 0 ? 'border-t border-slate-200 pt-5' : ''}>
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <h3 className="text-sm font-extrabold text-slate-800">{group.title}</h3>
                                            <span className="text-xs font-bold text-emerald-700">자동 합계 ₩{formatNum(group.calculatedTotal)}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {group.dayFields.map((field, i) => (
                                                <div key={field} className="min-w-0 border-l-2 border-emerald-500 bg-slate-50 px-3 py-3">
                                                    <label className="block text-[10px] font-black uppercase text-slate-500">Stage {i + 1} MD</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        className="mt-1 w-full min-w-0 bg-transparent text-lg font-bold outline-none"
                                                        value={(formData as any)[field]}
                                                        onChange={(e) => handleChange(field, parseFloat(e.target.value) || 0)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 space-y-1">
                                            <label className="text-xs font-bold text-slate-600">제경비 (₩)</label>
                                            <input
                                                type="text"
                                                className="w-full rounded-md border border-slate-300 px-3 py-2 font-bold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                                                value={Number((formData as any)[group.expenseField]).toLocaleString()}
                                                onChange={(e) => handleChange(group.expenseField, parseInt(e.target.value.replace(/,/g, '')) || 0)}
                                            />
                                        </div>
                                    </div>
                                ))}

                                <div className="border-t border-slate-200 pt-5">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">공통 심사 요율 (₩ / MD)</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-md border border-slate-300 px-3 py-2 font-bold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                                            value={formData.auditRate.toLocaleString()}
                                            onChange={(e) => handleChange('auditRate', parseInt(e.target.value.replace(/,/g, '')) || 0)}
                                        />
                                    </div>
                                </div>

                                <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4">
                                    <label className="mb-2 block text-xs font-bold text-emerald-800">부가가치세 (VAT) 구분</label>
                                    <div className="flex flex-wrap gap-6">
                                        <label className="flex cursor-pointer items-center gap-2">
                                            <input
                                                type="radio"
                                                name="vatType"
                                                value="별도"
                                                checked={formData.vatType === '별도'}
                                                onChange={(e) => handleChange('vatType', e.target.value)}
                                                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm font-medium text-slate-700">VAT 별도 (기본)</span>
                                        </label>
                                        <label className="flex cursor-pointer items-center gap-2">
                                            <input
                                                type="radio"
                                                name="vatType"
                                                value="포함"
                                                checked={formData.vatType === '포함'}
                                                onChange={(e) => handleChange('vatType', e.target.value)}
                                                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
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
                                    <div className="bg-emerald-900/50 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase text-emerald-300">자동 계산 합계</span>
                                            <span className="text-lg font-bold text-white">₩{formatNum(calculatedDisplayTotal)}</span>
                                        </div>
                                        {isCombined && (
                                            <div className="mt-3 space-y-1 border-t border-emerald-700/60 pt-3 text-xs text-emerald-100">
                                                <div className="flex justify-between"><span>명세서</span><span>₩{formatNum(calculations.calculatedTotal)}</span></div>
                                                <div className="flex justify-between"><span>배출량산정계획서</span><span>₩{formatNum(planCalculations.calculatedTotal)}</span></div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {finalAmountInputs.map((item) => (
                                            <div key={item.valueField} className="space-y-2">
                                                <span className="text-[10px] font-black uppercase text-emerald-300">{item.label}</span>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        className="w-full rounded-md border-2 border-emerald-500/30 bg-emerald-900 px-4 py-3 pr-16 text-xl font-black text-emerald-300 outline-none transition-all focus:border-emerald-400"
                                                        value={Number((formData as any)[item.valueField]).toLocaleString()}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value.replace(/,/g, '')) || 0;
                                                            setFormData(prev => ({ ...prev, [item.valueField]: val, [item.manualField]: true }));
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-400 hover:text-white"
                                                        onClick={() => setFormData(prev => ({ ...prev, [item.manualField]: false }))}
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {isCombined && (
                                            <div className="flex items-center justify-between border-t border-emerald-700 pt-4">
                                                <span className="text-xs font-bold text-emerald-200">최종 금액 합계</span>
                                                <span className="text-xl font-black text-white">₩{formatNum(finalDisplayTotal)}</span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleChange('vatType', formData.vatType === '별도' ? '포함' : '별도')}
                                            className="rounded-md bg-emerald-900 px-3 py-1 text-[10px] font-bold text-emerald-300 hover:text-white"
                                        >
                                            VAT {formData.vatType} 선택됨
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-col gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleDownloadDocx()}
                                        className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-500 py-4 font-bold text-white shadow-lg shadow-emerald-900/20 transition-colors hover:bg-emerald-400 active:scale-[0.99]"
                                    >
                                        <span>Word 계약서 다운로드</span>
                                        <span className="text-xs opacity-70">(.docx)</span>
                                    </button>
                                    {formData.contractType === 'statement' && (
                                        <button
                                            type="button"
                                            onClick={() => handlePrintPdf()}
                                            className="w-full rounded-md border border-emerald-400/60 py-3 font-bold text-emerald-100 transition-colors hover:bg-emerald-500/10"
                                        >
                                            PDF 인쇄
                                        </button>
                                    )}
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
                                    K-ETS {CONTRACT_TYPE_LABELS[formData.contractType]} 계약서를 생성합니다.<br />
                                    선택한 공식 Word 서식이 적용됩니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
                <div className="mx-auto flex max-w-md items-center gap-2">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-slate-500">최종 제안 금액</p>
                        <p className="truncate text-base font-extrabold text-slate-900">₩{formatNum(finalDisplayTotal)}</p>
                    </div>
                    {formData.contractType === 'statement' && (
                        <button type="button" onClick={() => handlePrintPdf()} className="min-h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800">PDF</button>
                    )}
                    <button type="button" onClick={() => handleDownloadDocx()} className="min-h-11 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white">Word</button>
                </div>
            </div>
        </div>
    );
}
