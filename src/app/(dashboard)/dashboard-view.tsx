'use client';

import { useSearchRecord } from '@/lib/use-search-record';
import type { ProcessSeqEntry, StockLine } from '@/types/domain';
import { StatusDonut } from '@/components/charts/donut-chart';
import { TrendLineChart } from '@/components/charts/line-chart';
import { StockBarChart } from '@/components/charts/bar-chart';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { KpiCard } from '@/components/ui/kpi-card';
import ui from '@/components/ui/ui.module.css';
import { opts, uniq } from '@/lib/filters';
import { formatNumber } from '@/lib/format';
import { formatIsoDate } from '@/lib/format';
import { param, pick } from '@/lib/query';
import { buildAnalyticalDashboard } from '@/lib/summary/analytical-dashboard';
import { listSnapshots, listStockSnapshots, resolveSnapshot } from '@/lib/summary/packages';
import { useProcessSeq } from '@/lib/use-process-seq';
import styles from './dashboard.module.css';

export function DashboardView({
  lines,
  seq,
}: {
  lines: StockLine[];
  seq: ProcessSeqEntry[];
}) {
  const sp = useSearchRecord();
  const activeSequence = useProcessSeq(seq);
  const snapshots = listSnapshots(lines);
  const latest = snapshots[snapshots.length - 1] ?? '';
  const snapshot = resolveSnapshot(snapshots, param(sp, 'date'), latest);
  const stockDates = listStockSnapshots(lines);
  const packageNames = uniq(
    lines.filter((line) => line.snapshot === snapshot).map((line) => line.packageName),
  );
  const packageName = pick(param(sp, 'package'), packageNames, '');
  const data = buildAnalyticalDashboard(lines, activeSequence, snapshot, packageName);
  const statusCount = (name: string) => data.status.find((item) => item.label === name)?.value ?? 0;
  const trend = data.trend.map((item) => ({ ...item, name: formatIsoDate(item.name) }));

  return (
    <div className={styles.dashboardPage}>
      <FilterBar
        fields={[
          {
            name: 'date',
            label: 'Snapshot',
            type: 'date',
            default: latest,
            availableDates: snapshots,
            stockDates,
          },
          { name: 'package', label: 'Package name', type: 'select', options: opts(packageNames) },
        ]}
      />
      <section className={ui.kpiGrid} data-cols="5" aria-label="Key figures">
        <KpiCard label="Packages" value={data.packageCount} tone="primary" />
        <KpiCard label="Stock" value={data.stock} tone="success" />
        <KpiCard label="Actual" value={data.actual} tone="primary" />
        <KpiCard label="New packages" value={statusCount('New')} tone="warning" />
        <KpiCard label="Cancelled" value={statusCount('Cancelled')} tone="danger" />
      </section>
      <div className={styles.grid}>
        <Card title="Stock and actual by process" className={styles.processCard}>
          <StockBarChart data={data.processes} />
        </Card>
        <Card title="Package status" className={styles.statusCard}>
          <div className={styles.statusBreakdown}>
            <StatusDonut data={data.status} />
            <ul className={`${styles.legend} ${styles.legendCol}`}>
              {data.status.map((s) => (
                <li key={s.label}>
                  <span className={styles.dot} style={{ background: `var(--color-${s.tone})` }} />
                  {s.label} <strong>{formatNumber(s.value)}</strong>
                </li>
              ))}
            </ul>
          </div>
        </Card>
        <Card title="Stock and actual by snapshot" className={styles.trendCard}>
          <TrendLineChart data={trend} />
        </Card>
      </div>
    </div>
  );
}
