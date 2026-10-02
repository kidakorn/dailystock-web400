/* eslint-disable @next/next/no-img-element */
'use client';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { NAV_ITEMS, isActive } from '@/lib/nav';
import { NAV_ICONS } from './nav-icons';
import styles from './shell.module.css';

export function Sidebar({ initialCollapsed }: { initialCollapsed: boolean }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    // A cookie, not localStorage: the server reads it, so the first paint already has the right width.
    document.cookie = `sidebar=${next ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`;
  };
  const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside className={styles.sidebar} data-collapsed={collapsed} aria-label="Sidebar">
      {/* The toggle sits at the top beside the logo and is never hidden by a breakpoint: it is the user's control, not a layout detail. */}
      <div className={styles.top}>
        <div className={styles.brand}>
          <img
            src="/favicon.ico"
            alt=""
            aria-hidden="true"
            className={styles.brandMark}
            width={24}
            height={24}
          />
          <div className={styles.hideWhenCollapsed}>
            <div className={styles.brandName}>DAILY STOCK</div>
            <div className={styles.brandSub}>Enterprise Monitoring</div>
          </div>
        </div>
        <button
          type="button"
          className={styles.toggle}
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={label}
          title={label}
        >
          <ToggleIcon size={18} aria-hidden="true" />
        </button>
      </div>
      <nav className={styles.nav} aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.key];
          return (
            <Link
              key={item.key}
              href={item.href}
              className={styles.link}
              title={item.label}
              aria-label={item.label}
              aria-current={isActive(pathname, item.href) ? 'page' : undefined}
            >
              <Icon size={18} className={styles.icon} aria-hidden="true" />
              <span className={styles.hideWhenCollapsed}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <p className={`${styles.tagline} ${styles.hideWhenCollapsed}`}>
        Better flow. Better stock. Better decision.
      </p>
    </aside>
  );
}
