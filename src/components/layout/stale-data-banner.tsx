'use client';

import { useLoadFailures } from '@/lib/data/live-data';
import styles from './stale-data-banner.module.css';

export function StaleDataBanner({ asOf }: { asOf: string }) {
  const failures = Object.values(useLoadFailures()).filter(Boolean);
  if (failures.length === 0) return null;
  return (
    <p role="status" className={styles.banner}>
      Live data unavailable ({failures[0]}). Showing built-in data as of {asOf}.
    </p>
  );
}
