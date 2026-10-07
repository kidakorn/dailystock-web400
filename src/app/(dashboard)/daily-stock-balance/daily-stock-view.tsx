'use client';

import { useEffect } from 'react';
import { useSearchRecord } from '@/lib/use-search-record';
import type { PackageGroups, PackagePairs, ProcessSeqEntry, StockLine } from '@/types/domain';
import { DailyStockTable } from '@/components/stock/daily-stock-table';
import { ExportCsvButton } from '@/components/stock/export-csv-button';
import { HeaderPortal } from '@/components/layout/header-portal';
import { FilterBar } from '@/components/ui/filter-bar';
import ui from '@/components/ui/ui.module.css';
import { opts, uniq } from '@/lib/filters';
import { formatIsoDate } from '@/lib/format';
import { param, pick } from '@/lib/query';
import { useQueryParams } from '@/lib/use-query-params';
import { buildDailyStock } from '@/lib/summary/daily-stock';
import {
  OTHER_GROUP,
  groupOf,
  listActiveSnapshots,
  listActiveStockSnapshots,
  listSnapshots,
  moreSeverePackageKind,
  packageKindOf,
  resolvePackageStatusFilter,
  resolveSnapshot,
  type PackageKind,
} from '@/lib/summary/packages';
import { useProcessSeq } from '@/lib/use-process-seq';

export function DailyStockView({
  lines,
  seq,
  groups,
  packagePairs = {},
}: {
  lines: StockLine[];
  seq: ProcessSeqEntry[];
  groups: PackageGroups;
  packagePairs?: PackagePairs;
}) {
  const sp = useSearchRecord();
  const { set } = useQueryParams();
  const activeSeq = useProcessSeq(seq);

  const snapshots = listSnapshots(lines);
  const activeSnapshots = listActiveSnapshots(lines);
  const latest = activeSnapshots.at(-1) ?? snapshots.at(-1) ?? '';
  const snapshot = resolveSnapshot(snapshots, param(sp, 'date'), latest);
  const stockDates = listActiveStockSnapshots(lines);
  const groupNames = [...Object.keys(groups), OTHER_GROUP];
  const group = pick(param(sp, 'group'), groupNames, '');
  const scopedLines = lines.filter(
    (line) =>
      line.snapshot === snapshot && (!group || groupOf(line.packageName, groups) === group),
  );
  const packageKinds = new Map<string, PackageKind>();
  for (const line of scopedLines) {
    const kind = packageKindOf(line.packageKind);
    const current = packageKinds.get(line.packageName);
    packageKinds.set(line.packageName, current ? moreSeverePackageKind(current, kind) : kind);
  }
  const statusParam = param(sp, 'status');
  const packageStatus = resolvePackageStatusFilter(
    statusParam,
    [...new Set(packageKinds.values())],
    Boolean(param(sp, 'package')),
  );
  useEffect(() => {
    if (statusParam !== packageStatus) set({ status: packageStatus });
  }, [packageStatus, set, statusParam]);

  const statusLines =
    packageStatus === 'all'
      ? scopedLines
      : scopedLines.filter((line) => packageKinds.get(line.packageName) === packageStatus);
  const packageNames = uniq(statusLines.map((line) => line.packageName));
  const packageName = pick(param(sp, 'package'), packageNames, '');
  const rowsParam = param(sp, 'rows');
  const rowsMode = rowsParam === 'all' ? 'all' : 'active';
  useEffect(() => {
    if (rowsParam !== rowsMode) set({ rows: rowsMode });
  }, [rowsMode, rowsParam, set]);
  const hideEmpty = rowsMode === 'active';

  const result = buildDailyStock(statusLines, activeSeq, groups, {
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
            name: 'status',
            label: 'Package status',
            type: 'select',
            default: packageStatus,
            options: [
              { value: 'normal', label: 'Normal' },
              { value: 'new', label: 'New' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'all', label: 'All' },
            ],
          },
          {
            name: 'rows',
            label: 'Packages',
            type: 'select',
            default: rowsMode,
            options: [
              { value: 'active', label: 'Active packages' },
              { value: 'all', label: 'All packages' },
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
        packageKinds={packageKinds}
        packagePairs={packagePairs}
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
