import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { StockLine } from '@/types/domain';
import { filterSummaries, listSnapshots, sortSummaries, summarizePackages } from './packages';

let n = 0;
const line = (o: Partial<StockLine>): StockLine => ({
  snapshot: '2026-05-05',
  packageCode: 1,
  packageName: 'DIP-8',
  packageKind: '0',
  processCode: 100 + n++,
  processName: 'P',
  subProcessCode: '',
  subProcessName: '',
  balance: 0,
  balDay: 0,
  stock: 0,
  actual: 0,
  pending: 0,
  ...o,
});
const groups = { IC2: ['DIP-8'], IC3: ['SSOP-8'] };

describe('summarizePackages', () => {
  it('sums STOCK over all lines and counts lines with stock', () => {
    const lines = [
      line({ stock: 100 }),
      line({ stock: 50 }),
      line({ stock: 0 }),
      line({ stock: 25, subProcessCode: '104020' }),
    ];
    const [p] = summarizePackages(lines, groups, '2026-05-05');
    expect(p).toMatchObject({ stock: 175, processesWithStock: 3, processCount: 4 });
  });

  it('can leave sub-process lines out', () => {
    const lines = [line({ stock: 100 }), line({ stock: 25, subProcessCode: '104020' })];
    const [p] = summarizePackages(lines, groups, '2026-05-05', { includeSubProcess: false });
    expect(p).toMatchObject({ stock: 100, processesWithStock: 1, processCount: 1 });
  });

  it('maps KBGPGS to a status, and the more severe kind wins inside one package', () => {
    const kinds = summarizePackages(
      [
        line({ packageCode: 1, packageKind: '0' }),
        line({ packageCode: 2, packageName: 'B', packageKind: '1' }),
        line({ packageCode: 3, packageName: 'C', packageKind: '2' }),
      ],
      groups,
      '2026-05-05',
    ).map((p) => p.kind);
    expect(kinds).toEqual(['normal', 'new', 'cancelled']);
    const [mixed] = summarizePackages(
      [line({ packageKind: '1' }), line({ packageKind: '2' })],
      groups,
      '2026-05-05',
    );
    expect(mixed?.kind).toBe('cancelled');
  });

  it('assigns groups from the lists and falls back to Other', () => {
    const lines = [
      line({ packageCode: 1, packageName: 'DIP-8' }),
      line({ packageCode: 2, packageName: 'SSOP-8' }),
      line({ packageCode: 3, packageName: 'NEW-X' }),
    ];
    expect(summarizePackages(lines, groups, '2026-05-05').map((p) => p.group)).toEqual([
      'IC2',
      'IC3',
      'Other',
    ]);
    expect(
      summarizePackages([line({ packageName: 'DUP' })], { A: ['DUP'], B: ['DUP'] }, '2026-05-05')[0]
        ?.group,
    ).toBe('A');
  });

  it('compares with the snapshot just before the selected one', () => {
    const lines = [
      line({ snapshot: '2026-05-01', stock: 100 }),
      line({ snapshot: '2026-05-05', stock: 200 }),
      line({ snapshot: '2026-05-28', stock: 300 }),
    ];
    const [mid] = summarizePackages(lines, groups, '2026-05-05');
    expect(mid).toMatchObject({ previousStock: 100, changePct: 100, trend: [100, 200] });
    const [last] = summarizePackages(lines, groups, '2026-05-28');
    expect(last).toMatchObject({ previousStock: 200, changePct: 50, trend: [100, 200, 300] });
  });

  it('has no change when there is no earlier snapshot, the package was absent, or the old total was zero', () => {
    const [first] = summarizePackages([line({ stock: 10 })], groups, '2026-05-05');
    expect(first).toMatchObject({ previousStock: null, changePct: null, trend: [10] });
    const [fresh] = summarizePackages(
      [line({ snapshot: '2026-05-01', packageCode: 9, packageName: 'Z' }), line({ stock: 10 })],
      groups,
      '2026-05-05',
    );
    expect(fresh).toMatchObject({ previousStock: null, changePct: null });
    const [zero] = summarizePackages(
      [line({ snapshot: '2026-05-01', stock: 0 }), line({ stock: 10 })],
      groups,
      '2026-05-05',
    );
    expect(zero).toMatchObject({ previousStock: 0, changePct: null });
  });

  it('returns nothing for an unknown snapshot', () => {
    expect(summarizePackages([line({})], groups, '1999-01-01')).toEqual([]);
  });
});

describe('listSnapshots, filterSummaries, sortSummaries', () => {
  const lines = [
    line({ packageCode: 1, packageName: 'DIP-8', stock: 10, packageKind: '0' }),
    line({ packageCode: 2, packageName: 'SSOP-8', stock: 30, packageKind: '1' }),
    line({ packageCode: 3, packageName: 'SIP-8', stock: 20, packageKind: '2' }),
    line({ snapshot: '2026-04-01' }),
  ];
  const list = summarizePackages(lines, groups, '2026-05-05');

  it('lists snapshots oldest first', () =>
    expect(listSnapshots(lines)).toEqual(['2026-04-01', '2026-05-05']));
  it('filters by group, status and text', () => {
    expect(filterSummaries(list, { group: 'IC3' }).map((p) => p.name)).toEqual(['SSOP-8']);
    expect(filterSummaries(list, { kind: 'cancelled' }).map((p) => p.name)).toEqual(['SIP-8']);
    expect(filterSummaries(list, { query: ' ssop' }).map((p) => p.name)).toEqual(['SSOP-8']);
  });
  it('sorts by stock, name, code and process count without changing the input', () => {
    expect(sortSummaries(list, 'stock').map((p) => p.name)).toEqual(['SSOP-8', 'SIP-8', 'DIP-8']);
    expect(sortSummaries(list, 'name').map((p) => p.name)).toEqual(['DIP-8', 'SIP-8', 'SSOP-8']);
    expect(sortSummaries(list, 'code').map((p) => p.code)).toEqual([1, 2, 3]);
    expect(list.map((p) => p.code)).toEqual([1, 2, 3]);
  });
});

describe('real data', () => {
  const lines = JSON.parse(
    readFileSync(path.join(process.cwd(), 'data', 'wgpgbl.json'), 'utf-8'),
  ) as StockLine[];
  const groups = JSON.parse(
    readFileSync(path.join(process.cwd(), 'data', 'package-groups.json'), 'utf-8'),
  ) as Record<string, string[]>;

  it('every snapshot keeps all packages and conserves the STOCK total', () => {
    for (const snapshot of listSnapshots(lines)) {
      const inSnapshot = lines.filter((l) => l.snapshot === snapshot);
      const list = summarizePackages(lines, groups, snapshot);
      expect(list.length).toBe(new Set(inSnapshot.map((l) => l.packageCode)).size);
      expect(list.reduce((t, p) => t + p.stock, 0)).toBe(
        inSnapshot.reduce((t, l) => t + l.stock, 0),
      );
      expect(list.every((p) => p.processesWithStock <= p.processCount)).toBe(true);
    }
  });
});
