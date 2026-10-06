'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, isActive } from '@/lib/nav';
import { Clock } from './clock';
import { NAV_ICONS } from './nav-icons';
import styles from './shell.module.css';

export function TopTabs() {
  const pathname = usePathname();
  return (
    <div className={styles.navigationRow}>
      <nav className={styles.tabs} aria-label="Pages">
        {NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.key];
          return (
            <Link
              key={item.key}
              href={item.href}
              className={styles.tab}
              aria-current={isActive(pathname, item.href) ? 'page' : undefined}
            >
              <Icon size={14} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className={styles.navClock}>
        <Clock />
      </div>
    </div>
  );
}
