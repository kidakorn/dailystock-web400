'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Minus, Package, Plus, Rows3 } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import { HeaderPortal } from '@/components/layout/header-portal';
import ui from '@/components/ui/ui.module.css';
import { DataTable, dataTableFeatures, type DataTableColumn } from '@/components/ui/data-table';
import { formatDecimal3, formatNumber } from '@/lib/format';
import { differenceOf } from '@/lib/summary/daily-stock';
import type { PackageKind } from '@/lib/summary/packages';
import type { DailyStockResult, DailyStockRow, Measures } from '@/lib/summary/daily-stock';
import type { PackagePairs } from '@/types/domain';
import { hrefWith, param } from '@/lib/query';
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
const PACKAGE_MEASURE_COLUMNS = [...MEASURE_COLUMNS, ['difference', 'Difference']] as const;

 type DailyStockTableGroup = {
  key: string;
  label: string;
  kind?: PackageKind;
  colorIndex?: number;
  pairIndex?: number;
  rows: DailyStockRow[];
  totals: DailyStockResult['totals'];
};

type PairRow = {
  key: string;
  first: DailyStockRow;
  rowsByPackage: ReadonlyMap<string, DailyStockRow>;
};

type PairSection = { key: string; groups: DailyStockTableGroup[] };

const columnHelper = createColumnHelper<typeof dataTableFeatures, DailyStockTableGroup>();
const DAILY_STOCK_COLUMNS: DataTableColumn<DailyStockTableGroup>[] = columnHelper.columns([
  columnHelper.display({ id: 'process', header: 'Process name' }),
  columnHelper.display({ id: 'subProcess', header: 'Sub-process name' }),
  ...MEASURE_COLUMNS.map(([key, label]) => columnHelper.display({ id: key, header: label })),
  columnHelper.display({ id: 'difference', header: 'Difference' }),
]);

const ZERO_MEASURES: DailyStockResult['totals'] = {
  balance: 0,
  balDay: 0,
  stock: 0,
  actual: 0,
  pending: 0,
  difference: 0,
};

function orderPackageGroups(
  groups: DailyStockTableGroup[],
  packagePairs: PackagePairs,
): DailyStockTableGroup[] {
  const groupsByName = new Map(groups.map((group) => [group.key, group]));
  const ordered: DailyStockTableGroup[] = [];
  const seen = new Set<string>();
  let pairIndex = 0;

  for (const packageRows of Object.values(packagePairs)) {
    for (const packageRow of packageRows) {
      const currentPairIndex = pairIndex++;
      for (const name of packageRow) {
        const group = groupsByName.get(name);
        if (!group) continue;
        ordered.push({ ...group, colorIndex: currentPairIndex % 8, pairIndex: currentPairIndex });
        seen.add(name);
      }
    }
  }

  for (const group of groups) {
    if (seen.has(group.key)) continue;
    const currentPairIndex = pairIndex++;
    ordered.push({ ...group, colorIndex: currentPairIndex % 8, pairIndex: currentPairIndex });
  }
  return ordered;
}

function hasMeasureValue(values: Measures): boolean {
  return MEASURE_COLUMNS.some(([key]) => values[key] !== 0);
}

function packageUnitKey(group: DailyStockTableGroup): string {
  return group.pairIndex === undefined ? `package:${group.key}` : `pair:${group.pairIndex}`;
}

function paginatePackageGroups(groups: DailyStockTableGroup[]): DailyStockTableGroup[][] {
  const pages: DailyStockTableGroup[][] = [];
  let page: DailyStockTableGroup[] = [];
  let index = 0;

  while (index < groups.length) {
    const unitKey = packageUnitKey(groups[index]!);
    let end = index + 1;
    while (end < groups.length && packageUnitKey(groups[end]!) === unitKey) end += 1;
    const unit = groups.slice(index, end);
    if (page.length > 0 && page.length + unit.length > PACKAGE_PAGE_SIZE) {
      pages.push(page);
      page = [];
    }
    page.push(...unit);
    index = end;
  }

  if (page.length > 0) pages.push(page);
  return pages.length > 0 ? pages : [[]];
}

function groupPackageSections(groups: DailyStockTableGroup[]): PairSection[] {
  const sections: PairSection[] = [];
  for (const group of groups) {
    const key = packageUnitKey(group);
    const previous = sections.at(-1);
    if (previous?.key === key) previous.groups.push(group);
    else sections.push({ key, groups: [group] });
  }
  return sections;
}

function comparePairRows(a: PairRow, b: PairRow): number {
  if (a.first.seq !== null && b.first.seq !== null) return a.first.seq - b.first.seq;
  if (a.first.seq !== null) return -1;
  if (b.first.seq !== null) return 1;
  return a.first.processCode - b.first.processCode || a.first.subProcessCode.localeCompare(b.first.subProcessCode);
}

function mergePairRows(groups: DailyStockTableGroup[]): PairRow[] {
  const merged = new Map<string, { first: DailyStockRow; rowsByPackage: Map<string, DailyStockRow> }>();
  for (const group of groups) {
    for (const row of group.rows) {
      const current = merged.get(row.key) ?? { first: row, rowsByPackage: new Map() };
      current.rowsByPackage.set(group.key, row);
      merged.set(row.key, current);
    }
  }
  return [...merged].map(([key, value]) => ({ key, ...value })).sort(comparePairRows);
}

function Cells({
  values,
  packageName,
  packageStart = false,
  total = false,
}: {
  values: DailyStockResult['totals'];
  packageName?: string;
  packageStart?: boolean;
  total?: boolean;
}) {
  const toneFor = (key: string, value: number) => {
    if (value === 0) return 'zero';
    if (key === 'pending') return 'warning';
    if (key === 'difference' || key === 'stock') return value < 0 ? 'danger' : 'success';
    if (key === 'actual') return value < 0 ? 'danger' : 'info';
    return value < 0 ? 'danger' : 'info';
  };
  return (
    <>
      {MEASURE_COLUMNS.map(([key]) => (
        <td
          key={key}
          className={`${ui.num} ${ui.measureCell} ${packageStart && key === 'balance' ? ui.packageMeasureStart : ''}`.trim()}
          data-package={packageName}
          data-total-package={total ? packageName : undefined}
          data-package-start={packageStart && key === 'balance' ? 'true' : undefined}
          data-measure={key}
          data-tone={toneFor(key, values[key])}
          aria-label={key === 'stock' && values[key] < 0 ? `Negative stock: ${formatNumber(values[key])}` : undefined}
        >
          {formatNumber(values[key])}
        </td>
      ))}
      <td
        className={`${ui.num} ${ui.measureCell}`}
        data-package={packageName}
        data-total-package={total ? packageName : undefined}
        data-measure="difference"
        data-tone={toneFor('difference', values.difference)}
        aria-label={values.difference < 0 ? `Negative difference: ${formatDecimal3(values.difference)}` : undefined}
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
    const groupedRows = groups.get(key);
    if (groupedRows) groupedRows.push(row);
    else groups.set(key, [row]);
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

const PACKAGE_STATUS: Record<PackageKind, string> = {
  normal: 'Normal',
  new: 'New',
  cancelled: 'Cancelled',
};

function PackageStatusBadge({ kind }: { kind: PackageKind }) {
  return (
    <span className={ui.packageStatus} data-kind={kind}>
      <span className={ui.packageStatusMark} aria-hidden="true" />
      {PACKAGE_STATUS[kind]}
    </span>
  );
}

function EmptyPackageCells() {
  return (
    <>
      {PACKAGE_MEASURE_COLUMNS.map(([key]) => (
        <td key={key} className={`${ui.num} ${ui.measureCell}`} data-empty-package-slot="true" />
      ))}
    </>
  );
}

function PackageSectionsTable({
  sections,
  collapsed,
  onToggle,
}: {
  sections: PairSection[];
  collapsed: ReadonlySet<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <table className={`${ui.table} ${ui.packageComparisonTable}`} aria-label="Daily stock balance by package pair">
      <thead>
        <tr>
          <th className={ui.processColumn}>Process name</th>
          <th className={ui.subProcessColumn}>Sub-process name</th>
          {[0, 1].flatMap((slot) => PACKAGE_MEASURE_COLUMNS.map(([key, label], measureIndex) => (
            <th
              key={`${slot}-${key}`}
              className={`${ui.packageMeasureColumn} ${slot > 0 && measureIndex === 0 ? ui.packageMeasureStart : ''}`.trim()}
              data-package-measure={key}
              data-package-slot={slot}
            >
              {label}
            </th>
          )))}
        </tr>
      </thead>
      <tbody>
        {sections.map((section, sectionIndex) => (
          <Fragment key={section.key}>
            <tr className={`${ui.grp} ${ui.packagePairNameRow}`} data-pair-section={section.key}>
              <td colSpan={2}>
                <button
                  type="button"
                  className={ui.toggleBtn}
                  onClick={() => onToggle(section.key)}
                  aria-expanded={!collapsed.has(section.key)}
                  aria-label={`Toggle ${section.groups.map((group) => group.label).join(' and ')}`}
                >
                  {collapsed.has(section.key) ? <Plus size={14} aria-hidden="true" /> : <Minus size={14} aria-hidden="true" />}
                </button>
              </td>
              {[0, 1].map((slot) => {
                const group = section.groups[slot];
                return group ? (
                  <td
                    key={group.key}
                    colSpan={PACKAGE_MEASURE_COLUMNS.length}
                    className={`${ui.packageGroupHeader} ${slot > 0 ? ui.packageGroupStart : ''}`.trim()}
                  >
                    <span className={ui.packageTab} data-package-name={group.label} data-palette={group.colorIndex} data-pair-index={group.pairIndex}>
                      {group.label}
                    </span>
                    {group.kind ? <PackageStatusBadge kind={group.kind} /> : null}
                  </td>
                ) : <td key={`empty-${slot}`} colSpan={PACKAGE_MEASURE_COLUMNS.length} data-empty-package-slot="true" aria-hidden="true" />;
              })}
            </tr>
            {!collapsed.has(section.key) ? mergePairRows(section.groups).map((row, rowIndex) => (
              <tr key={row.key} data-row-stripe={rowIndex % 2 === 1 ? 'alternate' : undefined}>
                <td>
                  {row.first.processName}
                  {row.first.seq === null ? <span className={ui.muted} title="This process is not in the PROCESS_SEQ list">{' '}(no sequence)</span> : null}
                </td>
                <td>{row.first.subProcessName}</td>
                {[0, 1].map((slot) => {
                  const group = section.groups[slot];
                  return group
                    ? <Cells key={group.key} values={row.rowsByPackage.get(group.key) ?? ZERO_MEASURES} packageName={group.key} packageStart={slot > 0} />
                    : <EmptyPackageCells key={`empty-${slot}`} />;
                })}
              </tr>
            )) : null}
            <tr className={ui.packageTotal}>
              <td colSpan={2}>Total</td>
              {[0, 1].map((slot) => {
                const group = section.groups[slot];
                return group
                  ? <Cells key={group.key} values={group.totals} packageName={group.key} packageStart={slot > 0} total />
                  : <EmptyPackageCells key={`empty-${slot}`} />;
              })}
            </tr>
            {sectionIndex < sections.length - 1 ? <tr className={ui.packageSeparator} aria-hidden="true"><td colSpan={14} /></tr> : null}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

export function DailyStockTable({
  result,
  packageKinds,
  packagePairs = {},
  searchParams = {},
  summary = { processLines: 0, packages: 0, date: '' },
}: {
  result: DailyStockResult;
  packageKinds?: ReadonlyMap<string, PackageKind>;
  packagePairs?: PackagePairs;
  searchParams?: SearchParams;
  summary?: { processLines: number; packages: number; date: string };
}) {
  const { rows, totals } = result;
  const packageView = result.packages !== undefined;
  const showAllPackages = param(searchParams, 'rows') === 'all';
  const rawGroups: DailyStockTableGroup[] = packageView
    ? (result.packages ?? []).map((item) => ({ key: item.key, label: item.name, kind: packageKinds?.get(item.name), rows: item.result.rows, totals: item.result.totals }))
    : groupRows(rows).map((group) => ({ ...group, label: group.rows[0]?.processName ?? group.key, kind: undefined }));
  const orderedGroups = packageView ? orderPackageGroups(rawGroups, packagePairs) : rawGroups;
  const groupsWithVisibleRows = packageView && !showAllPackages
    ? orderedGroups.map((group) => ({ ...group, rows: group.rows.filter(hasMeasureValue) }))
    : orderedGroups;
  const activePairIndexes = new Set(groupsWithVisibleRows.filter((group) => group.rows.length > 0).map((group) => group.pairIndex));
  const groups = packageView && !showAllPackages
    ? groupsWithVisibleRows.filter((group) => activePairIndexes.has(group.pairIndex))
    : groupsWithVisibleRows;
  const packagePages = packageView ? paginatePackageGroups(groups) : [];
  const pageCount = packageView ? packagePages.length : 1;
  const page = Math.min(Math.max(1, Number(param(searchParams, 'page')) || 1), pageCount);
  const visibleGroups = packageView ? packagePages[page - 1] ?? [] : groups;
  const pairSections = packageView ? groupPackageSections(visibleGroups) : [];
  const hasRows = packageView ? visibleGroups.length > 0 : rows.length > 0;
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const expandableKeys = packageView ? pairSections.map((section) => section.key) : visibleGroups.filter((group) => group.rows.length > 1).map((group) => group.key);
  const allCollapsed = expandableKeys.length > 0 && expandableKeys.every((key) => collapsed.has(key));
  const columnClassName = { process: ui.processColumn, subProcess: ui.subProcessColumn, balance: ui.num, balDay: ui.num, stock: ui.num, actual: ui.num, pending: ui.num, difference: ui.num };
  const toggle = (key: string) => setCollapsed((previous) => {
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
            <span><Rows3 size={15} aria-hidden="true" />{summary.processLines} process lines</span>
            <span><Package size={15} aria-hidden="true" />{summary.packages} packages</span>
            <span><CalendarDays size={15} aria-hidden="true" />{summary.date}</span>
          </div>
          {packageView || expandableKeys.length > 0 ? (
            <div className={ui.dailyStockHeaderGroup}>
              {packageView ? <span className={ui.muted}>{visibleGroups.length}/{groups.length} packages</span> : null}
              {expandableKeys.length > 0 ? (
                <button type="button" className={ui.btn} aria-label={allCollapsed ? 'Expand all' : 'Collapse all'} title={allCollapsed ? 'Expand all' : 'Collapse all'} onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(expandableKeys))}>
                  {allCollapsed ? <Plus size={14} data-collapse-icon aria-hidden="true" /> : <Minus size={14} data-collapse-icon aria-hidden="true" />}
                  <span data-collapse-label>{allCollapsed ? 'Expand all' : 'Collapse all'}</span>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </HeaderPortal>
      <div className={ui.measureLegend} aria-label="Table color legend">
        <span>Balance / Bal per day / Actual / positive Difference</span>
        <span><i data-tone="success" /> Positive Stock</span>
        <span><i data-tone="warning" /> Pending</span>
        <span><i data-tone="danger" /> Negative Stock / Difference</span>
        <span><i data-tone="zero" /> Zero</span>
      </div>
      {packageView ? (
        <>
          <div className={`${ui.dailyStockTableWrap} ${ui.packagePairList}`}>
            {pairSections.length > 0 ? (
              <PackageSectionsTable sections={pairSections} collapsed={collapsed} onToggle={toggle} />
            ) : <div className={ui.muted}>No process lines match the current filters.</div>}
          </div>
          {pageCount > 1 ? (
            <nav className={`${ui.pager} ${ui.dailyStockPager}`} aria-label="Pagination">
              <span className={ui.pagerInfo}>Page {page} of {pageCount}</span>
              <Link href={hrefWith(PATH, searchParams, { page: String(page - 1) })} className={`${ui.btn} ${page === 1 ? ui.disabled : ''}`} aria-disabled={page === 1}>Previous</Link>
              {packagePages.map((_, pageIndex) => <Link key={pageIndex + 1} href={hrefWith(PATH, searchParams, { page: String(pageIndex + 1) })} className={ui.btn} aria-current={pageIndex + 1 === page ? 'page' : undefined}>{pageIndex + 1}</Link>)}
              <Link href={hrefWith(PATH, searchParams, { page: String(page + 1) })} className={`${ui.btn} ${page === pageCount ? ui.disabled : ''}`} aria-disabled={page === pageCount}>Next</Link>
            </nav>
          ) : null}
        </>
      ) : (
        <DataTable
          data={visibleGroups}
          columns={DAILY_STOCK_COLUMNS}
          ariaLabel="Daily stock balance by process"
          viewportClassName={ui.dailyStockTableWrap}
          columnClassName={columnClassName}
          manualPagination
          rowCount={groups.length}
          paginationState={{ pageIndex: page - 1, pageSize: PACKAGE_PAGE_SIZE }}
          initialPageSize={PACKAGE_PAGE_SIZE}
          renderBody={(table) => !hasRows ? <tr><td colSpan={8} className={ui.muted}>No process lines match the current filters.</td></tr> : <>
            {table.getRowModel().rows.map((tableRow) => {
              const group = tableRow.original;
              const first = group.rows[0];
              if (group.rows.length === 1 && first) return <Row key={first.key} row={first} />;
              const open = !collapsed.has(group.key);
              return <Fragment key={tableRow.id}>
                <tr className={ui.grp}><td><button type="button" className={ui.toggleBtn} onClick={() => toggle(group.key)} aria-expanded={open} aria-label={`Toggle ${group.key}`}>{open ? <Minus size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}</button>{' '}{group.label}</td><td colSpan={7} /></tr>
                {open ? group.rows.map((row) => <Row key={row.key} row={row} />) : null}
              </Fragment>;
            })}
          </>}
          renderFooter={() => rows.length > 0 ? <tr><td colSpan={2}>Total</td><Cells values={totals} /></tr> : null}
        />
      )}
    </div>
  );
}
