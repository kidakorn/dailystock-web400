'use client';
import { usePathname } from 'next/navigation';
import { activeItem } from '@/lib/nav';
import styles from './shell.module.css';

export function StatusBar() {
  const item = activeItem(usePathname());
  return (
    <footer className={styles.status}>
      <span className={styles.statusBrand}>IT WEB400</span>
      <span>{item.label}</span>
      <ul className={styles.statusItems}>
        <li>Mobile</li>
        <li>Reliable</li>
        <li>Efficient</li>
      </ul>
    </footer>
  );
}
