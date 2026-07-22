import type { Metadata } from "next";
import "./globals.css";
import PortalShell from "@/components/PortalShell";

export const metadata: Metadata = {
  title: "LRQA ISO 신청·견적 관리",
  description: "ISO 신청서 검토와 견적·계약 문서 생성을 위한 LRQA 내부 업무 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body><PortalShell>{children}</PortalShell></body>
    </html>
  );
}
