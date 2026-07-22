'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import styles from './PortalShell.module.css';

type PortalDesign = 'modern' | 'legacy';

interface SessionSummary {
  username: string;
  role: 'admin' | 'member';
}

const DESIGN_STORAGE_KEY = 'lrqa_portal_design';

const NAV_ITEMS = [
  { label: '업무 대시보드', href: '/' },
  { label: 'ISO 견적·계약', href: '/iso' },
  { label: '신청서 접수함', href: '/iso/applications' },
  { label: '생성 문서', href: '/iso/documents' },
  { label: '세일즈 현황·D365', href: '/iso/sales' },
  { label: 'K-ETS 견적', href: '/generator' },
  { label: 'K-ETS 계약', href: '/kets-contract' },
  { label: 'P827 계약', href: '/system' },
];

const pageTitle = (pathname: string) => {
  if (pathname === '/iso') return 'ISO 견적·계약서 생성기';
  if (pathname === '/iso/applications') return '신청서 접수함';
  if (pathname.startsWith('/iso/applications/')) return '신청서 검토';
  if (pathname === '/iso/documents') return '생성 문서';
  if (pathname === '/iso/sales') return '세일즈 현황 및 D365 생성';
  if (pathname === '/iso/users') return '팀원 계정 관리';
  if (pathname === '/iso/adj') return 'ADJ 작성';
  if (pathname === '/generator') return 'K-ETS 검증 견적서 생성기';
  if (pathname === '/kets-contract') return 'K-ETS 검증 계약서 생성기';
  if (pathname === '/system') return 'P827 계약서 생성기';
  return 'LRQA Korea 업무 포털';
};

const isNavActive = (pathname: string, href: string) => {
  if (href === '/') return false;
  if (href === '/iso') return pathname === '/iso' || pathname === '/iso/adj';
  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [design, setDesign] = useState<PortalDesign>('modern');
  const [session, setSession] = useState<SessionSummary | null>(null);
  const isAuthPage = pathname === '/iso/login' || pathname === '/iso/setup';

  useEffect(() => {
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
    if (pathname === '/' || isAuthPage) return;
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
  }, [isAuthPage, pathname]);

  const changeDesign = (nextDesign: PortalDesign) => {
    localStorage.setItem(DESIGN_STORAGE_KEY, nextDesign);
    setDesign(nextDesign);
    window.dispatchEvent(new Event('lrqa-portal-design-change'));
  };

  const title = useMemo(() => pageTitle(pathname), [pathname]);

  if (pathname === '/') return children;

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

        <nav className={styles.nav} aria-label="업무 메뉴">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isNavActive(pathname, item.href) ? 'page' : undefined}
              className={`${styles.navLink} ${isNavActive(pathname, item.href) ? styles.navLinkActive : ''}`}
            >
              {item.label}
            </Link>
          ))}
          {session?.role === 'admin' && (
            <Link
              href="/iso/users"
              aria-current={pathname === '/iso/users' ? 'page' : undefined}
              className={`${styles.navLink} ${pathname === '/iso/users' ? styles.navLinkActive : ''}`}
            >
              팀원 관리
            </Link>
          )}
        </nav>

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
            <button type="button" className={styles.secondaryButton} onClick={() => changeDesign('legacy')}>
              이전 디자인
            </button>
            {session && (
              <form action="/api/iso/auth/logout" method="post">
                <button type="submit" className={styles.logoutButton}>로그아웃</button>
              </form>
            )}
          </div>
        </header>

        <div className={`${styles.content} portal-modern-content`}>
          {children}
        </div>
      </div>
    </div>
  );
}
