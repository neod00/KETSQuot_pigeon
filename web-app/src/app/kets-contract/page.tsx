'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { generateKetsDocx } from '../../utils/docxGenerator';

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

    const handleDownloadDocx = () => {
        const adm = ADM_DATA[formData.adminName] || ADM_DATA['권대근'];
        const rawText = (val: string) => (val || '').trim();

        const data: KetsContractData = {
            company_name: rawText(formData.companyName),
            proposal_date: formatDateLong(formData.proposalDate),
            proposal_no: formData.proposalNo,
            lrqa_contact_name: formData.adminName,
            lrqa_contact_email: adm.email,
            lrqa_contact_phone: adm.phone,
            hq_address: rawText(formData.hqAddress),
            target_sites: rawText(formData.targetSites),
            ghg_declaration_period: rawText(formData.ghgDeclarationPeriod),
            materiality: formData.materiality,
            stage1_days: formData.s1Days.toFixed(1),
            stage1_cost: formatNum(Math.floor(calculations.s1Cost)),
            stage2_days: formData.s2Days.toFixed(1),
            stage2_cost: formatNum(Math.floor(calculations.s2Cost)),
            stage3_days: formData.s3Days.toFixed(1),
            stage3_cost: formatNum(Math.floor(calculations.s3Cost)),
            expenses: formatNum(Math.floor(calculations.expCost)),
            total_days: formatTotalDays(calculations.totalDays),
            total_cost: formatNum(Math.floor(calculations.calculatedTotal)),
            final_cost: formatNum(formData.manualFinalCost),
            vat_type: formData.vatType,
        };

        generateKetsDocx(data, formData.companyName);
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
                                        onClick={handleDownloadDocx}
                                        className="w-full bg-emerald-500 hover:bg-emerald-400 py-4 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span>Word 계약서 다운로드</span>
                                        <span className="text-xs opacity-60">(.docx)</span>
                                    </button>
                                </div>
                            </div>

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
