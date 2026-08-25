import { getStore } from '@netlify/blobs';
import { STORE_NAME, json, secretMatches } from './shared.mjs';

export default async (request) => {
  if (request.method !== 'POST') return json(405, { message: 'POST 요청만 허용됩니다.' });
  if (!secretMatches(request)) return json(401, { message: '폐기 권한이 없습니다.' });
  let token = '';
  try { token = String((await request.json()).token || ''); } catch { return json(400, { message: '요청 형식이 올바르지 않습니다.' }); }
  const store = getStore(STORE_NAME);
  const current = await store.getWithMetadata(`meta/${token}`, { type: 'json', consistency: 'strong' });
  if (!current) return json(404, { message: '링크를 찾을 수 없습니다.' });
  const result = await store.setJSON(`meta/${token}`, { ...current.data, revoked: true, revokedAt: Date.now() }, { onlyIfMatch: current.etag });
  return result.modified ? json(200, { revoked: true }) : json(409, { message: '다시 시도해 주세요.' });
};
