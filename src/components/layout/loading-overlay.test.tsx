import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { beginLoading } from '@/lib/loading-store';
import { LoadingOverlay } from './loading-overlay';

afterEach(cleanup);

describe('LoadingOverlay', () => {
  it('is absent when idle, shown while loading, and removed afterwards', () => {
    render(<LoadingOverlay />);
    expect(screen.queryByRole('status')).toBeNull();

    let stop = () => {};
    act(() => {
      stop = beginLoading();
    });
    expect(screen.getByRole('status').textContent).toContain('Loading data');

    act(() => stop());
    expect(screen.queryByRole('status')).toBeNull();
  });
});
