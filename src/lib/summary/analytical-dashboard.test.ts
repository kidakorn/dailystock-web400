import { describe, expect, it } from 'vitest';
import type { ProcessSeqEntry, StockLine } from '@/types/domain';
import { buildAnalyticalDashboard } from './analytical-dashboard';

const line = (overrides: Partial<StockLine>): StockLine => ({
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
  ...overrides,
});

const sequence: ProcessSeqEntry[] = [
  { seq: 1, label: 'Master Dicing', processCode: 100, subProcessCode: '' },
  { seq: 2, label: 'Master Bond', processCode: 101, subProcessCode: '' },
];

describe('buildAnalyticalDashboard', () => {
  const lines = [
    line({ snapshot: '2026-05-01', stock: 10, actual: 8 }),
    line({ snapshot: '2026-05-05', packageKind: '1', stock: 10, actual: 7 }),
    line({
      snapshot: '2026-05-05',
      subProcessCode: '100010',
      subProcessName: 'CUT',
      stock: 2,
      actual: 1,
    }),
    line({
      snapshot: '2026-05-05',
      packageCode: 2,
      packageName: 'SSOP-8',
      packageKind: '2',
      processCode: 101,
      processName: 'BOND',
      stock: 5,
      actual: 4,
    }),
  ];

  it('filters current totals and status by selected package', () => {
    const result = buildAnalyticalDashboard(lines, sequence, '2026-05-05', 'DIP-8');
    expect(result).toMatchObject({
      packageCount: 1,
      stock: 12,
      actual: 8,
      status: [
        { label: 'Normal', value: 0 },
        { label: 'New', value: 1 },
        { label: 'Cancelled', value: 0 },
      ],
    });
  });

  it('orders process chart by master and trends the selected package across snapshots', () => {
    const result = buildAnalyticalDashboard(lines, sequence, '2026-05-05', 'DIP-8');
    expect(result.processes).toEqual([{ name: 'Master Dicing', stock: 12, actual: 8 }]);
    expect(result.trend).toEqual([
      { name: '2026-05-01', stock: 10, actual: 8 },
      { name: '2026-05-05', stock: 12, actual: 8 },
    ]);
  });

  it('counts unique packages and their most severe current status', () => {
    const result = buildAnalyticalDashboard(lines, sequence, '2026-05-05');
    expect(result.packageCount).toBe(2);
    expect(result.status.map((item) => item.value)).toEqual([0, 1, 1]);
  });
});