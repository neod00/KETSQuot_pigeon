import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationLink } from "@/components/ApplicationLink";
import { NavigatorProvider } from "@/components/NavigatorContext";
import { REGULATORY_DATE } from "@/shared/cbam-navigator";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "LRQA CBAM Navigator",
    template: "%s | LRQA CBAM Navigator",
  },
  description:
    "CBAM 대상 확인부터 검증 준비까지. LRQA Korea의 무료 검증 준비지원 서비스.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <a className="skip" href="#content">
          본문으로 이동
        </a>
        <NavigatorProvider>
          <header className="site-header">
            <div className="header-inner">
              <Link href="/" className="brand">
                <img src="/lrqa-logo.png" alt="LRQA" width="112" height="44" />
                <span>
                  <strong>CBAM Navigator</strong>
                  <small>LRQA Korea</small>
                </span>
              </Link>
              <ApplicationLink className="button small">
                검증 신청 <span aria-hidden="true">↗</span>
              </ApplicationLink>
            </div>
            <nav aria-label="주요 기능">
              <Link href="/cn-search">CN 코드 검색</Link>
              <Link href="/applicability">적용 가능성</Link>
              <Link href="/product-map">제품·공정</Link>
              <Link href="/readiness">검증 준비도</Link>
              <Link href="/evidence">증빙자료</Link>
            </nav>
          </header>
          <main id="content">{children}</main>
          <footer>
            <div>
              <strong>LRQA Korea · CBAM Navigator</strong>
              <p>CBAM 대상 확인부터 검증 준비까지 함께합니다.</p>
              <small>
                규정 데이터 기준일 {REGULATORY_DATE} · 무료 사전 확인 서비스
              </small>
            </div>
            <div className="footer-links">
              <Link href="/privacy">개인정보 안내</Link>
              <Link href="/legal">법적 근거 및 면책</Link>
              <a href="https://www.lrqa.com/ko-kr/">LRQA Korea 공식 문의 ↗</a>
            </div>
          </footer>
        </NavigatorProvider>
      </body>
    </html>
  );
}
