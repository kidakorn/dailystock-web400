import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DailyStockResult } from '@/lib/summary/daily-stock';
import { DailyStockTable } from './daily-stock-table';

beforeEach(() => {
  const headerTools = document.createElement('div');
  headerTools.id = 'header-tools';
  document.body.append(headerTools);
});
afterEach(() => {
  cleanup();
  document.getElementById('header-tools')?.remove();
});
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
    expect(document.querySelector('td[data-measure="stock"]')?.getAttribute('data-tone')).toBe(
      'success',
    );
  });

  it('marks negative stock and difference without icons and keeps positive and zero stock distinct', () => {
    const negativeStockResult: DailyStockResult = {
      ...result,
      rows: result.rows.map((row) => (row.processCode === 206 ? { ...row, stock: -4 } : row)),
      totals: { ...result.totals, stock: 745899 },
    };
    render(<DailyStockTable result={negativeStockResult} />);

    const negativeStock = screen.getByRole('cell', { name: 'Negative stock: -4' });
    const negativeDifference = screen.getByRole('cell', { name: 'Negative difference: -276.000' });
    expect(negativeStock.getAttribute('data-tone')).toBe('danger');
    expect(negativeStock.textContent).toBe('-4');
    expect(negativeDifference.textContent).toBe('-276.000');
    expect(negativeStock.querySelector('svg')).toBeNull();
    expect(negativeDifference.querySelector('svg')).toBeNull();
    expect(document.querySelector('td[data-measure="stock"][data-tone="success"]')).toBeTruthy();
  });

  it('keeps zero stock neutral and non-zero pending visibly in the warning state', () => {
    const pendingResult: DailyStockResult = {
      ...result,
      rows: result.rows.map((row) => (row.processCode === 100 ? { ...row, pending: -4 } : row)),
      totals: { ...result.totals, pending: -4 },
    };
    render(<DailyStockTable result={pendingResult} />);

    expect(document.querySelector('td[data-measure="stock"][data-tone="zero"]')).toBeTruthy();
    expect(document.querySelector('td[data-measure="pending"][data-tone="warning"]')).toBeTruthy();
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
    expect(document.getElementById('header-tools')?.contains(screen.getByRole('button', { name: 'Collapse all' }))).toBe(true);
    expect(screen.getByRole('button', { name: 'Toggle 101' }).getAttribute('aria-expanded')).toBe(
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Toggle 101' }).querySelector('svg.lucide-minus'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle 101' }));
    expect(screen.queryByText('AFTER WIRE BOND')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Toggle 101' }).querySelector('svg.lucide-plus'),
    ).toBeTruthy();

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
    expect(document.getElementById('header-tools')?.textContent).toContain('1/9 packages');
  });

  it('keeps one shared header and places package names below it with per-package totals', () => {
    const dicing = result.rows[0];
    const dieBond = result.rows[1];
    if (!dicing || !dieBond) throw new Error('Test fixture needs process rows');
    const packageResult = {
      ...result,
      packages: [
        {
          key: 'DIP-8',
          name: 'DIP-8',
          result: {
            ...result,
            rows: [dicing],
            totals: { ...base, stock: dicing.stock, actual: dicing.actual, difference: dicing.difference },
          },
        },
        {
          key: 'DIP-8 Cu',
          name: 'DIP-8 Cu',
          result: {
            ...result,
            rows: [dieBond],
            totals: { ...base, stock: dieBond.stock, balDay: dieBond.balDay, difference: dieBond.difference },
          },
        },
      ],
    };
    render(
      <DailyStockTable
        result={packageResult}
        packagePairs={{ IC2: [['DIP-8', 'DIP-8 Cu']] }}
        packageKinds={new Map([['DIP-8', 'cancelled']])}
        searchParams={{ rows: 'all' }}
      />,
    );

    const tables = screen.getAllByRole('table');
    expect(tables).toHaveLength(1);
    const table = tables[0] as HTMLElement;
    const tabs = Array.from(table.querySelectorAll('tbody [data-package-name]'));
    expect(tabs.map((tab) => tab.getAttribute('data-package-name'))).toEqual(['DIP-8', 'DIP-8 Cu']);
    expect(table.querySelectorAll('thead tr')).toHaveLength(1);
    expect(table.querySelectorAll('thead th')).toHaveLength(14);
    expect(tabs[0]?.closest('tr')?.nextElementSibling?.textContent).toContain('DICING');
    expect(Array.from(table.querySelectorAll('thead tr:first-child th[data-package-measure]')).map((header) => header.textContent?.trim())).toEqual([
      'Balance', 'Bal/Day', 'Stock', 'Actual', 'Pending', 'Difference',
      'Balance', 'Bal/Day', 'Stock', 'Actual', 'Pending', 'Difference',
    ]);
    expect(Array.from(table.querySelectorAll('thead tr:first-child th[data-package-measure]')).every((header) => header.className.includes('packageMeasureColumn'))).toBe(true);
    expect(tabs.map((tab) => tab.parentElement?.getAttribute('colspan'))).toEqual(['6', '6']);
    expect(tabs[0]?.getAttribute('data-palette')).toBe(tabs[1]?.getAttribute('data-palette'));
    expect(screen.getByText('Cancelled').closest('span')?.querySelector('[aria-hidden="true"]')).toBeTruthy();
    const dicingRow = within(table).getByRole('row', { name: /^DICING/ });
    expect(dicingRow.querySelector('td[data-package="DIP-8 Cu"][data-measure="stock"]')?.textContent).toBe('0');
    const dieBondRow = within(table).getByRole('row', { name: /^DIE BONDING/ });
    expect(dieBondRow.querySelector('td[data-package="DIP-8"][data-measure="stock"]')?.textContent).toBe('0');
    expect(dieBondRow.querySelector('td[data-package="DIP-8 Cu"][data-measure="stock"]')?.textContent).toBe('10');
    const totalCell = table.querySelector('td[data-total-package="DIP-8"][data-measure="stock"]');
    const totalRow = totalCell?.closest('tr');
    expect(totalCell?.textContent).toBe('745,893');
    expect(totalRow?.querySelector('td[data-total-package="DIP-8 Cu"][data-measure="stock"]')?.textContent).toBe('10');
  });

  it('orders configured package pairs together and gives each pair the same header tint', () => {
    const packageResult = {
      ...result,
      packages: [
        { key: 'PKG-A', name: 'PKG-A', result },
        { key: 'PKG-B', name: 'PKG-B', result },
        { key: 'PKG-C', name: 'PKG-C', result },
      ],
    };
    render(
      <DailyStockTable
        result={packageResult}
        packagePairs={{ IC2: [['PKG-B', 'PKG-A']] }}
        searchParams={{ rows: 'all' }}
      />,
    );

    const tabs = Array.from(document.querySelectorAll('table tbody [data-package-name]'));
    expect(tabs.map((tab) => tab.getAttribute('data-package-name'))).toEqual(['PKG-B', 'PKG-A', 'PKG-C']);
    expect(tabs[0]?.getAttribute('data-palette')).toBe(tabs[1]?.getAttribute('data-palette'));
    expect(tabs[2]?.getAttribute('data-palette')).not.toBe(tabs[0]?.getAttribute('data-palette'));
    expect(tabs[0]?.getAttribute('data-pair-index')).toBe(tabs[1]?.getAttribute('data-pair-index'));
    expect(tabs[2]?.getAttribute('data-pair-index')).not.toBe(tabs[0]?.getAttribute('data-pair-index'));
  });

  it('keeps pairs together at the 8-package page boundary and shows unpaired packages alone', () => {
    const source = result.rows[0];
    if (!source) throw new Error('Test fixture needs a source row');
    const names = [
      'PKG-1', 'PKG-2', 'PKG-3', 'PKG-4', 'PKG-5', 'PKG-6', 'PKG-7', 'PAIR-A', 'PAIR-B',
    ];
    const packages = names.map((name) => ({
      key: name,
      name,
      result: { ...result, rows: [{ ...source, key: `${name}|100|` }] },
    }));
    const packageResult = { ...result, packages };
    const pairs = { IC2: [['PKG-1'], ['PKG-2'], ['PKG-3'], ['PKG-4'], ['PKG-5'], ['PKG-6'], ['PKG-7'], ['PAIR-A', 'PAIR-B']] };

    const { unmount } = render(
      <DailyStockTable result={packageResult} packagePairs={pairs} searchParams={{ rows: 'all' }} />,
    );
    let headers = Array.from(document.querySelectorAll('table tbody [data-package-name]'));
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(document.querySelectorAll('tbody tr[data-pair-section]')).toHaveLength(7);
    expect(headers.map((header) => header.getAttribute('data-package-name'))).toEqual(names.slice(0, 7));
    expect(screen.getByText('Page 1 of 2')).toBeTruthy();

    unmount();
    render(
      <DailyStockTable
        result={packageResult}
        packagePairs={pairs}
        searchParams={{ page: '2', rows: 'all' }}
      />,
    );
    headers = Array.from(document.querySelectorAll('table tbody [data-package-name]'));
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(document.querySelectorAll('tbody tr[data-pair-section]')).toHaveLength(1);
    expect(headers.map((header) => header.getAttribute('data-package-name'))).toEqual(['PAIR-A', 'PAIR-B']);
    expect(screen.getByText('Page 2 of 2')).toBeTruthy();
  });

  it('hides an empty pair by default, keeps its empty partner beside an active package, and shows all in All packages mode', () => {
    const active = result.rows[0];
    const empty = result.rows[2];
    if (!active || !empty) throw new Error('Test fixture needs active and empty rows');
    const packageResult = {
      ...result,
      packages: [
        { key: 'ACTIVE', name: 'ACTIVE', result: { ...result, rows: [active] } },
        { key: 'ACTIVE-CU', name: 'ACTIVE-CU', result: { ...result, rows: [] } },
        { key: 'EMPTY', name: 'EMPTY', result: { ...result, rows: [empty] } },
        { key: 'EMPTY-CU', name: 'EMPTY-CU', result: { ...result, rows: [empty] } },
      ],
    };
    const packagePairs = { IC2: [['ACTIVE', 'ACTIVE-CU'], ['EMPTY', 'EMPTY-CU']] };

    const { unmount } = render(<DailyStockTable result={packageResult} packagePairs={packagePairs} />);
    let headers = Array.from(document.querySelectorAll('table tbody [data-package-name]'));
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(document.querySelectorAll('tbody tr[data-pair-section]')).toHaveLength(1);
    expect(headers.map((header) => header.getAttribute('data-package-name'))).toEqual(['ACTIVE', 'ACTIVE-CU']);
    const activeRow = screen.getByRole('row', { name: /^DICING/ });
    expect(activeRow.querySelector('td[data-package="ACTIVE-CU"][data-measure="stock"]')?.textContent).toBe('0');

    unmount();
    render(
      <DailyStockTable result={packageResult} packagePairs={packagePairs} searchParams={{ rows: 'all' }} />,
    );
    headers = Array.from(document.querySelectorAll('table tbody [data-package-name]'));
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(document.querySelectorAll('tbody tr[data-pair-section]')).toHaveLength(2);
    expect(headers.map((header) => header.getAttribute('data-package-name'))).toEqual([
      'ACTIVE', 'ACTIVE-CU', 'EMPTY', 'EMPTY-CU',
    ]);
  });

  it('labels normal packages as Running with a status marker', () => {
    const packageResult = {
      ...result,
      packages: [{ key: 'DIP-8', name: 'DIP-8', result }],
    };
    render(
      <DailyStockTable result={packageResult} packageKinds={new Map([['DIP-8', 'normal']])} />,
    );

    const badge = screen.getByText('Normal').closest('span');
    expect(badge?.getAttribute('data-kind')).toBe('normal');
    expect(badge?.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it('highlights New packages with an icon', () => {
    const packageResult = {
      ...result,
      packages: [{ key: 'DIP-8', name: 'DIP-8', result }],
    };
    render(<DailyStockTable result={packageResult} packageKinds={new Map([['DIP-8', 'new']])} />);

    const badge = screen.getByText('New').closest('span');
    expect(badge?.getAttribute('data-kind')).toBe('new');
    expect(badge?.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});
