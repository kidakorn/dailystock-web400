import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { getPackageGroups, getProcessSeq, getStockLines } from '@/lib/data/repository';
import { DailyStockView } from './daily-stock-view';

export const metadata: Metadata = { title: 'Daily Stock Balance' };

// Runs once, at build time. The query string (filters, tab, sort, page) is read in the browser by the view,
// which keeps this page statically exportable. Suspense is required around anything that calls useSearchParams.
export default async function DailyStockBalancePage() {
  const [lines, seq, groups] = await Promise.all([
    getStockLines(),
    getProcessSeq(),
    getPackageGroups(),
  ]);
  return (
    <Suspense fallback={<PageLoading />}>
      <DailyStockView lines={lines} seq={seq} groups={groups} />
    </Suspense>
  );
}
