import type { PackageGroups, ProcessSeqEntry, StockLine } from '@/types/domain';
import { groupOf } from './packages';

/*
 * Daily stock balance per process line, summed over the selected packages (the same totals the
 * workbook's IC2_TOTAL / IC3_TOTAL tables show). PROCESS_SEQ is the master list for display order:
 * every (process, sub-process) pair has its own position there, so a sub-process is NOT placed by its parent's code.
 */
export interface Measures {
  balance: number;
  balDay: number;
  stock: number;
  actual: number;
  pending: number;
}
export interface DailyStockRow extends Measures {
  key: string;
  processCode: number;
  processName: string;
  subProcessCode: string;
  subProcessName: string;
  /** Position in PROCESS_SEQ; null when the pair is not listed there. */
  seq: number | null;
  /** (ACTUAL - BAL/DAY) / 1000, the workbook's DIFERENCE column. */
  difference: number;
}
export interface DailyStockQuery {
  snapshot: string;
  group?: string;
  packageName?: string;
  hideEmpty?: boolean;
}
export interface DailyStockResult {
  rows: DailyStockRow[];
  totals: Measures & { difference: number };
  packageCount: number;
}

const MEASURES = ['balance', 'balDay', 'stock', 'actual', 'pending'] as const;
export const differenceOf = (m: Pick<Measures, 'actual' | 'balDay'>): number =>
  (m.actual - m.balDay) / 1000;
const isEmpty = (m: Measures): boolean => MEASURES.every((k) => m[k] === 0);

// Lines missing from PROCESS_SEQ (a null position) go after the listed ones, by code, so they never jump above DICING.
function compareRows(a: DailyStockRow, b: DailyStockRow): number {
  if (a.seq !== null && b.seq !== null) return a.seq - b.seq;
  if (a.seq !== null) return -1;
  if (b.seq !== null) return 1;
  return a.processCode - b.processCode || a.subProcessCode.localeCompare(b.subProcessCode);
}

export function buildDailyStock(
  lines: readonly StockLine[],
  seq: readonly ProcessSeqEntry[],
  groups: PackageGroups,
  q: DailyStockQuery,
): DailyStockResult {
  const position = new Map(seq.map((s) => [`${s.processCode}|${s.subProcessCode}`, s.seq]));
  // A package filter wins over the group filter, as picking one package is the more specific request.
  const selected = lines.filter(
    (l) =>
      l.snapshot === q.snapshot &&
      (q.packageName
        ? l.packageName === q.packageName
        : !q.group || groupOf(l.packageName, groups) === q.group),
  );

  const acc = new Map<
    string,
    Measures & { processCode: number; subProcessCode: string; names: Map<string, number> }
  >();
  for (const l of selected) {
    const key = `${l.processCode}|${l.subProcessCode}`;
    const e = acc.get(key) ?? {
      processCode: l.processCode,
      subProcessCode: l.subProcessCode,
      names: new Map(),
      balance: 0,
      balDay: 0,
      stock: 0,
      actual: 0,
      pending: 0,
    };
    for (const k of MEASURES) e[k] += l[k];
    const name = `${l.processName}\u0000${l.subProcessName}`;
    e.names.set(name, (e.names.get(name) ?? 0) + 1);
    acc.set(key, e);
  }

  const rows = [...acc.entries()].map(([key, e]): DailyStockRow => {
    // If packages ever disagree on a line's name, the most common spelling wins (ties alphabetical).
    const best =
      [...e.names.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? '';
    const [processName = '', subProcessName = ''] = best.split('\u0000');
    return {
      key,
      processCode: e.processCode,
      processName,
      subProcessCode: e.subProcessCode,
      subProcessName,
      balance: e.balance,
      balDay: e.balDay,
      stock: e.stock,
      actual: e.actual,
      pending: e.pending,
      seq: position.get(key) ?? null,
      difference: differenceOf(e),
    };
  });
  const shown = (q.hideEmpty ? rows.filter((r) => !isEmpty(r)) : rows).sort(compareRows);

  const totals = { balance: 0, balDay: 0, stock: 0, actual: 0, pending: 0, difference: 0 };
  for (const r of shown) for (const k of MEASURES) totals[k] += r[k];
  totals.difference = differenceOf(totals);
  return { rows: shown, totals, packageCount: new Set(selected.map((l) => l.packageCode)).size };
}
