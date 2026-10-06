'use client';

import { useSearchRecord } from '@/lib/use-search-record';
import type { PackageGroups, StockLine } from '@/types/domain';
import Link from 'next/link';
import { PackageCard } from '@/components/packages/package-card';
import styles from '@/components/packages/packages.module.css';
import { FilterBar } from '@/components/ui/filter-bar';
import { KpiCard } from '@/components/ui/kpi-card';
import ui from '@/components/ui/ui.module.css';
import { PAGE_SIZE, opts, uniq } from '@/lib/filters';
import { formatIsoDate } from '@/lib/format';
import { hrefWith, param, pick } from '@/lib/query';
import {
  OTHER_GROUP,
  filterPackageTab,
  filterSummaries,
  listSnapshots,
  sortSummaries,
  summarizePackages,
  listStockSnapshots,
  resolveSnapshot,
  type PackageKind,
  type SortKey,
} from '@/lib/summary/packages';

const PATH = '/package-summary';
const TABS = [
  { value: 'active', label: 'Normal + New' },
  { value: 'new', label: 'New' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
] as const;
const SORTS: { value: SortKey; label: string }[] = [
  { value: 'stock', label: 'Total stock' },
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Code' },
  { value: 'processes', label: 'Processes with stock' },
];

export function PackageSummaryView({
  lines,
  groups,
}: {
  lines: StockLine[];
  groups: PackageGroups;
}) {
  const sp = useSearchRecord();

  const snapshots = listSnapshots(lines);
  const latest = snapshots[snapshots.length - 1] ?? '';
  const snapshot = resolveSnapshot(snapshots, param(sp, 'date'), latest);
  const stockDates = listStockSnapshots(lines);
  const previous = snapshots[snapshots.indexOf(snapshot) - 1];
  const previousLabel = previous ? formatIsoDate(previous) : null;

  const groupNames = [...Object.keys(groups), OTHER_GROUP];
  const group = pick(param(sp, 'group'), groupNames, '');
  const tab = pick(
    param(sp, 'tab'),
    TABS.map((t) => t.value),
    'active',
  );
  const sort = pick(
    param(sp, 'sort'),
    SORTS.map((s) => s.value),
    'stock',
  );
  const view = param(sp, 'view') === 'list' ? 'list' : 'grid';

  // Group narrows the whole page (KPIs and tab counts); status tab and search narrow only the list.
  const base = filterSummaries(summarizePackages(lines, groups, snapshot), {
    group: group || undefined,
  });
  const packageNames = uniq(base.map((item) => item.name));
  const packageName = pick(param(sp, 'q'), packageNames, '');
  const count = (kind: PackageKind) => base.filter((p) => p.kind === kind).length;
  const selectedPackages = packageName ? base.filter((item) => item.name === packageName) : base;
  const rows = sortSummaries(filterPackageTab(selectedPackages, tab), sort);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(param(sp, 'page')) || 1), pages); // clamp: a filter can shrink the page count
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
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
          { name: 'q', label: 'Package name', type: 'select', options: opts(packageNames) },
          { name: 'sort', label: 'Sort', type: 'select', default: 'stock', options: SORTS },
          {
            name: 'view',
            label: 'View',
            type: 'select',
            default: 'grid',
            options: [
              { value: 'grid', label: 'Grid' },
              { value: 'list', label: 'List' },
            ],
          },
        ]}
      />
      <section className={ui.kpiGrid} data-cols="4" aria-label="Key figures">
        <KpiCard label="Packages" value={base.length} tone="primary" />
        <KpiCard label="Total stock" value={base.reduce((t, p) => t + p.stock, 0)} tone="success" />
        <KpiCard label="New" value={count('new')} tone="warning" />
        <KpiCard label="Cancelled" value={count('cancelled')} tone="danger" />
      </section>
      <nav className={styles.tabs} aria-label="Status">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={hrefWith(PATH, sp, { tab: t.value === 'all' ? null : t.value, page: null })}
            className={ui.btn}
            aria-current={tab === t.value ? 'page' : undefined}
          >
            {t.label} (
            {t.value === 'all'
              ? base.length
              : t.value === 'active'
                ? count('normal') + count('new')
                : count(t.value)}
            )
          </Link>
        ))}
      </nav>
      {slice.length ? (
        <div className={styles.grid} data-view={view}>
          {slice.map((p) => (
            <PackageCard key={p.code} item={p} previousLabel={previousLabel} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No packages match the current filter.</p>
      )}
      <nav className={styles.pager} aria-label="Pagination">
        <span className={styles.pagerInfo}>
          Showing {slice.length} of {rows.length}
        </span>
        <Link
          href={hrefWith(PATH, sp, { page: String(page - 1) })}
          className={`${ui.btn} ${page === 1 ? ui.disabled : ''}`}
          aria-disabled={page === 1}
        >
          Previous
        </Link>
        {Array.from({ length: pages }, (_, i) => (
          <Link
            key={i}
            href={hrefWith(PATH, sp, { page: String(i + 1) })}
            className={ui.btn}
            aria-current={i + 1 === page ? 'page' : undefined}
          >
            {i + 1}
          </Link>
        ))}
        <Link
          href={hrefWith(PATH, sp, { page: String(page + 1) })}
          className={`${ui.btn} ${page === pages ? ui.disabled : ''}`}
          aria-disabled={page === pages}
        >
          Next
        </Link>
      </nav>
    </>
  );
}
