import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './sidebar';

// next/link and usePathname need the app router, which does not exist in a unit test.
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: ComponentProps<'a'>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const clearCookie = () => {
  document.cookie = 'sidebar=; max-age=0; path=/';
};
afterEach(() => {
  cleanup();
  clearCookie();
});

describe('Sidebar', () => {
  it('always renders a toggle button, in both states', () => {
    render(<Sidebar />);
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeTruthy();
    cleanup();
    document.cookie = 'sidebar=collapsed; path=/';
    render(<Sidebar />);
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeTruthy();
  });

  it('starts expanded without a cookie, collapses and expands, and remembers the choice in a cookie', () => {
    render(<Sidebar />);
    const aside = screen.getByRole('complementary');
    expect(aside.getAttribute('data-collapsed')).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(aside.getAttribute('data-collapsed')).toBe('true');
    expect(document.cookie).toContain('sidebar=collapsed');

    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(aside.getAttribute('data-collapsed')).toBe('false');
    expect(document.cookie).toContain('sidebar=expanded');
  });
});
