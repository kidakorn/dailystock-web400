'use client';
import { usePathname } from 'next/navigation';
import { activeItem } from '@/lib/nav';
import { Clock } from './clock';
import styles from './shell.module.css';

export function Header() {
  const item = activeItem(usePathname());
  return (
    <header className={styles.header}>
      <div className={styles.headerTitle}>
        <h1 className={styles.title}>{item.title}</h1>
        <p className={styles.subtitle}>{item.subtitle}</p>
      </div>
      <div className={styles.headerMeta}>
        <div id="header-tools" className={styles.headerTools} />
        <div className={styles.meta}>
          <Clock />
        </div>
      </div>
    </header>
  );
}
