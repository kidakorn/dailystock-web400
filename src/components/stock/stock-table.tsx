'use client';
import { Fragment, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import ui from '@/components/ui/ui.module.css';
import { formatNumber, pct } from '@/lib/format';
import type { GroupBy, StockGroupView } from '@/lib/filters';

export function StockTable({ groups, groupBy }: { groups: StockGroupView[]; groupBy: GroupBy }) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const allCollapsed = groups.length > 0 && groups.every((g) => collapsed.has(g.key));
  const other = groupBy === 'package' ? 'process' : 'package';
  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div>
      <div className={ui.toolbar}>
        <button
          type="button"
          className={ui.btn}
          onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(groups.map((g) => g.key)))}
        >
          {allCollapsed ? 'Expand all' : 'Collapse all'}
        </button>
      </div>
      <div className={`${ui.card} ${ui.tableWrap}`}>
        <table className={ui.table} aria-label="Daily stock balance">
          <thead>
            <tr>
              <th>Group / product</th>
              <th className={ui.num}>Plan</th>
              <th className={ui.num}>Actual</th>
              <th className={ui.num}>Progress</th>
              <th className={ui.num}>In</th>
              <th className={ui.num}>Out</th>
              <th>Status</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={8} className={ui.muted}>
                  No rows match the current filters.
                </td>
              </tr>
            ) : (
              groups.map((g) => {
                const open = !collapsed.has(g.key);
                return (
                  <Fragment key={g.key}>
                    <tr className={ui.grp}>
                      <td>
                        <button
                          type="button"
                          className={ui.toggleBtn}
                          onClick={() => toggle(g.key)}
                          aria-expanded={open}
                          aria-label={`Toggle ${g.key}`}
                        >
                          {open ? '-' : '+'}
                        </button>{' '}
                        {g.key}
                      </td>
                      <td className={ui.num}>{formatNumber(g.plan)}</td>
                      <td className={ui.num}>{formatNumber(g.actual)}</td>
                      <td className={ui.num}>{pct(g.actual, g.plan)}%</td>
                      <td className={ui.num}>{formatNumber(g.in)}</td>
                      <td className={ui.num}>{formatNumber(g.out)}</td>
                      <td />
                      <td />
                    </tr>
                    {open
                      ? g.rows.map((r) => (
                          <tr key={`${r.package}-${r.product}`}>
                            <td className={ui.indent}>
                              {r.product} <span className={ui.muted}>{r[other]}</span>
                            </td>
                            <td className={ui.num}>{formatNumber(r.plan)}</td>
                            <td className={ui.num}>{formatNumber(r.actual)}</td>
                            <td className={ui.num}>{pct(r.actual, r.plan)}%</td>
                            <td className={ui.num}>{formatNumber(r.in)}</td>
                            <td className={ui.num}>{formatNumber(r.out)}</td>
                            <td>
                              <Badge status={r.status} />
                            </td>
                            <td>{r.remark}</td>
                          </tr>
                        ))
                      : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
