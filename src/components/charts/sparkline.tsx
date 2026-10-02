import styles from '@/components/ui/ui.module.css';

/** Tiny trend line, min-max normalised per series: it shows shape only, the exact value sits next to it. */
export function Sparkline({
  values,
  tone = 'primary',
}: {
  values: readonly number[];
  tone?: string;
}) {
  if (values.length < 2) return null;
  const w = 60,
    h = 18,
    min = Math.min(...values),
    range = Math.max(...values) - min || 1;
  const points = values
    .map((v, i) => `${(i * w) / (values.length - 1)},${h - 2 - ((v - min) / range) * (h - 4)}`)
    .join(' ');
  return (
    <svg className={styles.spark} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={points} stroke={`var(--color-${tone})`} />
    </svg>
  );
}
