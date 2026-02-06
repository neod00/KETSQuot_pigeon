import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

interface Feedback {
    id: string;
    name: string;
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt?: string;
}

export default async (request: Request, context: Context) => {
    const store = getStore("team-feedback");

    // CORS headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Content-Type": "application/json",
    };

    // Handle preflight
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers });
    }

    try {
        // GET: 피드백 목록 조회
        if (request.method === "GET") {
            const feedbackListData = await store.get("feedback-list", { type: "json" });
            const feedbackList: Feedback[] = feedbackListData || [];

            // 최신순 정렬
            feedbackList.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            return new Response(JSON.stringify(feedbackList), { status: 200, headers });
        }

        // POST: 새 피드백 저장
        if (request.method === "POST") {
            const body = await request.json();
            const { name, rating, comment } = body;

            if (!comment || comment.trim() === "") {
                return new Response(
                    JSON.stringify({ error: "의견을 입력해주세요." }),
                    { status: 400, headers }
                );
            }

            const newFeedback: Feedback = {
                id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: name?.trim() || "익명",
                rating: Math.min(5, Math.max(1, rating || 5)),
                comment: comment.trim(),
                createdAt: new Date().toISOString(),
            };

            // 기존 목록 가져오기
            const existingData = await store.get("feedback-list", { type: "json" });
            const feedbackList: Feedback[] = existingData || [];

            // 새 피드백 추가
            feedbackList.push(newFeedback);

            // 저장
            await store.setJSON("feedback-list", feedbackList);

            return new Response(JSON.stringify(newFeedback), { status: 201, headers });
        }

        // PUT: 피드백 수정
        if (request.method === "PUT") {
            const body = await request.json();
            const { id, name, rating, comment } = body;

            if (!id) {
                return new Response(
                    JSON.stringify({ error: "피드백 ID가 필요합니다." }),
                    { status: 400, headers }
                );
            }

            if (!comment || comment.trim() === "") {
                return new Response(
                    JSON.stringify({ error: "의견을 입력해주세요." }),
                    { status: 400, headers }
                );
            }

            // 기존 목록 가져오기
            const existingData = await store.get("feedback-list", { type: "json" });
            const feedbackList: Feedback[] = existingData || [];

            // 해당 피드백 찾기
            const feedbackIndex = feedbackList.findIndex(fb => fb.id === id);
            if (feedbackIndex === -1) {
                return new Response(
                    JSON.stringify({ error: "피드백을 찾을 수 없습니다." }),
                    { status: 404, headers }
                );
            }

            // 수정
            feedbackList[feedbackIndex] = {
                ...feedbackList[feedbackIndex],
                name: name?.trim() || "익명",
                rating: Math.min(5, Math.max(1, rating || 5)),
                comment: comment.trim(),
                updatedAt: new Date().toISOString(),
            };

            // 저장
            await store.setJSON("feedback-list", feedbackList);

            return new Response(JSON.stringify(feedbackList[feedbackIndex]), { status: 200, headers });
        }

        // DELETE: 피드백 삭제
        if (request.method === "DELETE") {
            const url = new URL(request.url);
            const id = url.searchParams.get("id");

            if (!id) {
                return new Response(
                    JSON.stringify({ error: "피드백 ID가 필요합니다." }),
                    { status: 400, headers }
                );
            }

            // 기존 목록 가져오기
            const existingData = await store.get("feedback-list", { type: "json" });
            const feedbackList: Feedback[] = existingData || [];

            // 해당 피드백 찾기
            const feedbackIndex = feedbackList.findIndex(fb => fb.id === id);
            if (feedbackIndex === -1) {
                return new Response(
                    JSON.stringify({ error: "피드백을 찾을 수 없습니다." }),
                    { status: 404, headers }
                );
            }

            // 삭제
            feedbackList.splice(feedbackIndex, 1);

            // 저장
            await store.setJSON("feedback-list", feedbackList);

            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers }
        );
    } catch (error) {
        console.error("Feedback function error:", error);
        return new Response(
            JSON.stringify({ error: "서버 오류가 발생했습니다." }),
            { status: 500, headers }
        );
    }
};
