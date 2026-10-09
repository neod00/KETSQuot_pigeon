"use client";
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigator } from './NavigatorContext';
import { CBAM_APPLICATION_URL, handoffUrl } from '@/shared/cbam-handoff';
import { applicationHandoff } from '@/lib/application-handoff';

export function ApplicationLink({ children, className }: { children: ReactNode; className?: string }) {
  const { draft, application, documentDetails, consultationMessage, track } = useNavigator();
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
    if (stamp) href = handoffUrl(applicationHandoff({ ...draft, sessionId: draft.sessionId || stamp.sessionId }, application, documentDetails, consultationMessage, stamp.createdAt));
  } catch (caught) { error = caught instanceof Error ? caught.message : '진단정보를 확인해 주세요.'; }
  return <><a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-disabled={!stamp || !!error} onClick={e => {
    if (!stamp || error) { e.preventDefault(); return; }
    track('LEAD_FORM_OPEN'); track('APPLICATION_STARTED');
  }}>{children}<span className="sr-only"> (새 탭에서 열림)</span></a>{error && <span role="alert">{error}</span>}</>;
}
