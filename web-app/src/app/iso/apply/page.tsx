import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'ISO 37001 · ISO 37301 인증 심사 신청 | LRQA' };

export default function IsoComplianceApplicationPage() {
  redirect('https://lrqa-iso-application.netlify.app/compliance/');
}
