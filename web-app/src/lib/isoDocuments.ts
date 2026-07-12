import 'server-only';

import { randomUUID } from 'node:crypto';
import { deleteIsoValue, getIsoBinary, getIsoJson, listIsoJson, setIsoBinary, setIsoJson } from './isoStorage';
import type { IsoDocumentMeta } from './isoTypes';

const STORE = 'iso-documents';
const MAX_DOCUMENT_BYTES = 30 * 1024 * 1024;

type IsoDocumentInput = Omit<IsoDocumentMeta, 'id' | 'createdAt' | 'storageKey' | 'contentType'>;

const uploadPartKey = (uploadId: string, index: number) => `uploads/${uploadId}/${index}.part`;

export async function saveIsoDocumentBinary(
  bytes: Uint8Array,
  contentType: string,
  input: IsoDocumentInput,
) {
  if (bytes.byteLength > MAX_DOCUMENT_BYTES) throw new Error('문서 크기는 30MB 이하여야 합니다.');

  const id = `DOC-${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
  const storageKey = `files/${id}.docx`;
  const metadata: IsoDocumentMeta = {
    ...input,
    id,
    createdAt: new Date().toISOString(),
    storageKey,
    contentType: contentType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  await setIsoBinary(STORE, storageKey, bytes);
  await setIsoJson(STORE, `meta/${id}.json`, metadata);
  return metadata;
}

export async function saveIsoDocument(file: File, input: IsoDocumentInput) {
  return saveIsoDocumentBinary(new Uint8Array(await file.arrayBuffer()), file.type, input);
}

export const saveIsoDocumentPart = async (uploadId: string, index: number, file: File) => {
  await setIsoBinary(STORE, uploadPartKey(uploadId, index), new Uint8Array(await file.arrayBuffer()));
};

export async function finalizeIsoDocumentUpload(
  uploadId: string,
  partCount: number,
  contentType: string,
  input: IsoDocumentInput,
) {
  const partKeys = Array.from({ length: partCount }, (_, index) => uploadPartKey(uploadId, index));
  const parts = await Promise.all(partKeys.map((key) => getIsoBinary(STORE, key)));
  if (parts.some((part) => !part)) throw new Error('업로드된 문서 조각이 일부 누락되었습니다. 다시 생성해주세요.');

  const completeParts = parts as Uint8Array[];
  const totalBytes = completeParts.reduce((sum, part) => sum + part.byteLength, 0);
  if (totalBytes > MAX_DOCUMENT_BYTES) throw new Error('문서 크기는 30MB 이하여야 합니다.');

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  completeParts.forEach((part) => {
    bytes.set(part, offset);
    offset += part.byteLength;
  });

  const metadata = await saveIsoDocumentBinary(bytes, contentType, input);
  await Promise.all(partKeys.map((key) => deleteIsoValue(STORE, key)));
  return metadata;
}

export async function listIsoDocuments() {
  const documents = await listIsoJson<IsoDocumentMeta>(STORE, 'meta');
  return documents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const getIsoDocument = (id: string) => getIsoJson<IsoDocumentMeta>(STORE, `meta/${id}.json`);
export const getIsoDocumentBinary = (storageKey: string) => getIsoBinary(STORE, storageKey);