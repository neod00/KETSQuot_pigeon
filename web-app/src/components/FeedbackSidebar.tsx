'use client';

import React, { useState, useEffect } from 'react';

interface Feedback {
    id: string;
    name: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export default function FeedbackSidebar() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // 피드백 목록 불러오기
    const fetchFeedbacks = async () => {
        try {
            const res = await fetch('/.netlify/functions/feedback');
            if (res.ok) {
                const data = await res.json();
                setFeedbacks(data);
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
                setFeedbacks(prev => [newFeedback, ...prev]);
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

    // 별점 렌더링
    const renderStars = (count: number, interactive = false) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type={interactive ? 'button' : undefined}
                        onClick={interactive ? () => setRating(star) : undefined}
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

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 h-full flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">💬</span>
                <h2 className="text-lg font-bold text-slate-800">팀원 피드백</h2>
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
                        {renderStars(rating, true)}
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
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1" style={{ maxHeight: '400px' }}>
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
                            className="bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-slate-200 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700 text-sm">{fb.name}</span>
                                    {renderStars(fb.rating)}
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">{formatTime(fb.createdAt)}</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{fb.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
