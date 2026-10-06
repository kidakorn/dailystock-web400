'use client';
import { usePathname } from 'next/navigation';
import { activeItem } from '@/lib/nav';
import styles from './shell.module.css';

export function Header() {
  const pathname = usePathname();
  const item = activeItem(pathname);
  return (
    <header
      className={styles.header}
      data-daily-stock={pathname.startsWith('/daily-stock-balance') ? 'true' : undefined}
    >
      <div className={styles.headerTitle}>
        <h1 className={styles.title}>{item.title}</h1>
        <p className={styles.subtitle}>{item.subtitle}</p>
      </div>
      <div className={styles.headerMeta}>
        <div
          id="header-tools"
          className={styles.headerTools}
          data-daily-stock={pathname.startsWith('/daily-stock-balance') ? 'true' : undefined}
          data-process-master={pathname.startsWith('/process-master') ? 'true' : undefined}
        />
      </div>
    </header>
  );
}
