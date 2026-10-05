import ui from '@/components/ui/ui.module.css';
import { formatDecimal3, formatNumber } from '@/lib/format';
import type { DailyStockResult } from '@/lib/summary/daily-stock';

const MEASURE_COLUMNS = [
  ['balance', 'Balance'],
  ['balDay', 'Bal/Day'],
  ['stock', 'Stock'],
  ['actual', 'Actual'],
  ['pending', 'Pending'],
] as const;

function Cells({ values }: { values: DailyStockResult['totals'] }) {
  return (
    <>
      {MEASURE_COLUMNS.map(([key]) => (
        <td key={key} className={ui.num} data-zero={values[key] === 0}>
          {formatNumber(values[key])}
        </td>
      ))}
      <td className={ui.num} data-zero={values.difference === 0}>
        {formatDecimal3(values.difference)}
      </td>
    </>
  );
}

export function DailyStockTable({ result }: { result: DailyStockResult }) {
  const { rows, totals } = result;
  return (
    <div className={`${ui.card} ${ui.tableWrap}`}>
      <table className={ui.table} aria-label="Daily stock balance by process">
        <thead>
          <tr>
            <th>Process</th>
            <th>Sub process</th>
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
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className={ui.muted}>
                No process lines match the current filters.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.key}>
                <td>
                  {r.processCode} {r.processName}
                  {r.seq === null ? (
                    <span className={ui.muted} title="This process is not in the PROCESS_SEQ list">
                      {' '}
                      (no sequence)
                    </span>
                  ) : null}
                </td>
                <td>{r.subProcessCode ? `${r.subProcessCode} ${r.subProcessName}` : ''}</td>
                <Cells values={r} />
              </tr>
            ))
          )}
        </tbody>
        {rows.length > 0 ? (
          <tfoot>
            <tr>
              <td colSpan={2}>Total</td>
              <Cells values={totals} />
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
