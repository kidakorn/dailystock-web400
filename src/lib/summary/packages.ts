import type { PackageGroups, StockLine } from '@/types/domain';

/*
 * Package-level totals for the Package Summary page. Pure functions over the raw AS400 lines:
 * nothing here reads files or React state, so every rule can be unit tested.
 */

/**
 * Sub-process lines (e.g. 104020 MOLD POST CURE) are separate lines in the workbook's tables, not nested
 * inside their parent process, so they are counted in a package's STOCK. Flip this if that turns out wrong.
 */
export const INCLUDE_SUB_PROCESS = true;
export const OTHER_GROUP = 'Other';

export type PackageKind = 'normal' | 'new' | 'cancelled';
export type PackageTab = PackageKind | 'active' | 'all';
export type SortKey = 'stock' | 'name' | 'code' | 'processes';

export interface PackageSummary {
  code: number;
  name: string;
  group: string;
  kind: PackageKind;
  /** STOCK summed over every counted process line of the package. */
  stock: number;
  /** Counted process lines whose STOCK is above zero. */
  processesWithStock: number;
  /** All counted process lines of the package. */
  processCount: number;
  /** Total at the snapshot just before the selected one; null when there is none or the package was absent. */
  previousStock: number | null;
  /** Percent change against previousStock; null when it cannot be computed (no previous value, or it was zero). */
  changePct: number | null;
  /** Totals per snapshot up to the selected one, oldest first (sparkline input). */
  trend: number[];
}

const KIND: Record<StockLine['packageKind'], PackageKind> = {
  '0': 'normal',
  '1': 'new',
  '2': 'cancelled',
};
// If one package ever carries mixed kinds inside a snapshot, the more severe one wins.
const SEVERITY: Record<PackageKind, number> = { normal: 0, new: 1, cancelled: 2 };

export const listSnapshots = (lines: readonly StockLine[]): string[] =>
  [...new Set(lines.map((l) => l.snapshot))].sort();
export const listStockSnapshots = (lines: readonly StockLine[]): string[] =>
  [...new Set(lines.filter((line) => line.stock > 0).map((line) => line.snapshot))].sort();
export const listActiveSnapshots = (lines: readonly StockLine[]): string[] =>
  listSnapshots(lines.filter((line) => line.packageKind !== '2'));
export const listActiveStockSnapshots = (lines: readonly StockLine[]): string[] =>
  listStockSnapshots(lines.filter((line) => line.packageKind !== '2'));

export function resolveSnapshot(
  snapshots: readonly string[],
  requested: string,
  fallback = snapshots[snapshots.length - 1] ?? '',
): string {
  if (!requested) return fallback;
  return snapshots.filter((date) => date <= requested).at(-1) ?? snapshots[0] ?? fallback;
}

// A name found in several groups belongs to the first group in the file's order.
export const groupOf = (name: string, groups: PackageGroups): string =>
  Object.keys(groups).find((g) => groups[g]?.includes(name)) ?? OTHER_GROUP;

export function summarizePackages(
  lines: readonly StockLine[],
  groups: PackageGroups,
  snapshot: string,
  options: { includeSubProcess?: boolean } = {},
): PackageSummary[] {
  const { includeSubProcess = INCLUDE_SUB_PROCESS } = options;
  const snapshots = listSnapshots(lines);
  const at = snapshots.indexOf(snapshot);
  if (at === -1) return [];
  const counted = (l: StockLine) => includeSubProcess || l.subProcessCode === '';

  // snapshot -> package code -> total STOCK; reused for the change and the trend.
  const totals = new Map<string, Map<number, number>>();
  for (const l of lines) {
    if (!counted(l)) continue;
    const perPackage = totals.get(l.snapshot) ?? new Map<number, number>();
    perPackage.set(l.packageCode, (perPackage.get(l.packageCode) ?? 0) + l.stock);
    totals.set(l.snapshot, perPackage);
  }

  const info = new Map<
    number,
    { name: string; kind: PackageKind; count: number; withStock: number }
  >();
  for (const l of lines) {
    if (l.snapshot !== snapshot) continue;
    const entry = info.get(l.packageCode) ?? {
      name: l.packageName,
      kind: 'normal' as PackageKind,
      count: 0,
      withStock: 0,
    };
    const kind = KIND[l.packageKind];
    if (SEVERITY[kind] > SEVERITY[entry.kind]) entry.kind = kind;
    if (counted(l)) {
      entry.count += 1;
      if (l.stock > 0) entry.withStock += 1;
    }
    info.set(l.packageCode, entry);
  }

  const earlier = snapshots.slice(0, at);
  const previous = earlier[earlier.length - 1];
  return [...info.entries()].map(([code, e]) => {
    const stock = totals.get(snapshot)?.get(code) ?? 0;
    const previousStock = previous === undefined ? null : (totals.get(previous)?.get(code) ?? null);
    return {
      code,
      name: e.name,
      group: groupOf(e.name, groups),
      kind: e.kind,
      stock,
      processesWithStock: e.withStock,
      processCount: e.count,
      previousStock,
      changePct: previousStock ? ((stock - previousStock) / previousStock) * 100 : null,
      trend: [...earlier, snapshot].flatMap((s) => {
        const v = totals.get(s)?.get(code);
        return v === undefined ? [] : [v];
      }),
    };
  });
}

export interface SummaryFilter {
  group?: string;
  kind?: PackageKind;
  query?: string;
}

export function filterSummaries(
  list: readonly PackageSummary[],
  f: SummaryFilter,
): PackageSummary[] {
  const q = f.query?.trim().toLowerCase();
  return list.filter(
    (p) =>
      (!f.group || p.group === f.group) &&
      (!f.kind || p.kind === f.kind) &&
      (!q || `${p.code} ${p.name}`.toLowerCase().includes(q)),
  );
}

export function filterPackageTab(
  list: readonly PackageSummary[],
  tab: PackageTab,
): PackageSummary[] {
  if (tab === 'all') return [...list];
  if (tab === 'active') return list.filter((item) => item.kind !== 'cancelled');
  return list.filter((item) => item.kind === tab);
}

const byName = (a: PackageSummary, b: PackageSummary) => a.name.localeCompare(b.name);
const SORTERS: Record<SortKey, (a: PackageSummary, b: PackageSummary) => number> = {
  stock: (a, b) => b.stock - a.stock || byName(a, b),
  name: byName,
  code: (a, b) => a.code - b.code,
  processes: (a, b) => b.processesWithStock - a.processesWithStock || byName(a, b),
};

export const sortSummaries = (list: readonly PackageSummary[], key: SortKey): PackageSummary[] =>
  [...list].sort(SORTERS[key]);
