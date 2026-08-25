import { getStore } from '@netlify/blobs';
import { STORE_NAME, json } from './shared.mjs';

const errorPage = (status, title, text) => new Response(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;background:#f3f6f8;color:#172033;font-family:Arial,sans-serif}.box{max-width:540px;margin:12vh auto;background:#fff;border:1px solid #dce3e8;border-radius:12px;padding:36px}h1{font-size:22px;color:#007f78}</style></head><body><main class="box"><h1>${title}</h1><p>${text}</p><p>문서를 보낸 LRQA 담당자에게 새 링크를 요청해 주세요.</p></main></body></html>`, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow, noarchive' } });

export default async (request) => {
  if (request.method !== 'GET') return json(405, { message: 'GET 요청만 허용됩니다.' });
  const token = new URL(request.url).searchParams.get('token') || '';
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return errorPage(404, '문서를 찾을 수 없습니다', '유효하지 않은 문서 링크입니다.');

  const store = getStore(STORE_NAME);
  let claimed;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const current = await store.getWithMetadata(`meta/${token}`, { type: 'json', consistency: 'strong' });
    if (!current) return errorPage(404, '문서를 찾을 수 없습니다', '문서가 없거나 삭제되었습니다.');
    const meta = current.data;
    if (meta.revoked) return errorPage(410, '사용이 중지된 링크입니다', 'LRQA 담당자가 이 링크의 사용을 중지했습니다.');
    if (Date.now() >= Number(meta.expiresAt)) return errorPage(410, '링크가 만료되었습니다', '이 링크의 10일 유효기간이 지났습니다.');
    if (Number(meta.downloads) >= Number(meta.maxDownloads || 3)) return errorPage(410, '다운로드 횟수를 초과했습니다', '허용된 최대 3회 다운로드를 모두 사용했습니다.');
    const next = { ...meta, downloads: Number(meta.downloads) + 1, lastDownloadedAt: Date.now() };
    const result = await store.setJSON(`meta/${token}`, next, { onlyIfMatch: current.etag });
    if (result.modified) { claimed = next; break; }
  }
  if (!claimed) return errorPage(409, '잠시 후 다시 시도해 주세요', '동시에 여러 다운로드가 요청되었습니다.');

  const pdf = await store.get(`pdf/${token}`, { type: 'arrayBuffer', consistency: 'strong' });
  if (!pdf) return errorPage(404, '문서를 찾을 수 없습니다', '문서 파일이 없거나 삭제되었습니다.');
  return new Response(pdf, { status: 200, headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="LRQA-KETS-contract.pdf"; filename*=UTF-8''${encodeURIComponent(claimed.fileName)}`, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow, noarchive' } });
};
