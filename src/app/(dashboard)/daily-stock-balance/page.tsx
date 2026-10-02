import type { Metadata } from 'next';
import { StockPanel } from '@/components/stock/stock-panel';
import styles from '@/components/stock/stock.module.css';
import { StockTable } from '@/components/stock/stock-table';
import { FilterBar } from '@/components/ui/filter-bar';
import { KpiCard } from '@/components/ui/kpi-card';
import ui from '@/components/ui/ui.module.css';
import { getStock } from '@/lib/data/repository';
import { STOCK_STATUSES, filterStock, flattenStock, groupStock, opts, uniq } from '@/lib/filters';
import { formatNumber, pct } from '@/lib/format';
import { param, type SearchParams } from '@/lib/query';

export const metadata: Metadata = { title: 'Daily Stock Balance' };

export default async function DailyStockBalancePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const all = flattenStock(await getStock());
  const groupBy = param(sp, 'group') === 'process' ? 'process' : 'package';
  // An absent status param means "all"; unknown values are dropped so a hand-edited URL cannot break the filter.
  const statuses = param(sp, 'status')
    ? param(sp, 'status')
        .split(',')
        .filter((s) => (STOCK_STATUSES as readonly string[]).includes(s))
    : [...STOCK_STATUSES];
  const rows = filterStock(all, {
    plant: param(sp, 'plant'),
    process: param(sp, 'process'),
    package: param(sp, 'package'),
    statuses,
    attention: param(sp, 'attention') === '1',
    remark: param(sp, 'remark') === '1',
  });
  const groups = groupStock(rows, groupBy);
  const sum = (k: 'plan' | 'actual') => rows.reduce((t, r) => t + r[k], 0);
  const critical = rows.filter((r) => r.status === 'Critical').length;

  return (
    <>
      <FilterBar
        fields={[
          {
            name: 'plant',
            label: 'Plant',
            type: 'select',
            options: opts(uniq(all.map((r) => r.plant))),
          },
          {
            name: 'process',
            label: 'Process',
            type: 'select',
            options: opts(uniq(all.map((r) => r.process))),
          },
          {
            name: 'package',
            label: 'Package',
            type: 'select',
            options: opts(uniq(all.map((r) => r.package))),
          },
          { name: 'date', label: 'Date', type: 'date' },
        ]}
      />
      <section className={ui.kpiGrid} data-cols="3" aria-label="Key figures">
        <KpiCard label="Total stock" value={sum('actual')} tone="primary" />
        <KpiCard label="Plan" value={sum('plan')} tone="success" />
        <KpiCard label="Critical rows" value={critical} tone="danger" />
      </section>
      <div className={styles.layout}>
        {/* key resets the expand/collapse state when the grouping changes, because the old keys no longer exist. */}
        <StockTable key={groupBy} groups={groups} groupBy={groupBy} />
        <StockPanel
          rows={rows}
          groupBy={groupBy}
          statuses={statuses}
          attention={param(sp, 'attention') === '1'}
          remark={param(sp, 'remark') === '1'}
        >
          <h3>Summary</h3>
          <dl className={styles.summary}>
            <dt>Rows</dt>
            <dd>{rows.length}</dd>
            <dt>Plan</dt>
            <dd>{formatNumber(sum('plan'))}</dd>
            <dt>Actual</dt>
            <dd>{formatNumber(sum('actual'))}</dd>
            <dt>Progress</dt>
            <dd>{pct(sum('actual'), sum('plan'))}%</dd>
            <dt>Critical</dt>
            <dd>{critical}</dd>
          </dl>
        </StockPanel>
      </div>
    </>
  );
}
