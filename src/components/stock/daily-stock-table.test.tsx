import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
const groupedResult: DailyStockResult = {
  ...result,
  rows: [
    ...result.rows,
    {
      ...base,
      key: '101|102011',
      processCode: 101,
      processName: 'DIE BONDING',
      subProcessCode: '102011',
      subProcessName: 'AFTER WIRE BOND',
      seq: 6,
    },
  ],
};

describe('DailyStockTable', () => {
  it('shows each line with its sub-process, formatted numbers and a 3-decimal difference', () => {
    render(<DailyStockTable result={result} />);
    expect(screen.getByText('745,893')).toBeTruthy();
    expect(screen.getByText('595.352', { selector: 'td' })).toBeTruthy();
    expect(screen.getByText('-276.000')).toBeTruthy();
    expect(screen.getByText('BEFORE WIRE BOND')).toBeTruthy();
    expect(screen.getByText('745,893').getAttribute('data-tone')).toBe('success');
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

  it('collapses grouped process rows and can collapse or expand all groups', () => {
    render(<DailyStockTable result={groupedResult} />);
    expect(screen.getByText('AFTER WIRE BOND')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Toggle 101' }).getAttribute('aria-expanded')).toBe(
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle 101' }));
    expect(screen.queryByText('AFTER WIRE BOND')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(screen.getByText('AFTER WIRE BOND')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(screen.queryByText('AFTER WIRE BOND')).toBeNull();
  });

  it('paginates package groups rather than process rows', () => {
    const source = result.rows[0];
    if (!source) throw new Error('Test fixture needs a source row');
    const packages = Array.from({ length: 9 }, (_, index) => {
      const name = `PKG-${index + 1}`;
      const row = { ...source, key: `${name}|100|` };
      return { key: name, name, result: { ...result, rows: [row], packages: [] } };
    });
    render(<DailyStockTable result={{ ...result, packages }} searchParams={{ page: '2' }} />);

    expect(screen.getByText('PKG-9')).toBeTruthy();
    expect(screen.queryByText('PKG-1')).toBeNull();
    expect(screen.getByText('Page 2 of 2')).toBeTruthy();
  });

  it('places each package subtotal after its process rows', () => {
    const packageResult = {
      ...result,
      packages: [{ key: 'DIP-8', name: 'DIP-8', result }],
    };
    render(<DailyStockTable result={packageResult} />);

    const rows = screen.getAllByRole('row');
    const processRow = rows.findIndex((row) => within(row).queryByText('BEFORE WIRE BOND'));
    const totalRow = rows.findIndex((row) => within(row).queryByText('Total DIP-8'));
    expect(totalRow).toBeGreaterThan(processRow);
    expect(within(rows[totalRow] as HTMLElement).getByText('745,903')).toBeTruthy();
  });
});
