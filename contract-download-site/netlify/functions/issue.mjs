import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getStore } from '@netlify/blobs';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb } from 'pdf-lib';
import { EXPIRY_MS, MAX_DOWNLOADS, STORE_NAME, json, safeFilePart, secretMatches } from './shared.mjs';

const required = ['company_name', 'proposal_date', 'proposal_no', 'hq_address', 'target_sites', 'ghg_declaration_period', 'materiality', 'business_registration', 'client_contact', 'industry_type'];

const pdfMasters = {
  statement: 'statement-master.pdf',
  plan: 'plan-master.pdf',
  combined: 'combined-master.pdf',
};

const centeredFields = new Set([
  'stage1_days', 'stage1_cost', 'stage2_days', 'stage2_cost', 'stage3_days', 'stage3_cost',
  'expenses', 'total_days', 'total_cost', 'final_cost', 'materiality', 'audit_rate', 'vat_type',
  'statement_stage1_days', 'statement_stage1_cost', 'statement_stage2_days', 'statement_stage2_cost',
  'statement_stage3_days', 'statement_stage3_cost', 'statement_expenses', 'statement_total_days',
  'statement_total_cost', 'statement_final_cost', 'plan_stage1_days', 'plan_stage1_cost',
  'plan_stage2_days', 'plan_stage2_cost', 'plan_stage3_days', 'plan_stage3_cost', 'plan_expenses',
  'plan_total_days', 'plan_total_cost', 'plan_final_cost',
]);

const fieldWidths = {
  company_name: 220,
  proposal_date: 90,
  proposal_no: 125,
  lrqa_contact_name: 100,
  lrqa_contact_email: 170,
  lrqa_contact_phone: 105,
  hq_address: 300,
  target_sites: 180,
  ghg_declaration_period: 55,
  target_year: 55,
  materiality: 55,
  audit_rate: 80,
  business_registration: 130,
  client_contact: 150,
  industry_type: 240,
};

function cleanPdfValue(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim() || '-';
}

function fitText(font, text, preferredSize, maxWidth) {
  let size = preferredSize;
  while (size > 4.5 && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.25;
  return size;
}

function wrapText(font, text, size, maxWidth) {
  const lines = [];
  let current = '';
  for (const character of text) {
    const candidate = current + character;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current.trim());
      current = character.trimStart();
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

function placementWidth(placement, page, sourcePage) {
  if (sourcePage === 12) {
    if (placement.field === 'business_registration' || placement.field === 'client_contact') return 72;
    if (placement.field === 'company_name' || placement.field === 'hq_address' || placement.field === 'industry_type') return 82;
    if (placement.field === 'proposal_date' && placement.y > 700) return 72;
  }
  if (sourcePage === 15 && placement.field === 'proposal_date') return 112;
  if (sourcePage === 20 && placement.field === 'company_name' && placement.y > 680) return placement.width + 4;
  const pageRoom = Math.max(30, page.getWidth() - placement.x - 36);
  return Math.min(fieldWidths[placement.field] || 92, pageRoom);
}

export async function renderMasterPdf(data, contractType) {
  const assets = new URL('./assets/', import.meta.url);
  const masterPath = fileURLToPath(new URL(pdfMasters[contractType], assets));
  const placementsPath = fileURLToPath(new URL('placements.json', assets));
  const regularPath = fileURLToPath(new URL('NanumGothic-Regular.ttf', assets));
  const boldPath = fileURLToPath(new URL('NanumGothic-Bold.ttf', assets));
  const [masterBytes, placementsBytes, regularBytes, boldBytes] = await Promise.all([
    readFile(masterPath), readFile(placementsPath), readFile(regularPath), readFile(boldPath),
  ]);
  const allPlacements = JSON.parse(placementsBytes.toString('utf8'));
  const contractPlacements = allPlacements[contractType]?.placements;
  if (!contractPlacements?.length) throw new Error(`PDF master placements not found: ${contractType}`);

  const pdf = await PDFDocument.load(masterBytes);
  pdf.registerFontkit(fontkit);
  const [regularFont, boldFont] = await Promise.all([
    pdf.embedFont(regularBytes, { subset: false }),
    pdf.embedFont(boldBytes, { subset: false }),
  ]);
  const pages = pdf.getPages();

  // Remove every marker before drawing values. Some fields share the same line,
  // so a later marker erasure must never cover an already drawn long value.
  for (const placement of contractPlacements) {
    const page = pages[placement.page];
    const sourcePage = contractType === 'combined' && placement.page >= 5 ? placement.page - 1 : placement.page;
    page.drawRectangle({
      x: placement.x - 1,
      y: placement.y - 1,
      width: sourcePage === 15 && placement.field === 'proposal_date' ? 114 : placement.width + 2,
      height: placement.height + 2,
      color: rgb(1, 1, 1),
    });
  }

  for (const placement of contractPlacements) {
    const page = pages[placement.page];
    const sourcePage = contractType === 'combined' && placement.page >= 5 ? placement.page - 1 : placement.page;
    const font = placement.bold ? boldFont : regularFont;
    let value = cleanPdfValue(data[placement.field]);
    if (sourcePage === 15 && placement.field === 'proposal_date') value = `${value} ("효력 발생일")에`;
    const maxWidth = placementWidth(placement, page, sourcePage);
    if (placement.page === 2 && placement.field === 'target_sites') value = `/ ${value}`;
    let fontSize = fitText(font, value, placement.fontSize, maxWidth);
    let textWidth = font.widthOfTextAtSize(value, fontSize);
    let x = centeredFields.has(placement.field)
      ? placement.x + (placement.width - textWidth) / 2
      : placement.x;
    if (placement.page === 2 && placement.field === 'target_sites') {
      const addressPlacement = contractPlacements.find((candidate) => (
        candidate.page === 2 && candidate.field === 'hq_address' && Math.abs(candidate.y - placement.y) < 1
      ));
      if (addressPlacement) {
        const address = cleanPdfValue(data.hq_address);
        const addressFont = addressPlacement.bold ? boldFont : regularFont;
        const addressSize = fitText(addressFont, address, addressPlacement.fontSize, 250);
        x = addressPlacement.x + addressFont.widthOfTextAtSize(address, addressSize) + 7;
      }
    }
    if (placement.field === 'audit_rate') x += 2;
    const [red, green, blue] = placement.color || [0, 0, 0];

    if (sourcePage === 12 && (placement.field === 'hq_address' || placement.field === 'industry_type')) {
      let lines = wrapText(font, value, fontSize, maxWidth);
      while (lines.length > 2 && fontSize > 4.5) {
        fontSize -= 0.25;
        lines = wrapText(font, value, fontSize, maxWidth);
      }
      const lineHeight = fontSize + 0.8;
      const firstY = placement.y + ((lines.length - 1) * lineHeight) / 2;
      lines.slice(0, 2).forEach((line, index) => page.drawText(line, {
        x,
        y: firstY - index * lineHeight,
        size: fontSize,
        font,
        color: rgb(red, green, blue),
      }));
      continue;
    }

    page.drawText(value, {
      x,
      y: placement.y + Math.max(0, (placement.height - fontSize) / 2),
      size: fontSize,
      font,
      color: rgb(red, green, blue),
    });
  }

  if (contractType === 'combined') {
    const cover = pages[0];
    const coverTitle = '온실가스 명세서 및 배출량산정계획서 검증';
    const coverTitleSize = fitText(boldFont, coverTitle, 12, 285);
    cover.drawRectangle({ x: 40, y: 532, width: 290, height: 18, color: rgb(1, 1, 1) });
    cover.drawText(coverTitle, { x: 42.6, y: 534.1, size: coverTitleSize, font: boldFont, color: rgb(0, 0, 0) });

    const service = pages[2];
    const scope = `${cleanPdfValue(data.ghg_declaration_period)}분 명세서 및 ${cleanPdfValue(data.target_year)}분 배출량산정계획서`;
    const scopeSize = fitText(regularFont, scope, 9.96, 285);
    service.drawRectangle({ x: 244, y: 511, width: 295, height: 14, color: rgb(1, 1, 1) });
    service.drawText(scope, { x: 246.4, y: 513.4, size: scopeSize, font: regularFont, color: rgb(0, 0, 0) });

    for (const [pageIndex, label] of [[3, '4-1'], [4, '4-2']]) {
      const quotePage = pages[pageIndex];
      quotePage.drawRectangle({ x: 295, y: 15, width: 22, height: 13, color: rgb(1, 1, 1) });
      quotePage.drawText(label, { x: 297, y: 18, size: 8, font: regularFont, color: rgb(0, 0, 0) });
    }
  }

  return Buffer.from(await pdf.save({ useObjectStreams: false }));
}

async function renderContractPdf(data, contractType) {
  return renderMasterPdf(data, contractType);
}

export default async (request) => {
  if (request.method !== 'POST') return json(405, { message: 'POST 요청만 허용됩니다.' });
  if (!secretMatches(request)) return json(401, { message: '발급 권한이 없습니다.' });

  let payload;
  try { payload = await request.json(); } catch { return json(400, { message: '요청 형식이 올바르지 않습니다.' }); }
  const contractType = ['statement', 'plan', 'combined'].includes(payload.contractType) ? payload.contractType : 'statement';
  const data = payload.data || {};
  const missing = required.filter((key) => !String(data[key] || '').trim());
  if (missing.length) return json(400, { message: '계약서 필수정보가 누락되었습니다.', missing });

  const stripDays = (value) => String(value ?? '').replace(/\s*days?\s*$/i, '').trim();
  const normalizedData = { ...data };
  for (const key of [
    'stage1_days', 'stage2_days', 'stage3_days', 'total_days',
    'statement_stage1_days', 'statement_stage2_days', 'statement_stage3_days', 'statement_total_days',
    'plan_stage1_days', 'plan_stage2_days', 'plan_stage3_days', 'plan_total_days',
  ]) normalizedData[key] = stripDays(normalizedData[key]);
  normalizedData.vat_type = String(normalizedData.vat_type || '').replace(/^VAT\s*/i, '').trim();
  if (/^\d{4}$/.test(String(normalizedData.target_year || '').trim())) normalizedData.target_year = `${normalizedData.target_year}년`;

  const token = randomBytes(32).toString('base64url');
  const createdAt = Date.now();
  const expiresAt = createdAt + EXPIRY_MS;
  const typeLabel = contractType === 'plan' ? '배출량산정계획서_검증' : contractType === 'combined' ? '명세서_및_배출량산정계획서_검증' : '명세서_검증';
  const fileName = `LRQA_K-ETS_${typeLabel}_계약서_${safeFilePart(normalizedData.company_name)}.pdf`;
  const pdf = await renderContractPdf(normalizedData, contractType);
  const pdfData = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength);
  const store = getStore(STORE_NAME);
  await store.set(`pdf/${token}`, pdfData, { onlyIfNew: true });
  await store.setJSON(`meta/${token}`, { createdAt, expiresAt, downloads: 0, maxDownloads: MAX_DOWNLOADS, revoked: false, fileName }, { onlyIfNew: true });

  const origin = new URL(request.url).origin;
  return json(201, { url: `${origin}/.netlify/functions/download?token=${token}`, expiresAt, maxDownloads: MAX_DOWNLOADS });
};
