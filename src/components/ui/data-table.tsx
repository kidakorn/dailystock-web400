'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import {
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type ReactTable,
  type Row,
  type RowData,
} from '@tanstack/react-table';
import ui from './ui.module.css';

export const dataTableFeatures = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

export type DataTableColumn<TData extends RowData> = ColumnDef<typeof dataTableFeatures, TData>;
export type DataTableRow<TData extends RowData> = Row<typeof dataTableFeatures, TData>;
export type DataTableInstance<TData extends RowData> = ReactTable<typeof dataTableFeatures, TData>;

export function DataTable<TData extends RowData>({
  data,
  columns,
  ariaLabel,
  className,
  viewportClassName,
  tableClassName,
  columnClassName,
  getRowId,
  paginationState,
  onPaginationChange,
  manualPagination = false,
  rowCount,
  initialPageSize = 20,
  autoPageSize = false,
  autoResetPageIndex,
  renderCell,
  renderBody,
  renderFooter,
  renderToolbar,
  renderPagination,
}: {
  data: TData[];
  columns: DataTableColumn<TData>[];
  ariaLabel: string;
  className?: string;
  viewportClassName?: string;
  tableClassName?: string;
  columnClassName?: Readonly<Record<string, string | undefined>>;
  getRowId?: (row: TData, index: number) => string;
  paginationState?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  manualPagination?: boolean;
  rowCount?: number;
  initialPageSize?: number;
  autoPageSize?: boolean;
  autoResetPageIndex?: boolean;
  renderCell?: (row: DataTableRow<TData>, columnId: string, value: unknown) => ReactNode;
  renderBody?: (table: DataTableInstance<TData>) => ReactNode;
  renderFooter?: (table: DataTableInstance<TData>) => ReactNode;
  renderToolbar?: (table: DataTableInstance<TData>) => ReactNode;
  renderPagination?: (table: DataTableInstance<TData>) => ReactNode;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId,
    manualPagination,
    autoResetPageIndex,
    rowCount,
    initialState: { pagination: { pageIndex: 0, pageSize: initialPageSize } },
    state: paginationState ? { pagination: paginationState } : undefined,
    ...(onPaginationChange ? { onPaginationChange } : {}),
  });
  const tableRef = useRef(table);
  tableRef.current = table;

  useLayoutEffect(() => {
    if (autoResetPageIndex !== false) return;
    const pageCount = table.getPageCount();
    const pageIndex = table.state.pagination.pageIndex;
    if (pageCount > 0 && pageIndex >= pageCount) {
      table.setPageIndex(pageCount - 1);
    }
  }, [autoResetPageIndex, data, table]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!autoPageSize || !viewport || typeof ResizeObserver === 'undefined') return;

    const updatePageSize = () => {
      const headerHeight = viewport.querySelector('thead')?.getBoundingClientRect().height ?? 0;
      const rowHeights = [...viewport.querySelectorAll('tbody tr')].map(
        (row) => row.getBoundingClientRect().height,
      );
      const rowHeight = Math.max(16, ...rowHeights);
      const pageSize = Math.max(1, Math.floor((viewport.clientHeight - headerHeight) / rowHeight));
      if (tableRef.current.state.pagination.pageSize !== pageSize) {
        tableRef.current.setPageSize(pageSize);
      }
    };

    const observer = new ResizeObserver(updatePageSize);
    observer.observe(viewport);
    updatePageSize();
    return () => observer.disconnect();
  }, [autoPageSize]);

  return (
    <div className={`${ui.dataTable} ${className ?? ''}`.trim()}>
      {renderToolbar?.(table)}
      <div ref={viewportRef} className={`${ui.dataTableViewport} ${viewportClassName ?? ''}`.trim()}>
        <table className={`${ui.table} ${tableClassName ?? ''}`.trim()} aria-label={ariaLabel}>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className={columnClassName?.[header.column.id]}>
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          {renderBody ? (
            <tbody>{renderBody(table)}</tbody>
          ) : (
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <td key={cell.id} className={columnClassName?.[cell.column.id]}>
                      {renderCell
                        ? renderCell(row, cell.column.id, cell.getValue())
                        : <table.FlexRender cell={cell} />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
          {renderFooter ? <tfoot>{renderFooter(table)}</tfoot> : null}
        </table>
      </div>
      {renderPagination?.(table)}
    </div>
  );
}