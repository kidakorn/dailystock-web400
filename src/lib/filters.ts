import type { PackageItem, StockGroup, StockRow } from '@/types/domain';

export const opts = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));
export const uniq = (values: readonly string[]) => [...new Set(values)].sort();

/* ---------- packages ---------- */
export const PAGE_SIZE = 12;
export interface PackageQuery {
  plant: string;
  process: string;
  tab: string;
  q: string;
  sort: string;
}

const byCode = (a: PackageItem, b: PackageItem) => a.code.localeCompare(b.code);
const SORTS: Record<string, (a: PackageItem, b: PackageItem) => number> = {
  code: byCode,
  progress: (a, b) => b.progress - a.progress,
  qty: (a, b) => b.qty - a.qty,
};

export function queryPackages(items: readonly PackageItem[], q: PackageQuery) {
  // Plant/process narrow the whole page (KPIs, tab counts); tab and search narrow only the list.
  const base = items.filter(
    (p) => (!q.plant || p.plant === q.plant) && (!q.process || p.process === q.process),
  );
  const needle = q.q.trim().toLowerCase();
  const rows = base
    .filter(
      (p) =>
        (q.tab === 'All' || p.status === q.tab) &&
        (!needle || `${p.code} ${p.name}`.toLowerCase().includes(needle)),
    )
    .sort(SORTS[q.sort] ?? byCode);
  return { base, rows };
}

/* ---------- stock ---------- */
export const STOCK_STATUSES = ['OK', 'Warning', 'Critical'] as const;
export type GroupBy = 'package' | 'process';
export interface FlatStockRow extends StockRow {
  package: string;
}
export interface StockQuery {
  plant: string;
  process: string;
  package: string;
  statuses: readonly string[];
  attention: boolean;
  remark: boolean;
}
export interface StockGroupView {
  key: string;
  plan: number;
  actual: number;
  in: number;
  out: number;
  rows: FlatStockRow[];
}

// Flatten once: regrouping by any dimension then needs only a key, not a second data shape.
export const flattenStock = (groups: readonly StockGroup[]): FlatStockRow[] =>
  groups.flatMap((g) => g.rows.map((r) => ({ ...r, package: `${g.code} ${g.name}` })));

export const filterStock = (rows: readonly FlatStockRow[], q: StockQuery): FlatStockRow[] =>
  rows.filter(
    (r) =>
      (!q.plant || r.plant === q.plant) &&
      (!q.process || r.process === q.process) &&
      (!q.package || r.package === q.package) &&
      q.statuses.includes(r.status) &&
      (!q.attention || (r.plan ? r.actual / r.plan < 0.95 : true)) &&
      (!q.remark || r.remark !== ''),
  );

export function groupStock(rows: readonly FlatStockRow[], by: GroupBy): StockGroupView[] {
  const map = new Map<string, FlatStockRow[]>();
  for (const r of rows) map.set(r[by], [...(map.get(r[by]) ?? []), r]);
  const sum = (list: FlatStockRow[], k: 'plan' | 'actual' | 'in' | 'out') =>
    list.reduce((t, r) => t + r[k], 0);
  // Totals come from the visible rows so a group header always matches what is listed under it.
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, list]) => ({
      key,
      rows: list,
      plan: sum(list, 'plan'),
      actual: sum(list, 'actual'),
      in: sum(list, 'in'),
      out: sum(list, 'out'),
    }));
}
