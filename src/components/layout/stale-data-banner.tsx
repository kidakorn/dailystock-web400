'use client';

import { useLoadFailures } from '@/lib/data/live-data';
import styles from './stale-data-banner.module.css';

export function StaleDataBanner({ asOf }: { asOf: string }) {
  const failures = Object.values(useLoadFailures()).filter(Boolean);
  if (failures.length === 0) return null;
  return (
    <p role="status" className={styles.banner}>
      ข้อมูลสดไม่พร้อมใช้งาน ({failures[0]}) กำลังแสดงข้อมูลที่มาพร้อมระบบ ณ {asOf}
    </p>
  );
}
