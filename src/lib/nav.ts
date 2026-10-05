/*
 * Navigation is app structure, so it lives in code. Title and subtitle are
 * here too so the tab strip, sidebar and page header cannot disagree.
 * "icon" is a key, not a component: this module stays free of React imports
 * and the UI layer maps keys to lucide icons.
 */
export type NavKey = 'dashboard' | 'packages' | 'stock';

export interface NavItem {
  key: NavKey;
  href: string;
  label: string;
  title: string;
  subtitle: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    key: 'dashboard',
    href: '/',
    label: 'Dashboard',
    title: 'Operational & Analytical Dashboard',
    subtitle: 'Real-time overview of production, stock and shipment',
  },
  {
    key: 'packages',
    href: '/package-summary',
    label: 'Package Summary',
    title: 'Package Summary',
    subtitle: 'View all packages with real-time stock and status',
  },
  {
    key: 'stock',
    href: '/daily-stock-balance',
    label: 'Daily Stock Balance',
    title: 'Daily Stock Balance',
    subtitle: 'Daily stock balance by process and sub-process',
  },
];

export const isActive = (pathname: string, href: string): boolean =>
  href === '/' ? pathname === '/' : pathname.startsWith(href);

export function activeItem(pathname: string): NavItem {
  return NAV_ITEMS.find((i) => isActive(pathname, i.href)) ?? (NAV_ITEMS[0] as NavItem);
}
