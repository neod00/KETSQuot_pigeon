import 'server-only';

import { randomUUID } from 'node:crypto';
import { getIsoBinary, getIsoJson, listIsoJson, setIsoBinary, setIsoJson } from './isoStorage';
import type { IsoDocumentMeta } from './isoTypes';

const STORE = 'iso-documents';

export async function saveIsoDocument(
  file: File,
  input: Omit<IsoDocumentMeta, 'id' | 'createdAt' | 'storageKey' | 'contentType'>,
) {
  const id = `DOC-${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
  const storageKey = `files/${id}.docx`;
  const metadata: IsoDocumentMeta = {
    ...input,
    id,
    createdAt: new Date().toISOString(),
    storageKey,
    contentType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  await setIsoBinary(STORE, storageKey, new Uint8Array(await file.arrayBuffer()));
  await setIsoJson(STORE, `meta/${id}.json`, metadata);
  return metadata;
}

export async function listIsoDocuments() {
  const documents = await listIsoJson<IsoDocumentMeta>(STORE, 'meta');
  return documents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const getIsoDocument = (id: string) => getIsoJson<IsoDocumentMeta>(STORE, `meta/${id}.json`);
export const getIsoDocumentBinary = (storageKey: string) => getIsoBinary(STORE, storageKey);
