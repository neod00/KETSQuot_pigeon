import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';
import { hasValidInternalSession, privateJsonHeaders, unauthorizedResponse } from './_auth';
import { deleteAllHistory, deleteHistory, listHistory, saveHistory, type StoredHistoryRecord } from './_historyStorage';

export default async (request: Request, _context: Context) => {
    const store = getStore('generation-history');
    const headers = privateJsonHeaders;

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }
    if (!hasValidInternalSession(request)) return unauthorizedResponse();

    const action = new URL(request.url).searchParams.get('action');

    try {
        if (action === 'list' && request.method === 'GET') {
            const records = await listHistory(store);
            return new Response(JSON.stringify(records), { status: 200, headers });
        }

        if (action === 'save' && request.method === 'POST') {
            const body = await request.json();
            const { pageType, pageLabel, companyName, finalCost, vatType, formData, summary } = body;
            if (!pageType || !companyName) {
                return new Response(JSON.stringify({ error: '필수 정보가 누락되었습니다.' }), { status: 400, headers });
            }

            const record: StoredHistoryRecord = {
                id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                pageType,
                pageLabel: pageLabel || pageType,
                companyName,
                finalCost: finalCost || 0,
                vatType: vatType || '별도',
                createdAt: new Date().toISOString(),
                formData,
                summary: summary || {},
            };
            await saveHistory(store, record);
            return new Response(JSON.stringify(record), { status: 201, headers });
        }

        if (action === 'delete' && request.method === 'DELETE') {
            const { id } = await request.json();
            if (!id) {
                return new Response(JSON.stringify({ error: '삭제할 이력 ID가 필요합니다.' }), { status: 400, headers });
            }
            const remaining = await deleteHistory(store, id);
            return new Response(JSON.stringify({ success: true, remaining }), { status: 200, headers });
        }

        if (action === 'deleteAll' && request.method === 'DELETE') {
            await deleteAllHistory(store);
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        return new Response(JSON.stringify({ error: '알 수 없는 요청입니다.' }), { status: 400, headers });
    } catch (error) {
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return new Response(JSON.stringify({ error: message }), { status: 500, headers });
    }
};