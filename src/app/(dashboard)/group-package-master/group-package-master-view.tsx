'use client';

import { RotateCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { HeaderPortal } from '@/components/layout/header-portal';
import { FilterBar } from '@/components/ui/filter-bar';
import { KpiCard } from '@/components/ui/kpi-card';
import { DataTable, dataTableFeatures, type DataTableColumn } from '@/components/ui/data-table';
import ui from '@/components/ui/ui.module.css';
import { mgpgstSchema } from '@/lib/data/schemas';
import { param } from '@/lib/query';
import { useSearchRecord } from '@/lib/use-search-record';
import type { GroupPackageEntry } from '@/types/domain';
import styles from './group-package-master.module.css';

const MASTER_URL = '/data/mgpgst.json';

const columnHelper = createColumnHelper<typeof dataTableFeatures, GroupPackageEntry>();
const MASTER_COLUMNS: DataTableColumn<GroupPackageEntry>[] = columnHelper.columns([
  columnHelper.display({ id: 'groupCode', header: 'Group code' }),
  columnHelper.display({ id: 'groupName', header: 'Group name' }),
  columnHelper.display({ id: 'packageCode', header: 'Package code' }),
  columnHelper.display({ id: 'statusDivision', header: 'Status division' }),
  columnHelper.display({ id: 'createdAt', header: 'Created at' }),
  columnHelper.display({ id: 'createdBy', header: 'Created by' }),
  columnHelper.display({ id: 'createdFunction', header: 'Created function' }),
  columnHelper.display({ id: 'updatedAt', header: 'Updated at' }),
  columnHelper.display({ id: 'updatedBy', header: 'Updated by' }),
  columnHelper.display({ id: 'updatedFunction', header: 'Updated function' }),
  columnHelper.display({ id: 'updateIdent', header: 'Update ident' }),
]);

// AS400 dates are YYMMDD and times HHMMSS; the 2-digit year is assumed to be 20xx.
function formatStamp(date: number, time: number) {
  if (!date) return '—';
  const d = String(date).padStart(6, '0');
  const t = String(time).padStart(6, '0');
  return `${d.slice(4, 6)}/${d.slice(2, 4)}/20${d.slice(0, 2)} ${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}`;
}

const orDash = (value: string | null) => value || '—';

// KBGPGS: null = Running; codes not listed here render as the raw value.
type StatusTone = 'success' | 'info' | 'danger';
const RUNNING: { label: string; tone: StatusTone } = { label: 'Running', tone: 'success' };
const STATUS_DIVISION: Partial<Record<number, { label: string; tone: StatusTone }>> = {
  1: { label: 'New', tone: 'info' },
  2: { label: 'Cancelled', tone: 'danger' },
};

type StatusKey = 'running' | 'new' | 'cancelled' | 'other';
function statusKeyOf(kbgpgs: number | null): StatusKey {
  if (kbgpgs === null) return 'running';
  if (kbgpgs === 1) return 'new';
  if (kbgpgs === 2) return 'cancelled';
  return 'other';
}
const STATUS_OPTIONS = [
  { value: 'running', label: 'Running' },
  { value: 'new', label: 'New' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function GroupPackageMasterView({ defaultEntries }: { defaultEntries: GroupPackageEntry[] }) {
  const searchParams = useSearchRecord();
  const query = param(searchParams, 'q').trim().toLowerCase();
  const statusFilter = param(searchParams, 'status');
  const groupFilter = param(searchParams, 'group');
  const [entries, setEntries] = useState(defaultEntries);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const tableRows = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (!query || `${entry.CDGPGS} ${entry.NMGPGS} ${entry.CDPAKG}`.toLowerCase().includes(query)) &&
          (!statusFilter || statusKeyOf(entry.KBGPGS) === statusFilter) &&
          (!groupFilter || String(entry.CDGPGS) === groupFilter),
      ),
    [entries, query, statusFilter, groupFilter],
  );
  const groupOptions = useMemo(() => {
    const names = new Map(entries.map((entry) => [entry.CDGPGS, entry.NMGPGS]));
    return [...names]
      .sort(([a], [b]) => a - b)
      .map(([code, name]) => ({ value: String(code), label: `${code} · ${name}` }));
  }, [entries]);
  const kpi = useMemo(
    () => ({
      running: tableRows.filter((entry) => statusKeyOf(entry.KBGPGS) === 'running').length,
      new: tableRows.filter((entry) => statusKeyOf(entry.KBGPGS) === 'new').length,
      cancelled: tableRows.filter((entry) => statusKeyOf(entry.KBGPGS) === 'cancelled').length,
      updated: tableRows.filter((entry) => entry.UPDATE_IDENT !== 0).length,
    }),
    [tableRows],
  );

  async function refresh() {
    setIsRefreshing(true);
    try {
      const response = await fetch(MASTER_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Refresh failed (${response.status})`);
      setEntries(mgpgstSchema.parse(await response.json()));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to refresh group package master');
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <section className={styles.page}>
      <FilterBar
        fields={[
          { name: 'q', label: 'Group or package', type: 'search' },
          { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
          { name: 'group', label: 'Group', type: 'select', options: groupOptions },
        ]}
        showRefresh={false}
      />
      <HeaderPortal>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary}`}
            onClick={() => void refresh()}
            disabled={isRefreshing}
          >
            <RotateCw size={16} aria-hidden="true" /> {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </HeaderPortal>
      <div className={`${ui.kpiGrid} ${styles.summary}`} data-cols="4">
        <KpiCard label="Running" value={kpi.running} tone="success" />
        <KpiCard label="New" value={kpi.new} tone="primary" />
        <KpiCard label="Cancelled" value={kpi.cancelled} tone="danger" />
        <KpiCard label="Updated records" value={kpi.updated} tone="warning" />
      </div>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <DataTable
        data={tableRows}
        columns={MASTER_COLUMNS}
        ariaLabel="Group package master"
        viewportClassName={styles.tableWrap}
        tableClassName={styles.masterTable}
        columnClassName={{ groupCode: ui.num, packageCode: ui.num, updateIdent: ui.num }}
        getRowId={(entry) => `${entry.CDGPGS}|${entry.CDPAKG}`}
        initialPageSize={8}
        autoPageSize
        autoResetPageIndex={false}
        renderCell={(tableRow, columnId) => {
          const entry = tableRow.original;
          if (columnId === 'groupCode') return <span className={styles.code}>{entry.CDGPGS}</span>;
          if (columnId === 'groupName') return <strong className={styles.groupName}>{entry.NMGPGS || '—'}</strong>;
          if (columnId === 'packageCode') return <span className={styles.code}>{entry.CDPAKG}</span>;
          if (columnId === 'statusDivision') {
            const status = entry.KBGPGS === null ? RUNNING : STATUS_DIVISION[entry.KBGPGS];
            return status ? (
              <span className={styles.statusChip} data-tone={status.tone}>
                {status.label}
              </span>
            ) : (
              String(entry.KBGPGS)
            );
          }
          if (columnId === 'createdAt') return formatStamp(entry.D6DATC, entry.TMTIMC);
          if (columnId === 'createdBy') return orDash(entry.CNJNMC);
          if (columnId === 'createdFunction') return orDash(entry.CNFUNC);
          if (columnId === 'updatedAt') return formatStamp(entry.D6DATU, entry.TMTIMU);
          if (columnId === 'updatedBy') return orDash(entry.CNJNMU);
          if (columnId === 'updatedFunction') return orDash(entry.CNFUNU);
          if (columnId === 'updateIdent') return entry.UPDATE_IDENT;
          return null;
        }}
        renderPagination={(table) => {
          const pageCount = Math.max(1, table.getPageCount());
          const page = table.state.pagination.pageIndex + 1;
          return (
            <nav className={`${ui.pager} ${styles.pagination}`} aria-label="Pagination">
              <span className={`${ui.pagerInfo} ${styles.pageInfo}`}>
                Page {page} of {pageCount} · {table.getRowCount()} entries
              </span>
              <button
                type="button"
                className={ui.btn}
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </button>
              {table.getPageOptions().map((pageIndex) => (
                <button
                  key={pageIndex}
                  type="button"
                  className={ui.btn}
                  aria-current={pageIndex + 1 === page ? 'page' : undefined}
                  onClick={() => table.setPageIndex(pageIndex)}
                >
                  {pageIndex + 1}
                </button>
              ))}
              <button
                type="button"
                className={ui.btn}
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </button>
            </nav>
          );
        }}
      />
    </section>
  );
}
