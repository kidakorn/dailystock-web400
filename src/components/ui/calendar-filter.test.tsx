import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CalendarFilter } from './calendar-filter';
import styles from './calendar-filter.module.css';

afterEach(cleanup);

describe('CalendarFilter', () => {
  it('marks days with stock and selects available snapshot dates', () => {
    const onChange = vi.fn();
    render(
      <CalendarFilter
        label="Snapshot"
        value="2026-05-05"
        availableDates={['2026-05-05', '2026-05-07']}
        stockDates={['2026-05-05']}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Choose Snapshot' }));
    const dialog = screen.getByRole('dialog', { name: 'Snapshot calendar' });
    expect(dialog.querySelector(`.${styles.hasStock}`)).toBeTruthy();
    expect(screen.getByText('Normal/New package stock')).toBeTruthy();

    const availableDate = screen
      .getAllByRole('button')
      .find((button) => button.getAttribute('aria-label')?.includes('May 7'));
    expect(availableDate).toBeTruthy();
    fireEvent.click(availableDate as HTMLElement);

    expect(onChange).toHaveBeenCalledWith('2026-05-07');
    expect(screen.queryByRole('dialog', { name: 'Snapshot calendar' })).toBeNull();
  });
});