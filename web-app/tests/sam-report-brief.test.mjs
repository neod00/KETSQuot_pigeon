import assert from 'node:assert/strict';
import test from 'node:test';
import { reportPeriodStart, samReportRows } from '../src/lib/samReportBrief.ts';

test('선택한 기간의 기록만 SAM 보고 근거로 모은다', () => {
  assert.equal(reportPeriodStart('week', new Date(2026, 8, 23)), '2026-09-17');
  assert.equal(reportPeriodStart('month', new Date(2026, 8, 23)), '2026-09-01');

  const accounts = [{
    id: 'sam-1', name: { ko: '예시 그룹' },
    updates: [
      { id: 'latest', date: '2026-09-21', briefing: { ko: '고객 협의 완료' }, accomplishments: { ko: '' }, pipelineChanges: { ko: '' }, nextActions: { ko: '견적 확인' } },
      { id: 'old', date: '2026-08-28', accomplishments: { ko: '이전 보고' }, pipelineChanges: { ko: '' }, nextActions: { ko: '' } },
    ],
    pipeline: [
      { id: 'quote-1', quotedAt: '2026-09-19', opportunityName: 'ISO 9001', product: 'ISO', stage: '견적 발송', amount: 12000000 },
      { id: 'quote-old', quotedAt: '2026-08-30', product: 'ISO', stage: '견적 발송', amount: 5000000 },
    ],
  }];

  const rows = samReportRows(accounts, '2026-09-17', '2026-09-23');
  assert.deepEqual(rows.map(row => row.id), ['update-sam-1-latest', 'quote-sam-1-quote-1']);
  assert.equal(rows[0].nextAction, '견적 확인');
  assert.match(rows[1].description, /12,000,000원/);
});
