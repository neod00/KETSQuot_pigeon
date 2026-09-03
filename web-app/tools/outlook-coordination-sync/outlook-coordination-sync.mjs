#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const DEFAULT_EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const root = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(root, 'outlook-coordination-sync.config.json');
const statePath = path.join(root, 'outlook-coordination-sync.state.json');
const schedule = [[9, 0], [12, 30], [16, 30]];

const readJson = async (file, fallback) => {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; }
};

const compact = (value, maximum = 12000) => String(value || '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maximum);

const normalise = (value) => compact(value, 1000)
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, '');

const must = (value, message) => {
  if (!value) throw new Error(message);
  return value;
};

const previousWeekday = (value) => {
  const candidate = new Date(value);
  candidate.setDate(candidate.getDate() - 1);
  while (candidate.getDay() === 0 || candidate.getDay() === 6) candidate.setDate(candidate.getDate() - 1);
  return candidate;
};

export const latestDueSlot = (now = new Date()) => {
  let day = new Date(now);
  day.setSeconds(0, 0);
  if (day.getDay() === 0 || day.getDay() === 6) day = previousWeekday(day);

  const candidates = schedule.map(([hour, minute]) => {
    const slot = new Date(day);
    slot.setHours(hour, minute, 0, 0);
    return slot;
  }).filter((slot) => slot <= now);

  if (candidates.length) return candidates.at(-1);
  const prior = previousWeekday(day);
  prior.setHours(16, 30, 0, 0);
  return prior;
};

export const catchUpNeeded = (state, now = new Date()) => {
  const due = latestDueSlot(now);
  const completed = state?.updatedAt ? new Date(state.updatedAt) : null;
  return !completed || Number.isNaN(completed.getTime()) || completed < due;
};

const redactRequestSecrets = (value, options = {}) => {
  let redacted = String(value || '');
  Object.values(options.headers || {}).forEach((secret) => {
    if (secret) redacted = redacted.replaceAll(String(secret), '[redacted]');
  });
  return redacted;
};

const requestWithWindowsTrustStore = async (url, options = {}) => {
  const requestPath = path.join(os.tmpdir(), `lrqa-coordination-request-${randomUUID()}.json`);
  await fs.writeFile(requestPath, JSON.stringify({
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body || null,
  }), { encoding: 'utf8', mode: 0o600 });

  try {
    return await new Promise((resolve, reject) => {
      const child = spawn('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', path.join(root, 'invoke-coordination-api.ps1'),
        '-Url', url,
        '-RequestPath', requestPath,
      ], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
      let stdout = '';
      let stderr = '';
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
      child.on('error', reject);
      child.on('close', (code) => {
        if (code !== 0) return reject(new Error(redactRequestSecrets(stderr.trim(), options) || `Windows API request failed (${code})`));
        try { resolve(JSON.parse(stdout)); } catch { reject(new Error('Windows API response was not valid JSON.')); }
      });
    });
  } finally {
    await fs.unlink(requestPath).catch(() => undefined);
  }
};

const request = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Coordination API request failed (${response.status})`);
    return payload;
  } catch (error) {
    const certificateError = String(error?.cause || error).includes('unable to get local issuer certificate');
    if (!certificateError) throw error;
    console.log('Using the Windows trust store for the coordination API connection.');
    return requestWithWindowsTrustStore(url, options);
  }
};

const userDataDir = (config) => path.resolve(root, config.profileDirectory || 'edge-profile');

const findConversationRows = async (page) => {
  const selectors = [
    '[role="main"] [role="option"]',
    '[role="main"] [role="listitem"][data-convid]',
    '[role="main"] [data-convid]',
    '[role="main"] [data-itemid]',
  ];
  for (const selector of selectors) {
    const rows = page.locator(selector);
    if (await rows.count()) return rows;
  }
  return page.locator('[role="option"], [role="listitem"]');
};

const waitForConversationRows = async (page) => {
  await page.locator('[data-convid], [data-itemid]').first()
    .waitFor({ state: 'visible', timeout: 6000 })
    .catch(() => undefined);
};

const messageMeta = async (row) => row.evaluate((element) => ({
  id: element.getAttribute('data-convid') || element.getAttribute('data-itemid') || element.getAttribute('data-automationid') || '',
  itemId: element.getAttribute('data-itemid') || '',
  text: element.innerText || element.textContent || '',
  label: element.getAttribute('aria-label') || '',
  datetime: element.querySelector('time')?.getAttribute('datetime') || '',
  pinned: Array.from(element.querySelectorAll('[aria-label], [title], [data-icon-name]')).some((child) => {
    const marker = [child.getAttribute('aria-label'), child.getAttribute('title'), child.getAttribute('data-icon-name')]
      .filter(Boolean)
      .join(' ');
    return /고정|pinned/i.test(marker);
  }),
}));

const isToday = (meta, now = new Date()) => {
  const source = `${meta.label}\n${meta.text}\n${meta.datetime}`;
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const dateMarkers = [
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    `${year}.${month}.${day}`,
    `${month}/${day}`,
    `${month}월 ${day}일`,
  ];
  return /(?:오전|오후)\s*\d{1,2}:\d{2}/.test(source) ||
    /\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/i.test(source) ||
    /오늘|today/i.test(source) ||
    dateMarkers.some((marker) => source.includes(marker));
};

const findMessageBody = async (page) => {
  const selectors = [
    '[data-automationid="messageBodyContent"]',
    '[role="document"]',
    '[aria-label="Message body"]',
    '[aria-label="메시지 본문"]',
    '[role="main"] [dir="ltr"]',
    '[role="main"] [aria-label*="message" i]',
    '[role="main"] [aria-label*="메시지"]',
  ];
  for (const selector of selectors) {
    const targets = page.locator(selector);
    for (let index = await targets.count() - 1; index >= 0; index -= 1) {
      const target = targets.nth(index);
      if (await target.isVisible().catch(() => false)) {
        const value = compact(await target.innerText().catch(() => ''), 14000);
        if (value) return value;
      }
    }
  }
  return '';
};

const folderLocator = async (page, preferred) => {
  const names = [...new Set([preferred, '전체 받은편지함', '전체 받은 편지함', '받은 편지함', 'Inbox'].filter(Boolean))];
  for (const name of names) {
    const exact = page.getByText(name, { exact: true });
    if (await exact.count() && await exact.first().isVisible().catch(() => false)) return exact.first();
  }

  const expected = new Set(names.map((name) => normalise(name)));
  const candidates = page.locator('[role="treeitem"], [role="link"], [role="button"]');
  const values = await candidates.evaluateAll((elements) => elements.map((element, index) => ({
    index,
    label: element.getAttribute('aria-label') || element.getAttribute('title') || '',
    text: element.textContent || '',
  })));
  const match = values.find((candidate) => {
    const labels = [candidate.label, ...candidate.text.split('\n')]
      .map((value) => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '').replace(/\d+$/u, ''));
    return labels.some((label) => expected.has(label));
  });
  if (match && await candidates.nth(match.index).isVisible().catch(() => false)) return candidates.nth(match.index);
  return null;
};

const tabLocator = async (page, names) => {
  for (const name of names) {
    const byRole = page.getByRole('tab', { name: new RegExp(`^${name}$`, 'i') });
    if (await byRole.count()) return byRole.first();
    const byText = page.getByText(name, { exact: true });
    if (await byText.count()) return byText.first();
  }
  return null;
};

const collectVisibleRows = async ({ page, processed, maximum, seen, todayOnly }) => {
  const rows = await findConversationRows(page);
  const total = Math.min(await rows.count(), Math.max(maximum * 5, 50));
  const messages = [];
  const skipped = { pinned: 0, notToday: 0, processed: 0, noBody: 0 };

  for (let index = 0; index < total; index += 1) {
    if (messages.length >= maximum) break;
    const currentRows = await findConversationRows(page);
    if (index >= await currentRows.count()) break;
    const row = currentRows.nth(index);
    const meta = await messageMeta(row);
    const sourceText = compact(`${meta.label}\n${meta.text}`, 5000);
    const fallbackId = `row:${normalise(sourceText).slice(0, 500)}`;
    const rowKey = compact(meta.itemId || meta.id || fallbackId, 1000);
    if (meta.pinned) { skipped.pinned += 1; continue; }
    if (todayOnly && !isToday(meta)) { skipped.notToday += 1; continue; }
    if (!rowKey || processed.has(rowKey) || seen.has(rowKey)) { skipped.processed += 1; continue; }

    await row.scrollIntoViewIfNeeded().catch(() => undefined);
    await row.click();
    await page.waitForTimeout(650);
    const body = await findMessageBody(page);
    if (!body) { skipped.noBody += 1; continue; }
    const lines = String(meta.text || meta.label).split('\n').map((line) => compact(line, 1000)).filter(Boolean);
    const currentUrl = page.url();
    messages.push({
      id: rowKey,
      conversationId: compact(meta.id, 1000) || undefined,
      subject: compact(lines[1] || lines[0] || '(제목 없음)', 1000),
      from: compact(lines[0] || '발신자 확인 필요', 500),
      receivedAt: compact(meta.datetime, 100),
      webLink: /^https:\/\/outlook\.office\.com\/mail\//i.test(currentUrl) ? currentUrl : undefined,
      content: compact(`${sourceText}\n${body}`, 16000),
    });
    seen.add(rowKey);
  }
  return { messages, skipped };
};

async function main() {
  const config = await readJson(configPath, null);
  if (!config) throw new Error(`설정 파일이 없습니다: ${configPath}`);
  const siteUrl = must(config.siteUrl, 'siteUrl을 설정해 주세요.').replace(/\/$/, '');
  const syncKey = must(config.syncKey, 'syncKey를 설정해 주세요.');
  const visible = process.argv.includes('--visible') || Boolean(config.visible);
  const state = await readJson(statePath, { processed: [] });
  const headers = { 'x-coordination-sync-key': syncKey };

  await request(`${siteUrl}/api/iso/coordination/sync`, { headers });
  if (process.argv.includes('--check-api')) {
    console.log('Coordination API connection OK.');
    return;
  }
  if (process.argv.includes('--catch-up') && !visible && !catchUpNeeded(state)) {
    console.log('No missed coordination schedule is due.');
    return;
  }

  const processed = new Set(Array.isArray(state.processed) ? state.processed : []);
  const context = await chromium.launchPersistentContext(userDataDir(config), {
    channel: 'msedge',
    executablePath: config.edgeExecutablePath || DEFAULT_EDGE,
    headless: !visible,
    viewport: { width: 1440, height: 1000 },
  });

  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto('https://outlook.office.com/mail/inbox', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    if (/login\.microsoftonline\.com|login\.live\.com/i.test(page.url())) {
      throw new Error('Outlook 로그인이 필요합니다. --visible 옵션으로 실행해 전용 Edge 프로필에 로그인한 뒤 다시 실행해 주세요.');
    }

    const folder = await folderLocator(page, config.folderName || '전체 받은편지함');
    if (folder) {
      await folder.click();
      await page.waitForTimeout(1500);
    } else {
      console.log('받은편지함 메뉴를 찾지 못해 /mail/inbox으로 열린 현재 화면을 그대로 사용합니다.');
    }
    await waitForConversationRows(page);

    const maximum = Math.max(1, Math.min(Number(config.maxMessagesPerTab || 20), 40));
    const todayOnly = config.todayOnly !== false;
    const messages = [];
    const seen = new Set();
    const skipped = { pinned: 0, notToday: 0, processed: 0, noBody: 0 };
    const tabs = [
      ['중요', 'Focused'],
      ['기타', 'Other'],
    ];
    let tabFound = false;
    for (const names of tabs) {
      const tab = await tabLocator(page, names);
      if (!tab) continue;
      tabFound = true;
      await tab.click();
      await page.waitForTimeout(900);
      await waitForConversationRows(page);
      const result = await collectVisibleRows({ page, processed, maximum, seen, todayOnly });
      messages.push(...result.messages);
      Object.keys(skipped).forEach((key) => { skipped[key] += result.skipped[key]; });
    }
    if (!tabFound) {
      const result = await collectVisibleRows({ page, processed, maximum, seen, todayOnly });
      messages.push(...result.messages);
      Object.keys(skipped).forEach((key) => { skipped[key] += result.skipped[key]; });
    }

    let created = 0;
    if (!messages.length) {
      await request(`${siteUrl}/api/iso/coordination/sync`, {
        method: 'PUT',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      });
    }
    for (let index = 0; index < messages.length; index += 20) {
      const batch = messages.slice(index, index + 20);
      const payload = await request(`${siteUrl}/api/iso/coordination/sync`, {
        method: 'PUT',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ messages: batch }),
      });
      created += Number(payload.created || 0);
      batch.forEach((message) => processed.add(message.id));
    }

    await fs.writeFile(statePath, JSON.stringify({
      processed: [...processed].slice(-2000),
      updatedAt: new Date().toISOString(),
    }, null, 2), 'utf8');
    console.log(`Outlook 전체 받은편지함 동기화 완료: 확인 ${messages.length}건, 신규 조정 업무 ${created}건, 고정 제외 ${skipped.pinned}건, 오늘 아님 제외 ${skipped.notToday}건`);
  } finally {
    await context.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Outlook 조정 에이전트 동기화 실패: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
