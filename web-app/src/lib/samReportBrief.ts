import type { SamAccountView } from './samTypes';

export interface SamReportRow {
  id: string;
  accountId: string;
  accountName: string;
  date: string;
  source: '진행현황' | '연결 견적';
  description: string;
  nextAction: string;
}

const datePart = (value: string) => value.slice(0, 10).replaceAll('.', '-');

export function reportPeriodStart(period: 'week' | 'month', now = new Date()): string {
  const start = period === 'month'
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
}

export function samReportRows(accounts: SamAccountView[], start: string, end: string): SamReportRow[] {
  const rows = accounts.flatMap(account => {
    const accountName = account.name.ko || account.name.en;
    const updates: SamReportRow[] = account.updates
      .filter(update => datePart(update.date) >= start && datePart(update.date) <= end)
      .map(update => ({
        id: `update-${account.id}-${update.id}`,
        accountId: account.id,
        accountName,
        date: datePart(update.date),
        source: '진행현황',
        description: update.briefing?.ko || update.accomplishments.ko || update.pipelineChanges.ko || '진행현황 기록',
        nextAction: update.nextActions.ko || '',
      }));
    const quotations: SamReportRow[] = account.pipeline
      .filter(record => datePart(record.quotedAt) >= start && datePart(record.quotedAt) <= end)
      .map(record => ({
        id: `quote-${account.id}-${record.id}`,
        accountId: account.id,
        accountName,
        date: datePart(record.quotedAt),
        source: '연결 견적',
        description: `${record.opportunityName || record.product || '견적'} · ${record.stage || '상태 미기재'} · ${record.amount.toLocaleString('ko-KR')}원`,
        nextAction: '',
      }));
    return [...updates, ...quotations];
  });
  return rows.sort((a, b) => b.date.localeCompare(a.date) || a.accountName.localeCompare(b.accountName));
}
