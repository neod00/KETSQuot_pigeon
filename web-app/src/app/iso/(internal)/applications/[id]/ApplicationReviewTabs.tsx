'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import styles from './ApplicationReview.module.css';

const TABS = ['접수 요약', '신청서 전체', '심사일수·견적'];

export default function ApplicationReviewTabs({ summary, form, calculation }: { summary: ReactNode; form: ReactNode; calculation: ReactNode }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const formPanel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let previous: Array<[HTMLDetailsElement, boolean]> = [];
    const before = () => {
      if (previous.length) return;
      previous = Array.from(formPanel.current?.querySelectorAll('details') || []).map(element => [element, element.open]);
      previous.forEach(([element]) => { element.open = true; });
    };
    const after = () => { previous.forEach(([element, open]) => { element.open = open; }); previous = []; };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); after(); };
  }, []);
  const select = (index: number) => { setActive(index); root.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index]?.focus(); };
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : -1;
    if (next >= 0) { event.preventDefault(); select(next); }
  };
  const expand = (open: boolean) => formPanel.current?.querySelectorAll('details').forEach(element => { element.open = open; });
  return <div ref={root} className={styles.printHost}>
    <div role="tablist" aria-label="신청서 검토 보기" className={styles.tabs}>{TABS.map((label, index) => <button key={label} id={`${id}-tab-${index}`} role="tab" aria-selected={active === index} aria-controls={`${id}-panel-${index}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => keyDown(event, index)}>{label}</button>)}</div>
    {[summary, form, calculation].map((content, index) => <div key={index} ref={index === 1 ? formPanel : undefined} id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} tabIndex={0} data-active={active === index} className={`${styles.panel} ${index === 1 ? styles.formPanel : ''}`}>
      {index === 1 && <div className={styles.formTools}><span>읽기 전용 · 필요한 항목을 펼쳐 확인하세요.</span><div><button type="button" onClick={() => expand(true)}>전체 펼치기</button><button type="button" onClick={() => expand(false)}>전체 접기</button></div></div>}
      {index === 1 && <h1 className={styles.printTitle}>인증 심사 신청서</h1>}{content}
    </div>)}
  </div>;
}
