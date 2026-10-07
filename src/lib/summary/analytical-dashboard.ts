import type { ProcessSeqEntry, StockLine } from '@/types/domain';
import { listSnapshots } from './packages';

export interface DashboardProcessDatum {
  processCode: number;
  name: string;
  stock: number;
  actual: number;
  subProcesses: DashboardSubProcessDatum[];
}

export interface DashboardSubProcessDatum {
  code: string;
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
  comparison: { snapshot: string; stock: number; actual: number } | null;
  status: DashboardStatusDatum[];
  processes: DashboardProcessDatum[];
  unmappedProcesses: { processCode: number; name: string }[];
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
  const processMap = new Map<
    number,
    Omit<DashboardProcessDatum, 'subProcesses'> & {
      order: number;
      subProcesses: Map<string, DashboardSubProcessDatum & { order: number }>;
    }
  >();
  const processMaster = new Map<number, { name: string; order: number }>();
  const subProcessMaster = new Map<string, { name: string; order: number }>();
  const unmappedProcesses = new Map<number, string>();
  for (const entry of sequence) {
    if (entry.subProcessCode) {
      subProcessMaster.set(`${entry.processCode}|${entry.subProcessCode}`, {
        name: entry.label,
        order: entry.seq,
      });
    } else {
      processMaster.set(entry.processCode, { name: entry.label, order: entry.seq });
    }
  }

  for (const line of selected) {
    const kind = KIND[line.packageKind];
    const previousPackage = packages.get(line.packageCode);
    if (!previousPackage || SEVERITY[kind] > SEVERITY[previousPackage.kind]) {
      packages.set(line.packageCode, { name: line.packageName, kind });
    }

    const master = processMaster.get(line.processCode);
    if (!master) {
      unmappedProcesses.set(line.processCode, line.processName);
      continue;
    }

    const process = processMap.get(line.processCode) ?? {
      processCode: line.processCode,
      name: master.name,
      stock: 0,
      actual: 0,
      order: master.order,
      subProcesses: new Map(),
    };
    process.stock += line.stock;
    process.actual += line.actual;

    const subProcessCode = line.subProcessCode.trim();
    const subMaster = subProcessCode
      ? subProcessMaster.get(`${line.processCode}|${subProcessCode}`)
      : undefined;
    const subProcess = process.subProcesses.get(subProcessCode) ?? {
      code: subProcessCode,
      name: subProcessCode
        ? subMaster?.name || line.subProcessName.trim() || subProcessCode
        : `${master.name} (main)`,
      stock: 0,
      actual: 0,
      order: subProcessCode ? subMaster?.order ?? Number.MAX_SAFE_INTEGER : -1,
    };
    subProcess.stock += line.stock;
    subProcess.actual += line.actual;
    process.subProcesses.set(subProcessCode, subProcess);
    processMap.set(line.processCode, process);
  }

  const status: DashboardStatusDatum[] = (['Normal', 'New', 'Cancelled'] as const).map((label) => ({
    label,
    value: [...packages.values()].filter((item) => item.kind === label).length,
    tone: STATUS_TONES[label],
  }));
  const allSnapshots = listSnapshots(lines);
  const previousSnapshot = allSnapshots.filter((date) => date < snapshot).at(-1) ?? null;
  const previousRows = previousSnapshot
    ? lines.filter(
        (line) =>
          line.snapshot === previousSnapshot && (!packageName || line.packageName === packageName),
      )
    : [];
  const snapshots = allSnapshots.filter((date) => date <= snapshot).slice(-7);
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
    comparison: previousSnapshot
      ? {
          snapshot: previousSnapshot,
          stock: previousRows.reduce((total, line) => total + line.stock, 0),
          actual: previousRows.reduce((total, line) => total + line.actual, 0),
        }
      : null,
    status,
    processes: [...processMap.values()]
      .sort((a, b) => a.order - b.order)
      .map((process) => ({
        processCode: process.processCode,
        name: process.name,
        stock: process.stock,
        actual: process.actual,
        subProcesses: [...process.subProcesses.values()]
          .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
          .map((subProcess) => ({
            code: subProcess.code,
            name: subProcess.name,
            stock: subProcess.stock,
            actual: subProcess.actual,
          })),
      })),
    unmappedProcesses: [...unmappedProcesses.entries()]
      .sort(([left], [right]) => left - right)
      .map(([processCode, name]) => ({ processCode, name })),
    trend,
  };
}