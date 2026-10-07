import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DashboardError from './(dashboard)/error';
import NotFound from './not-found';

afterEach(cleanup);

describe('error pages', () => {
  it('renders a standalone 404 with a dashboard link', () => {
    render(<NotFound />);

    expect(screen.getByText('404')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to dashboard' }).getAttribute('href')).toBe('/');
  });

  it('retries runtime errors without displaying exception details', () => {
    const reset = vi.fn();
    render(<DashboardError error={new Error('internal detail')} reset={reset} />);

    expect(screen.getByRole('alert').textContent).not.toContain('internal detail');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledOnce();
  });
});