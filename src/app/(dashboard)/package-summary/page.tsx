import type { Metadata } from 'next';
import Link from 'next/link';
import { PackageCard } from '@/components/packages/package-card';
import styles from '@/components/packages/packages.module.css';
import { FilterBar } from '@/components/ui/filter-bar';
import { KpiCard } from '@/components/ui/kpi-card';
import ui from '@/components/ui/ui.module.css';
import { getPackages } from '@/lib/data/repository';
import { PAGE_SIZE, opts, queryPackages, uniq } from '@/lib/filters';
import { param, hrefWith, type SearchParams } from '@/lib/query';
import type { PackageStatus } from '@/types/domain';

export const metadata: Metadata = { title: 'Package Summary' };
const PATH = '/package-summary';
const TABS = ['All', 'Active', 'Pending', 'Cancelled'] as const;

export default async function PackageSummaryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const view = param(sp, 'view') === 'list' ? 'list' : 'grid';
  const tab = TABS.find((t) => t === param(sp, 'tab')) ?? 'All';
  const items = await getPackages();
  const { base, rows } = queryPackages(items, {
    plant: param(sp, 'plant'),
    process: param(sp, 'process'),
    tab,
    q: param(sp, 'q'),
    sort: param(sp, 'sort') || 'code',
  });

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // Clamp: a filter can shrink the page count below the page in the URL.
  const page = Math.min(Math.max(1, Number(param(sp, 'page')) || 1), pages);
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const count = (s: PackageStatus) => base.filter((p) => p.status === s).length;

  return (
    <>
      <FilterBar
        fields={[
          {
            name: 'plant',
            label: 'Plant',
            type: 'select',
            options: opts(uniq(items.map((p) => p.plant))),
          },
          {
            name: 'process',
            label: 'Process',
            type: 'select',
            options: opts(uniq(items.map((p) => p.process))),
          },
          { name: 'q', label: 'Search', type: 'search' },
          {
            name: 'sort',
            label: 'Sort',
            type: 'select',
            default: 'code',
            options: [
              { value: 'code', label: 'Code' },
              { value: 'progress', label: 'Progress' },
              { value: 'qty', label: 'Quantity' },
            ],
          },
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
        <KpiCard label="Total packages" value={base.length} tone="primary" />
        <KpiCard label="Active" value={count('Active')} tone="success" />
        <KpiCard label="Cancelled" value={count('Cancelled')} tone="danger" />
        <KpiCard label="Pending" value={count('Pending')} tone="warning" />
      </section>
      <nav className={styles.tabs} aria-label="Status">
        {TABS.map((t) => (
          <Link
            key={t}
            href={hrefWith(PATH, sp, { tab: t === 'All' ? null : t, page: null })}
            className={ui.btn}
            aria-current={tab === t ? 'page' : undefined}
          >
            {t} ({t === 'All' ? base.length : count(t)})
          </Link>
        ))}
      </nav>
      {slice.length ? (
        <div className={styles.grid} data-view={view}>
          {slice.map((p) => (
            <PackageCard key={p.code} item={p} />
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
