import { toneOf } from '@/lib/status';
import styles from './ui.module.css';

export const Badge = ({ status }: { status: string }) => (
  <span className={styles.badge} data-tone={toneOf(status)}>
    {status}
  </span>
);
