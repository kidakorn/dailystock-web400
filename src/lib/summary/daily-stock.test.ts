import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { PackageGroups, ProcessSeqEntry, StockLine } from '@/types/domain';
import { buildDailyStock, differenceOf } from './daily-stock';

const line = (o: Partial<StockLine>): StockLine => ({
  snapshot: '2026-05-05',
  packageCode: 1,
  packageName: 'DIP-8',
  packageKind: '0',
  processCode: 100,
  processName: 'DICING',
  subProcessCode: '',
  subProcessName: '',
  balance: 0,
  balDay: 0,
  stock: 0,
  actual: 0,
  pending: 0,
  ...o,
});
const seq: ProcessSeqEntry[] = [
  { seq: 1, label: 'DICING', processCode: 100, subProcessCode: '' },
  { seq: 2, label: 'DIE BOND', processCode: 101, subProcessCode: '' },
  { seq: 3, label: 'BEFORE WIRE BOND', processCode: 101, subProcessCode: '102010' }, // a sub-process listed under 101, not 102
  { seq: 4, label: 'WIRE BOND', processCode: 102, subProcessCode: '' },
];
const groups: PackageGroups = { IC2: ['DIP-8'], IC3: ['SSOP-8'] };
const run = (lines: StockLine[], q: Partial<Parameters<typeof buildDailyStock>[3]> = {}) =>
  buildDailyStock(lines, seq, groups, { snapshot: '2026-05-05', ...q });

describe('buildDailyStock', () => {
  it('sums every measure over packages and computes DIFFERENCE as (ACTUAL - BAL/DAY) / 1000', () => {
    const { rows, totals } = run([
      line({ packageCode: 1, balance: 10, balDay: 2000, stock: 5, actual: 1500, pending: 1 }),
      line({
        packageCode: 2,
        packageName: 'SSOP-8',
        balance: 20,
        balDay: 1000,
        stock: 7,
        actual: 4000,
        pending: 2,
      }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      balance: 30,
      balDay: 3000,
      stock: 12,
      actual: 5500,
      pending: 3,
      difference: 2.5,
    });
    expect(totals).toMatchObject({ stock: 12, difference: 2.5 });
    expect(differenceOf({ actual: 25109, balDay: 0 })).toBe(25.109);
  });

  it('orders by the PROCESS_SEQ position of each pair, not by process or sub-process code', () => {
    const { rows } = run([
      line({ processCode: 102, processName: 'WIRE BONDING' }),
      line({
        processCode: 101,
        processName: 'DIE BONDING',
        subProcessCode: '102010',
        subProcessName: 'BEFORE WIRE BOND',
      }),
      line({ processCode: 101, processName: 'DIE BONDING' }),
      line({ processCode: 100 }),
    ]);
    expect(rows.map((r) => r.key)).toEqual(['100|', '101|', '101|102010', '102|']);
  });

  it('puts lines missing from PROCESS_SEQ after the listed ones, ordered by code', () => {
    const { rows } = run([
      line({ processCode: 206 }),
      line({ processCode: 113 }),
      line({ processCode: 102 }),
    ]);
    expect(rows.map((r) => [r.processCode, r.seq])).toEqual([
      [102, 4],
      [113, null],
      [206, null],
    ]);
  });

  it('filters by group, treats Other as unlisted packages, and lets a package filter win', () => {
    const lines = [
      line({ packageCode: 1, packageName: 'DIP-8', stock: 1 }),
      line({ packageCode: 2, packageName: 'SSOP-8', stock: 10 }),
      line({ packageCode: 3, packageName: 'NEW-X', stock: 100 }),
    ];
    expect(run(lines, { group: 'IC3' }).totals.stock).toBe(10);
    expect(run(lines, { group: 'Other' })).toMatchObject({
      totals: { stock: 100 },
      packageCount: 1,
    });
    expect(run(lines, { group: 'IC3', packageName: 'DIP-8' }).totals.stock).toBe(1);
  });

  it('only uses the selected snapshot and can hide all-zero lines', () => {
    const lines = [
      line({ stock: 4 }),
      line({ snapshot: '2026-05-28', stock: 99 }),
      line({ processCode: 101, processName: 'DIE BONDING' }),
    ];
    expect(run(lines).totals.stock).toBe(4);
    expect(run(lines, { hideEmpty: true }).rows.map((r) => r.processCode)).toEqual([100]);
    expect(run(lines, { snapshot: '1999-01-01' }).rows).toEqual([]);
  });

  it('uses the most common name when packages disagree about a line', () => {
    const { rows } = run([
      line({ processName: 'DICING' }),
      line({ packageCode: 2, processName: 'DICING B' }),
      line({ packageCode: 3, processName: 'DICING B' }),
    ]);
    expect(rows[0]?.processName).toBe('DICING B');
  });
});

describe('real data', () => {
  const read = <T>(f: string) =>
    JSON.parse(readFileSync(path.join(process.cwd(), 'data', f), 'utf-8')) as T;
  const lines = read<StockLine[]>('wgpgbl.json');
  it('keeps every line pair and conserves each measure', () => {
    for (const snapshot of [...new Set(lines.map((l) => l.snapshot))]) {
      const inSnap = lines.filter((l) => l.snapshot === snapshot);
      const { rows, totals } = buildDailyStock(
        lines,
        read<ProcessSeqEntry[]>('process-seq.json'),
        read<PackageGroups>('package-groups.json'),
        { snapshot },
      );
      expect(rows.length).toBe(
        new Set(inSnap.map((l) => `${l.processCode}|${l.subProcessCode}`)).size,
      );
      expect(totals.stock).toBe(inSnap.reduce((t, l) => t + l.stock, 0));
      expect(totals.pending).toBe(inSnap.reduce((t, l) => t + l.pending, 0));
    }
  });
});
