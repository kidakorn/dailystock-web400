import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { getProcessSeq, getStockLines } from '@/lib/data/repository';
import { DashboardView } from './dashboard-view';

export const metadata: Metadata = { title: 'Dashboard' };

// Runs once, at build time. The query string (filters, tab, sort, page) is read in the browser by the view,
// which keeps this page statically exportable. Suspense is required around anything that calls useSearchParams.
export default async function DashboardPage() {
  const [lines, seq] = await Promise.all([getStockLines(), getProcessSeq()]);
  return (
    <Suspense fallback={<PageLoading />}>
      <DashboardView lines={lines} seq={seq} />
    </Suspense>
  );
}
