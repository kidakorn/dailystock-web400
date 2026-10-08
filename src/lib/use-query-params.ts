'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useTransition, type MouseEvent } from 'react';
import { beginLoading } from './loading-store';

// usePathname() omits the base path, but history.replaceState needs the full URL.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/*
 * Filters live in the URL, not component state: links are shareable, back/forward
 * works. history.replaceState (not router.replace) keeps a static export from fetching RSC per query string.
 */
export function useQueryParams() {
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
      // pathname may already end with '/' under trailingSlash, so normalise to exactly one.
      const url = `${BASE_PATH}${pathname.replace(/\/+$/, '')}/`;
      start(() => window.history.replaceState(null, '', qs ? `${url}?${qs}` : url));
    },
    [pathname, search],
  );
  // A static export has no server to re-ask, so Refresh reloads the page (and so picks up a freshly deployed build).
  const refresh = useCallback(() => {
    beginLoading();
    window.location.reload();
  }, []);
  // Modifier clicks keep the browser's native behaviour (open in new tab).
  const linkTo = useCallback(
    (patch: Record<string, string | null>) => (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      set(patch);
    },
    [set],
  );
  return { get, set, linkTo, refresh, pending };
}
