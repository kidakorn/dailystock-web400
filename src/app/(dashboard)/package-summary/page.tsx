import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { getPackageGroups, getStockLines } from '@/lib/data/repository';
import { PackageSummaryView } from './package-summary-view';

export const metadata: Metadata = { title: 'Package Summary' };

// Runs once, at build time. The query string (filters, tab, sort, page) is read in the browser by the view,
// which keeps this page statically exportable. Suspense is required around anything that calls useSearchParams.
export default async function PackageSummaryPage() {
  const [lines, groups] = await Promise.all([getStockLines(), getPackageGroups()]);
  return (
    <Suspense fallback={<PageLoading />}>
      <PackageSummaryView lines={lines} groups={groups} />
    </Suspense>
  );
}
