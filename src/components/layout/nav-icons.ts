import { ClipboardList, LayoutDashboard, Package, Warehouse, type LucideIcon } from 'lucide-react';
import type { NavKey } from '@/lib/nav';

export const NAV_ICONS: Record<NavKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  packages: Package,
  stock: Warehouse,
  processMaster: ClipboardList,
};
