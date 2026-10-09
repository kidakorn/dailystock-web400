import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { getGroupPackageMaster } from '@/lib/data/repository';
import { GroupPackageMasterView } from './group-package-master-view';

export const metadata: Metadata = { title: 'Group Package Master' };

export default async function GroupPackageMasterPage() {
  const entries = await getGroupPackageMaster();
  return (
    <Suspense fallback={<PageLoading />}>
      <GroupPackageMasterView defaultEntries={entries} />
    </Suspense>
  );
}
