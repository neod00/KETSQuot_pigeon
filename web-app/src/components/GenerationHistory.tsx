'use client';

import React, { useState, useEffect, useMemo } from 'react';

// --- Types ---
export interface HistoryRecord {
    id: string;
    pageType: 'generator' | 'system' | 'kets-contract';
    pageLabel: string;
    companyName: string;
    finalCost: number;
    vatType: string;
    createdAt: string;
    formData: any;
    summary: {
        s1Days: number;
        s2Days: number;
        s3Days: number;
        expenses: number;
        auditRate?: number;
    };
}

interface GenerationHistoryProps {
    pageType: 'generator' | 'system' | 'kets-contract';
    pageLabel: string;
    onRestore: (formData: any) => void;           // ✏️ 수정 후 생성
    onRegenerate: (formData: any) => void;         // 🔄 다시 생성하기
}

const PAGE_LABELS: Record<string, string> = {
    'generator': 'K-ETS 견적서',
    'system': 'P827 계약서',
    'kets-contract': 'K-ETS 계약서',
};

const PAGE_COLORS: Record<string, { bg: string, text: string, border: string, chip: string }> = {
    'generator': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', chip: 'bg-blue-100' },
    'system': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', chip: 'bg-violet-100' },
    'kets-contract': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', chip: 'bg-emerald-100' },
};

// ============================================================
//  공통 유틸
// ============================================================
const formatCost = (n: number) => n.toLocaleString();
const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const formatDateFull = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const getMonthKey = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
};

// ============================================================
//  메인 컴포넌트
// ============================================================
export default function GenerationHistory({ pageType, pageLabel, onRestore, onRegenerate }: GenerationHistoryProps) {
    const [allHistory, setAllHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [isAdmin, setIsAdmin] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

    // 관리자 모드 체크
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'lrqa2026') {
            setIsAdmin(true);
        }
    }, []);

    // 이력 불러오기
    const fetchHistory = async () => {
        try {
            const res = await fetch('/.netlify/functions/history?action=list');
            if (res.ok) {
                const data = await res.json();
                setAllHistory(data);
            }
        } catch (e) {
            console.error('이력 불러오기 실패:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // 현재 페이지의 최근 3건 (칩 표시용)
    const recentChips = useMemo(() => {
        return allHistory
            .filter(h => h.pageType === pageType)
            .slice(0, 3);
    }, [allHistory, pageType]);

    // 필터링된 이력 (팝업용)
    const filteredHistory = useMemo(() => {
        let list = allHistory;
        if (filterType !== 'all') {
            list = list.filter(h => h.pageType === filterType);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            list = list.filter(h => h.companyName.toLowerCase().includes(q));
        }
        return list;
    }, [allHistory, filterType, searchQuery]);

    // 월별 그룹핑
    const groupedHistory = useMemo(() => {
        const groups: Record<string, HistoryRecord[]> = {};
        filteredHistory.forEach(h => {
            const key = getMonthKey(h.createdAt);
            if (!groups[key]) groups[key] = [];
            groups[key].push(h);
        });
        return groups;
    }, [filteredHistory]);

    // 간단 통계 (관리자용)
    const stats = useMemo(() => {
        const now = new Date();
        const thisMonth = allHistory.filter(h => {
            const d = new Date(h.createdAt);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
        const totalCost = thisMonth.reduce((sum, h) => sum + h.finalCost, 0);
        return { monthCount: thisMonth.length, monthTotal: totalCost, allCount: allHistory.length };
    }, [allHistory]);

    // 이력 저장 (외부에서 호출)
    const saveHistory = async (formData: any, companyName: string, finalCost: number, vatType: string, summary: any) => {
        try {
            await fetch('/.netlify/functions/history?action=save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageType, pageLabel, companyName, finalCost, vatType, formData, summary }),
            });
            fetchHistory();
        } catch (e) {
            console.error('이력 저장 실패:', e);
        }
    };

    // 개별 삭제
    const handleDelete = async (id: string) => {
        try {
            await fetch('/.netlify/functions/history?action=delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, adminKey: 'lrqa2026' }),
            });
            setAllHistory(prev => prev.filter(h => h.id !== id));
            setDeletingId(null);
        } catch (e) {
            console.error('삭제 실패:', e);
        }
    };

    // 전체 삭제
    const handleDeleteAll = async () => {
        try {
            await fetch('/.netlify/functions/history?action=deleteAll', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminKey: 'lrqa2026' }),
            });
            setAllHistory([]);
            setConfirmDeleteAll(false);
        } catch (e) {
            console.error('전체 삭제 실패:', e);
        }
    };

    // CSV 다운로드
    const handleCsvDownload = () => {
        const csvHeader = '생성일시,문서유형,회사명,최종금액,VAT구분,Stage1,Stage2,Stage3,제경비,심사요율\n';
        const csvRows = allHistory.map(h =>
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

    // 불러오기 (폼에 채움)
    const handleRestore = (record: HistoryRecord) => {
        onRestore(record.formData);
        setShowModal(false);
    };

    // 다시 생성하기 (바로 생성)
    const handleRegenerate = (record: HistoryRecord) => {
        onRegenerate(record.formData);
        setShowModal(false);
    };

    // saveHistory를 외부에서 별도 함수(saveHistoryRecord)로 호출

    // ============================================================
    //  칩 렌더링
    // ============================================================
    const renderChips = () => {
        if (loading) {
            return (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                    이력 불러오는 중...
                </div>
            );
        }

        if (recentChips.length === 0) {
            return (
                <p className="text-xs text-slate-400 italic">아직 생성 이력이 없습니다.</p>
            );
        }

        return (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {recentChips.map(record => {
                    const colors = PAGE_COLORS[record.pageType];
                    return (
                        <div
                            key={record.id}
                            className={`flex-shrink-0 ${colors.chip} ${colors.border} border rounded-xl p-3 min-w-[160px] max-w-[200px] group hover:shadow-md transition-all cursor-default`}
                        >
                            <div className={`text-xs font-bold ${colors.text} truncate`}>{record.companyName}</div>
                            <div className="text-[11px] font-semibold text-slate-700 mt-0.5">₩{formatCost(record.finalCost)}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(record.createdAt)}</div>
                            <div className="flex gap-1 mt-2">
                                <button
                                    onClick={() => handleRegenerate(record)}
                                    className="flex-1 text-[10px] font-bold text-white bg-slate-700 hover:bg-slate-800 rounded-lg px-2 py-1 transition-colors"
                                    title="저장된 데이터로 즉시 문서 생성"
                                >
                                    🔄 재생성
                                </button>
                                <button
                                    onClick={() => handleRestore(record)}
                                    className="flex-1 text-[10px] font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 transition-colors"
                                    title="폼에 데이터를 채워서 수정 가능"
                                >
                                    ✏️ 수정
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // ============================================================
    //  팝업 모달 렌더링
    // ============================================================
    const renderModal = () => {
        if (!showModal) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

                {/* Modal */}
                <div
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📋</span>
                            <h2 className="text-lg font-black text-slate-800">생성 이력</h2>
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {filteredHistory.length}건
                            </span>
                            {isAdmin && (
                                <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">ADMIN</span>
                            )}
                        </div>
                        <button
                            onClick={() => setShowModal(false)}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* 관리자 통계 */}
                    {isAdmin && (
                        <div className="mx-5 mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-4 text-xs font-medium">
                                <span className="text-blue-600">📊 이번 달: <strong>{stats.monthCount}건</strong> 생성</span>
                                <span className="text-purple-600">💰 총 ₩<strong>{formatCost(stats.monthTotal)}</strong></span>
                                <span className="text-slate-500">전체 {stats.allCount}건 / 최대 100건</span>
                            </div>
                        </div>
                    )}

                    {/* 검색 & 필터 */}
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-50">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                            <input
                                type="text"
                                placeholder="회사명으로 검색..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-1">
                            {[
                                { key: 'all', label: '전체' },
                                { key: 'generator', label: '견적서' },
                                { key: 'system', label: 'P827' },
                                { key: 'kets-contract', label: 'K-ETS' },
                            ].map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setFilterType(f.key)}
                                    className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors ${filterType === f.key
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 이력 목록 */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {filteredHistory.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <p className="text-3xl mb-2">📭</p>
                                <p className="text-sm font-medium">이력이 없습니다</p>
                            </div>
                        ) : (
                            Object.entries(groupedHistory).map(([month, records]) => (
                                <div key={month}>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">📅 {month}</h3>
                                    <div className="space-y-2">
                                        {records.map(record => {
                                            const colors = PAGE_COLORS[record.pageType];
                                            return (
                                                <div
                                                    key={record.id}
                                                    className={`${colors.bg} ${colors.border} border rounded-xl p-4 hover:shadow-md transition-all`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-slate-800 truncate">{record.companyName}</span>
                                                                <span className={`text-[10px] font-bold ${colors.text} ${colors.chip} px-1.5 py-0.5 rounded`}>
                                                                    {PAGE_LABELS[record.pageType]}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                                <span className="font-semibold text-slate-700">₩{formatCost(record.finalCost)}</span>
                                                                <span>VAT {record.vatType}</span>
                                                                <span>{formatDateFull(record.createdAt)}</span>
                                                            </div>
                                                            {record.summary && (
                                                                <div className="mt-1.5 text-[11px] text-slate-400">
                                                                    Stage: {record.summary.s1Days} / {record.summary.s2Days} / {record.summary.s3Days}
                                                                    {record.summary.expenses ? ` · 제경비 ₩${formatCost(record.summary.expenses)}` : ''}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200/50">
                                                        <button
                                                            onClick={() => handleRegenerate(record)}
                                                            className="text-[11px] font-bold text-white bg-slate-700 hover:bg-slate-800 rounded-lg px-3 py-1.5 transition-colors"
                                                        >
                                                            🔄 다시 생성
                                                        </button>
                                                        <button
                                                            onClick={() => handleRestore(record)}
                                                            className="text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
                                                        >
                                                            ✏️ 수정 후 생성
                                                        </button>
                                                        {isAdmin && (
                                                            <>
                                                                {deletingId === record.id ? (
                                                                    <div className="ml-auto flex items-center gap-1">
                                                                        <span className="text-[10px] text-red-500 font-medium">삭제?</span>
                                                                        <button onClick={() => handleDelete(record.id)} className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 rounded px-2 py-1">확인</button>
                                                                        <button onClick={() => setDeletingId(null)} className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded px-2 py-1">취소</button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setDeletingId(record.id)}
                                                                        className="ml-auto text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                                                                        title="삭제 (관리자)"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
                        <span className="text-[11px] text-slate-400 font-medium">
                            총 {allHistory.length}건 (최대 100건)
                        </span>
                        {isAdmin && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCsvDownload}
                                    className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-1.5 transition-colors"
                                >
                                    📥 CSV 다운로드
                                </button>
                                {confirmDeleteAll ? (
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-red-500 font-medium">전체 삭제?</span>
                                        <button onClick={handleDeleteAll} className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 rounded px-2 py-1">확인</button>
                                        <button onClick={() => setConfirmDeleteAll(false)} className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded px-2 py-1">취소</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmDeleteAll(true)}
                                        className="text-[11px] font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-1.5 transition-colors"
                                    >
                                        🗑️ 전체 삭제
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* 칩 영역 */}
            <div className="no-print mt-4 mb-2">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm">📜</span>
                        <span className="text-xs font-bold text-slate-500">최근 이력</span>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                        전체 이력 보기 →
                    </button>
                </div>
                {renderChips()}
            </div>

            {/* 팝업 모달 */}
            {renderModal()}

            {/* 모달 애니메이션 */}
            <style jsx>{`
                .animate-in {
                    animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .scrollbar-thin::-webkit-scrollbar {
                    height: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 2px;
                }
            `}</style>
        </>
    );
}

// saveHistory를 외부에서 호출하기 위한 헬퍼
export async function saveHistoryRecord(
    pageType: string,
    pageLabel: string,
    companyName: string,
    finalCost: number,
    vatType: string,
    formData: any,
    summary: any
) {
    try {
        await fetch('/.netlify/functions/history?action=save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageType, pageLabel, companyName, finalCost, vatType, formData, summary }),
        });
    } catch (e) {
        console.error('이력 저장 실패:', e);
    }
}
