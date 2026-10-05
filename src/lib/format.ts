// Intl objects are costly to create, so one shared instance per format.
const numberFormatter = new Intl.NumberFormat('en-US');
export const formatNumber = (n: number): string => numberFormatter.format(n);

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});
export const formatDateTime = (d: Date): string => dateTimeFormatter.format(d);
export const pct = (actual: number, plan: number): number =>
  plan ? Math.round((actual / plan) * 100) : 0;

/** Trend text is derived from the same series as the sparkline, so the two cannot disagree. */
export function trendText(series: readonly number[]): string {
  const first = series[0] ?? 0;
  const last = series[series.length - 1] ?? 0;
  const change = first ? ((last - first) / first) * 100 : 0;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs 7 days ago`;
}

const snapshotFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
/** "2026-05-28" -> "28 May 2026". Parsed as UTC so the day never shifts with the viewer's time zone. */
export const formatSnapshotDate = (iso: string): string =>
  snapshotFormatter.format(new Date(`${iso}T00:00:00Z`));

// timeZone UTC: an ISO date such as 2026-05-28 must not shift to the previous day in negative-offset browsers.
const isoDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
export const formatIsoDate = (iso: string): string =>
  isoDateFormatter.format(new Date(`${iso}T00:00:00Z`));

const decimal3Formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});
export const formatDecimal3 = (n: number): string => decimal3Formatter.format(n);
