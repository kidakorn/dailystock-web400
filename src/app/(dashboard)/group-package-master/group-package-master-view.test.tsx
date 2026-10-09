import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GroupPackageEntry } from '@/types/domain';
import { GroupPackageMasterView } from './group-package-master-view';

const mocks = vi.hoisted(() => ({ params: {} as Record<string, string> }));

vi.mock('@/lib/use-search-record', () => ({
  useSearchRecord: () => mocks.params,
}));
vi.mock('@/components/layout/header-portal', () => ({
  HeaderPortal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/ui/filter-bar', () => ({
  FilterBar: () => <input aria-label="Group or package" />,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  mocks.params = {};
});

const entry = (index: number): GroupPackageEntry => ({
  CDGPGS: index,
  NMGPGS: `Group ${String(index).padStart(2, '0')}`,
  CDPAKG: 100 + index,
  KBGPGS: null,
  D6DATC: 190224,
  TMTIMC: 160000,
  CNJNMC: 'WONOTE12',
  CNFUNC: 'CNTRANS',
  D6DATU: 0,
  TMTIMU: 0,
  CNJNMU: null,
  CNFUNU: null,
  UPDATE_IDENT: 0,
});
const entries = Array.from({ length: 23 }, (_, index) => entry(index + 1));

describe('GroupPackageMasterView', () => {
  it('paginates rows and formats the AS400 created date and time', () => {
    render(<GroupPackageMasterView defaultEntries={entries} />);

    expect(screen.getByText('Page 1 of 3 · 23 entries')).toBeTruthy();
    expect(screen.getAllByText('24/02/2019 16:00:00').length).toBeGreaterThan(0);
    expect(screen.getByText('Group 08')).toBeTruthy();
    expect(screen.queryByText('Group 09')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Page 2 of 3 · 23 entries')).toBeTruthy();
    expect(screen.getByText('Group 09')).toBeTruthy();
  });

  it('applies the search filter before pagination', () => {
    mocks.params = { q: 'group 22' };
    render(<GroupPackageMasterView defaultEntries={entries} />);

    expect(screen.getByText('Page 1 of 1 · 1 entries')).toBeTruthy();
    expect(screen.getByText('Group 22')).toBeTruthy();
    expect(screen.queryByText('Group 21')).toBeNull();
  });

  it('refreshes the table from the static master file', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [entry(1), entry(2)],
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<GroupPackageMasterView defaultEntries={entries} />);

    fireEvent.click(screen.getByRole('button', { name: /Refresh/ }));

    await waitFor(() => expect(screen.getByText('Page 1 of 1 · 2 entries')).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith('/data/mgpgst.json', { cache: 'no-store' });
  });

  it('shows an error and keeps the current rows when refresh fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    render(<GroupPackageMasterView defaultEntries={entries} />);

    fireEvent.click(screen.getByRole('button', { name: /Refresh/ }));

    expect((await screen.findByRole('alert')).textContent).toBe('Refresh failed (500)');
    expect(screen.getByText('Page 1 of 3 · 23 entries')).toBeTruthy();
  });

  it('renders a single refresh button', () => {
    render(<GroupPackageMasterView defaultEntries={entries} />);

    expect(screen.getAllByRole('button', { name: /Refresh/ })).toHaveLength(1);
  });

  it('jumps to a page from the numbered pagination', () => {
    render(<GroupPackageMasterView defaultEntries={entries} />);

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    expect(screen.getByText('Page 2 of 3 · 23 entries')).toBeTruthy();
    expect(screen.getByText('Group 09')).toBeTruthy();
  });

  it('labels the status division from KBGPGS', () => {
    const statuses = [entry(1), { ...entry(2), KBGPGS: 1 }, { ...entry(3), KBGPGS: 2 }];
    render(<GroupPackageMasterView defaultEntries={statuses} />);

    expect(screen.getByText('Running').getAttribute('data-tone')).toBe('success');
    expect(screen.getByText('New').getAttribute('data-tone')).toBe('info');
    expect(screen.getByText('Cancelled').getAttribute('data-tone')).toBe('danger');
  });

  it('filters rows by status division', () => {
    const statuses = [entry(1), { ...entry(2), KBGPGS: 1 }, { ...entry(3), KBGPGS: 2 }];
    mocks.params = { status: 'new' };
    render(<GroupPackageMasterView defaultEntries={statuses} />);

    expect(screen.getByText('Page 1 of 1 · 1 entries')).toBeTruthy();
    expect(screen.getByText('Group 02')).toBeTruthy();
  });

  it('filters rows by group', () => {
    mocks.params = { group: '5' };
    render(<GroupPackageMasterView defaultEntries={entries} />);

    expect(screen.getByText('Page 1 of 1 · 1 entries')).toBeTruthy();
    expect(screen.getByText('Group 05')).toBeTruthy();
  });
});
