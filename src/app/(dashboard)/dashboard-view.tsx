'use client';

import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useSearchRecord } from '@/lib/use-search-record';
import type { ProcessSeqEntry, StockLine } from '@/types/domain';
import { StatusDonut } from '@/components/charts/donut-chart';
import { TrendLineChart } from '@/components/charts/line-chart';
import { StockBarChart } from '@/components/charts/bar-chart';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { HeaderPortal } from '@/components/layout/header-portal';
import { GetDataButton } from '@/components/ui/get-data-button';
import { KpiCard } from '@/components/ui/kpi-card';
import ui from '@/components/ui/ui.module.css';
import { opts, uniq } from '@/lib/filters';
import { formatNumber } from '@/lib/format';
import { formatIsoDate } from '@/lib/format';
import { param, pick } from '@/lib/query';
import { buildAnalyticalDashboard } from '@/lib/summary/analytical-dashboard';
import { listSnapshots, listStockSnapshots, resolveSnapshot } from '@/lib/summary/packages';
import { useLiveStockLines } from '@/lib/data/live-data';
import { useProcessSeq } from '@/lib/use-process-seq';
import styles from './dashboard.module.css';

export function DashboardView({
  lines: initialLines,
  seq,
}: {
  lines: StockLine[];
  seq: ProcessSeqEntry[];
}) {
  const lines = useLiveStockLines(initialLines);
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
  const [selectedProcessCode, setSelectedProcessCode] = useState<number | null>(null);
  const selectedProcess = data.processes.find(
    (process) => process.processCode === selectedProcessCode,
  );
  const statusFor = (name: string) =>
    data.status.find((item) => item.label === name) ?? { label: name, value: 0, tone: 'warning' as const };
  const newStatus = statusFor('New');
  const cancelledStatus = statusFor('Cancelled');
  const trend = data.trend.map((item) => ({ ...item, name: formatIsoDate(item.name) }));

  return (
    <div className={styles.dashboardPage}>
      <HeaderPortal>
        <GetDataButton dataset="lines" />
      </HeaderPortal>
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
        <KpiCard
          label="Stock"
          value={data.stock}
          tone="success"
          comparison={data.comparison ? { value: data.comparison.stock, snapshot: data.comparison.snapshot } : undefined}
        />
        <KpiCard
          label="Actual"
          value={data.actual}
          tone="primary"
          comparison={data.comparison ? { value: data.comparison.actual, snapshot: data.comparison.snapshot } : undefined}
        />
        <KpiCard label="New packages" value={newStatus.value} tone={newStatus.tone} />
        <KpiCard label="Cancelled" value={cancelledStatus.value} tone={cancelledStatus.tone} />
      </section>
      <div className={styles.grid}>
        <Card
          title={selectedProcess ? `${selectedProcess.name} subprocesses` : 'Stock and actual by process'}
          className={styles.processCard}
        >
          <div className={styles.processContent}>
            {selectedProcess ? (
              <div className={styles.processDrillHeader}>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnInfo}`}
                  onClick={() => setSelectedProcessCode(null)}
                >
                  <ArrowLeft size={16} aria-hidden="true" /> All processes
                </button>
                <p>
                  Stock {formatNumber(selectedProcess.stock)} · Actual{' '}
                  {formatNumber(selectedProcess.actual)}
                </p>
              </div>
            ) : null}
            {selectedProcess && selectedProcess.subProcesses.length === 0 ? (
              <p className={styles.processEmpty}>No subprocess data for this snapshot.</p>
            ) : (
              <StockBarChart
                data={selectedProcess ? selectedProcess.subProcesses : data.processes}
                onSelectProcess={
                  selectedProcess
                    ? undefined
                    : (name) => {
                        const process = data.processes.find((item) => item.name === name);
                        if (process) setSelectedProcessCode(process.processCode);
                      }
                }
              />
            )}
            {!selectedProcess && data.unmappedProcesses.length > 0 ? (
              <p className={styles.processNote}>
                Not in Process Master:{' '}
                {data.unmappedProcesses
                  .map((process) => `${process.name} (${process.processCode})`)
                  .join(', ')}
              </p>
            ) : null}
          </div>
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
