import Link from 'next/link';
import { PRODUCT_LINKS, PRODUCT_WORKFLOWS, productForPath } from './workspaceNavigation';
import styles from './WorkspaceProductTabs.module.css';

export default function WorkspaceProductTabs({ pathname }: { pathname: string }) {
  const current = productForPath(pathname);
  if (!current) return null;

  return (
    <div className={`${styles.root} no-print`}>
      <nav className={styles.products} aria-label="견적·계약 제품">
        {PRODUCT_LINKS.map(product => (
          <Link key={product.label} href={product.href} aria-current={current.label === product.label ? 'page' : undefined}
            className={`${styles.product} ${current.label === product.label ? styles.active : ''}`}>
            {product.label}
          </Link>
        ))}
      </nav>
      <nav className={styles.workflow} aria-label={`${current.label} 업무 단계`}>
        <span className={styles.workflowLabel}>{current.label} 업무</span>
        {PRODUCT_WORKFLOWS[current.label].map(item => (
          <Link key={item.href} href={item.href}
            aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'step' : undefined}
            className={`${styles.step} ${pathname === item.href || pathname.startsWith(`${item.href}/`) ? styles.stepActive : ''}`}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
