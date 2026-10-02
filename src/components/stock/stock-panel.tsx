'use client';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import ui from '@/components/ui/ui.module.css';
import { toCsv } from '@/lib/csv';
import { STOCK_STATUSES, type FlatStockRow, type GroupBy } from '@/lib/filters';
import { useQueryParams } from '@/lib/use-query-params';
import styles from './stock.module.css';

interface Props {
  rows: FlatStockRow[];
  groupBy: GroupBy;
  statuses: readonly string[];
  attention: boolean;
  remark: boolean;
  children: ReactNode;
}

export function StockPanel({ rows, groupBy, statuses, attention, remark, children }: Props) {
  const { set } = useQueryParams();

  const toggleStatus = (status: string, on: boolean) => {
    const next = on ? [...statuses, status] : statuses.filter((s) => s !== status);
    // "All selected" is the default, so it is stored as no param at all and URLs stay short.
    set({ status: next.length === STOCK_STATUSES.length ? null : next.join(',') });
  };
  const exportCsv = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          toCsv(rows, [
            'package',
            'process',
            'product',
            'plant',
            'plan',
            'actual',
            'in',
            'out',
            'status',
            'remark',
          ]),
        ],
        { type: 'text/csv' },
      ),
    );
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: 'daily-stock-balance.csv',
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card title="Options" className={styles.panel}>
      <fieldset>
        <legend>Group by</legend>
        {(['package', 'process'] as const).map((g) => (
          <label key={g}>
            <input
              type="radio"
              name="group"
              checked={groupBy === g}
              onChange={() => set({ group: g === 'package' ? null : g })}
            />
            {g === 'package' ? 'Package' : 'Process'}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Status</legend>
        {STOCK_STATUSES.map((s) => (
          <label key={s}>
            <input
              type="checkbox"
              checked={statuses.includes(s)}
              onChange={(e) => toggleStatus(s, e.target.checked)}
            />
            {s}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Quick filter</legend>
        <label>
          <input
            type="checkbox"
            checked={attention}
            onChange={(e) => set({ attention: e.target.checked ? '1' : null })}
          />
          Progress below 95%
        </label>
        <label>
          <input
            type="checkbox"
            checked={remark}
            onChange={(e) => set({ remark: e.target.checked ? '1' : null })}
          />
          Has remark
        </label>
      </fieldset>
      <div className={styles.actions}>
        <button type="button" className={ui.btn} onClick={exportCsv}>
          Export CSV
        </button>
      </div>
      {children}
    </Card>
  );
}
