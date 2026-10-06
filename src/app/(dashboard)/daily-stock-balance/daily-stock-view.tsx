'use client';

import { useSearchRecord } from '@/lib/use-search-record';
import type { PackageGroups, ProcessSeqEntry, StockLine } from '@/types/domain';
import { DailyStockTable } from '@/components/stock/daily-stock-table';
import { ExportCsvButton } from '@/components/stock/export-csv-button';
import { FilterBar } from '@/components/ui/filter-bar';
import { KpiCard } from '@/components/ui/kpi-card';
import ui from '@/components/ui/ui.module.css';
import { opts, uniq } from '@/lib/filters';
import { formatIsoDate } from '@/lib/format';
import { param, pick } from '@/lib/query';
import { buildDailyStock } from '@/lib/summary/daily-stock';
import { OTHER_GROUP, groupOf, listSnapshots } from '@/lib/summary/packages';

export function DailyStockView({
  lines,
  seq,
  groups,
}: {
  lines: StockLine[];
  seq: ProcessSeqEntry[];
  groups: PackageGroups;
}) {
  const sp = useSearchRecord();

  const snapshots = listSnapshots(lines);
  const latest = snapshots[snapshots.length - 1] ?? '';
  const snapshot = pick(param(sp, 'date'), snapshots, latest);
  const groupNames = [...Object.keys(groups), OTHER_GROUP];
  const group = pick(param(sp, 'group'), groupNames, '');
  // The package list follows the chosen group, so it can never offer a package the group filter would hide.
  const packageNames = uniq(
    lines.filter((l) => l.snapshot === snapshot).map((l) => l.packageName),
  ).filter((n) => !group || groupOf(n, groups) === group);
  const packageName = pick(param(sp, 'package'), packageNames, '');
  const hideEmpty = param(sp, 'rows') === 'active';

  const result = buildDailyStock(lines, seq, groups, {
    snapshot,
    group: group || undefined,
    packageName: packageName || undefined,
    hideEmpty,
  });
  const { totals } = result;

  return (
    <>
      <FilterBar
        fields={[
          {
            name: 'date',
            label: 'Date',
            type: 'select',
            default: latest,
            options: [...snapshots].reverse().map((s) => ({ value: s, label: formatIsoDate(s) })),
          },
          { name: 'group', label: 'Group', type: 'select', options: opts(groupNames) },
          { name: 'package', label: 'Package', type: 'select', options: opts(packageNames) },
          {
            name: 'rows',
            label: 'Lines',
            type: 'select',
            default: 'all',
            options: [
              { value: 'all', label: 'All lines' },
              { value: 'active', label: 'Hide empty lines' },
            ],
          },
        ]}
      />
      <section className={ui.kpiGrid} data-cols="4" aria-label="Key figures">
        <KpiCard label="Stock" value={totals.stock} tone="primary" />
        <KpiCard label="Actual" value={totals.actual} tone="success" />
        <KpiCard label="Pending" value={totals.pending} tone="warning" />
        <KpiCard label="Difference" value={totals.difference} tone="danger" />
      </section>
      <div className={ui.toolbar}>
        <p className={ui.muted}>
          {result.rows.length} process lines, {result.packageCount} packages,{' '}
          {formatIsoDate(snapshot)}
        </p>
        <ExportCsvButton rows={result.rows} filename={`daily-stock-${snapshot}.csv`} />
      </div>
      <DailyStockTable result={result} />
    </>
  );
}
