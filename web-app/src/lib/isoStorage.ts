import 'server-only';

import { getStore } from '@netlify/blobs';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const LOCAL_ROOT = path.join(process.cwd(), '.local-data', 'iso');
const localJsonUpdateQueues = new Map<string, Promise<void>>();

const shouldUseNetlifyBlobs = () => process.env.NETLIFY === 'true' || Boolean(process.env.SITE_ID);

const safeLocalPath = (storeName: string, key: string) => {
  const parts = key.replace(/\\/g, '/').split('/').filter((part) => part && part !== '.' && part !== '..');
  return path.join(LOCAL_ROOT, storeName, ...parts);
};

export async function getIsoJson<T>(storeName: string, key: string): Promise<T | null> {
  if (shouldUseNetlifyBlobs()) {
    const value = await getStore(storeName).get(key, { type: 'json', consistency: 'strong' });
    return (value as T | null) ?? null;
  }

  try {
    return JSON.parse(await readFile(safeLocalPath(storeName, key), 'utf8')) as T;
  } catch {
    return null;
  }
}

export async function updateIsoJson<T>(
  storeName: string,
  key: string,
  updater: (current: T | null) => T | Promise<T>,
) {
  if (shouldUseNetlifyBlobs()) {
    const store = getStore(storeName);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const current = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
      const next = await updater((current?.data as T | undefined) ?? null);
      const result = current?.etag
        ? await store.setJSON(key, next, { onlyIfMatch: current.etag })
        : await store.setJSON(key, next, { onlyIfNew: true });
      if (result.modified) return next;
    }
    throw new Error('동시 수정이 많아 데이터를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }

  const queueKey = storeName + '/' + key;
  const previous = localJsonUpdateQueues.get(queueKey) || Promise.resolve();
  let nextValue: T | undefined;
  const operation = previous.catch(() => undefined).then(async () => {
    nextValue = await updater(await getIsoJson<T>(storeName, key));
    await setIsoJson(storeName, key, nextValue);
  });
  localJsonUpdateQueues.set(queueKey, operation.then(() => undefined, () => undefined));
  await operation;
  return nextValue as T;
}

export async function setIsoJson(storeName: string, key: string, value: unknown) {
  if (shouldUseNetlifyBlobs()) {
    await getStore(storeName).setJSON(key, value);
    return;
  }

  const filePath = safeLocalPath(storeName, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

export async function listIsoJson<T>(storeName: string, prefix: string): Promise<T[]> {
  if (shouldUseNetlifyBlobs()) {
    const store = getStore(storeName);
    const listed = await store.list({ prefix });
    const values = await Promise.all(listed.blobs.map((item) => store.get(item.key, { type: 'json', consistency: 'strong' })));
    return values.filter(Boolean) as T[];
  }

  const prefixPath = safeLocalPath(storeName, prefix);
  try {
    const files = await readdir(prefixPath, { recursive: true });
    const jsonFiles = files.filter((file) => String(file).endsWith('.json'));
    return await Promise.all(jsonFiles.map(async (file) => {
      const raw = await readFile(path.join(prefixPath, String(file)), 'utf8');
      return JSON.parse(raw) as T;
    }));
  } catch {
    return [];
  }
}

export async function setIsoBinary(storeName: string, key: string, value: Uint8Array) {
  if (shouldUseNetlifyBlobs()) {
    const buffer = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
    await getStore(storeName).set(key, new Blob([buffer], { type: 'application/octet-stream' }));
    return;
  }

  const filePath = safeLocalPath(storeName, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value);
}

export async function getIsoBinary(storeName: string, key: string): Promise<Uint8Array | null> {
  if (shouldUseNetlifyBlobs()) {
    const value = await getStore(storeName).get(key, { type: 'arrayBuffer', consistency: 'strong' });
    return value ? new Uint8Array(value) : null;
  }

  try {
    return new Uint8Array(await readFile(safeLocalPath(storeName, key)));
  } catch {
    return null;
  }
}

export async function deleteIsoValue(storeName: string, key: string) {
  if (shouldUseNetlifyBlobs()) {
    await getStore(storeName).delete(key);
    return;
  }

  try {
    await unlink(safeLocalPath(storeName, key));
  } catch {
    // A missing temporary upload part is already clean.
  }
}