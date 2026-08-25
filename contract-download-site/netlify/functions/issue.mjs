import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getStore } from '@netlify/blobs';
import chromium from '@sparticuz/chromium';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import puppeteer from 'puppeteer-core';
import { EXPIRY_MS, MAX_DOWNLOADS, STORE_NAME, json, safeFilePart, secretMatches } from './shared.mjs';

const required = ['company_name', 'proposal_date', 'proposal_no', 'hq_address', 'target_sites', 'ghg_declaration_period', 'materiality', 'business_registration', 'client_contact', 'industry_type'];
const browserExecutable = async () => process.env.LOCAL_CHROME_EXECUTABLE || await chromium.executablePath();

const docxTemplates = {
  statement: 'K-ETSemission_template.docx',
  plan: 'K-ETS_plan_template.docx',
  combined: 'K-ETS_statement_plan_template.docx',
};

export async function renderDocxPdf(data, contractType) {
  const assets = new URL('./assets/', import.meta.url);
  const template = await readFile(fileURLToPath(new URL(docxTemplates[contractType], assets)));
  const zip = new PizZip(template);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  const docxBytes = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  const jsZipScript = fileURLToPath(new URL('jszip.min.js', assets));
  const previewScript = fileURLToPath(new URL('docx-preview.min.js', assets));

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 900 },
    executablePath: await browserExecutable(),
    headless: chromium.headless,
  });
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4 portrait;margin:0}html,body{margin:0!important;padding:0!important;background:#fff!important}.docx-wrapper{background:#fff!important;padding:0!important}.docx-wrapper>section.docx{margin:0!important;box-shadow:none!important;page-break-after:always!important}</style></head><body><main id="document"></main></body></html>');
    await page.addScriptTag({ path: jsZipScript });
    await page.addScriptTag({ path: previewScript });
    await page.evaluate(async (base64) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      await window.docx.renderAsync(bytes.buffer, document.getElementById('document'), null, {
        inWrapper: true,
        breakPages: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        useBase64URL: true,
      });
      await document.fonts.ready;
    }, docxBytes.toString('base64'));
    await page.emulateMediaType('print');
    // docx-preview inserts one leading print sheet for these Word templates.
    // Exclude that sheet so the generated PDF starts with the designed cover.
    return await page.pdf({ format: 'A4', pageRanges: '2-', scale: 0.98, preferCSSPageSize: true, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  } finally {
    await browser.close();
  }
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

  const token = randomBytes(32).toString('base64url');
  const createdAt = Date.now();
  const expiresAt = createdAt + EXPIRY_MS;
  const typeLabel = contractType === 'plan' ? '배출량산정계획서_검증' : contractType === 'combined' ? '명세서_및_배출량산정계획서_검증' : '명세서_검증';
  const fileName = `LRQA_K-ETS_${typeLabel}_계약서_${safeFilePart(data.company_name)}.pdf`;
  const pdf = await renderDocxPdf(data, contractType);
  const pdfData = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength);
  const store = getStore(STORE_NAME);
  await store.set(`pdf/${token}`, pdfData, { onlyIfNew: true });
  await store.setJSON(`meta/${token}`, { createdAt, expiresAt, downloads: 0, maxDownloads: MAX_DOWNLOADS, revoked: false, fileName }, { onlyIfNew: true });

  const origin = new URL(request.url).origin;
  return json(201, { url: `${origin}/.netlify/functions/download?token=${token}`, expiresAt, maxDownloads: MAX_DOWNLOADS });
};
