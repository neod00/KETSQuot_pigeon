import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_SAM_MAIL_CONTENT,
  newSamMailMessageRefs,
  parseSamMailInput,
  persistUniqueSamMailDraft,
  SamMailInputError,
} from '../src/lib/samMailUpload';
import type { SamMailDraft, SamMailMessageRef } from '../src/lib/samTypes';

const message = (id = 'message-1'): SamMailMessageRef => ({
  id, subject: 'Follow up', from: 'sender@example.test', to: 'owner@example.test', receivedAt: '2026-11-04',
});
const payload = () => ({ accountId: 'account-a', source: 'eml-upload', messages: [message()], content: '메일 본문' });
const bilingual = { ko: '', en: '', status: 'review' as const };
const draft = (id: string, accountId = 'account-a', source: SamMailDraft['source'] = 'eml-upload'): SamMailDraft => ({
  id, accountId, source, status: 'pending', messageRefs: [message()],
  analysis: {
    status: 'on-track', dueDate: '', briefing: bilingual, accomplishments: bilingual,
    customerMeetings: bilingual, pipelineChanges: bilingual, blockers: bilingual,
    nextActions: bilingual, managerSupport: bilingual, uncategorized: bilingual,
  },
  createdAt: '2026-11-04T00:00:00.000Z', createdBy: 'test',
});

test('mail content at the limit is retained in full and longer content is rejected, not truncated', () => {
  const content = '가'.repeat(MAX_SAM_MAIL_CONTENT - 4) + '마지막줄';
  assert.equal(parseSamMailInput({ ...payload(), content }).content, content);
  assert.throws(() => parseSamMailInput({ ...payload(), content: content + '초과' }),
    (error: unknown) => error instanceof SamMailInputError && error.status === 413);
});

test('an upload represents exactly one message, while a bounded collector batch is supported', () => {
  assert.equal(parseSamMailInput(payload()).messages.length, 1);
  assert.throws(() => parseSamMailInput({ ...payload(), messages: [message(), message('second')] }), SamMailInputError);
  assert.equal(parseSamMailInput({ ...payload(), source: 'outlook-web', messages: [message(), message('second')] }).messages.length, 2);
  assert.throws(() => parseSamMailInput({ ...payload(), source: 'outlook-web', messages: Array.from({ length: 51 }, (_, i) => message(String(i))) }),
    (error: unknown) => error instanceof SamMailInputError && error.status === 413);
});

test('malformed, empty or oversized metadata fails before analysis without coercion or ID truncation', () => {
  for (const input of [
    null, [], {}, { ...payload(), source: 'unknown' }, { ...payload(), accountId: '' },
    { ...payload(), content: 123 }, { ...payload(), content: '  ' },
    { ...payload(), messages: [] }, { ...payload(), messages: [null] },
    { ...payload(), messages: [{ ...message(), id: '' }] },
    { ...payload(), messages: [{ ...message(), id: 'x'.repeat(501) }] },
    { ...payload(), messages: [{ ...message(), subject: 'x'.repeat(1001) }] },
    { ...payload(), messages: [{ ...message(), from: { address: 'sender@example.test' } }] },
  ]) assert.throws(() => parseSamMailInput(input), SamMailInputError);
});

test('uploads deduplicate within the selected account across pending, approved and discarded drafts', () => {
  for (const status of ['pending', 'approved', 'discarded'] as const) {
    const known = [{ ...draft('existing'), status }];
    assert.deepEqual(newSamMailMessageRefs(known, [message()], 'account-a'), []);
    assert.equal(newSamMailMessageRefs(known, [message()], 'account-b').length, 1);
    assert.deepEqual(newSamMailMessageRefs(known, [message()]), []);
  }
  assert.deepEqual(newSamMailMessageRefs([], [message(), message()]).map((item) => item.id), ['message-1']);
});

// Emulate the optimistic retry contract used by updateIsoJson, with no real
// storage, customer data or environment access.
const retryingStore = () => {
  let stored: SamMailDraft[] = [];
  let revision = 0;
  let calls = 0;
  return {
    read: () => stored,
    calls: () => calls,
    update: async (updater: (current: SamMailDraft[] | null) => SamMailDraft[]) => {
      for (;;) {
        const currentRevision = revision;
        const next = updater(stored);
        calls += 1;
        await Promise.resolve();
        if (currentRevision !== revision) continue;
        stored = next;
        revision += 1;
        return stored;
      }
    },
  };
};

test('concurrent identical uploads create one draft and the retry reliably returns duplicate', async () => {
  const store = retryingStore();
  const results = await Promise.all([
    persistUniqueSamMailDraft(draft('request-1'), store.update),
    persistUniqueSamMailDraft(draft('request-2'), store.update),
  ]);
  assert.ok(store.calls() > 2, 'the test must exercise a storage conflict and retry');
  assert.equal(store.read().length, 1);
  assert.equal(results.filter((result) => result.draft).length, 1);
  assert.equal(results.filter((result) => result.duplicate && result.draft === null).length, 1);
  assert.equal(store.read()[0].status, 'pending');
});

test('the same email can be uploaded for different accounts and the collector retains global deduplication', async () => {
  const store = retryingStore();
  const uploads = await Promise.all([
    persistUniqueSamMailDraft(draft('request-1', 'account-a'), store.update),
    persistUniqueSamMailDraft(draft('request-2', 'account-b'), store.update),
  ]);
  assert.ok(uploads.every((result) => result.draft && !result.duplicate));
  assert.equal(store.read().length, 2);
  const collected = await persistUniqueSamMailDraft(draft('collector', 'account-c', 'outlook-web'), store.update);
  assert.deepEqual(collected, { draft: null, duplicate: true });
  assert.equal(store.read().length, 2);
});
