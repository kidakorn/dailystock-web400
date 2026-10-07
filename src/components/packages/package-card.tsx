import { Sparkline } from '@/components/charts/sparkline';
import { formatNumber } from '@/lib/format';
import type { PackageSummary } from '@/lib/summary/packages';
import ui from '@/components/ui/ui.module.css';
import styles from './packages.module.css';

const PACKAGE_STATUS: Record<PackageSummary['kind'], string> = {
  normal: 'Normal',
  new: 'New',
  cancelled: 'Cancelled',
};

function changeText(pct: number | null, previousLabel: string | null): string {
  if (pct === null || previousLabel === null) return 'No comparison';
  const value = Math.abs(pct) < 0.005 ? 0 : pct; // avoids showing "-0.00%"
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}% vs ${previousLabel}`;
}

export function PackageCard({
  item,
  previousLabel,
}: {
  item: PackageSummary;
  previousLabel: string | null;
}) {
  return (
    <article className={styles.pkg} data-kind={item.kind}>
      <header className={styles.head}>
        <div>
          <h3 className={styles.name}>{item.name}</h3>
          <p className={styles.code}>Code {item.code}</p>
        </div>
        <div className={styles.badges}>
          <span className={styles.group}>{item.group}</span>
          <span className={ui.packageStatus} data-kind={item.kind}>
            <span className={ui.packageStatusMark} aria-hidden="true" />
            {PACKAGE_STATUS[item.kind]}
          </span>
        </div>
      </header>
      <div>
        <p className={styles.label}>Total stock</p>
        <p className={styles.value}>{formatNumber(item.stock)}</p>
        <p className={styles.procs}>
          {item.processesWithStock} of {item.processCount} processes with stock
        </p>
      </div>
      <p className={styles.foot}>
        <span className={styles.change}>{changeText(item.changePct, previousLabel)}</span>
        <Sparkline values={item.trend} tone={item.kind === 'cancelled' ? 'danger' : 'primary'} />
      </p>
    </article>
  );
}
