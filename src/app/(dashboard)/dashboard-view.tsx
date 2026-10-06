'use client';

import { useSearchRecord } from '@/lib/use-search-record';
import type { DashboardData } from '@/types/domain';
import { DonutDatum, StatusDonut } from '@/components/charts/donut-chart';
import { TrendLineChart } from '@/components/charts/line-chart';
import { StockBarChart } from '@/components/charts/bar-chart';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { KpiCard } from '@/components/ui/kpi-card';
import ui from '@/components/ui/ui.module.css';
import { opts } from '@/lib/filters';
import { formatNumber } from '@/lib/format';
import { param } from '@/lib/query';
import styles from './dashboard.module.css';

export function DashboardView({ d }: { d: DashboardData }) {
  const sp = useSearchRecord();
  const process = param(sp, 'process');

  // Only Process narrows the chart: dashboard.json is an aggregate with no plant dimension.
  const bars = d.processes.labels
    .map((name, i) => ({
      name,
      plan: d.processes.plan[i] ?? 0,
      actual: d.processes.actual[i] ?? 0,
    }))
    .filter((b) => !process || b.name === process);
  const trend = d.trend.labels.map((name, i) => ({
    name,
    plan: d.trend.plan[i] ?? 0,
    actual: d.trend.actual[i] ?? 0,
  }));
  const total = d.status.reduce((t, s) => t + s.value, 0);
  // KPIs derive from the status list so headline numbers can never disagree with the donut.
  const by = (label: string) => d.status.find((s) => s.label === label)?.value ?? 0;
  const spark = (key: string) => d.spark[key] ?? [];
  const donut: DonutDatum[] = d.status;

  return (
    <>
      <FilterBar
        fields={[
          { name: 'process', label: 'Process', type: 'select', options: opts(d.processes.labels) },
          { name: 'date', label: 'Date', type: 'date' },
        ]}
      />
      <section className={ui.kpiGrid} data-cols="5" aria-label="Key figures">
        <KpiCard label="Total packages" value={total} tone="primary" spark={spark('total')} />
        <KpiCard
          label="Active packages"
          value={by('Active')}
          tone="success"
          spark={spark('active')}
        />
        <KpiCard
          label="Cancelled"
          value={by('Cancelled')}
          tone="danger"
          spark={spark('cancelled')}
        />
        <KpiCard label="Pending" value={by('Pending')} tone="warning" spark={spark('pending')} />
        <KpiCard
          label="Exceptions"
          value={d.exceptions}
          tone="danger"
          spark={spark('exceptions')}
        />
      </section>
      <div className={styles.grid}>
        <Card title="Stock balance by process" className={styles.wide}>
          <StockBarChart data={bars} target={d.processes.target} />
        </Card>
        <Card title="Package status">
          <StatusDonut data={donut} />
          <ul className={`${styles.legend} ${styles.legendCol}`}>
            {d.status.map((s) => (
              <li key={s.label}>
                <span className={styles.dot} style={{ background: `var(--color-${s.tone})` }} />
                {s.label} <strong>{formatNumber(s.value)}</strong>{' '}
                <span className={ui.muted}>({((s.value / total) * 100).toFixed(1)}%)</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Stock trend, last 7 days" className={styles.wide}>
          <TrendLineChart data={trend} />
        </Card>
        <Card title="Top 5 alerts">
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Package</th>
                  <th>Message</th>
                  <th>Level</th>
                </tr>
              </thead>
              <tbody>
                {d.alerts.map((a) => (
                  <tr key={`${a.time}-${a.package}`}>
                    <td>{a.time}</td>
                    <td>{a.package}</td>
                    <td>{a.message}</td>
                    <td>
                      <Badge status={a.level} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="System status">
          <ul className={styles.sys}>
            {d.systems.map((s) => (
              <li key={s.name}>
                <span>{s.name}</span>
                <Badge status={s.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
