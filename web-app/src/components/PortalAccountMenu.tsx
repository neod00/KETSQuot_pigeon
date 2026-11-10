'use client';

import styles from './PortalAccountMenu.module.css';

export default function PortalAccountMenu({ onUseLegacy, username }: { onUseLegacy: () => void; username?: string }) {
  return (
    <details className={styles.menu}>
      <summary className={styles.summary}>내 계정 · 화면 설정</summary>
      <div className={styles.panel}>
        {username && <p className={styles.account}>{username}</p>}
        <button type="button" className={styles.action} onClick={onUseLegacy}>이전 디자인으로 전환</button>
        <form action="/api/iso/auth/logout" method="post"><button type="submit" className={styles.action}>로그아웃</button></form>
      </div>
    </details>
  );
}
