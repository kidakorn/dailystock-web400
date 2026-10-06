import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { getProcessSeq } from '@/lib/data/repository';
import { ProcessMasterView } from './process-master-view';

export const metadata: Metadata = { title: 'Process Master' };

export default async function ProcessMasterPage() {
  const entries = await getProcessSeq();
  return (
    <Suspense fallback={<PageLoading />}>
      <ProcessMasterView defaultEntries={entries} />
    </Suspense>
  );
}
