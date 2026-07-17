'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FeedbackSidebar from '../components/FeedbackSidebar';
import type { HistoryRecord } from '../components/GenerationHistory';

export default function LandingPage() {
    const [isAdminAccount, setIsAdminAccount] = useState(false);

    useEffect(() => {
        fetch('/api/iso/auth/session', { cache: 'no-store' })
            .then(response => response.ok ? response.json() : null)
            .then(session => setIsAdminAccount(session?.role === 'admin'))
            .catch(() => setIsAdminAccount(false));
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50 p-4 sm:p-6 lg:p-8 font-sans selection:bg-blue-100">
            {isAdminAccount && (
                <div className="mx-auto mb-3 flex max-w-7xl justify-end">
                    <Link href="/iso/users" className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:border-teal-500 hover:text-teal-700">
                        팀원 계정 관리
                    </Link>
                </div>
            )}
            {/* Header */}
            <div className="mb-8 sm:mb-12 text-center space-y-2 sm:space-y-3">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                    LRQA <span className="text-blue-600">Quotation & Contract</span> Portal
                </h1>
                <p className="text-slate-500 text-sm sm:text-lg font-medium">원하시는 견적 및 계약 시스템을 선택해 주세요.</p>
            </div>

            {/* Main Content: 2-column layout */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Left: Tool Cards */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Legacy Generator Card */}
                        <Link href="/generator" className="group">
                            <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 h-full flex flex-col relative overflow-hidden group-hover:border-slate-300">
                                {/* Soft background decoration */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-slate-100"></div>

                                <div className="mb-6 w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                </div>

                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-xl font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                                        K-ETS 검증 견적서 생성기
                                    </h2>
                                </div>

                                <div className="mb-4">
                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-500/10">
                                        Legacy (v1.7)
                                    </span>
                                </div>

                                <p className="text-slate-500 leading-relaxed text-sm">
                                    기존에 사용하던 심플한 입력 폼 방식의 견적서 생성기입니다. 빠른 견적 산출이 필요할 때 사용하세요.
                                </p>
                            </div>
                        </Link>

                        {/* P827 Data & Information Contract Card */}
                        <Link href="/system" className="group">
                            <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300 border border-blue-50 h-full flex flex-col relative overflow-hidden group-hover:border-blue-200">
                                {/* Gradient background decoration */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-60 group-hover:opacity-100 transition-opacity"></div>

                                <div className="mb-6 w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-blue-100 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                                    </svg>
                                </div>

                                <div className="flex flex-col mb-2">
                                    <h2 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                        P827 Data & Information
                                    </h2>
                                    <h2 className="text-lg font-bold text-slate-600 group-hover:text-blue-500 transition-colors">
                                        계약서 생성기
                                    </h2>
                                </div>

                                <div className="mb-4">
                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 ring-1 ring-inset ring-blue-600/20">
                                        New System (v2.0)
                                    </span>
                                </div>

                                <p className="text-slate-500 leading-relaxed text-sm">
                                    새로운 대시보드 UI와 통합 관리 기능을 제공하는 차세대 시스템입니다. 데이터 기반의 정확한 계약서 작성을 지원합니다.
                                </p>
                            </div>
                        </Link>

                        {/* K-ETS 명세서 검증 계약서 생성기 Card */}
                        <Link href="/kets-contract" className="group md:col-span-2">
                            <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-emerald-900/10 hover:-translate-y-1 transition-all duration-300 border border-emerald-50 h-full flex flex-col relative overflow-hidden group-hover:border-emerald-200">
                                {/* Gradient background decoration */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-60 group-hover:opacity-100 transition-opacity"></div>

                                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                                    <div className="mb-4 md:mb-0 w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-emerald-100 shadow-inner flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                        </svg>
                                    </div>

                                    <div className="flex-grow">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                                            <h2 className="text-xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                                                K-ETS 명세서 검증 계약서 생성기
                                            </h2>
                                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-600/20 w-fit">
                                                New (v1.0)
                                            </span>
                                        </div>

                                        <p className="text-slate-500 leading-relaxed text-sm">
                                            K-ETS 온실가스 명세서 검증을 위한 계약서를 생성합니다. 템플릿 기반 Word 문서(.docx)를 자동 생성하여 다운로드할 수 있습니다.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        <Link href="/iso" className="group md:col-span-2">
                            <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-900/10 hover:-translate-y-1 transition-all duration-300 border border-indigo-50 h-full flex flex-col relative overflow-hidden group-hover:border-indigo-200">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-sky-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-60 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                                    <div className="mb-4 md:mb-0 w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-indigo-100 shadow-inner flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2.25 4.5H6.75A2.25 2.25 0 014.5 18.25V5.75A2.25 2.25 0 016.75 3.5h7.5L19.5 8.75v9.5a2.25 2.25 0 01-2.25 2.25z" />
                                        </svg>
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                                            <h2 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">ISO 견적/계약서 생성기</h2>
                                            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-600/20 w-fit">ISO</span>
                                        </div>
                                        <p className="text-slate-500 leading-relaxed text-sm">ISO 인증 견적과 계약 조건을 심사일수, 경비, 할인, VAT 기준으로 계산하고 A4 문서로 출력합니다.</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* 최근 생성 이력 섹션 */}
                    <RecentHistorySection />
                </div>

                {/* Right: Feedback Sidebar */}
                <div className="lg:col-span-4">
                    <div className="lg:sticky lg:top-8">
                        <FeedbackSidebar />
                    </div>
                </div>
            </div>

            <footer className="mt-10 sm:mt-16 text-center text-slate-400 text-xs font-medium tracking-wide">
                © 2026 LRQA Korea's DK. All rights reserved.
            </footer>

            {/* 관리자 전용: 개정이력 */}
            <ChangelogSection />
        </div>
    );
}

// 최근 생성 이력 섹션 컴포넌트
function RecentHistorySection() {
    const router = useRouter();
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [isAdmin, setIsAdmin] = useState(false);

    const navigateWithData = (record: HistoryRecord, action: 'restore' | 'regenerate') => {
        localStorage.setItem('history_action', JSON.stringify({ action, formData: record.formData, pageType: record.pageType }));
        router.push(PAGE_LINKS[record.pageType] || '/generator');
        setShowModal(false);
    };

    const PAGE_LABELS: Record<string, string> = {
        'generator': 'K-ETS 견적서',
        'system': 'P827 계약서',
        'kets-contract': 'K-ETS 계약서',
    };

    const PAGE_LINKS: Record<string, string> = {
        'generator': '/generator',
        'system': '/system',
        'kets-contract': '/kets-contract',
    };

    const PAGE_COLORS: Record<string, { bg: string, text: string, border: string, chip: string, dot: string }> = {
        'generator': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', chip: 'bg-slate-100', dot: 'bg-slate-400' },
        'system': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', chip: 'bg-blue-100', dot: 'bg-blue-400' },
        'kets-contract': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', chip: 'bg-emerald-100', dot: 'bg-emerald-400' },
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === '1') setIsAdmin(true);

        fetch('/.netlify/functions/history?action=list')
            .then(r => r.ok ? r.json() : [])
            .then(data => setHistory(data))
            .catch(() => setHistory([]))
            .finally(() => setLoading(false));
    }, []);

    const formatCost = (n: number) => n.toLocaleString();
    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    const formatDateFull = (iso: string) => {
        const d = new Date(iso);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const recent5 = history.slice(0, 5);

    const filteredHistory = (() => {
        let list = history;
        if (filterType !== 'all') list = list.filter(h => h.pageType === filterType);
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            list = list.filter(h => h.companyName.toLowerCase().includes(q));
        }
        return list;
    })();

    const stats = (() => {
        const now = new Date();
        const thisMonth = history.filter(h => {
            const d = new Date(h.createdAt);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
        return { monthCount: thisMonth.length, monthTotal: thisMonth.reduce((s, h) => s + h.finalCost, 0), allCount: history.length };
    })();

    const handleCsvDownload = () => {
        const csvHeader = '생성일시,문서유형,회사명,최종금액,VAT구분,Stage1,Stage2,Stage3,제경비,심사요율\n';
        const csvRows = history.map(h =>
            `"${formatDateFull(h.createdAt)}","${h.pageLabel}","${h.companyName}",${h.finalCost},"${h.vatType}",${h.summary?.s1Days || ''},${h.summary?.s2Days || ''},${h.summary?.s3Days || ''},${h.summary?.expenses || ''},${h.summary?.auditRate || ''}`
        ).join('\n');
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LRQA_생성이력_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDeleteOne = async (id: string) => {
        if (!confirm('이 이력을 삭제하시겠습니까?')) return;
        await fetch('/.netlify/functions/history?action=delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        setHistory(prev => prev.filter(h => h.id !== id));
    };

    const handleDeleteAll = async () => {
        if (!confirm('모든 이력을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
        await fetch('/.netlify/functions/history?action=deleteAll', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        setHistory([]);
    };

    if (loading) {
        return (
            <div className="mt-6 bg-white rounded-2xl sm:rounded-[2rem] border border-slate-100 p-6">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                    이력 불러오는 중...
                </div>
            </div>
        );
    }

    if (recent5.length === 0) return null;

    return (
        <>
            <div className="mt-6 bg-white rounded-2xl sm:rounded-[2rem] border border-slate-100 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">📝</span>
                        <h3 className="text-sm font-bold text-slate-700">최근 생성 이력</h3>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{history.length}건</span>
                        {isAdmin && <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">ADMIN</span>}
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                        전체 이력 보기 →
                    </button>
                </div>

                <div className="space-y-2">
                    {recent5.map(record => {
                        const colors = PAGE_COLORS[record.pageType] || PAGE_COLORS['generator'];
                        return (
                            <Link
                                key={record.id}
                                href={PAGE_LINKS[record.pageType] || '/generator'}
                                className={`flex items-center gap-3 p-3 ${colors.bg} ${colors.border} border rounded-xl hover:shadow-sm transition-all group`}
                            >
                                <div className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`}></div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-800 truncate">{record.companyName}</span>
                                        <span className={`text-[10px] font-bold ${colors.text} ${colors.chip} px-1.5 py-0.5 rounded flex-shrink-0`}>
                                            {PAGE_LABELS[record.pageType]}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-xs font-semibold text-slate-700">₩{formatCost(record.finalCost)}</div>
                                    <div className="text-[10px] text-slate-400">{formatDate(record.createdAt)}</div>
                                </div>
                                <span className="text-slate-300 group-hover:text-slate-500 transition-colors text-xs">›</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* 전체 이력 팝업 모달 */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📋</span>
                                <h2 className="text-lg font-black text-slate-800">전체 생성 이력</h2>
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filteredHistory.length}건</span>
                                {isAdmin && <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">ADMIN</span>}
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                        </div>

                        {/* 관리자 통계 */}
                        {isAdmin && (
                            <div className="mx-5 mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-4 text-xs font-medium">
                                    <span className="text-blue-600">📊 이번 달: <strong>{stats.monthCount}건</strong></span>
                                    <span className="text-purple-600">💰 총 ₩<strong>{formatCost(stats.monthTotal)}</strong></span>
                                    <span className="text-slate-500">전체 {stats.allCount}건</span>
                                </div>
                            </div>
                        )}

                        {/* 검색 & 필터 */}
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-50">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                                <input
                                    type="text" placeholder="회사명으로 검색..."
                                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex gap-1">
                                {[{ key: 'all', label: '전체' }, { key: 'generator', label: '견적서' }, { key: 'system', label: 'P827' }, { key: 'kets-contract', label: 'K-ETS' }].map(f => (
                                    <button key={f.key} onClick={() => setFilterType(f.key)} className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors ${filterType === f.key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 이력 목록 */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-2">
                            {filteredHistory.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <p className="text-3xl mb-2">📭</p>
                                    <p className="text-sm font-medium">이력이 없습니다</p>
                                </div>
                            ) : (
                                filteredHistory.map(record => {
                                    const colors = PAGE_COLORS[record.pageType] || PAGE_COLORS['generator'];
                                    return (
                                        <div
                                            key={record.id}
                                            className={`block ${colors.bg} ${colors.border} border rounded-xl p-4 hover:shadow-md transition-all`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-slate-800 truncate">{record.companyName}</span>
                                                        <span className={`text-[10px] font-bold ${colors.text} ${colors.chip} px-1.5 py-0.5 rounded`}>{PAGE_LABELS[record.pageType]}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                        <span className="font-semibold text-slate-700">₩{formatCost(record.finalCost)}</span>
                                                        <span>VAT {record.vatType}</span>
                                                        <span>{formatDateFull(record.createdAt)}</span>
                                                    </div>
                                                    {record.summary && (
                                                        <div className="mt-1 text-[11px] text-slate-400">
                                                            Stage: {record.summary.s1Days} / {record.summary.s2Days} / {record.summary.s3Days}
                                                            {record.summary.expenses ? ` · 제경비 ₩${formatCost(record.summary.expenses)}` : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/50">
                                                <button
                                                    onClick={() => navigateWithData(record, 'restore')}
                                                    className="flex-1 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg py-1.5 transition-colors"
                                                >
                                                    ✏️ 수정 후 생성
                                                </button>
                                                <button
                                                    onClick={() => navigateWithData(record, 'regenerate')}
                                                    className={`flex-1 text-[11px] font-bold text-white hover:opacity-80 rounded-lg py-1.5 transition-colors`}
                                                    style={{ backgroundColor: record.pageType === 'system' ? '#3b82f6' : record.pageType === 'kets-contract' ? '#10b981' : '#64748b' }}
                                                >
                                                    🔄 다시 생성
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleDeleteOne(record.id)}
                                                        className="text-[11px] font-bold text-red-400 hover:text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-lg px-2 py-1.5 transition-colors"
                                                        title="삭제"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
                            <span className="text-[11px] text-slate-400 font-medium">총 {history.length}건 (최대 100건)</span>
                            {isAdmin && (
                                <div className="flex items-center gap-2">
                                    <button onClick={handleDeleteAll} className="text-[11px] font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-1.5 transition-colors">
                                        🗑️ 전체 삭제
                                    </button>
                                    <button onClick={handleCsvDownload} className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-1.5 transition-colors">
                                        📥 CSV 다운로드
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </>
    );
}

// ============================================================
//  관리자 전용: 개정이력 (Changelog)
// ============================================================
const CHANGELOG = [
    {
        version: 'v2.4',
        date: '2026-02-11',
        type: 'feature' as const,
        items: [
            '생성 이력 기능 추가 (칩 + 팝업 모달 UI)',
            '메인 페이지 최근 이력 섹션 & 전체 이력 팝업',
            '관리자 삭제 / 통계 / CSV 다운로드 기능',
            '다시 생성 시 Word 문서 즉시 다운로드',
            '개정이력(Changelog) 섹션 추가',
        ],
    },
    {
        version: 'v2.3',
        date: '2026-02-07',
        type: 'improvement' as const,
        items: [
            'K-ETS 계약서 PDF 인쇄 레이아웃 개선',
            'Stage Days 한줄 표시, VAT 표시 정리',
            '온실가스 선언 기간 별도 입력 필드화',
        ],
    },
    {
        version: 'v2.2',
        date: '2026-02-06',
        type: 'improvement' as const,
        items: [
            'K-ETS 계약서 생성기 신규 추가',
            '계약 기간 필드 분리 (service_description에서 독립)',
        ],
    },
    {
        version: 'v2.1',
        date: '2026-02-04',
        type: 'fix' as const,
        items: [
            '견적서 소수점 표시 정밀도 개선 (6 → 6.0, 9.50 → 9.5)',
            'P827 계약서 Word 템플릿 데이터 매핑 수정',
        ],
    },
    {
        version: 'v2.0',
        date: '2026-02-01',
        type: 'feature' as const,
        items: [
            'P827 Data & Information 계약서 생성기 추가',
            '피드백 사이드바 (별점, 댓글, 좋아요)',
            '메인 포털 페이지 UI 리뉴얼',
        ],
    },
    {
        version: 'v1.0',
        date: '2026-01-15',
        type: 'feature' as const,
        items: [
            'LRQA K-ETS 견적서 생성기 초기 버전',
            'PDF 인쇄 & 자동 계산 기능',
        ],
    },
];

const TYPE_COLORS = {
    feature: { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700', label: 'New' },
    improvement: { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', label: 'Update' },
    fix: { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', label: 'Fix' },
};

function ChangelogSection() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === '1') {
            setIsAdmin(true);
        }
    }, []);

    if (!isAdmin) return null;

    const displayItems = expanded ? CHANGELOG : CHANGELOG.slice(0, 2);

    return (
        <div className="max-w-7xl mx-auto mt-8">
            <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                {/* Header */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-slate-50/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-lg">📝</span>
                        <h2 className="text-base sm:text-lg font-black text-slate-800">개정이력</h2>
                        <span className="text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full">
                            {CHANGELOG[0].version}
                        </span>
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            ADMIN
                        </span>
                    </div>
                    <span className={`text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
                        ▼
                    </span>
                </button>

                {/* Timeline */}
                <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-blue-300 via-slate-200 to-transparent"></div>

                        <div className="space-y-5">
                            {displayItems.map((entry, idx) => {
                                const colors = TYPE_COLORS[entry.type];
                                return (
                                    <div key={entry.version} className="relative pl-7">
                                        {/* Dot */}
                                        <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full ${colors.dot} border-[3px] border-white shadow-sm`}></div>

                                        {/* Content */}
                                        <div className={`${idx === 0 ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' : 'bg-slate-50 border-slate-200'} border rounded-xl p-4`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-black text-slate-800">{entry.version}</span>
                                                <span className={`text-[10px] font-bold ${colors.badge} px-1.5 py-0.5 rounded`}>
                                                    {colors.label}
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-medium ml-auto">{entry.date}</span>
                                            </div>
                                            <ul className="space-y-1">
                                                {entry.items.map((item, i) => (
                                                    <li key={i} className="text-xs text-slate-600 font-medium flex items-start gap-1.5">
                                                        <span className="text-slate-300 mt-0.5">•</span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {CHANGELOG.length > 2 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="mt-4 w-full text-center text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors py-2"
                        >
                            {expanded ? '접기 ▲' : `이전 이력 ${CHANGELOG.length - 2}건 더 보기 ▼`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
