'use client';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { NAV_ITEMS, isActive } from '@/lib/nav';
import { NAV_ICONS } from './nav-icons';
import styles from './shell.module.css';

/*
 * The collapsed/expanded choice lives in a cookie that the BROWSER reads. A statically exported page has no server
 * to read it per request, so the first paint is always "expanded" and a stored "collapsed" applies right after
 * hydration. useSyncExternalStore gives exactly that: the server snapshot is the default, the client snapshot is the cookie.
 */
const COOKIE = 'sidebar';
// Scoped to the app's base path so other apps on the same host cannot read or overwrite it.
const COOKIE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/';

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const readCollapsed = (): boolean => document.cookie.split('; ').includes(`${COOKIE}=collapsed`);
const defaultCollapsed = (): boolean => false;

function writeCollapsed(collapsed: boolean) {
  document.cookie = `${COOKIE}=${collapsed ? 'collapsed' : 'expanded'}; path=${COOKIE_PATH}; max-age=31536000; samesite=lax`;
  listeners.forEach((listener) => listener());
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, defaultCollapsed);
  const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside className={styles.sidebar} data-collapsed={collapsed} aria-label="Sidebar">
      {/* The toggle sits at the top beside the logo and is never hidden by a breakpoint: it is the user's control, not a layout detail. */}
      <div className={styles.top}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            IT
          </span>
          <div className={styles.hideWhenCollapsed}>
            <div className={styles.brandName}>IT WEB400</div>
            <div className={styles.brandSub}>Enterprise Monitoring</div>
          </div>
        </div>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => writeCollapsed(!collapsed)}
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
