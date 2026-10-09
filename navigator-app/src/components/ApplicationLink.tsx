"use client";
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigator } from './NavigatorContext';
import { CBAM_APPLICATION_URL, handoffUrl } from '@/shared/cbam-handoff';

export function ApplicationLink({ children, className }: { children: ReactNode; className?: string }) {
  const { draft, track } = useNavigator();
  const [stamp, setStamp] = useState<{ createdAt: number; sessionId: string }>();
  useEffect(() => {
    const sessionId = `NAV-${crypto.randomUUID()}`;
    const refresh = () => setStamp({ createdAt: Date.now(), sessionId });
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, []);
  let href = CBAM_APPLICATION_URL, error = '';
  try {
    if (stamp) href = handoffUrl({
      version: 1, createdAt: stamp.createdAt,
      prefill: { cnCodes: draft.cnCode, cbamGoods: draft.sector ? [draft.sector] : [],
        country: ({ KR: '대한민국', CN: '중국', JP: '일본', IN: '인도', US: '미국', CH: '스위스', IS: '아이슬란드', LI: '리히텐슈타인', NO: '노르웨이' } as Record<string, string>)[draft.country] || '',
        sites: draft.sites, productionProcesses: draft.productionProcesses,
        clientType: draft.importer === 'importer' ? 'importer' : draft.importer === 'operator' ? 'operator' : undefined },
      navigatorData: { sessionId: draft.sessionId || stamp.sessionId, productName: draft.productName,
        searchedCnCodes: draft.searchedCnCodes, readinessAnswers: draft.answers, startedAt: draft.startedAt },
    });
  } catch (caught) { error = caught instanceof Error ? caught.message : '진단정보를 확인해 주세요.'; }
  return <><a href={href} className={className} aria-disabled={!stamp || !!error} onClick={e => {
    if (!stamp || error) { e.preventDefault(); return; }
    track('LEAD_FORM_OPEN'); track('APPLICATION_STARTED');
  }}>{children}</a>{error && <span role="alert">{error}</span>}</>;
}
