// Existing history-list remains readable; each new document gets its own blob.
// Separate keys avoid concurrent saves replacing another user's quotation.
export interface StoredHistoryRecord {
    id: string;
    pageType: 'generator' | 'system' | 'kets-contract';
    pageLabel: string;
    companyName: string;
    finalCost: number;
    vatType: string;
    createdAt: string;
    formData: unknown;
    summary: {
        s1Days: number;
        s2Days: number;
        s3Days: number;
        expenses: number;
        auditRate?: number;
    };
}

export interface HistoryStore {
    get(key: string, options: { type: 'json' }): Promise<unknown>;
    setJSON(key: string, value: unknown): Promise<unknown>;
    delete(key: string): Promise<unknown>;
    list(options: { prefix: string; paginate: true }): AsyncIterable<{ blobs: { key: string }[] }>;
}

const LEGACY_KEY = 'history-list';
const RECORD_PREFIX = 'history-record-';

const read = async <T>(store: HistoryStore, key: string): Promise<T | null> =>
    (await store.get(key, { type: 'json' })) as T | null;

async function recordKeys(store: HistoryStore): Promise<string[]> {
    const keys: string[] = [];
    for await (const page of store.list({ prefix: RECORD_PREFIX, paginate: true })) {
        keys.push(...page.blobs.map(blob => blob.key));
    }
    return keys;
}

export async function listHistory(store: HistoryStore): Promise<StoredHistoryRecord[]> {
    const keys = await recordKeys(store);
    const [legacy, ...records] = await Promise.all([
        read<StoredHistoryRecord[]>(store, LEGACY_KEY),
        ...keys.map(key => read<StoredHistoryRecord>(store, key)),
    ]);
    return [...(legacy || []), ...records.filter((record): record is StoredHistoryRecord => Boolean(record))]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}

export async function saveHistory(store: HistoryStore, record: StoredHistoryRecord): Promise<void> {
    await store.setJSON(`${RECORD_PREFIX}${record.id}`, record);
}

export async function deleteHistory(store: HistoryStore, id: string): Promise<number> {
    const legacy = (await read<StoredHistoryRecord[]>(store, LEGACY_KEY)) || [];
    const filteredLegacy = legacy.filter(record => record.id !== id);
    if (filteredLegacy.length !== legacy.length) await store.setJSON(LEGACY_KEY, filteredLegacy);
    await store.delete(`${RECORD_PREFIX}${id}`);
    return (await listHistory(store)).length;
}

export async function deleteAllHistory(store: HistoryStore): Promise<void> {
    const keys = await recordKeys(store);
    await Promise.all(keys.map(key => store.delete(key)));
    await store.setJSON(LEGACY_KEY, []);
}
