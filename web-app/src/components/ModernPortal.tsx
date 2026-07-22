'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import FeedbackSidebar from './FeedbackSidebar';
import type { HistoryRecord } from './GenerationHistory';
import styles from './ModernPortal.module.css';

interface ModernPortalProps {
    onUseLegacy: () => void;
    isAdminAccount: boolean;
}

const NAV_ITEMS = [
    { label: '업무 대시보드', href: '/', active: true },
    { label: 'ISO 신청과 견적', href: '/iso' },
    { label: '세일즈 현황', href: '/iso/sales' },
    { label: 'D365 생성', href: '/iso/sales?mode=d365' },
    { label: 'K-ETS 검증', href: '/generator' },
    { label: '문서함', href: '/iso/documents' },
];

const QUICK_ACTIONS = [
    { code: 'ISO', label: 'ISO 견적 작성', detail: '견적서와 계약서 생성', href: '/iso' },
    { code: 'ETS', label: 'K-ETS 견적 작성', detail: '검증 견적 빠른 생성', href: '/generator' },
    { code: 'DOC', label: 'K-ETS 계약서', detail: 'Word 계약 문서 생성', href: '/kets-contract' },
    { code: '365', label: 'Excel 가져오기', detail: '세일즈 현황 업데이트', href: '/iso/sales' },
];

const PAGE_LINKS: Record<string, string> = {
    generator: '/generator',
    system: '/system',
    'kets-contract': '/kets-contract',
};

const formatMoney = (value: number) => `${value.toLocaleString('ko-KR')}원`;

const formatDate = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '-';
    return `${date.getMonth() + 1}.${date.getDate()}`;
};

export default function ModernPortal({ onUseLegacy, isAdminAccount }: ModernPortalProps) {
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [feedbackOpen, setFeedbackOpen] = useState(false);

    useEffect(() => {
        let active = true;

        fetch('/.netlify/functions/history?action=list')
            .then(response => response.ok ? response.json() : [])
            .then(data => {
                if (active) setHistory(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (active) setHistory([]);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const monthCount = useMemo(() => {
        const now = new Date();
        return history.filter(record => {
            const date = new Date(record.createdAt);
            return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
        }).length;
    }, [history]);

    const recentHistory = history.slice(0, 4);
    const today = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date());

    return (
        <div className={styles.root}>
            <div className={styles.shell}>
                <aside className={styles.rail}>
                    <div className={styles.brand}>
                        <img src="/lrqa-logo.png" alt="LRQA" className={styles.logo} />
                        <div>
                            <div className={styles.brandName}>LRQA Workspace</div>
                            <div className={styles.brandMeta}>Korea operations</div>
                        </div>
                    </div>

                    <nav className={styles.nav} aria-label="포털 메뉴">
                        {NAV_ITEMS.map(item => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`${styles.navLink} ${item.active ? styles.navLinkActive : ''}`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className={styles.railFooter}>
                        <div className={styles.railTitle}>LRQA Korea</div>
                        <div className={styles.railMeta}>Quotation & contract operations</div>
                    </div>
                </aside>

                <main className={styles.main}>
                    <header className={styles.topbar}>
                        <div>
                            <div className={styles.topKicker}>LRQA Korea</div>
                            <div className={styles.topMeta}>Commercial operations portal</div>
                        </div>
                        <div className={styles.topActions}>
                            {isAdminAccount && (
                                <Link href="/iso/users" className={styles.button}>팀원 관리</Link>
                            )}
                            <button type="button" onClick={() => setFeedbackOpen(true)} className={styles.button}>
                                팀원 피드백
                            </button>
                            <button type="button" onClick={onUseLegacy} className={styles.buttonPrimary}>
                                이전 디자인
                            </button>
                        </div>
                    </header>

                    <section className={styles.hero}>
                        <div className={styles.heroCopy}>
                            <div className={styles.heroKicker}>Operations overview</div>
                            <h1 className={styles.heroTitle}>
                                CONTROL
                                <span className={styles.heroAccent}>THE PIPELINE</span>
                            </h1>
                            <p className={styles.heroText}>
                                신청부터 견적, 계약, 세일즈 현황과 D365 생성까지 하나의 업무 흐름으로 관리합니다.
                            </p>
                        </div>
                        <div className={styles.tick} aria-hidden="true" />
                        <div className={styles.tickMid} aria-hidden="true" />
                        <div className={styles.tickDark} aria-hidden="true" />
                    </section>

                    <div className={styles.content}>
                        <section aria-labelledby="operations-heading">
                            <div className={styles.sectionHeader}>
                                <div>
                                    <h2 id="operations-heading" className={styles.sectionTitle}>오늘의 운영 현황</h2>
                                    <p className={styles.sectionDescription}>실제 문서 생성 이력을 기준으로 표시합니다.</p>
                                </div>
                                <div className={styles.date}>{today}</div>
                            </div>

                            <div className={styles.metrics}>
                                <div className={styles.metric}>
                                    <div className={styles.metricLabel}>운영 도구</div>
                                    <div className={styles.metricValue}>4개</div>
                                    <div className={styles.metricNote}>견적·계약 생성기</div>
                                </div>
                                <div className={styles.metric}>
                                    <div className={styles.metricLabel}>이번 달 생성</div>
                                    <div className={styles.metricValue}>{loading ? '-' : `${monthCount}건`}</div>
                                    <div className={styles.metricNote}>월간 문서 이력</div>
                                </div>
                                <div className={styles.metric}>
                                    <div className={styles.metricLabel}>전체 문서 기록</div>
                                    <div className={styles.metricValue}>{loading ? '-' : `${history.length}건`}</div>
                                    <div className={styles.metricNote}>최근 100건 보관</div>
                                </div>
                            </div>
                        </section>

                        <div className={styles.workspace}>
                            <section className={styles.workPanel} aria-labelledby="recent-work-heading">
                                <div className={styles.panelHeader}>
                                    <div>
                                        <h2 id="recent-work-heading" className={styles.panelTitle}>최근 생성 업무</h2>
                                        <p className={styles.panelDescription}>최근 문서를 열어 수정하거나 다시 생성합니다.</p>
                                    </div>
                                    <button type="button" onClick={onUseLegacy} className={styles.allLink}>전체 이력 보기</button>
                                </div>

                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr><th>고객과 업무</th><th>상태</th><th>금액</th><th>생성일</th></tr>
                                        </thead>
                                        <tbody>
                                            {loading && (
                                                <tr><td colSpan={4} className={styles.emptyCell}>생성 이력을 불러오는 중입니다.</td></tr>
                                            )}
                                            {!loading && recentHistory.length === 0 && (
                                                <tr><td colSpan={4} className={styles.emptyCell}>아직 생성된 문서가 없습니다.</td></tr>
                                            )}
                                            {!loading && recentHistory.map(record => (
                                                <tr key={record.id}>
                                                    <td>
                                                        <Link href={PAGE_LINKS[record.pageType] || '/generator'} className={styles.companyLink}>
                                                            {record.companyName || '회사명 없음'}
                                                        </Link>
                                                        <div className={styles.rowMeta}>{record.pageLabel}</div>
                                                    </td>
                                                    <td><span className={styles.status}>생성 완료</span></td>
                                                    <td className={styles.money}>{formatMoney(record.finalCost || 0)}</td>
                                                    <td className={styles.mutedCell}>{formatDate(record.createdAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <aside className={styles.quickPanel} aria-labelledby="quick-actions-heading">
                                <div className={styles.panelHeader}>
                                    <div>
                                        <h2 id="quick-actions-heading" className={styles.panelTitle}>빠른 실행</h2>
                                        <p className={styles.panelDescription}>반복 업무를 바로 시작합니다.</p>
                                    </div>
                                </div>
                                <div className={styles.actionList}>
                                    {QUICK_ACTIONS.map(action => (
                                        <Link key={action.label} href={action.href} className={styles.quickAction}>
                                            <span className={styles.actionCode}>{action.code}</span>
                                            <span>
                                                <span className={styles.actionTitle}>{action.label}</span>
                                                <span className={styles.actionDetail}>{action.detail}</span>
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </aside>
                        </div>

                        <footer className={styles.footer}>
                            <span>LRQA Korea internal workspace</span>
                            <span>Quotation and contract operations</span>
                        </footer>
                    </div>
                </main>
            </div>

            {feedbackOpen && (
                <div className={styles.feedbackBackdrop} role="dialog" aria-modal="true" aria-label="팀원 피드백">
                    <div className={styles.feedbackDrawer}>
                        <div className={styles.feedbackHeader}>
                            <div>
                                <div className={styles.topKicker}>Team voice</div>
                                <h2 className={styles.feedbackTitle}>팀원 피드백</h2>
                            </div>
                            <button type="button" onClick={() => setFeedbackOpen(false)} className={styles.closeButton}>
                                닫기
                            </button>
                        </div>
                        <FeedbackSidebar />
                    </div>
                </div>
            )}
        </div>
    );
}
