import { Sparkline } from '@/components/charts/sparkline';
import { formatNumber, trendText } from '@/lib/format';
import styles from './ui.module.css';

interface Props {
  label: string;
  value: number;
  tone: 'primary' | 'success' | 'danger' | 'warning';
  spark?: readonly number[];
}

export function KpiCard({ label, value, tone, spark }: Props) {
  return (
    <div className={`${styles.card} ${styles.kpi}`} data-tone={tone}>
      <p className={styles.kpiLabel}>{label}</p>
      <div className={styles.kpiRow}>
        <p className={styles.kpiValue}>{formatNumber(value)}</p>
        {spark ? <Sparkline values={spark} tone={tone} /> : null}
      </div>
      {spark ? <p className={styles.kpiTrend}>{trendText(spark)}</p> : null}
    </div>
  );
}
