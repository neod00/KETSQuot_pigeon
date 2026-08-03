import { redirect } from 'next/navigation';
import SamDashboard from './SamDashboard';
import { requireIsoAdmin } from '@/lib/isoAuth';

export default async function SamPage() {
  const session = await requireIsoAdmin('/iso/sam');
  if (session.role !== 'admin') redirect('/iso/applications');
  return <SamDashboard />;
}
