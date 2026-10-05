'use client';
import ui from '@/components/ui/ui.module.css';
import { toCsv } from '@/lib/csv';
import type { DailyStockRow } from '@/lib/summary/daily-stock';

const COLUMNS = [
  'processCode',
  'processName',
  'subProcessCode',
  'subProcessName',
  'balance',
  'balDay',
  'stock',
  'actual',
  'pending',
  'difference',
] as const;

export function ExportCsvButton({ rows, filename }: { rows: DailyStockRow[]; filename: string }) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([toCsv(rows, COLUMNS)], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: filename }).click();
    URL.revokeObjectURL(url);
  };
  return (
    <button type="button" className={ui.btn} onClick={download} disabled={rows.length === 0}>
      Export CSV
    </button>
  );
}
