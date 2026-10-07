import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StockLine } from '@/types/domain';
import { DailyStockView } from './daily-stock-view';

const mocks = vi.hoisted(() => ({
  params: {} as Record<string, string>,
  set: vi.fn(),
}));

vi.mock('@/lib/use-search-record', () => ({
  useSearchRecord: () => mocks.params,
}));
vi.mock('@/lib/use-query-params', () => ({
  useQueryParams: () => ({
    get: (key: string) => mocks.params[key] ?? '',
    set: mocks.set,
    refresh: vi.fn(),
    pending: false,
  }),
}));
vi.mock('@/lib/use-process-seq', () => ({
  useProcessSeq: (entries: unknown[]) => entries,
}));
vi.mock('@/components/layout/header-portal', () => ({
  HeaderPortal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/stock/export-csv-button', () => ({
  ExportCsvButton: () => null,
}));

afterEach(cleanup);
beforeEach(() => {
  mocks.params = {};
  mocks.set.mockClear();
});

const stockLine = (packageName: string, packageKind: StockLine['packageKind']): StockLine => ({
  snapshot: '2026-05-05',
  packageCode: packageName.length,
  packageName,
  packageKind,
  processCode: 100,
  processName: 'DICING',
  subProcessCode: '',
  subProcessName: '',
  balance: 10,
  balDay: 10,
  stock: packageKind === '2' ? -2 : 5,
  actual: 10,
  pending: 1,
});

const lines: StockLine[] = [
  stockLine('PRODUCING-PKG', '0'),
  stockLine('NEW-PKG', '1'),
  stockLine('CANCELLED-PKG', '2'),
];

function renderView(source = lines) {
  return render(<DailyStockView lines={source} seq={[]} groups={{}} />);
}

describe('DailyStockView package status filter', () => {
  it('defaults to Producing and persists the initial choice in the URL', () => {
    renderView();

    expect((screen.getByLabelText('Package status') as HTMLSelectElement).value).toBe('normal');
    const tableText = screen.getByRole('table').textContent ?? '';
    expect(tableText).toContain('PRODUCING-PKG');
    expect(tableText).not.toContain('NEW-PKG');
    expect(tableText).not.toContain('CANCELLED-PKG');
    expect(mocks.set).toHaveBeenCalledWith({ status: 'normal' });
  });

  it('falls back to New, then All when no active package kind is available', () => {
    const { unmount } = renderView(lines.slice(1));
    expect((screen.getByLabelText('Package status') as HTMLSelectElement).value).toBe('new');
    expect(screen.getByRole('table').textContent).toContain('NEW-PKG');
    expect(mocks.set).toHaveBeenCalledWith({ status: 'new' });

    unmount();
    mocks.set.mockClear();
    renderView([lines[2] as StockLine]);
    expect((screen.getByLabelText('Package status') as HTMLSelectElement).value).toBe('all');
    expect(screen.getByRole('table').textContent).toContain('CANCELLED-PKG');
    expect(mocks.set).toHaveBeenCalledWith({ status: 'all' });
  });

  it('preserves explicit status and package query selections', () => {
    mocks.params = { status: 'cancelled' };
    const { unmount } = renderView();
    expect((screen.getByLabelText('Package status') as HTMLSelectElement).value).toBe('cancelled');
    expect(screen.getByRole('table').textContent).toContain('CANCELLED-PKG');
    expect(mocks.set).not.toHaveBeenCalledWith({ status: 'cancelled' });
    expect(mocks.set).toHaveBeenCalledWith({ rows: 'active' });

    unmount();
    mocks.params = { package: 'NEW-PKG' };
    renderView();
    expect((screen.getByLabelText('Package status') as HTMLSelectElement).value).toBe('all');
    expect((screen.getByLabelText('Package name') as HTMLSelectElement).value).toBe('NEW-PKG');
    const tableText = screen.getByRole('table').textContent ?? '';
    expect(tableText).toContain('NEW-PKG');
    expect(tableText).not.toContain('PRODUCING-PKG');
    expect(mocks.set).toHaveBeenCalledWith({ status: 'all' });
  });

  it('keeps a manual status change as the requested URL filter', () => {
    renderView();
    fireEvent.change(screen.getByLabelText('Package status'), { target: { value: 'new' } });
    expect(mocks.set).toHaveBeenLastCalledWith({ status: 'new' });
  });

  it('defaults to active packages and supports showing all packages', () => {
    renderView();

    expect((screen.getByLabelText('Packages') as HTMLSelectElement).value).toBe('active');
    expect(mocks.set).toHaveBeenCalledWith({ rows: 'active' });

    cleanup();
    mocks.params = { rows: 'all' };
    mocks.set.mockClear();
    renderView();

    expect((screen.getByLabelText('Packages') as HTMLSelectElement).value).toBe('all');
    expect(mocks.set).not.toHaveBeenCalledWith({ rows: 'active' });
  });
});