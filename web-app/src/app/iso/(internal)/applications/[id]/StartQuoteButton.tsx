'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function StartQuoteButton({ applicationId, disabled }: { applicationId: string; disabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const start = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/iso/quote-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '견적 초안을 만들지 못했습니다.');
      router.push(`/iso?draftId=${encodeURIComponent(payload.draft.id)}`);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : '견적 초안을 만들지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={start} disabled={disabled || loading} className="rounded-md bg-teal-700 px-4 py-2.5 font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300">
        {loading ? '초안 생성 중...' : '견적 작업 시작'}
      </button>
      {error && <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
