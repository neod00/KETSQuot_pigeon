import HyundaiGhgAdmin from '@/components/HyundaiGhgAdmin';
import { requireIsoAdmin } from '@/lib/isoAuth';

export const dynamic = 'force-dynamic';
export const metadata = { title: '현대차 협력사 GHG검증 관리 | LRQA Korea' };

export default async function HyundaiGhgAdminPage() {
  await requireIsoAdmin('/hyundai-ghg/admin');
  return <HyundaiGhgAdmin />;
}
