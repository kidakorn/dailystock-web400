'use client';
import { RuntimeErrorPanel } from '@/components/ui/runtime-error-panel';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <RuntimeErrorPanel reset={reset} />;
}
