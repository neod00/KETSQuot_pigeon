import 'server-only';

import PizZip from 'pizzip';
import type { AuditDurationInput, AuditDurationResult } from './auditDurationEngine';

export interface AdjWorkbookRequest {
  companyName: string;
  contactPerson?: string;
  createdBy?: string;
  issueDate?: string;
  auditType?: string;
  standards: string[];
  scope?: string;
  siteName?: string;
  siteAddress?: string;
  siteCount?: number;
  auditInput: AuditDurationInput;
  auditResult: AuditDurationResult;
}

const escapeXml = (value: string) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const setCell = (xml: string, reference: string, value: string | number) => {
  const numeric = typeof value === 'number' && Number.isFinite(value);
  const replacement = (_full: string, attrs = '') => {
    const cleanAttrs = attrs.replace(/\s+t="[^"]*"/g, '');
    const inner = numeric
      ? `<v>${value}</v>`
      : `<is><t xml:space="preserve">${escapeXml(String(value))}</t></is>`;
    return `<c r="${reference}"${cleanAttrs}${numeric ? '' : ' t="inlineStr"'}>${inner}</c>`;
  };
  const complete = new RegExp(`<c r="${reference}"([^>]*)>[\\s\\S]*?<\\/c>`, 'g');
  if (complete.test(xml)) return xml.replace(complete, replacement);
  const selfClosing = new RegExp(`<c r="${reference}"([^>]*)\\/>`, 'g');
  return xml.replace(selfClosing, replacement);
};

const updateWorksheet = (zip: PizZip, worksheetPath: string, updates: Record<string, string | number>) => {
  const file = zip.file(worksheetPath);
  if (!file) throw new Error(`ADJ template worksheet is missing: ${worksheetPath}`);
  let xml = file.asText();
  for (const [reference, value] of Object.entries(updates)) xml = setCell(xml, reference, value);
  zip.file(worksheetPath, xml);
};

const safeFilePart = (value: string) => (value || 'client')
  .replace(/[\\/?%*:|"<>]/g, '-')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 80);

const isTransfer = (auditType = '') => /transfer|takeover|인수|전환/i.test(auditType);

/** Keeps every original worksheet, formula, validation rule and style in ADJ_v3 intact. */
export const buildAdjWorkbook = (template: Uint8Array, request: AdjWorkbookRequest) => {
  const zip = new PizZip(template);
  const selected = new Set(request.standards);
  const scope = request.scope?.trim() || 'To be confirmed by the assessor';
  const siteCount = Math.max(1, Math.floor(request.siteCount || request.auditInput.siteCount || 1));
  const issueDate = request.issueDate || new Date().toISOString().slice(0, 10);
  const notes = [
    `Generated from LRQA ADJ v3 on ${issueDate}.`,
    `Scope: ${scope}`,
    'EA sector and LRQA activity code must be selected and reviewed by an authorised competent person in ADJ.',
    siteCount > 1 ? `Declared sites: ${siteCount}. Complete the remaining site rows and sampling evidence before approval.` : '',
    request.auditResult.warnings.length ? `Review required: ${request.auditResult.warnings.join(' | ')}` : '',
  ].filter(Boolean).join('\n');

  // Client Info is worksheet 3 in the protected LRQA ADJ v3 workbook.
  updateWorksheet(zip, 'xl/worksheets/sheet3.xml', {
    D16: issueDate,
    H16: request.createdBy || request.contactPerson || 'LRQA assessor',
    D20: request.companyName || 'Client to be confirmed',
    H20: 'New',
    D22: `Effective employees: ${request.auditResult.effectiveEmployees}`,
    H22: `${request.companyName || 'Client'} - ISO certification assessment`,
    D28: selected.has('ISO 9001') ? 'Yes' : '',
    D29: selected.has('ISO 14001') ? 'Yes' : '',
    D30: selected.has('ISO 45001') ? 'Yes' : '',
    D32: notes,
    D38: '12-monthly',
    D47: isTransfer(request.auditType) ? 'Yes' : 'No',
    D52: 'No',
    D61: siteCount > 1 && request.auditInput.multiSite?.eligible ? 'Yes' : 'No',
    B71: request.siteName || 'Head office',
    C71: 'Main Site',
    D71: request.siteAddress || '',
    E71: scope,
  });

  // Effective Employees is worksheet 6. Populate the three standard rows only;
  // the template formulas continue to calculate ENP, sampling and audit days.
  const effectiveRows: Record<string, string | number> = {};
  const fullTime = Math.max(0, request.auditInput.fullTimeEmployees || 0);
  const partTime = Math.max(0, request.auditInput.partTimeEmployees || 0);
  const contractors = Math.max(0, request.auditInput.contractorEmployees || 0);
  const rowByStandard: Record<string, number> = { 'ISO 9001': 13, 'ISO 14001': 14, 'ISO 45001': 15 };
  for (const [standard, row] of Object.entries(rowByStandard)) {
    if (!selected.has(standard)) continue;
    effectiveRows[`E${row}`] = fullTime;
    effectiveRows[`F${row}`] = partTime;
    effectiveRows[`G${row}`] = contractors;
  }
  updateWorksheet(zip, 'xl/worksheets/sheet6.xml', effectiveRows);

  const workbookFile = zip.file('xl/workbook.xml');
  if (workbookFile) {
    const workbookXml = workbookFile.asText().replace(/<calcPr([^>]*)\/?>(?:<\/calcPr>)?/i, (_full, attributes) =>
      `<calcPr${String(attributes).replace(/\s+(calcMode|fullCalcOnLoad|forceFullCalc)="[^"]*"/g, '')} calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/>`);
    zip.file('xl/workbook.xml', workbookXml);
  }

  return {
    bytes: zip.generate({ type: 'uint8array', compression: 'DEFLATE' }) as Uint8Array,
    fileName: `ADJ_v3_${safeFilePart(request.companyName)}_${issueDate.replace(/-/g, '')}.xlsx`,
  };
};
