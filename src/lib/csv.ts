/** Quotes every field; a leading = + - @ is neutralised so spreadsheets cannot run it as a formula. */
const cell = (v: string | number): string => {
  const text = typeof v === 'string' && /^[=+\-@]/.test(v) ? `'${v}` : String(v);
  return `"${text.replace(/"/g, '""')}"`;
};

export function toCsv<T extends object>(
  rows: readonly T[],
  columns: readonly (keyof T & string)[],
): string {
  const lines = rows.map((r) => columns.map((c) => cell(r[c] as string | number)).join(','));
  return [columns.join(','), ...lines].join('\n');
}
