'use client';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import type { SearchParams } from './query';

/**
 * The URL query string as the plain record the page logic already works with (param(), hrefWith()).
 * It is read in the browser, which is what lets these pages be exported as static HTML.
 */
export function useSearchRecord(): SearchParams {
  const search = useSearchParams();
  return useMemo(() => Object.fromEntries(search.entries()), [search]);
}
