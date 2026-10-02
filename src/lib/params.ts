export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

export const uniq = <T>(rows: T[], pick: (row: T) => string): string[] =>
  [...new Set(rows.map(pick))].sort();
