'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useId, useState } from 'react';
import { activePortalGroup, isPortalNavActive, PORTAL_NAV_GROUPS, visiblePortalItems } from '../lib/portal-navigation';
import styles from './PortalNavigation.module.css';

interface Props {
  isAdmin: boolean;
  coordinationOwner?: boolean;
  onFeedback: () => void;
}

function Navigation({ isAdmin, coordinationOwner = false, onFeedback }: Props) {
  const pathname = usePathname();
  const params = useSearchParams();
  const view = params.get('view');
  const routeKey = `${pathname}?${view ?? ''}`;
  const currentGroup = activePortalGroup(pathname, view);
  const [selection, setSelection] = useState<{ route: string; group: string | null } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const expanded = selection?.route === routeKey ? selection.group : currentGroup;
  const id = useId();

  return (
    <nav className={styles.nav} aria-label="업무 메뉴">
      <button type="button" className={styles.mobileToggle} aria-expanded={mobileOpen} aria-controls={`${id}-contents`} onClick={() => setMobileOpen(!mobileOpen)}>
        <span>업무 메뉴 · {PORTAL_NAV_GROUPS.find(group => group.id === currentGroup)?.label ?? '업무 홈'}</span><span aria-hidden="true">{mobileOpen ? '−' : '+'}</span>
      </button>
      <div id={`${id}-contents`} className={`${styles.contents} ${mobileOpen ? styles.mobileOpen : ''}`}>
      <Link href="/" aria-current={pathname === '/' ? 'page' : undefined} className={`${styles.link} ${pathname === '/' ? styles.active : ''}`}>업무 홈</Link>
      {(['업무 분야', '영업·지원'] as const).map(section => (
        <section key={section} aria-label={section}>
          <h2 className={styles.heading}>{section}</h2>
          {PORTAL_NAV_GROUPS.filter(group => group.section === section).map(group => {
            const items = visiblePortalItems(group, isAdmin, coordinationOwner);
            const open = expanded === group.id;
            const active = currentGroup === group.id;
            if (group.href) return <Link key={group.id} href={group.href} className={`${styles.link} ${active ? styles.active : ''}`} aria-current={active ? 'page' : undefined}>{group.label}</Link>;
            return (
              <div key={group.id}>
                <button type="button" className={`${styles.link} ${active ? styles.active : ''}`} aria-expanded={open} aria-controls={`${id}-${group.id}`} onClick={() => setSelection({ route: routeKey, group: open ? null : group.id })}>
                  <span>{group.label}</span><span className={styles.chevron} aria-hidden="true">{open ? '−' : '+'}</span>
                </button>
                <div id={`${id}-${group.id}`} className={styles.children} hidden={!open}>
                  {items.map(item => {
                    const selected = isPortalNavActive(pathname, item.href, view);
                    return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`${styles.child} ${selected ? styles.childActive : ''}`} aria-current={selected ? 'page' : undefined}>{item.label}</Link>;
                  })}
                  {group.id === 'support' && <button type="button" className={styles.child} onClick={onFeedback}>팀원 피드백</button>}
                </div>
              </div>
            );
          })}
        </section>
      ))}
      </div>
    </nav>
  );
}

export default function PortalNavigation(props: Props) {
  return <Suspense fallback={<nav className={styles.nav} aria-label="업무 메뉴"><Link className={styles.link} href="/">업무 홈</Link></nav>}><Navigation {...props} /></Suspense>;
}
