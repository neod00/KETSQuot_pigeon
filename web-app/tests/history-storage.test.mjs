import assert from 'node:assert/strict';
import test from 'node:test';
import { listHistory, saveHistory, deleteHistory, deleteAllHistory } from '../netlify/functions/_historyStorage.ts';

class MemoryStore {
  data = new Map();
  async get(key) { return structuredClone(this.data.get(key) ?? null); }
  async setJSON(key, value) { this.data.set(key, structuredClone(value)); }
  async delete(key) { this.data.delete(key); }
  async *list({ prefix }) {
    const blobs = [...this.data.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key }));
    yield { blobs };
  }
}

const record = n => ({
  id: `record-${n}`,
  pageType: 'generator',
  pageLabel: 'K-ETS 견적서',
  companyName: `고객 ${n}`,
  finalCost: n,
  vatType: '별도',
  createdAt: new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString(),
  formData: { stage1: n },
  summary: { s1Days: 1, s2Days: 2, s3Days: 3, expenses: 0 },
});

test('기존 100건과 추가 205건을 모두 보존하고 원본 입력을 다시 읽는다', async () => {
  const store = new MemoryStore();
  await store.setJSON('history-list', Array.from({ length: 100 }, (_, n) => record(n)));
  for (let n = 100; n < 305; n++) await saveHistory(store, record(n));

  const all = await listHistory(store);
  assert.equal(all.length, 305);
  assert.equal(all[0].id, 'record-304');
  assert.equal(all.at(-1).id, 'record-0');
  assert.deepEqual(all.find(row => row.id === 'record-212')?.formData, { stage1: 212 });
  assert.equal((await store.get('history-list')).length, 100);
  assert.equal([...store.data.keys()].filter(key => key.startsWith('history-record-')).length, 205);

  assert.equal(await deleteHistory(store, 'record-25'), 304);
  assert.equal(await deleteHistory(store, 'record-212'), 303);
  assert.equal((await listHistory(store)).length, 303);
  await deleteAllHistory(store);
  assert.deepEqual(await listHistory(store), []);
});

test('동시 저장 시 두 문서가 서로 덮어쓰지 않는다', async () => {
  const store = new MemoryStore();
  await Promise.all([saveHistory(store, record(1)), saveHistory(store, record(2))]);
  assert.deepEqual((await listHistory(store)).map(row => row.id), ['record-2', 'record-1']);
});
