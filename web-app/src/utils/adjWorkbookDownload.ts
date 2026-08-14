import type { AuditDurationInput, AuditDurationResult } from '../lib/auditDurationEngine';
import type { AuditDurationAdjustment } from '../lib/auditDurationAdjustments';
import type { IsoMultiSiteEvidence } from '../lib/isoMultiSiteEvidence';

export interface AdjWorkbookDownloadInput {
  companyName: string;
  contactPerson?: string;
  issueDate?: string;
  auditType?: string;
  standards: string[];
  scope?: string;
  siteName?: string;
  siteAddress?: string;
  siteCount?: number;
  multiSiteEvidence?: IsoMultiSiteEvidence;
  auditInput: AuditDurationInput;
  auditResult: AuditDurationResult;
  durationAdjustments?: AuditDurationAdjustment[];
}

export async function downloadAdjWorkbook(input: AdjWorkbookDownloadInput) {
  const response = await fetch('/api/iso/adj', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error || 'ADJ workbook could not be created.');
  }
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const fileName = encodedName ? decodeURIComponent(encodedName) : 'ADJ_v3.xlsx';
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
