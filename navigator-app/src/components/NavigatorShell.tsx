"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ApplicationLink } from "./ApplicationLink";
import { REGULATORY_DATE } from "@/shared/cbam-navigator";
import { useNavigator } from './NavigatorContext';
import { guideHref } from '@/lib/user-guide';

const navigation = [
  ["/", "시작하기"],
  ["/cn-search", "CN 코드 검색"],
  ["/applicability", "적용 가능성"],
  ["/product-map", "제품·공정"],
  ["/readiness", "검증 준비도"],
  ["/application", "검증 신청"],
] as const;

export function NavigatorShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { initialized, remember, setRemember, saveStatus } = useNavigator();
  return (
    <div className="app-shell">
      <aside className="site-sidebar">
        <Link href="/" className="brand" aria-label="LRQA CBAM Navigator 홈">
          <img src="/lrqa-logo.png" alt="LRQA" width="80" height="80" />
          <span className="brand-product">CBAM Navigator</span>
        </Link>
        <nav className="sidebar-nav" aria-label="주요 기능">
          {navigation.map(([href, label], index) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
              <span className="nav-number">{String(index + 1).padStart(2, "0")}</span>
              {label}
            </Link>
          ))}
        </nav>
        <p className="sidebar-note">공식 EU 규정 기반 안내<br />규정 데이터 기준일 {REGULATORY_DATE}</p>
      </aside>
      <div className="site-main">
        <header className="site-header">
          <Link href="/" className="topbar-title">LRQA KOREA <span>/</span> CBAM READINESS</Link>
          <div className="header-actions"><Link href={guideHref(pathname)} className="header-guide" aria-current={pathname === '/guide' ? 'page' : undefined}><span aria-hidden="true">?</span>사용 가이드</Link><ApplicationLink className="button small">검증 신청 <span aria-hidden="true">↗</span></ApplicationLink></div>
        </header>
        <div className="storage-bar">
          <span role="status">{saveStatus === 'unavailable' ? '브라우저 저장을 사용할 수 없습니다. 창을 닫기 전에 체크리스트를 내려받아 주세요.' : remember ? '이 기기에 자동 저장 · 마지막 작업 후 7일간 이어서 사용' : '현재 탭에 자동 저장 · 새로고침 후 입력 복원'}</span>
          <label><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />이 기기에 7일 저장</label>
        </div>
        <main id="content">{initialized || pathname === '/' || pathname === '/guide' ? children : <p className="page" role="status">저장된 입력을 확인하고 있습니다…</p>}</main>
        <footer>
          <div><strong>LRQA Korea · CBAM Navigator</strong><p>CBAM 대상 확인부터 검증 준비까지 함께합니다.</p><small>규정 데이터 기준일 {REGULATORY_DATE} · 무료 사전 확인 서비스</small></div>
          <div className="footer-links"><Link href={guideHref(pathname)}>사용 가이드</Link><Link href="/privacy">개인정보 안내</Link><Link href="/legal">법적 근거 및 면책</Link><a href="https://www.lrqa.com/ko-kr/">LRQA Korea 공식 문의 ↗</a></div>
        </footer>
      </div>
    </div>
  );
}
