#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const DEFAULT_EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const root = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(root, 'outlook-sam-sync.config.json');
const statePath = path.join(root, 'outlook-sam-sync.state.json');

const readJson = async (file, fallback) => {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; }
};

const normalise = (value) => String(value || '')
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, '');

const compact = (value, maximum = 12000) => String(value || '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maximum);

const must = (value, message) => {
  if (!value) throw new Error(message);
  return value;
};

const requestWithWindowsTrustStore = (url, options = {}) => new Promise((resolve, reject) => {
  const child = spawn('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', path.join(root, 'invoke-sam-api.ps1'),
    '-Url', url,
  ], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('error', reject);
  child.on('close', (code) => {
    if (code !== 0) return reject(new Error(stderr.trim() || `Windows API request failed (${code})`));
    try { resolve(JSON.parse(stdout)); } catch { reject(new Error('Windows API response was not valid JSON.')); }
  });
  child.stdin.end(JSON.stringify({
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body || null,
  }));
});

const request = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `SAM API request failed (${response.status})`);
    return payload;
  } catch (error) {
    const certificateError = String(error?.cause || error).includes('unable to get local issuer certificate');
    if (!certificateError) throw error;
    console.log('Using the Windows trust store for the SAM API connection.');
    return requestWithWindowsTrustStore(url, options);
  }
};

const userDataDir = (config) => path.resolve(root, config.profileDirectory || 'edge-profile');

const messageMeta = async (row) => row.evaluate((element) => ({
  id: element.getAttribute('data-convid') || element.getAttribute('data-itemid') || element.getAttribute('data-automationid') || '',
  text: element.innerText || element.textContent || '',
}));

const findConversationRows = async (page) => {
  const selectors = [
    '[role="main"] [role="option"]',
    '[role="main"] [role="listitem"]',
    '[role="main"] [data-convid]',
  ];
  for (const selector of selectors) {
    const rows = page.locator(selector);
    if (await rows.count()) return rows;
  }
  return page.locator('[role="option"], [role="listitem"]');
};

const findMessageBody = async (page) => {
  const selectors = [
    '[role="main"] [dir="ltr"]',
    '[role="main"] [data-automationid="messageBodyContent"]',
    '[role="main"] [aria-label*="message"]',
  ];
  for (const selector of selectors) {
    const target = page.locator(selector).last();
    if (await target.count() && await target.isVisible()) {
      const text = compact(await target.innerText(), 14000);
      if (text) return text;
    }
  }
  return compact(await page.locator('body').innerText(), 14000);
};

const accountFor = (accounts, text) => {
  const source = normalise(text);
  const candidates = accounts.map((account) => {
    const score = account.terms.reduce((total, term) => {
      const termValue = normalise(term);
      return total + (termValue && source.includes(termValue) ? termValue.length : 0);
    }, 0);
    return { account, score };
  }).filter((candidate) => candidate.score > 1)
    .sort((left, right) => right.score - left.score);
  return candidates.length === 1 || (candidates[0]?.score > (candidates[1]?.score || 0)) ? candidates[0]?.account : null;
};

async function main() {
  const config = await readJson(configPath, null);
  if (!config) throw new Error(`설정 파일이 없습니다: ${configPath}`);
  const siteUrl = must(config.siteUrl, 'siteUrl을 설정해 주세요.');
  const syncKey = must(config.syncKey, 'syncKey를 설정해 주세요.');
  const folderName = config.folderName || 'SAM-AI 대상';
  const visible = process.argv.includes('--visible') || Boolean(config.visible);
  const state = await readJson(statePath, { processed: [] });
  const processed = new Set(Array.isArray(state.processed) ? state.processed : []);
  const headers = { 'x-sam-sync-key': syncKey };
  const catalog = await request(`${siteUrl.replace(/\/$/, '')}/api/iso/sam/mail`, { headers });
  const accounts = catalog.accounts || [];

  const context = await chromium.launchPersistentContext(userDataDir(config), {
    channel: 'msedge',
    executablePath: config.edgeExecutablePath || DEFAULT_EDGE,
    headless: !visible,
    viewport: { width: 1440, height: 1000 },
  });
  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto('https://outlook.office.com/mail/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    if (/login\.microsoftonline\.com|login\.live\.com/i.test(page.url())) {
      throw new Error('Outlook 로그인이 필요합니다. --visible 옵션으로 실행해 전용 Edge 프로필에 로그인한 뒤 다시 실행해 주세요.');
    }

    const folder = page.getByText(folderName, { exact: true });
    if (!await folder.count()) throw new Error(`Outlook에서 '${folderName}' 폴더를 찾지 못했습니다.`);
    await folder.first().click();
    await page.waitForTimeout(1500);

    const rows = await findConversationRows(page);
    const total = Math.min(await rows.count(), Number(config.maxMessages || 20));
    const grouped = new Map();

    for (let index = 0; index < total; index += 1) {
      const row = rows.nth(index);
      const meta = await messageMeta(row);
      const rowKey = meta.id || `row:${normalise(meta.text).slice(0, 300)}`;
      if (!rowKey || processed.has(rowKey)) continue;
      await row.click();
      await page.waitForTimeout(550);
      const body = await findMessageBody(page);
      const currentUrl = page.url();
      const text = compact(`${meta.text}\n${body}`, 16000);
      const match = accountFor(accounts, text);
      if (!match) continue;
      const lines = meta.text.split('\n').map((line) => compact(line, 500)).filter(Boolean);
      const item = {
        id: rowKey,
        conversationId: meta.id || undefined,
        subject: compact(lines[1] || lines[0], 1000),
        from: compact(lines[0], 500),
        to: '',
        receivedAt: '',
        webLink: currentUrl.includes('/mail/') ? currentUrl : undefined,
        body: text,
      };
      const current = grouped.get(match.id) || [];
      current.push(item);
      grouped.set(match.id, current);
    }

    let created = 0;
    for (const [accountId, messages] of grouped) {
      const payload = await request(`${siteUrl.replace(/\/$/, '')}/api/iso/sam/mail`, {
        method: 'PUT',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({
          accountId,
          source: 'outlook-web',
          messages: messages.map(({ body, ...message }) => message),
          content: messages.map((message) => `[Outlook 메일]\n제목: ${message.subject}\n본문:\n${message.body}`).join('\n\n---\n\n'),
        }),
      });
      if (!payload.duplicate) created += 1;
      messages.forEach((message) => processed.add(message.id));
    }
    await fs.writeFile(statePath, JSON.stringify({ processed: [...processed].slice(-1000), updatedAt: new Date().toISOString() }, null, 2), 'utf8');
    console.log(`Outlook SAM 동기화 완료: ${grouped.size}개 Account, 새 AI 초안 ${created}건`);
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(`Outlook SAM 동기화 실패: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
