import { describe, expect, it } from 'vitest';
import { formatIsoDate, formatNumber } from './format';

describe('format', () => {
  it('formats an ISO date without shifting the day', () =>
    expect(formatIsoDate('2026-05-28')).toBe('28 May 2026'));
  it('formats numbers with thousands separators', () =>
    expect(formatNumber(4041646)).toBe('4,041,646'));
});
