import JSZip from 'jszip';

type Value = string | number | boolean | { formula: string } | null | undefined;
type Updates = Record<string, Record<string, Value>>;
type Data = Record<string, any>;

const escapeXml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const yesNo = (value: unknown) => value ? 'Yes' : 'No';
const add = (all: Updates, sheet: string, ref: string, value: Value) => ((all[sheet] ||= {})[ref] = value);

export function buildCellUpdates(data: Data): Updates {
  const cells: Updates = {};
  const client = data.client || {}, flags = data.flags || {}, codes = data.activityCodes || {};
  const standards = new Set<string>(data.standards || []);
  const integration = data.integration || {}, transfer = data.transfer || {}, cta = data.cta || {};
  const sampling = data.sampling || {};

  add(cells, 'Client Info', 'H11', yesNo(flags.outsourcedProcesses));
  add(cells, 'Client Info', 'D16', client.createdDate);
  add(cells, 'Client Info', 'H16', client.createdBy);
  add(cells, 'Client Info', 'D20', client.name);
  add(cells, 'Client Info', 'H20', client.contractId || 'New');
  add(cells, 'Client Info', 'D22', client.comments);
  add(cells, 'Client Info', 'H22', client.opportunity);
  add(cells, 'Client Info', 'D24', client.scope);
  add(cells, 'Client Info', 'D26', yesNo(flags.iso55or56));
  add(cells, 'Client Info', 'F26', flags.iso55or56Against);
  for (const [row, standard] of [['28', 'ISO 9001'], ['29', 'ISO 14001'], ['30', 'ISO 45001']]) {
    add(cells, 'Client Info', `D${row}`, standards.has(standard) ? 'Yes' : 'No');
    const values = codes[standard] || [];
    ['F', 'G', 'H'].forEach((col, index) => add(cells, 'Client Info', `${col}${row}`, values[index] || ''));
  }
  add(cells, 'Client Info', 'D38', client.auditFrequency || '12-monthly');
  add(cells, 'Client Info', 'D42', yesNo(integration.otherStandards));
  add(cells, 'Client Info', 'G42', integration.otherStandardsText);
  add(cells, 'Client Info', 'D47', yesNo(transfer.isToa));
  add(cells, 'Client Info', 'G47', transfer.stage);
  add(cells, 'Client Info', 'D52', yesNo(cta.isCta));
  add(cells, 'Client Info', 'G52', cta.covers);
  add(cells, 'Client Info', 'D61', yesNo(sampling.multiSite));
  add(cells, 'Client Info', 'H61', yesNo(sampling.mainSiteExcluded));
  add(cells, 'Client Info', 'D65', sampling.grouping || 'No Sampling Applicable');

  (data.sites || []).slice(0, 100).forEach((site: Data, index: number) => {
    const row = 71 + index, head = site.headcount || {};
    add(cells, 'Client Info', `B${row}`, site.name);
    add(cells, 'Client Info', `C${row}`, site.type);
    add(cells, 'Client Info', `D${row}`, site.address);
    add(cells, 'Client Info', `E${row}`, site.scope);
    add(cells, 'Client Info', `I${row}`, site.riskJustification);
    if (sampling.mainSiteExcluded && index === 0) add(cells, 'Client Info', `L${row}`, site.samplingNote || 'Main site excluded from calculation - justified in app input.');
    for (let offset = 0; offset < 3; offset += 1) {
      const employeeRow = 13 + index * 3 + offset;
      add(cells, 'Effective Employees', `E${employeeRow}`, Number(head.fullTime || 0));
      add(cells, 'Effective Employees', `F${employeeRow}`, Number(head.partTime || 0));
      add(cells, 'Effective Employees', `G${employeeRow}`, Number(head.contractors || 0));
      if (site.employeeReductionReason) add(cells, 'Effective Employees', `L${employeeRow}`, site.employeeReductionReason);
      if (site.furtherReductionJustification) add(cells, 'Effective Employees', `M${employeeRow}`, site.furtherReductionJustification);
    }
  });

  const integrated = data.integratedReduction || {}, answers = integrated.answers || [];
  for (let index = 0; index < 7; index += 1) add(cells, 'Integrated Reduction', `E${8 + index}`, yesNo(Boolean(answers[index])));
  add(cells, 'Integrated Reduction', 'C24', Number(integrated.teamAbility ?? 100));


  (data.adjustments || []).slice(0, 20).forEach((item: Data, index: number) => {
    const row = 8 + index;
    add(cells, 'Adjustment Factors', `B${row}`, item.standard);
    add(cells, 'Adjustment Factors', `C${row}`, item.factor);
    add(cells, 'Adjustment Factors', `D${row}`, item.direction);
    add(cells, 'Adjustment Factors', `L${row}`, item.justification);
  });

  add(cells, 'Sampling', 'I4', yesNo(sampling.useNormalSampling ?? true));
  add(cells, 'Sampling', 'I5', yesNo(sampling.stage1Sampling ?? true));
  add(cells, 'Sampling', 'I6', yesNo(sampling.stage2Sampling ?? true));
  add(cells, 'Sampling', 'I7', yesNo(sampling.surveillanceSampling ?? true));
  add(cells, 'Sampling', 'I8', yesNo(sampling.recertSampling ?? true));
  if (sampling.rationale) add(cells, 'Sampling', 'H24', sampling.rationale);

  add(cells, 'Manual Adjustments', 'E4', data.rounding || 'half');
  (data.manualAdjustments || []).slice(0, 12).forEach((item: Data, index: number) => {
    const row = 22 + index;
    add(cells, 'Manual Adjustments', `B${row}`, item.standard);
    add(cells, 'Manual Adjustments', `C${row}`, item.visit);
    add(cells, 'Manual Adjustments', `D${row}`, item.days);
    add(cells, 'Manual Adjustments', `E${row}`, item.justification);
  });
  return cells;
}

function renderCell(ref: string, value: Value, source: string) {
  const style = source.match(/\bs="([^"]+)"/)?.[1];
  const styleAttr = style ? ` s="${style}"` : '';
  if (value === null || value === undefined || value === '') return `<c r="${ref}"${styleAttr}></c>`;
  if (typeof value === 'boolean') return `<c r="${ref}"${styleAttr} t="b"><v>${value ? 1 : 0}</v></c>`;
  if (typeof value === 'object' && 'formula' in value) return `<c r="${ref}"${styleAttr}><f>${escapeXml(value.formula)}</f><v></v></c>`;
  if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${ref}"${styleAttr}><v>${value}</v></c>`;
  const text = String(value), preserve = text.trim() !== text || text.includes('\n') ? ' xml:space="preserve"' : '';
  return `<c r="${ref}"${styleAttr} t="inlineStr"><is><t${preserve}>${escapeXml(text)}</t></is></c>`;
}

const columnNumber = (ref: string) => ref.match(/^[A-Z]+/)![0].split('').reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0);
function replaceCell(xml: string, ref: string, value: Value) {
  const pattern = new RegExp(`<c\\b(?=[^>]*\\br="${ref}")[^>]*\\/>|<c\\b(?=[^>]*\\br="${ref}")[^>]*>[\\s\\S]*?<\\/c>`);
  const match = xml.match(pattern);
  if (match) return xml.replace(pattern, renderCell(ref, value, match[0]));

  const rowNumber = ref.match(/\d+$/)?.[0];
  const rowPattern = new RegExp(`<row\\b[^>]*\\br="${rowNumber}"[^>]*>[\\s\\S]*?<\\/row>`);
  const rowMatch = xml.match(rowPattern);
  if (!rowMatch) throw new Error(`Template row not found: ${rowNumber}`);
  const newCell = renderCell(ref, value, '');
  const targetColumn = columnNumber(ref);
  const laterCell = [...rowMatch[0].matchAll(/<c\\b[^>]*\\br="([A-Z]+\d+)"/g)]
    .find(item => columnNumber(item[1]) > targetColumn);
  const updatedRow = laterCell
    ? rowMatch[0].replace(laterCell[0], `${newCell}${laterCell[0]}`)
    : rowMatch[0].replace('</row>', `${newCell}</row>`);
  return xml.replace(rowPattern, updatedRow);
}

const attributes = (tag: string) => Object.fromEntries([...tag.matchAll(/([\w:]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
function getSheetPaths(workbookXml: string, relsXml: string) {
  const relationships = new Map<string, string>();
  for (const match of relsXml.matchAll(/<Relationship\b[^>]*\/?\s*>/g)) {
    const attr = attributes(match[0]);
    if (attr.Id && attr.Target) relationships.set(attr.Id, attr.Target.replace(/\\/g, '/'));
  }
  const result = new Map<string, string>();
  for (const match of workbookXml.matchAll(/<sheet\b[^>]*\/?\s*>/g)) {
    const attr = attributes(match[0]), target = relationships.get(attr['r:id']);
    if (attr.name && target) result.set(attr.name, target.startsWith('/') ? target.slice(1) : target.startsWith('xl/') ? target : `xl/${target}`);
  }
  return result;
}

export async function generateAdjWorkbook(template: Buffer, data: Data) {
  const zip = await JSZip.loadAsync(template);
  const workbookFile = zip.file('xl/workbook.xml'), relsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (!workbookFile || !relsFile) throw new Error('Invalid ADJ workbook template');
  const workbookXml = await workbookFile.async('string'), relsXml = await relsFile.async('string');
  const paths = getSheetPaths(workbookXml, relsXml), updates = buildCellUpdates(data);
  for (const [sheetName, cellUpdates] of Object.entries(updates)) {
    const sheetPath = paths.get(sheetName), file = sheetPath ? zip.file(sheetPath) : null;
    if (!sheetPath || !file) throw new Error(`Template sheet not found: ${sheetName}`);
    let xml = await file.async('string');
    for (const [ref, value] of Object.entries(cellUpdates)) xml = replaceCell(xml, ref, value);
    zip.file(sheetPath, xml);
  }
  const calcPr = /<calcPr\b[^>]*\/?\s*>/;
  zip.file('xl/workbook.xml', calcPr.test(workbookXml)
    ? workbookXml.replace(calcPr, '<calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1" calcCompleted="0"/>')
    : workbookXml.replace('</workbook>', '<calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1" calcCompleted="0"/></workbook>'));
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}




