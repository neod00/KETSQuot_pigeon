import 'server-only';

import { listIsoJson, setIsoJson } from './isoStorage';

const STORE = 'iso-application-inbox';
const DELETED_PREFIX = 'deleted';

interface DeletedIsoApplication {
  applicationId: string;
  deletedAt: string;
  deletedBy: string;
}

const deletedKey = (applicationId: string) => `${DELETED_PREFIX}/${applicationId}.json`;

export async function listDeletedIsoApplicationIds() {
  const records = await listIsoJson<DeletedIsoApplication>(STORE, DELETED_PREFIX);
  return new Set(records.map((record) => record.applicationId).filter(Boolean));
}

export async function deleteIsoApplicationsFromInbox(applicationIds: string[], deletedBy: string) {
  const deletedAt = new Date().toISOString();
  await Promise.all(applicationIds.map((applicationId) => setIsoJson(STORE, deletedKey(applicationId), {
    applicationId,
    deletedAt,
    deletedBy,
  } satisfies DeletedIsoApplication)));
}