import { redirect } from 'next/navigation';
import { requireIsoAdmin } from '@/lib/isoAuth';
import {
  listInternalAccessRequests,
  listInternalInvitations,
  listInternalUsers,
} from '@/lib/internalUsers';
import UserManagementClient from './UserManagementClient';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await requireIsoAdmin('/iso/users');
  if (session.role !== 'admin') redirect('/iso/applications');
  const [users, invitations, accessRequests] = await Promise.all([
    listInternalUsers(),
    listInternalInvitations(),
    listInternalAccessRequests(),
  ]);
  return (
    <UserManagementClient
      initialUsers={users}
      initialInvitations={invitations}
      initialAccessRequests={accessRequests}
    />
  );
}
