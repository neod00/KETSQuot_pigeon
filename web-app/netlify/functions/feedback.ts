import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

interface Reply {
    id: string;
    name: string;
    comment: string;
    createdAt: string;
}

interface Feedback {
    id: string;
    name: string;
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt?: string;
    likes: number;
    likedBy: string[]; // 좋아요 누른 사용자 ID (익명 식별자)
    replies: Reply[];
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

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

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

        // POST: 새 피드백 저장 또는 특수 액션
        if (request.method === "POST") {
            const body = await request.json();

            // 좋아요 토글
            if (action === "like") {
                const { feedbackId, odonymId } = body;

                if (!feedbackId || !odonymId) {
                    return new Response(
                        JSON.stringify({ error: "필수 정보가 누락되었습니다." }),
                        { status: 400, headers }
                    );
                }

                const existingData = await store.get("feedback-list", { type: "json" });
                const feedbackList: Feedback[] = existingData || [];

                const feedbackIndex = feedbackList.findIndex(fb => fb.id === feedbackId);
                if (feedbackIndex === -1) {
                    return new Response(
                        JSON.stringify({ error: "피드백을 찾을 수 없습니다." }),
                        { status: 404, headers }
                    );
                }

                const feedback = feedbackList[feedbackIndex];

                // likedBy 배열 초기화 (기존 데이터 호환)
                if (!feedback.likedBy) feedback.likedBy = [];
                if (typeof feedback.likes !== 'number') feedback.likes = 0;

                // 좋아요 토글
                const alreadyLiked = feedback.likedBy.includes(odonymId);
                if (alreadyLiked) {
                    feedback.likedBy = feedback.likedBy.filter(id => id !== odonymId);
                    feedback.likes = Math.max(0, feedback.likes - 1);
                } else {
                    feedback.likedBy.push(odonymId);
                    feedback.likes += 1;
                }

                feedbackList[feedbackIndex] = feedback;
                await store.setJSON("feedback-list", feedbackList);

                return new Response(JSON.stringify({
                    likes: feedback.likes,
                    liked: !alreadyLiked
                }), { status: 200, headers });
            }

            // 댓글 추가
            if (action === "reply") {
                const { feedbackId, name, comment } = body;

                if (!feedbackId || !comment?.trim()) {
                    return new Response(
                        JSON.stringify({ error: "댓글 내용을 입력해주세요." }),
                        { status: 400, headers }
                    );
                }

                const existingData = await store.get("feedback-list", { type: "json" });
                const feedbackList: Feedback[] = existingData || [];

                const feedbackIndex = feedbackList.findIndex(fb => fb.id === feedbackId);
                if (feedbackIndex === -1) {
                    return new Response(
                        JSON.stringify({ error: "피드백을 찾을 수 없습니다." }),
                        { status: 404, headers }
                    );
                }

                const newReply: Reply = {
                    id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: name?.trim() || "익명",
                    comment: comment.trim(),
                    createdAt: new Date().toISOString(),
                };

                // replies 배열 초기화 (기존 데이터 호환)
                if (!feedbackList[feedbackIndex].replies) {
                    feedbackList[feedbackIndex].replies = [];
                }

                feedbackList[feedbackIndex].replies.push(newReply);
                await store.setJSON("feedback-list", feedbackList);

                return new Response(JSON.stringify(newReply), { status: 201, headers });
            }

            // 일반 피드백 작성
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
                likes: 0,
                likedBy: [],
                replies: [],
            };

            const existingData = await store.get("feedback-list", { type: "json" });
            const feedbackList: Feedback[] = existingData || [];

            feedbackList.push(newFeedback);
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

            const existingData = await store.get("feedback-list", { type: "json" });
            const feedbackList: Feedback[] = existingData || [];

            const feedbackIndex = feedbackList.findIndex(fb => fb.id === id);
            if (feedbackIndex === -1) {
                return new Response(
                    JSON.stringify({ error: "피드백을 찾을 수 없습니다." }),
                    { status: 404, headers }
                );
            }

            feedbackList[feedbackIndex] = {
                ...feedbackList[feedbackIndex],
                name: name?.trim() || "익명",
                rating: Math.min(5, Math.max(1, rating || 5)),
                comment: comment.trim(),
                updatedAt: new Date().toISOString(),
            };

            await store.setJSON("feedback-list", feedbackList);

            return new Response(JSON.stringify(feedbackList[feedbackIndex]), { status: 200, headers });
        }

        // DELETE: 피드백 또는 댓글 삭제
        if (request.method === "DELETE") {
            const id = url.searchParams.get("id");
            const replyId = url.searchParams.get("replyId");

            if (!id) {
                return new Response(
                    JSON.stringify({ error: "피드백 ID가 필요합니다." }),
                    { status: 400, headers }
                );
            }

            const existingData = await store.get("feedback-list", { type: "json" });
            const feedbackList: Feedback[] = existingData || [];

            const feedbackIndex = feedbackList.findIndex(fb => fb.id === id);
            if (feedbackIndex === -1) {
                return new Response(
                    JSON.stringify({ error: "피드백을 찾을 수 없습니다." }),
                    { status: 404, headers }
                );
            }

            // 댓글 삭제
            if (replyId) {
                const feedback = feedbackList[feedbackIndex];
                if (!feedback.replies) {
                    return new Response(
                        JSON.stringify({ error: "댓글을 찾을 수 없습니다." }),
                        { status: 404, headers }
                    );
                }

                const replyIndex = feedback.replies.findIndex(r => r.id === replyId);
                if (replyIndex === -1) {
                    return new Response(
                        JSON.stringify({ error: "댓글을 찾을 수 없습니다." }),
                        { status: 404, headers }
                    );
                }

                feedback.replies.splice(replyIndex, 1);
                feedbackList[feedbackIndex] = feedback;
                await store.setJSON("feedback-list", feedbackList);

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            }

            // 피드백 삭제
            feedbackList.splice(feedbackIndex, 1);
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
