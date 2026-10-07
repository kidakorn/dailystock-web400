import { Sparkline } from '@/components/charts/sparkline';
import { formatNumber, trendText } from '@/lib/format';
import { formatIsoDate } from '@/lib/format';
import styles from './ui.module.css';

interface Props {
  label: string;
  value: number;
  tone: 'primary' | 'success' | 'danger' | 'warning';
  spark?: readonly number[];
  comparison?: { value: number; snapshot: string };
}

export function KpiCard({ label, value, tone, spark, comparison }: Props) {
  const change = comparison ? value - comparison.value : null;
  const percentage =
    comparison && comparison.value !== 0 ? (change! / comparison.value) * 100 : null;

  return (
    <div className={`${styles.card} ${styles.kpi}`} data-tone={tone}>
      <p className={styles.kpiLabel}>{label}</p>
      <div className={styles.kpiRow}>
        <p className={styles.kpiValue}>{formatNumber(value)}</p>
        {spark ? <Sparkline values={spark} tone={tone} /> : null}
      </div>
      {spark ? <p className={styles.kpiTrend}>{trendText(spark)}</p> : null}
      {comparison && change !== null ? (
        <p className={styles.kpiComparison}>
          {change > 0 ? '+' : ''}{formatNumber(change)}
          {percentage !== null ? ` (${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%)` : ''}
          {' vs '}{formatIsoDate(comparison.snapshot)}
        </p>
      ) : null}
    </div>
  );
}
