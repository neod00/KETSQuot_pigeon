import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LCA_SOLUTION_FORM_URL } from '@/lib/p827-application';

export const metadata: Metadata = { title: 'LCA 산정 솔루션 제3자 검증 견적 요청 | LRQA' };

// The customer form lives on the public application site and submits into the P827 intake.
export default function LcaSolutionApplicationPage() {
  redirect(LCA_SOLUTION_FORM_URL);
}
