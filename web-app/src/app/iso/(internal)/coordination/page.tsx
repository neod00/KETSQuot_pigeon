import CoordinationDashboard from './CoordinationDashboard';
import { requireCoordinationOwner } from '@/lib/isoAuth';

export const dynamic = 'force-dynamic';

export default async function CoordinationPage() {
  await requireCoordinationOwner('/iso/coordination');
  return <CoordinationDashboard />;
}
