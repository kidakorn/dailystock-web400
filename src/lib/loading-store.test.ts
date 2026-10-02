import { describe, expect, it } from 'vitest';
import { beginLoading, isLoading } from './loading-store';

describe('loading store', () => {
  it('is loading while any job is running', () => {
    const a = beginLoading();
    const b = beginLoading();
    expect(isLoading()).toBe(true);
    a();
    expect(isLoading()).toBe(true);
    b();
    expect(isLoading()).toBe(false);
  });

  it('ignores a second call to the same stop function', () => {
    const a = beginLoading();
    const b = beginLoading();
    a();
    a();
    expect(isLoading()).toBe(true);
    b();
    expect(isLoading()).toBe(false);
  });
});
