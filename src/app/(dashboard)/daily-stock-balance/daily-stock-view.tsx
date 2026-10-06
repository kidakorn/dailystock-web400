'use client';

import { useSearchRecord } from '@/lib/use-search-record';
import type { PackageGroups, ProcessSeqEntry, StockLine } from '@/types/domain';
import { DailyStockTable } from '@/components/stock/daily-stock-table';
import { ExportCsvButton } from '@/components/stock/export-csv-button';
import { HeaderPortal } from '@/components/layout/header-portal';
import { FilterBar } from '@/components/ui/filter-bar';
import ui from '@/components/ui/ui.module.css';
import { opts, uniq } from '@/lib/filters';
import { formatIsoDate } from '@/lib/format';
import { param, pick } from '@/lib/query';
import { buildDailyStock } from '@/lib/summary/daily-stock';
import {
  OTHER_GROUP,
  groupOf,
  listActiveSnapshots,
  listActiveStockSnapshots,
  listSnapshots,
  resolveSnapshot,
} from '@/lib/summary/packages';
import { useProcessSeq } from '@/lib/use-process-seq';

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
  const activeSeq = useProcessSeq(seq);

  const snapshots = listSnapshots(lines);
  const activeSnapshots = listActiveSnapshots(lines);
  const latest = activeSnapshots.at(-1) ?? snapshots.at(-1) ?? '';
  const snapshot = resolveSnapshot(snapshots, param(sp, 'date'), latest);
  const stockDates = listActiveStockSnapshots(lines);
  const groupNames = [...Object.keys(groups), OTHER_GROUP];
  const group = pick(param(sp, 'group'), groupNames, '');
  // The package list follows the chosen group, so it can never offer a package the group filter would hide.
  const packageNames = uniq(
    lines.filter((l) => l.snapshot === snapshot).map((l) => l.packageName),
  ).filter((n) => !group || groupOf(n, groups) === group);
  const packageName = pick(param(sp, 'package'), packageNames, '');
  const hideEmpty = param(sp, 'rows') === 'active';

  const result = buildDailyStock(lines, activeSeq, groups, {
    snapshot,
    group: group || undefined,
    packageName: packageName || undefined,
    hideEmpty,
  });
  return (
    <section className={ui.dailyStockPage}>
      <FilterBar
        fields={[
          {
            name: 'date',
            label: 'Date',
            type: 'date',
            default: latest,
            availableDates: snapshots,
            stockDates,
          },
          { name: 'group', label: 'Group', type: 'select', options: opts(groupNames) },
          { name: 'package', label: 'Package name', type: 'select', options: opts(packageNames) },
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
      <HeaderPortal>
        <div className={ui.dailyStockHeaderActions} data-daily-stock-actions>
          <ExportCsvButton rows={result.rows} filename={`daily-stock-${snapshot}.csv`} />
        </div>
      </HeaderPortal>
      <DailyStockTable
        result={result}
        searchParams={sp}
        summary={{
          processLines: result.rows.length,
          packages: result.packageCount,
          date: formatIsoDate(snapshot),
        }}
      />
    </section>
  );
}
