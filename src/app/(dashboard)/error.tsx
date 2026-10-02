'use client';
import ui from '@/components/ui/ui.module.css';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className={ui.card} role="alert">
      <p>Something went wrong while loading this page.</p>
      <p className={ui.muted}>{error.message}</p>
      <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={reset}>
        Try again
      </button>
    </div>
  );
}
