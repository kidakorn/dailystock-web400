import type { Metadata } from 'next';
import Link from 'next/link';
import { PackageCard } from '@/components/packages/package-card';
import styles from '@/components/packages/packages.module.css';
import { FilterBar } from '@/components/ui/filter-bar';
import { KpiCard } from '@/components/ui/kpi-card';
import ui from '@/components/ui/ui.module.css';
import { getPackageGroups, getStockLines } from '@/lib/data/repository';
import { PAGE_SIZE, opts } from '@/lib/filters';
import { formatIsoDate } from '@/lib/format';
import { hrefWith, param, pick, type SearchParams } from '@/lib/query';
import {
  OTHER_GROUP,
  filterSummaries,
  listSnapshots,
  sortSummaries,
  summarizePackages,
  type PackageKind,
  type SortKey,
} from '@/lib/summary/packages';

export const metadata: Metadata = { title: 'Package Summary' };
const PATH = '/package-summary';
const TABS = [
  { value: 'all', label: 'All' },
  { value: 'normal', label: 'Normal' },
  { value: 'new', label: 'New' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;
const SORTS: { value: SortKey; label: string }[] = [
  { value: 'stock', label: 'Total stock' },
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Code' },
  { value: 'processes', label: 'Processes with stock' },
];

export default async function PackageSummaryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const [lines, groups] = await Promise.all([getStockLines(), getPackageGroups()]);

  const snapshots = listSnapshots(lines);
  const latest = snapshots[snapshots.length - 1] ?? '';
  const snapshot = pick(param(sp, 'date'), snapshots, latest);
  const previous = snapshots[snapshots.indexOf(snapshot) - 1];
  const previousLabel = previous ? formatIsoDate(previous) : null;

  const groupNames = [...Object.keys(groups), OTHER_GROUP];
  const group = pick(param(sp, 'group'), groupNames, '');
  const tab = pick(
    param(sp, 'tab'),
    TABS.map((t) => t.value),
    'all',
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
  const count = (kind: PackageKind) => base.filter((p) => p.kind === kind).length;
  const kind = tab === 'all' ? undefined : tab;
  const rows = sortSummaries(filterSummaries(base, { kind, query: param(sp, 'q') }), sort);

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
            type: 'select',
            default: latest,
            options: [...snapshots].reverse().map((s) => ({ value: s, label: formatIsoDate(s) })),
          },
          { name: 'group', label: 'Group', type: 'select', options: opts(groupNames) },
          { name: 'q', label: 'Search', type: 'search' },
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
            {t.label} ({t.value === 'all' ? base.length : count(t.value)})
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
