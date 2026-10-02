"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ApplicationLink } from "./ApplicationLink";
import { REGULATORY_DATE } from "@/shared/cbam-navigator";

const navigation = [
  ["/", "시작하기"],
  ["/cn-search", "CN 코드 검색"],
  ["/applicability", "적용 가능성"],
  ["/product-map", "제품·공정"],
  ["/readiness", "검증 준비도"],
  ["/evidence", "증빙자료"],
  ["/application", "검증 신청"],
] as const;

export function NavigatorShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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
          <ApplicationLink className="button small">검증 신청 <span aria-hidden="true">↗</span></ApplicationLink>
        </header>
        <main id="content">{children}</main>
        <footer>
          <div><strong>LRQA Korea · CBAM Navigator</strong><p>CBAM 대상 확인부터 검증 준비까지 함께합니다.</p><small>규정 데이터 기준일 {REGULATORY_DATE} · 무료 사전 확인 서비스</small></div>
          <div className="footer-links"><Link href="/privacy">개인정보 안내</Link><Link href="/legal">법적 근거 및 면책</Link><a href="https://www.lrqa.com/ko-kr/">LRQA Korea 공식 문의 ↗</a></div>
        </footer>
      </div>
    </div>
  );
}
