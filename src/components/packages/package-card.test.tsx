import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { PackageSummary } from '@/lib/summary/packages';
import { PackageCard } from './package-card';

afterEach(cleanup);
const item: PackageSummary = {
  code: 18,
  name: 'SOT23-5',
  group: 'IC2',
  kind: 'normal',
  stock: 4041646,
  processesWithStock: 20,
  processCount: 24,
  previousStock: 4001000,
  changePct: 0.99,
  trend: [4001000, 4041646],
};

describe('PackageCard', () => {
  it('shows the total stock, the process coverage and the change', () => {
    render(<PackageCard item={item} previousLabel="05 May 2026" />);
    expect(screen.getByText('SOT23-5')).toBeTruthy();
    expect(screen.getByText('4,041,646')).toBeTruthy();
    expect(screen.getByText('20 of 24 processes with stock')).toBeTruthy();
    expect(screen.getByText('+0.99% vs 05 May 2026')).toBeTruthy();
    expect(screen.queryByText('New')).toBeNull();
  });

  it('uses the shared text and marker treatment for every package status', () => {
    for (const [kind, label] of [
      ['normal', 'Normal'],
      ['new', 'New'],
      ['cancelled', 'Cancelled'],
    ] as const) {
      const { unmount } = render(<PackageCard item={{ ...item, kind }} previousLabel={null} />);
      const badge = screen.getByText(label).closest('span');
      expect(badge?.getAttribute('data-kind')).toBe(kind);
      expect(badge?.querySelector('[aria-hidden="true"]')).toBeTruthy();
      expect(badge?.querySelector('svg')).toBeNull();
      unmount();
    }
  });

  it('says so when there is nothing to compare with, and never shows -0.00%', () => {
    render(<PackageCard item={{ ...item, changePct: null }} previousLabel="05 May 2026" />);
    expect(screen.getByText('No comparison')).toBeTruthy();
    cleanup();
    render(<PackageCard item={{ ...item, changePct: -0.001 }} previousLabel="05 May 2026" />);
    expect(screen.getByText('0.00% vs 05 May 2026')).toBeTruthy();
  });
});
