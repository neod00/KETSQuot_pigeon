import { timingSafeEqual } from 'node:crypto';

export const STORE_NAME = 'private-contract-documents';
export const EXPIRY_MS = 10 * 24 * 60 * 60 * 1000;
export const MAX_DOWNLOADS = 3;

export const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export const secretMatches = (request) => {
  const expected = process.env.CONTRACT_ISSUE_SECRET || '';
  const supplied = request.headers.get('x-contract-issue-secret') || '';
  if (!expected || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
};

export const safeFilePart = (value) => String(value || '고객').replace(/[\\/:*?"<>|\r\n]/g, '-').slice(0, 80);
