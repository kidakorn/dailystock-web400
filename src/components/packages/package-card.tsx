import { Sparkline } from '@/components/charts/sparkline';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/format';
import type { PackageItem } from '@/types/domain';
import styles from './packages.module.css';

export function PackageCard({ item }: { item: PackageItem }) {
  return (
    <article className={styles.pkg}>
      <header className={styles.head}>
        <strong>{item.code}</strong>
        <Badge status={item.status} />
      </header>
      <p>
        {item.name}{' '}
        <span className={styles.muted}>
          ({item.process}, {item.plant})
        </span>
      </p>
      <p className={styles.nums}>
        <span>Qty {formatNumber(item.qty)}</span>
        <span>Actual {formatNumber(item.actual)}</span>
      </p>
      <div
        className={styles.bar}
        role="progressbar"
        aria-valuenow={item.progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress"
      >
        <span style={{ width: `${item.progress}%` }} />
      </div>
      <p className={styles.foot}>
        <span className={styles.muted}>{item.progress}%</span>
        <Sparkline values={item.spark} tone={item.status === 'Cancelled' ? 'danger' : 'success'} />
      </p>
    </article>
  );
}
