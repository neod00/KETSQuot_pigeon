'use client';

import Link from 'next/link';
import PortalNavigation from './PortalNavigation';
import PortalAccountMenu from './PortalAccountMenu';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import FeedbackSidebar from './FeedbackSidebar';
import styles from './PortalShell.module.css';

type PortalDesign = 'modern' | 'legacy';

interface SessionSummary {
  username: string;
  role: 'admin' | 'member';
  coordinationOwner?: boolean;
}

const DESIGN_STORAGE_KEY = 'lrqa_portal_design';

const pageTitle = (pathname: string) => {
  if (pathname === '/iso') return 'ISO 견적·계약서 생성기';
  if (pathname === '/iso/applications') return '신청서 접수함';
  if (pathname.startsWith('/iso/applications/')) return '신청서 검토';
  if (pathname === '/iso/documents') return '생성 문서';
  if (pathname === '/iso/sales') return '세일즈 현황 및 D365 생성';
  if (pathname === '/iso/coordination') return '개인 조정 에이전트';
  if (pathname === '/iso/sam') return '전략고객 관리 (SAM)';
  if (pathname === '/iso/users') return '팀원 계정 관리';
  if (pathname === '/iso/adj') return 'ADJ 작성';
  if (pathname === '/generator') return 'K-ETS 검증 견적서 생성기';
  if (pathname === '/kets-contract') return 'K-ETS 검증 계약서 생성기';
  if (pathname === '/system') return 'P827 견적·계약서 생성기';
  if (pathname === '/p827/admin') return 'P827 신청·견적 관리';
  if (pathname === '/p827') return 'P827 검증 신청';
  if (pathname === '/hyundai-ghg/admin') return '현대차 협력사 GHG검증';
  if (pathname === '/cbam/admin') return 'CBAM 관리';
  if (pathname === '/cbam/documents') return 'CBAM 견적·계약 문서 생성';
  if (pathname === '/cbam') return 'CBAM 서비스 신청';
  return 'LRQA Korea 업무 포털';
};

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [design, setDesign] = useState<PortalDesign>('modern');
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const isAuthPage = pathname === '/iso/login' || pathname === '/iso/setup' || pathname === '/iso/request-access';
  const isPublicPage = pathname.startsWith('/outlook/') || pathname === '/iso/apply' || pathname === '/cbam' || pathname === '/p827' || pathname === '/hyundai-ghg/existing' || pathname === '/hyundai-ghg/new';

  useEffect(() => {
    if (pathname.startsWith('/outlook/')) return;
    const syncDesign = () => {
      const saved = localStorage.getItem(DESIGN_STORAGE_KEY);
      setDesign(saved === 'legacy' ? 'legacy' : 'modern');
    };

    syncDesign();
    window.addEventListener('storage', syncDesign);
    window.addEventListener('lrqa-portal-design-change', syncDesign);
    return () => {
      window.removeEventListener('storage', syncDesign);
      window.removeEventListener('lrqa-portal-design-change', syncDesign);
    };
  }, [pathname]);

  useEffect(() => {
    document.documentElement.dataset.portalDesign = design;
    return () => {
      delete document.documentElement.dataset.portalDesign;
    };
  }, [design]);

  useEffect(() => {
    if (pathname === '/' || isAuthPage || isPublicPage) return;
    let active = true;
    fetch('/api/iso/auth/session')
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (active && data?.username) setSession(data as SessionSummary);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isAuthPage, isPublicPage, pathname]);

  const changeDesign = (nextDesign: PortalDesign) => {
    localStorage.setItem(DESIGN_STORAGE_KEY, nextDesign);
    setDesign(nextDesign);
    window.dispatchEvent(new Event('lrqa-portal-design-change'));
  };

  const title = useMemo(() => pageTitle(pathname), [pathname]);

  if (pathname === '/' || isPublicPage) return children;

  if (isAuthPage) {
    return (
      <div className={design === 'modern' ? styles.authModern : styles.authLegacy}>
        {children}
        <button
          type="button"
          className={design === 'modern' ? styles.authDesignButton : styles.legacyToggle}
          onClick={() => changeDesign(design === 'modern' ? 'legacy' : 'modern')}
        >
          {design === 'modern' ? '이전 디자인' : '새 디자인'}
        </button>
      </div>
    );
  }

  if (design === 'legacy') {
    return (
      <>
        {children}
        <button type="button" className={styles.legacyToggle} onClick={() => changeDesign('modern')}>
          새 디자인
        </button>
      </>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={`${styles.rail} no-print`}>
        <Link href="/" className={styles.brand} aria-label="LRQA 업무 대시보드">
          <img src="/lrqa-logo.png" alt="LRQA" className={styles.logo} />
          <span>
            <strong>LRQA Workspace</strong>
            <small>Korea operations</small>
          </span>
        </Link>

        <PortalNavigation
          key={session?.username ?? 'pending'}
          isAdmin={session?.role === 'admin'}
          coordinationOwner={session?.coordinationOwner}
          onFeedback={() => setFeedbackOpen(true)}
        />

        <div className={styles.railFooter}>
          <strong>LRQA Korea</strong>
          <span>Quotation & contract operations</span>
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={`${styles.topbar} no-print`}>
          <div className={styles.titleBlock}>
            <span>LRQA Korea / Commercial operations</span>
            <h1>{title}</h1>
          </div>
          <div className={styles.topActions}>
            {session && <span className={styles.account}>{session.username} · {session.role === 'admin' ? '관리자' : '팀원'}</span>}
            <PortalAccountMenu onUseLegacy={() => changeDesign('legacy')} username={session?.username} />
          </div>
        </header>

        <div className={`${styles.content} portal-modern-content`}>
          {children}
        </div>
      </div>
      {feedbackOpen && (
        <div className={styles.feedbackBackdrop} role="dialog" aria-modal="true" aria-label="팀원 피드백">
          <section className={styles.feedbackDrawer}>
            <div className={styles.feedbackHeader}>
              <div>
                <span>TEAM VOICE</span>
                <h2>팀원 피드백</h2>
              </div>
              <button type="button" className={styles.feedbackCloseButton} onClick={() => setFeedbackOpen(false)}>닫기</button>
            </div>
            <FeedbackSidebar />
          </section>
        </div>
      )}
    </div>
  );
}
