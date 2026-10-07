import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProcessSeqEntry } from '@/types/domain';
import { ProcessMasterView } from './process-master-view';

const mocks = vi.hoisted(() => ({ params: {} as Record<string, string> }));

vi.mock('@/lib/use-search-record', () => ({
  useSearchRecord: () => mocks.params,
}));
vi.mock('@/lib/use-process-seq', () => ({
  useProcessSeq: (entries: ProcessSeqEntry[]) => entries,
  resetProcessSeq: vi.fn(),
  saveProcessSeq: vi.fn(),
}));
vi.mock('@/components/layout/header-portal', () => ({
  HeaderPortal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/ui/filter-bar', () => ({
  FilterBar: () => <input aria-label="Process name" />,
}));

afterEach(cleanup);
beforeEach(() => {
  mocks.params = {};
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
});