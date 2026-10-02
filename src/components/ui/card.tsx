import type { ReactNode } from 'react';
import styles from './ui.module.css';

export function Card({
  title,
  className = '',
  children,
}: {
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${styles.card} ${className}`}>
      {title ? <h2 className={styles.cardTitle}>{title}</h2> : null}
      {children}
    </section>
  );
}
