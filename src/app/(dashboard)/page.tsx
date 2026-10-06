import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { getDashboard } from '@/lib/data/repository';
import { DashboardView } from './dashboard-view';

export const metadata: Metadata = { title: 'Dashboard' };

// Runs once, at build time. The query string (filters, tab, sort, page) is read in the browser by the view,
// which keeps this page statically exportable. Suspense is required around anything that calls useSearchParams.
export default async function DashboardPage() {
  const d = await getDashboard();
  return (
    <Suspense fallback={<PageLoading />}>
      <DashboardView d={d} />
    </Suspense>
  );
}
