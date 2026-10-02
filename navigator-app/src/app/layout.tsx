import type { Metadata } from "next";
import { NavigatorProvider } from "@/components/NavigatorContext";
import { NavigatorShell } from "@/components/NavigatorShell";
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
        <NavigatorProvider><NavigatorShell>{children}</NavigatorShell></NavigatorProvider>
      </body>
    </html>
  );
}
