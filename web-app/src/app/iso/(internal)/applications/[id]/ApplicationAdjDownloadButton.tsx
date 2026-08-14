'use client';

import { useState } from 'react';
import type { AuditDurationInput, AuditDurationResult } from '@/lib/auditDurationEngine';
import type { IsoApplication } from '@/lib/isoTypes';
import { downloadAdjWorkbook } from '@/utils/adjWorkbookDownload';

export default function ApplicationAdjDownloadButton({
  application,
  auditInput,
  auditResult,
}: {
  application: IsoApplication;
  auditInput: AuditDurationInput;
  auditResult: AuditDurationResult;
}) {
  const [message, setMessage] = useState('');
  const download = async () => {
    try {
      setMessage('Creating ADJ Excel workbook...');
      await downloadAdjWorkbook({
        companyName: application.companyName,
        contactPerson: application.contactName,
        issueDate: application.submittedAt?.slice(0, 10),
        auditType: application.auditType,
        standards: application.standards,
        scope: application.scope || application.activityDescription,
        siteName: 'Head office',
        siteAddress: application.siteAddress,
        siteCount: application.siteCount,
        auditInput,
        auditResult,
      });
      setMessage('ADJ Excel downloaded. Complete the remaining evidence before approval.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ADJ Excel workbook could not be created.');
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={download}
        disabled={auditResult.status === 'insufficient'}
        className="rounded-md border border-teal-700 bg-white px-3 py-2 text-sm font-bold text-teal-800 hover:bg-teal-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
      >
        ADJ Excel 다운로드
      </button>
      {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
    </div>
  );
}
