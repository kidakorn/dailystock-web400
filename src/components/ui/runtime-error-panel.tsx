'use client';

import { House, RotateCw } from 'lucide-react';
import Link from 'next/link';
import ui from './ui.module.css';

export function RuntimeErrorPanel({ reset }: { reset: () => void }) {
  return (
    <section className={ui.errorPanel} role="alert">
      <h1 className={ui.errorTitle}>Something went wrong</h1>
      <p>The page could not be loaded. Please try again or return to the dashboard.</p>
      <div className={ui.errorActions}>
        <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={reset}>
          <RotateCw size={15} aria-hidden="true" /> Try again
        </button>
        <Link className={ui.btn} href="/">
          <House size={15} aria-hidden="true" /> Back to dashboard
        </Link>
      </div>
    </section>
  );
}