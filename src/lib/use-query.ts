'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/*
 * Filters live in the URL, not in useState: links are shareable, Back works,
 * and server components can filter before sending HTML. Changing any filter
 * resets paging unless the patch sets the page itself.
 */
export function useQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const set = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!('page' in patch)) next.delete('page');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  return { sp, set, router };
}
