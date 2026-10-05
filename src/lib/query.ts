export type SearchParams = Record<string, string | string[] | undefined>;

export const param = (sp: SearchParams, key: string): string => {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? '';
};

/** Builds a link that keeps the current filters and changes only `patch` (null removes a key). */
export function hrefWith(
  path: string,
  sp: SearchParams,
  patch: Record<string, string | null>,
): string {
  const next = new URLSearchParams();
  for (const key of Object.keys(sp)) {
    const v = param(sp, key);
    if (v) next.set(key, v);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) next.delete(k);
    else next.set(k, v);
  }
  const qs = next.toString();
  return qs ? `${path}?${qs}` : path;
}

/** URL params are user input: anything outside the allowed list quietly falls back instead of breaking the page. */
export const pick = <T extends string>(value: string, allowed: readonly T[], fallback: T): T =>
  allowed.find((a) => a === value) ?? fallback;
