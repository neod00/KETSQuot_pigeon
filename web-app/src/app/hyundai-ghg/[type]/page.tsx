import { notFound } from 'next/navigation';
import HyundaiGhgApplicationForm from '@/components/HyundaiGhgApplicationForm';
import P827ApplicationForm from '@/components/P827ApplicationForm';

export const metadata = { title: '현대차 협력사 GHG검증 신청 | LRQA Korea', description: '기존 고객 및 신규 현대차 협력사의 온실가스 검증 신청' };

export default async function HyundaiGhgPublicPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (type !== 'existing' && type !== 'new') notFound();
  if (type === 'new') return <P827ApplicationForm destination="hyundai-new" />;
  return <HyundaiGhgApplicationForm customerType="existing" />;
}
