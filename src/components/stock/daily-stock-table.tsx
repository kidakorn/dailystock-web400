'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Package, Rows3 } from 'lucide-react';
import { HeaderPortal } from '@/components/layout/header-portal';
import ui from '@/components/ui/ui.module.css';
import { formatDecimal3, formatNumber } from '@/lib/format';
import { differenceOf } from '@/lib/summary/daily-stock';
import type { DailyStockResult, DailyStockRow, Measures } from '@/lib/summary/daily-stock';
import { hrefWith } from '@/lib/query';
import type { SearchParams } from '@/lib/query';

const PACKAGE_PAGE_SIZE = 8;
const PATH = '/daily-stock-balance';

const MEASURE_COLUMNS = [
  ['balance', 'Balance'],
  ['balDay', 'Bal/Day'],
  ['stock', 'Stock'],
  ['actual', 'Actual'],
  ['pending', 'Pending'],
] as const;

function Cells({ values }: { values: DailyStockResult['totals'] }) {
  const toneFor = (key: string, value: number) => {
    if (value === 0) return 'zero';
    if (key === 'pending') return 'warning';
    if (key === 'difference') return value < 0 ? 'danger' : 'success';
    if (key === 'stock' || key === 'actual') return value < 0 ? 'danger' : 'success';
    return value < 0 ? 'danger' : 'info';
  };
  return (
    <>
      {MEASURE_COLUMNS.map(([key]) => (
        <td
          key={key}
          className={`${ui.num} ${ui.measureCell}`}
          data-measure={key}
          data-tone={toneFor(key, values[key])}
        >
          {formatNumber(values[key])}
        </td>
      ))}
      <td
        className={`${ui.num} ${ui.measureCell}`}
        data-measure="difference"
        data-tone={toneFor('difference', values.difference)}
      >
        {formatDecimal3(values.difference)}
      </td>
    </>
  );
}

type ProcessGroup = {
  key: string;
  rows: DailyStockRow[];
  totals: DailyStockResult['totals'];
};

function groupRows(rows: DailyStockRow[]): ProcessGroup[] {
  const groups = new Map<string, DailyStockRow[]>();
  for (const row of rows) {
    const key = String(row.processCode);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups].map(([key, groupedRows]) => {
    const totals: Measures = { balance: 0, balDay: 0, stock: 0, actual: 0, pending: 0 };
    for (const row of groupedRows) {
      totals.balance += row.balance;
      totals.balDay += row.balDay;
      totals.stock += row.stock;
      totals.actual += row.actual;
      totals.pending += row.pending;
    }
    return { key, rows: groupedRows, totals: { ...totals, difference: differenceOf(totals) } };
  });
}

function Row({ row }: { row: DailyStockRow }) {
  return (
    <tr key={row.key}>
      <td>
        {row.processName}
        {row.seq === null ? (
          <span className={ui.muted} title="This process is not in the PROCESS_SEQ list">
            {' '}
            (no sequence)
          </span>
        ) : null}
      </td>
      <td>{row.subProcessName}</td>
      <Cells values={row} />
    </tr>
  );
}

export function DailyStockTable({
  result,
  searchParams = {},
  summary = { processLines: 0, packages: 0, date: '' },
}: {
  result: DailyStockResult;
  searchParams?: SearchParams;
  summary?: { processLines: number; packages: number; date: string };
}) {
  const { rows, totals } = result;
  const packageView = Boolean(result.packages?.length);
  const groups = packageView
    ? (result.packages ?? []).map((item) => ({
        key: item.key,
        label: item.name,
        rows: item.result.rows,
        totals: item.result.totals,
      }))
    : groupRows(rows).map((group) => ({
        ...group,
        label: group.rows[0]?.processName ?? group.key,
      }));
  const pages = packageView ? Math.max(1, Math.ceil(groups.length / PACKAGE_PAGE_SIZE)) : 1;
  const page = Math.min(Math.max(1, Number(searchParams.page) || 1), pages);
  const visibleGroups = packageView
    ? groups.slice((page - 1) * PACKAGE_PAGE_SIZE, page * PACKAGE_PAGE_SIZE)
    : groups;
  const hasGroups = packageView ? groups.length > 0 : rows.length > 0;
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const expandableGroups = packageView
    ? visibleGroups
    : visibleGroups.filter((group) => group.rows.length > 1);
  const allCollapsed =
    expandableGroups.length > 0 && expandableGroups.every((g) => collapsed.has(g.key));
  const toggle = (key: string) =>
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className={ui.dailyStockPanel}>
      <HeaderPortal>
        <div className={ui.dailyStockHeaderInfo} data-daily-stock-info>
          <div className={ui.dailyStockHeaderStats} aria-label="Daily stock summary">
            <span>
              <Rows3 size={15} aria-hidden="true" />
              {summary.processLines} process lines
            </span>
            <span>
              <Package size={15} aria-hidden="true" />
              {summary.packages} packages
            </span>
            <span>
              <CalendarDays size={15} aria-hidden="true" />
              {summary.date}
            </span>
          </div>
          {packageView || expandableGroups.length > 0 ? (
            <div className={ui.dailyStockHeaderGroup}>
              {packageView ? (
                <span className={ui.muted}>
                  Showing {visibleGroups.length} of {groups.length} packages
                </span>
              ) : null}
              {expandableGroups.length > 0 ? (
                <button
                  type="button"
                  className={ui.btn}
                  onClick={() =>
                    setCollapsed(
                      allCollapsed ? new Set() : new Set(expandableGroups.map((group) => group.key)),
                    )
                  }
                >
                  {allCollapsed ? 'Expand all' : 'Collapse all'}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </HeaderPortal>
      <div className={ui.measureLegend} aria-label="Table color legend">
        <span>
          <i data-tone="info" /> Balance / Bal per day
        </span>
        <span>
          <i data-tone="success" /> Stock / Actual / positive difference
        </span>
        <span>
          <i data-tone="warning" /> Pending
        </span>
        <span>
          <i data-tone="danger" /> Negative values
        </span>
        <span>
          <i data-tone="zero" /> Zero
        </span>
      </div>
      <div className={`${ui.card} ${ui.dailyStockTableWrap}`}>
        <table className={ui.table} aria-label="Daily stock balance by process">
          <thead>
            <tr>
              <th className={ui.processColumn}>Process name</th>
              <th className={ui.subProcessColumn}>Sub-process name</th>
              {MEASURE_COLUMNS.map(([key, label]) => (
                <th key={key} className={ui.num}>
                  {label}
                </th>
              ))}
              <th className={ui.num} title="(Actual - Bal/Day) / 1000">
                Difference
              </th>
            </tr>
          </thead>
          <tbody>
            {!hasGroups ? (
              <tr>
                <td colSpan={8} className={ui.muted}>
                  No process lines match the current filters.
                </td>
              </tr>
            ) : (
              visibleGroups.map((group) => {
                const first = group.rows[0];
                if (!first && !packageView) return null;
                if (!packageView && group.rows.length === 1 && first) {
                  return <Row key={first.key} row={first} />;
                }
                const open = !collapsed.has(group.key);
                return (
                  <Fragment key={group.key}>
                    <tr className={ui.grp}>
                      <td>
                        <button
                          type="button"
                          className={ui.toggleBtn}
                          onClick={() => toggle(group.key)}
                          aria-expanded={open}
                          aria-label={`Toggle ${group.key}`}
                        >
                          {open ? '-' : '+'}
                        </button>{' '}
                        {group.label}
                      </td>
                      <td colSpan={7} />
                    </tr>
                    {open ? group.rows.map((row) => <Row key={row.key} row={row} />) : null}
                    <tr className={ui.packageTotal}>
                      <td colSpan={2}>Total {group.label}</td>
                      <Cells values={group.totals} />
                    </tr>
                  </Fragment>
                );
              })
            )}
          </tbody>
          {rows.length > 0 && !packageView ? (
            <tfoot>
              <tr>
                <td colSpan={2}>Total</td>
                <Cells values={totals} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
      {packageView && pages > 1 ? (
        <nav className={`${ui.pager} ${ui.dailyStockPager}`} aria-label="Pagination">
          <span className={ui.pagerInfo}>
            Page {page} of {pages}
          </span>
          <Link
            href={hrefWith(PATH, searchParams, { page: String(page - 1) })}
            className={`${ui.btn} ${page === 1 ? ui.disabled : ''}`}
            aria-disabled={page === 1}
          >
            Previous
          </Link>
          {Array.from({ length: pages }, (_, index) => (
            <Link
              key={index + 1}
              href={hrefWith(PATH, searchParams, { page: String(index + 1) })}
              className={ui.btn}
              aria-current={index + 1 === page ? 'page' : undefined}
            >
              {index + 1}
            </Link>
          ))}
          <Link
            href={hrefWith(PATH, searchParams, { page: String(page + 1) })}
            className={`${ui.btn} ${page === pages ? ui.disabled : ''}`}
            aria-disabled={page === pages}
          >
            Next
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
