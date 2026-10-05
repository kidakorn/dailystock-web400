import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { DailyStockResult } from '@/lib/summary/daily-stock';
import { DailyStockTable } from './daily-stock-table';

afterEach(cleanup);
const base = { balance: 0, balDay: 0, stock: 0, actual: 0, pending: 0, difference: 0 };
const result: DailyStockResult = {
  packageCount: 2,
  rows: [
    {
      ...base,
      key: '100|',
      processCode: 100,
      processName: 'DICING',
      subProcessCode: '',
      subProcessName: '',
      seq: 2,
      stock: 745893,
      actual: 595352,
      difference: 595.352,
    },
    {
      ...base,
      key: '101|102010',
      processCode: 101,
      processName: 'DIE BONDING',
      subProcessCode: '102010',
      subProcessName: 'BEFORE WIRE BOND',
      seq: 5,
      stock: 10,
      actual: 0,
      balDay: 276000,
      difference: -276,
    },
    {
      ...base,
      key: '206|',
      processCode: 206,
      processName: 'PKG DICING',
      subProcessCode: '',
      subProcessName: '',
      seq: null,
    },
  ],
  totals: { ...base, stock: 745903, actual: 595352, balDay: 276000, difference: 319.352 },
};

describe('DailyStockTable', () => {
  it('shows each line with its sub-process, formatted numbers and a 3-decimal difference', () => {
    render(<DailyStockTable result={result} />);
    expect(screen.getByText('745,893')).toBeTruthy();
    expect(screen.getByText('595.352', { selector: 'td' })).toBeTruthy();
    expect(screen.getByText('-276.000')).toBeTruthy();
    expect(screen.getByText('102010 BEFORE WIRE BOND')).toBeTruthy();
  });

  it('marks lines missing from PROCESS_SEQ and ends with a total row', () => {
    render(<DailyStockTable result={result} />);
    expect(screen.getAllByText('(no sequence)', { exact: false })).toHaveLength(1);
    const foot = screen.getAllByRole('row').at(-1) as HTMLElement;
    expect(within(foot).getByText('Total')).toBeTruthy();
    expect(within(foot).getByText('745,903')).toBeTruthy();
  });

  it('says so when nothing matches and omits the total row', () => {
    render(<DailyStockTable result={{ ...result, rows: [] }} />);
    expect(screen.getByText('No process lines match the current filters.')).toBeTruthy();
    expect(screen.queryByText('Total')).toBeNull();
  });
});
