import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";
import { hasValidInternalSession, privateJsonHeaders, unauthorizedResponse } from './_auth';

interface HistoryRecord {
    id: string;
    pageType: 'generator' | 'system' | 'kets-contract';
    pageLabel: string;
    companyName: string;
    finalCost: number;
    vatType: string;
    createdAt: string;
    formData: any;
    summary: {
        s1Days: number;
        s2Days: number;
        s3Days: number;
        expenses: number;
        auditRate?: number;
    };
}

const MAX_RECORDS = 100;

export default async (request: Request, context: Context) => {
    const store = getStore("generation-history");

    const headers = privateJsonHeaders;

    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers });
    }

    if (!hasValidInternalSession(request)) return unauthorizedResponse();

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    try {
        // 이력 목록 조회
        if (action === "list" && request.method === "GET") {
            const existingData = await store.get("history-list", { type: "json" });
            const historyList: HistoryRecord[] = existingData || [];

            return new Response(JSON.stringify(historyList), { status: 200, headers });
        }

        // 이력 저장
        if (action === "save" && request.method === "POST") {
            const body = await request.json();
            const { pageType, pageLabel, companyName, finalCost, vatType, formData, summary } = body;

            if (!pageType || !companyName) {
                return new Response(
                    JSON.stringify({ error: "필수 정보가 누락되었습니다." }),
                    { status: 400, headers }
                );
            }

            const existingData = await store.get("history-list", { type: "json" });
            const historyList: HistoryRecord[] = existingData || [];

            const newRecord: HistoryRecord = {
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

            historyList.unshift(newRecord);

            // 최대 건수 초과 시 가장 오래된 건 삭제
            if (historyList.length > MAX_RECORDS) {
                historyList.splice(MAX_RECORDS);
            }

            await store.setJSON("history-list", historyList);

            return new Response(JSON.stringify(newRecord), { status: 201, headers });
        }

        // 개별 삭제
        if (action === "delete" && request.method === "DELETE") {
            const body = await request.json();
            const { id } = body;

            if (!id) {
                return new Response(
                    JSON.stringify({ error: "삭제할 이력 ID가 필요합니다." }),
                    { status: 400, headers }
                );
            }

            const existingData = await store.get("history-list", { type: "json" });
            const historyList: HistoryRecord[] = existingData || [];
            const filtered = historyList.filter(h => h.id !== id);

            await store.setJSON("history-list", filtered);

            return new Response(JSON.stringify({ success: true, remaining: filtered.length }), { status: 200, headers });
        }

        // 전체 삭제
        if (action === "deleteAll" && request.method === "DELETE") {
            await store.setJSON("history-list", []);

            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        return new Response(
            JSON.stringify({ error: "알 수 없는 요청입니다." }),
            { status: 400, headers }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message || "서버 오류가 발생했습니다." }),
            { status: 500, headers }
        );
    }
};
