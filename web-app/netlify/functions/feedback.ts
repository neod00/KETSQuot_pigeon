import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

interface Feedback {
    id: string;
    name: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export default async (request: Request, context: Context) => {
    const store = getStore("team-feedback");

    // CORS headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
