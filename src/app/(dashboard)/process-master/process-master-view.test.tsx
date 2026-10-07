import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProcessSeqEntry } from '@/types/domain';
import { ProcessMasterView } from './process-master-view';

const mocks = vi.hoisted(() => ({
  params: {} as Record<string, string>,
  entries: undefined as ProcessSeqEntry[] | undefined,
  listeners: new Set<() => void>(),
}));

vi.mock('@/lib/use-search-record', () => ({
  useSearchRecord: () => mocks.params,
}));
vi.mock('@/lib/use-process-seq', async () => {
  const { useSyncExternalStore } = await import('react');
  return {
    useProcessSeq: (defaultEntries: ProcessSeqEntry[]) =>
      useSyncExternalStore(
        (listener) => {
          mocks.listeners.add(listener);
          return () => mocks.listeners.delete(listener);
        },
        () => mocks.entries ?? defaultEntries,
        () => defaultEntries,
      ),
    resetProcessSeq: vi.fn(),
    saveProcessSeq: (entries: ProcessSeqEntry[]) => {
      mocks.entries = entries;
      mocks.listeners.forEach((listener) => listener());
    },
  };
});
vi.mock('@/components/layout/header-portal', () => ({
  HeaderPortal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/ui/filter-bar', () => ({
  FilterBar: () => <input aria-label="Process name" />,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  mocks.params = {};
  mocks.entries = undefined;
  mocks.listeners.clear();
});

const entries: ProcessSeqEntry[] = Array.from({ length: 23 }, (_, index) => ({
  seq: index + 1,
  label: `Process ${String(index + 1).padStart(2, '0')}`,
  processCode: index + 1,
  subProcessCode: '',
  processName: `Process ${String(index + 1).padStart(2, '0')}`,
  subProcessName: '',
}));

describe('ProcessMasterView pagination', () => {
  it('paginates rows and keeps the current page indicator synchronized', () => {
    render(<ProcessMasterView defaultEntries={entries} />);

    expect(screen.getByText('Page 1 of 3 · 23 entries')).toBeTruthy();
    expect(screen.getByText('Process 01')).toBeTruthy();
    expect(screen.getByText('Process 08')).toBeTruthy();
    expect(screen.queryByText('Process 09')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Page 2 of 3 · 23 entries')).toBeTruthy();
    expect(screen.queryByText('Process 01')).toBeNull();
    expect(screen.getByText('Process 09')).toBeTruthy();
    expect(screen.getByText('Process 16')).toBeTruthy();
  });

  it('applies the existing search filter before pagination', () => {
    mocks.params = { q: 'process 22' };
    render(<ProcessMasterView defaultEntries={entries} />);

    expect(screen.getByText('Page 1 of 1 · 1 entries')).toBeTruthy();
    expect(screen.getByText('Process 22')).toBeTruthy();
    expect(screen.queryByText('Process 21')).toBeNull();
  });

  it('keeps the current page when opening a row action', () => {
    render(<ProcessMasterView defaultEntries={entries} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    const row = screen.getByText('Process 09').closest('tr');
    expect(row).not.toBeNull();
    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Edit' }));

    expect(screen.getByText('Page 2 of 3 · 23 entries')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Edit process name' })).toBeTruthy();
    expect(screen.queryByText('Process 01')).toBeNull();
  });

  it('keeps auto-pagination stable when a row action changes row content', () => {
    const observedTargets = new Set<Element>();
    class ResizeObserverMock {
      constructor() {}
      observe(target: Element) {
        observedTargets.add(target);
      }
      unobserve() {}
      disconnect() {}
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const height = this.tagName === 'THEAD' ? 22 : this.tagName === 'TR' ? 16 : 0;
      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: height,
        width: 0,
        height,
        toJSON: () => undefined,
      } as DOMRect;
    });
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.querySelector('table') ? 320 : 0;
    });

    render(<ProcessMasterView defaultEntries={entries} />);
    const table = screen.getByRole('table', { name: 'Process sequence master' });
    const viewport = table.parentElement as HTMLDivElement;
    const body = table.querySelector('tbody');

    expect(observedTargets.has(viewport)).toBe(true);
    expect(body).not.toBeNull();
    expect(observedTargets.has(body as HTMLTableSectionElement)).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    viewport.scrollTop = 120;
    const row = screen.getByText('Process 19').closest('tr');
    expect(row).not.toBeNull();
    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Edit' }));

    expect(screen.getByText('Page 2 of 2 · 23 entries')).toBeTruthy();
    expect(viewport.scrollTop).toBe(120);
  });

  it('keeps the current page when an action changes the entries', () => {
    render(<ProcessMasterView defaultEntries={entries} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    const row = screen.getByText('Process 09').closest('tr');
    expect(row).not.toBeNull();
    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Delete' }));

    expect(screen.getByText('Page 2 of 3 · 22 entries')).toBeTruthy();
    expect(screen.getByText('Process 10')).toBeTruthy();
    expect(screen.queryByText('Process 09')).toBeNull();
  });
});