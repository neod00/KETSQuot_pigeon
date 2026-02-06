'use client';

import React, { useState, useEffect } from 'react';

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
    likedBy: string[];
    replies: Reply[];
}

const LOCAL_STORAGE_KEY = 'lrqa_my_feedback_ids';
const LOCAL_STORAGE_REPLY_KEY = 'lrqa_my_reply_ids';
const LOCAL_STORAGE_USER_ID = 'lrqa_user_id';

// 익명 사용자 ID 생성/조회
const getUserId = (): string => {
    if (typeof window === 'undefined') return '';
    let userId = localStorage.getItem(LOCAL_STORAGE_USER_ID);
    if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(LOCAL_STORAGE_USER_ID, userId);
    }
    return userId;
};

// LocalStorage에 본인 피드백 ID 저장/조회
const getMyFeedbackIds = (): string[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

const addMyFeedbackId = (id: string) => {
    const ids = getMyFeedbackIds();
    if (!ids.includes(id)) {
        ids.push(id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids));
    }
};

const removeMyFeedbackId = (id: string) => {
    const ids = getMyFeedbackIds().filter(i => i !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids));
};

// LocalStorage에 본인 댓글 ID 저장/조회
const getMyReplyIds = (): string[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(LOCAL_STORAGE_REPLY_KEY);
    return stored ? JSON.parse(stored) : [];
};

const addMyReplyId = (id: string) => {
    const ids = getMyReplyIds();
    if (!ids.includes(id)) {
        ids.push(id);
        localStorage.setItem(LOCAL_STORAGE_REPLY_KEY, JSON.stringify(ids));
    }
};

const removeMyReplyId = (id: string) => {
    const ids = getMyReplyIds().filter(i => i !== id);
    localStorage.setItem(LOCAL_STORAGE_REPLY_KEY, JSON.stringify(ids));
};

export default function FeedbackSidebar() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [myFeedbackIds, setMyFeedbackIds] = useState<string[]>([]);
    const [myReplyIds, setMyReplyIds] = useState<string[]>([]);
    const [userId, setUserId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // 수정 모드 상태
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editRating, setEditRating] = useState(5);
    const [editComment, setEditComment] = useState('');

    // 삭제 확인 모달
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleteReplyConfirm, setDeleteReplyConfirm] = useState<{ feedbackId: string; replyId: string } | null>(null);

    // 댓글 입력 상태
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyName, setReplyName] = useState('');
    const [replyComment, setReplyComment] = useState('');

    // 좋아요 로딩 상태
    const [likingId, setLikingId] = useState<string | null>(null);

    // 관리자 모드
    const [isAdmin, setIsAdmin] = useState(false);

    // 초기 로드
    useEffect(() => {
        setMyFeedbackIds(getMyFeedbackIds());
        setMyReplyIds(getMyReplyIds());
        setUserId(getUserId());

        // URL 파라미터로 관리자 모드 체크
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'lrqa2026') {
            setIsAdmin(true);
        }
    }, []);

    // 피드백 목록 불러오기
    const fetchFeedbacks = async () => {
        try {
            const res = await fetch('/.netlify/functions/feedback');
            if (res.ok) {
                const data = await res.json();
                // 기존 데이터 호환성 처리
                const processed = data.map((fb: any) => ({
                    ...fb,
                    likes: fb.likes || 0,
                    likedBy: fb.likedBy || [],
                    replies: fb.replies || [],
                }));
                setFeedbacks(processed);
            }
        } catch (error) {
            console.error('피드백 불러오기 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    // 피드백 제출
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) {
            setSubmitMessage({ type: 'error', text: '의견을 입력해주세요.' });
            return;
        }

        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const res = await fetch('/.netlify/functions/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, rating, comment }),
            });

            if (res.ok) {
                const newFeedback = await res.json();
                setFeedbacks(prev => [{
                    ...newFeedback,
                    likes: 0,
                    likedBy: [],
                    replies: [],
                }, ...prev]);

                addMyFeedbackId(newFeedback.id);
                setMyFeedbackIds(prev => [...prev, newFeedback.id]);

                setName('');
                setComment('');
                setRating(5);
                setSubmitMessage({ type: 'success', text: '피드백이 등록되었습니다! 🎉' });
                setTimeout(() => setSubmitMessage(null), 3000);
            } else {
                const errorData = await res.json();
                setSubmitMessage({ type: 'error', text: errorData.error || '제출 실패' });
            }
        } catch (error) {
            setSubmitMessage({ type: 'error', text: '네트워크 오류가 발생했습니다.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 피드백 수정
    const handleEdit = async (id: string) => {
        if (!editComment.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/.netlify/functions/feedback', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name: editName, rating: editRating, comment: editComment }),
            });

            if (res.ok) {
                const updatedFeedback = await res.json();
                setFeedbacks(prev => prev.map(fb => fb.id === id ? { ...fb, ...updatedFeedback } : fb));
                setEditingId(null);
                setSubmitMessage({ type: 'success', text: '수정되었습니다! ✏️' });
                setTimeout(() => setSubmitMessage(null), 3000);
            }
        } catch (error) {
            console.error('수정 실패:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 피드백 삭제
    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/.netlify/functions/feedback?id=${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setFeedbacks(prev => prev.filter(fb => fb.id !== id));
                removeMyFeedbackId(id);
                setMyFeedbackIds(prev => prev.filter(i => i !== id));
                setDeleteConfirmId(null);
                setSubmitMessage({ type: 'success', text: '삭제되었습니다! 🗑️' });
                setTimeout(() => setSubmitMessage(null), 3000);
            }
        } catch (error) {
            console.error('삭제 실패:', error);
        }
    };

    // 좋아요 (무제한 클릭!)
    const handleLike = async (feedbackId: string) => {
        // 클릭 즉시 UI 업데이트 (낙관적 업데이트)
        setFeedbacks(prev => prev.map(fb => {
            if (fb.id === feedbackId) {
                return { ...fb, likes: (fb.likes || 0) + 1 };
            }
            return fb;
        }));

        // 서버에 저장 (응답은 무시 - 새로고침 시 정확한 값 반영)
        try {
            await fetch('/.netlify/functions/feedback?action=like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedbackId }),
            });
        } catch (error) {
            console.error('좋아요 실패:', error);
        }
    };

    // 댓글 작성
    const handleReply = async (feedbackId: string) => {
        if (!replyComment.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/.netlify/functions/feedback?action=reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedbackId, name: replyName, comment: replyComment }),
            });

            if (res.ok) {
                const newReply = await res.json();
                setFeedbacks(prev => prev.map(fb => {
                    if (fb.id === feedbackId) {
                        return { ...fb, replies: [...(fb.replies || []), newReply] };
                    }
                    return fb;
                }));

                addMyReplyId(newReply.id);
                setMyReplyIds(prev => [...prev, newReply.id]);

                setReplyingTo(null);
                setReplyName('');
                setReplyComment('');
            }
        } catch (error) {
            console.error('댓글 작성 실패:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 댓글 삭제
    const handleDeleteReply = async (feedbackId: string, replyId: string) => {
        try {
            const res = await fetch(`/.netlify/functions/feedback?id=${feedbackId}&replyId=${replyId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setFeedbacks(prev => prev.map(fb => {
                    if (fb.id === feedbackId) {
                        return { ...fb, replies: fb.replies.filter(r => r.id !== replyId) };
                    }
                    return fb;
                }));
                removeMyReplyId(replyId);
                setMyReplyIds(prev => prev.filter(i => i !== replyId));
                setDeleteReplyConfirm(null);
            }
        } catch (error) {
            console.error('댓글 삭제 실패:', error);
        }
    };

    // 수정 모드 시작
    const startEditing = (fb: Feedback) => {
        setEditingId(fb.id);
        setEditName(fb.name === '익명' ? '' : fb.name);
        setEditRating(fb.rating);
        setEditComment(fb.comment);
    };

    // 별점 렌더링
    const renderStars = (count: number, interactive = false, onStarClick?: (star: number) => void) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type={interactive ? 'button' : undefined}
                        onClick={interactive && onStarClick ? () => onStarClick(star) : undefined}
                        className={`text-lg ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
                        disabled={!interactive}
                    >
                        {star <= count ? '⭐' : '☆'}
                    </button>
                ))}
            </div>
        );
    };

    // 시간 포맷팅
    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    };

    // 본인 글/댓글 확인 (관리자는 모두 삭제 가능)
    const canDeleteFeedback = (id: string) => isAdmin || myFeedbackIds.includes(id);
    const canDeleteReply = (id: string) => isAdmin || myReplyIds.includes(id);
    const isMyFeedback = (id: string) => myFeedbackIds.includes(id);
    const isMyReply = (id: string) => myReplyIds.includes(id);
    const hasLiked = (fb: Feedback) => (fb.likedBy || []).includes(userId);

    return (
        <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-100 p-4 sm:p-6 h-full flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">💬</span>
                <h2 className="text-lg font-bold text-slate-800">팀원 피드백</h2>
                {isAdmin && (
                    <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">
                        ADMIN
                    </span>
                )}
                <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                    {feedbacks.length}
                </span>
            </div>

            {/* 입력 폼 */}
            <form onSubmit={handleSubmit} className="space-y-3 mb-5 pb-5 border-b border-slate-100">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="이름 (선택)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        maxLength={20}
                    />
                    <div className="flex items-center bg-slate-50 rounded-xl px-2 border border-slate-200">
                        {renderStars(rating, true, setRating)}
                    </div>
                </div>
                <textarea
                    placeholder="이 도구에 대한 의견을 남겨주세요..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    maxLength={500}
                />
                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-xl transition-all active:scale-95 text-sm"
                    >
                        {isSubmitting ? '전송 중...' : '보내기'}
                    </button>
                </div>
                {submitMessage && (
                    <p className={`text-xs font-medium ${submitMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                        {submitMessage.text}
                    </p>
                )}
            </form>

            {/* 피드백 목록 */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1" style={{ maxHeight: '500px' }}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                ) : feedbacks.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        <p>아직 피드백이 없습니다.</p>
                        <p className="text-xs mt-1">첫 번째 피드백을 남겨보세요! 🙌</p>
                    </div>
                ) : (
                    feedbacks.map((fb) => (
                        <div
                            key={fb.id}
                            className={`rounded-xl p-3 border transition-colors ${isMyFeedback(fb.id)
                                ? 'bg-blue-50 border-blue-200 hover:border-blue-300'
                                : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                                }`}
                        >
                            {/* 수정 모드 */}
                            {editingId === fb.id ? (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="이름"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="flex-1 px-2 py-1 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                            maxLength={20}
                                        />
                                        {renderStars(editRating, true, setEditRating)}
                                    </div>
                                    <textarea
                                        value={editComment}
                                        onChange={(e) => setEditComment(e.target.value)}
                                        rows={2}
                                        className="w-full px-2 py-1 text-sm rounded-lg border border-slate-300 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                                        maxLength={500}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(fb.id)}
                                            disabled={isSubmitting}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 rounded-lg transition-all"
                                        >
                                            저장
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold py-1.5 rounded-lg transition-all"
                                        >
                                            취소
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* 피드백 헤더 */}
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-700 text-sm">{fb.name}</span>
                                            {renderStars(fb.rating)}
                                            {isMyFeedback(fb.id) && (
                                                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                                                    내 글
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {formatTime(fb.updatedAt || fb.createdAt)}
                                            {fb.updatedAt && ' (수정됨)'}
                                        </span>
                                    </div>

                                    {/* 피드백 내용 */}
                                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap mb-2">{fb.comment}</p>

                                    {/* 좋아요 / 댓글 수 / 액션 버튼 */}
                                    <div className="flex items-center gap-3 pt-2 border-t border-slate-200/50">
                                        {/* 좋아요 버튼 */}
                                        <button
                                            onClick={() => handleLike(fb.id)}
                                            className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-500 transition-all active:scale-125 hover:scale-110"
                                        >
                                            <span className="transition-transform">❤️</span>
                                            <span>{fb.likes || 0}</span>
                                        </button>

                                        {/* 댓글 수 */}
                                        <button
                                            onClick={() => setReplyingTo(replyingTo === fb.id ? null : fb.id)}
                                            className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-blue-500 transition-all"
                                        >
                                            <span>💬</span>
                                            <span>{fb.replies?.length || 0}</span>
                                        </button>

                                        {/* 본인 글일 때만 수정 버튼 */}
                                        {isMyFeedback(fb.id) && (
                                            <button
                                                onClick={() => startEditing(fb)}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                ✏️
                                            </button>
                                        )}

                                        {/* 본인 또는 관리자일 때 삭제 버튼 */}
                                        {canDeleteFeedback(fb.id) && (
                                            <button
                                                onClick={() => setDeleteConfirmId(fb.id)}
                                                className="text-xs text-red-500 hover:text-red-700 font-medium"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>

                                    {/* 삭제 확인 */}
                                    {deleteConfirmId === fb.id && (
                                        <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                                            <p className="text-xs text-red-600 font-medium mb-2">정말 삭제하시겠습니까?</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDelete(fb.id)}
                                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1 rounded-lg"
                                                >
                                                    삭제
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(null)}
                                                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold py-1 rounded-lg"
                                                >
                                                    취소
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* 댓글 목록 */}
                                    {fb.replies && fb.replies.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-slate-200/50 space-y-2">
                                            {fb.replies.map((reply) => (
                                                <div
                                                    key={reply.id}
                                                    className={`ml-2 pl-2 border-l-2 ${isMyReply(reply.id) ? 'border-blue-300' : 'border-slate-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs font-semibold text-slate-600">{reply.name}</span>
                                                            {isMyReply(reply.id) && (
                                                                <span className="text-[9px] bg-blue-100 text-blue-600 px-1 rounded font-semibold">
                                                                    내 댓글
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] text-slate-400">{formatTime(reply.createdAt)}</span>
                                                            {canDeleteReply(reply.id) && (
                                                                <button
                                                                    onClick={() => setDeleteReplyConfirm({ feedbackId: fb.id, replyId: reply.id })}
                                                                    className="text-[10px] text-red-400 hover:text-red-600"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-600 mt-0.5">{reply.comment}</p>

                                                    {/* 댓글 삭제 확인 */}
                                                    {deleteReplyConfirm?.replyId === reply.id && (
                                                        <div className="mt-1 p-1.5 bg-red-50 rounded border border-red-200">
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleDeleteReply(fb.id, reply.id)}
                                                                    className="flex-1 bg-red-500 text-white text-[10px] font-semibold py-0.5 rounded"
                                                                >
                                                                    삭제
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteReplyConfirm(null)}
                                                                    className="flex-1 bg-slate-200 text-slate-700 text-[10px] font-semibold py-0.5 rounded"
                                                                >
                                                                    취소
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* 댓글 입력 */}
                                    {replyingTo === fb.id && (
                                        <div className="mt-3 pt-2 border-t border-slate-200/50 space-y-2">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="이름"
                                                    value={replyName}
                                                    onChange={(e) => setReplyName(e.target.value)}
                                                    className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                                    maxLength={10}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="댓글 작성..."
                                                    value={replyComment}
                                                    onChange={(e) => setReplyComment(e.target.value)}
                                                    className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                                    maxLength={200}
                                                />
                                                <button
                                                    onClick={() => handleReply(fb.id)}
                                                    disabled={isSubmitting || !replyComment.trim()}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-lg transition-all"
                                                >
                                                    등록
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
