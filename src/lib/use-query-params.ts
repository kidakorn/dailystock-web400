'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useTransition } from 'react';
import { beginLoading } from './loading-store';

/*
 * Filters live in the URL, not component state: links are shareable, back/forward
 * works, and server components read the same params to filter data on the server.
 */
export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, start] = useTransition();

  // Mirror the transition into the shared store so the layout-level overlay can show it.
  useEffect(() => {
    if (!pending) return;
    return beginLoading();
  }, [pending]);

  const get = useCallback((key: string) => search.get(key) ?? '', [search]);
  const set = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(search.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === '') next.delete(k);
        else next.set(k, v);
      }
      // Any filter change returns to page 1, otherwise the user can land on an empty page.
      if (!('page' in patch)) next.delete('page');
      const qs = next.toString();
      start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [pathname, router, search],
  );
  const refresh = useCallback(() => start(() => router.refresh()), [router]);
  return { get, set, refresh, pending };
}
