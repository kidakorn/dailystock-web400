import type { ProcessSeqEntry, StockLine } from '@/types/domain';
import { listSnapshots } from './packages';

export interface DashboardProcessDatum {
  name: string;
  stock: number;
  actual: number;
}

export interface DashboardSnapshotDatum {
  name: string;
  stock: number;
  actual: number;
}

export interface DashboardStatusDatum {
  label: string;
  value: number;
  tone: 'success' | 'warning' | 'danger';
}

export interface AnalyticalDashboardData {
  packageCount: number;
  stock: number;
  actual: number;
  status: DashboardStatusDatum[];
  processes: DashboardProcessDatum[];
  trend: DashboardSnapshotDatum[];
}

const KIND: Record<StockLine['packageKind'], 'Normal' | 'New' | 'Cancelled'> = {
  '0': 'Normal',
  '1': 'New',
  '2': 'Cancelled',
};
const SEVERITY = { Normal: 0, New: 1, Cancelled: 2 } as const;
const STATUS_TONES = { Normal: 'success', New: 'warning', Cancelled: 'danger' } as const;

export function buildAnalyticalDashboard(
  lines: readonly StockLine[],
  sequence: readonly ProcessSeqEntry[],
  snapshot: string,
  packageName = '',
): AnalyticalDashboardData {
  const selected = lines.filter(
    (line) => line.snapshot === snapshot && (!packageName || line.packageName === packageName),
  );
  const packages = new Map<number, { name: string; kind: 'Normal' | 'New' | 'Cancelled' }>();
  const processMap = new Map<number, DashboardProcessDatum & { order: number }>();
  const processOrder = new Map<number, number>();
  for (const entry of sequence) {
    const previous = processOrder.get(entry.processCode);
    if (previous === undefined || entry.seq < previous) processOrder.set(entry.processCode, entry.seq);
  }

  for (const line of selected) {
    const kind = KIND[line.packageKind];
    const previousPackage = packages.get(line.packageCode);
    if (!previousPackage || SEVERITY[kind] > SEVERITY[previousPackage.kind]) {
      packages.set(line.packageCode, { name: line.packageName, kind });
    }

    const process = processMap.get(line.processCode) ?? {
      name:
        sequence.find(
          (entry) => entry.processCode === line.processCode && entry.subProcessCode === '',
        )?.label ?? line.processName,
      stock: 0,
      actual: 0,
      order: processOrder.get(line.processCode) ?? Number.MAX_SAFE_INTEGER,
    };
    process.stock += line.stock;
    process.actual += line.actual;
    processMap.set(line.processCode, process);
  }

  const status: DashboardStatusDatum[] = (['Normal', 'New', 'Cancelled'] as const).map((label) => ({
    label,
    value: [...packages.values()].filter((item) => item.kind === label).length,
    tone: STATUS_TONES[label],
  }));
  const snapshots = listSnapshots(lines).filter((date) => date <= snapshot).slice(-7);
  const trend = snapshots.map((date) => {
    const rows = lines.filter(
      (line) => line.snapshot === date && (!packageName || line.packageName === packageName),
    );
    return {
      name: date,
      stock: rows.reduce((total, line) => total + line.stock, 0),
      actual: rows.reduce((total, line) => total + line.actual, 0),
    };
  });

  return {
    packageCount: packages.size,
    stock: selected.reduce((total, line) => total + line.stock, 0),
    actual: selected.reduce((total, line) => total + line.actual, 0),
    status,
    processes: [...processMap.values()]
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
      .map(({ name, stock, actual }) => ({ name, stock, actual })),
    trend,
  };
}