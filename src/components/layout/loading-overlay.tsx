'use client';
import { ConveyorLoader } from '@/components/ui/conveyor-loader';
import { useIsLoading } from '@/lib/loading-store';
import styles from './loading-overlay.module.css';

export function LoadingOverlay() {
  const loading = useIsLoading();
  if (!loading) return null;
  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <ConveyorLoader />
    </div>
  );
}
