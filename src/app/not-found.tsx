import { House } from 'lucide-react';
import Link from 'next/link';
import ui from '@/components/ui/ui.module.css';

export default function NotFound() {
  return (
    <main className={ui.errorPage}>
      <section className={ui.errorPanel}>
        <p className={ui.errorCode}>404</p>
        <h1 className={ui.errorTitle}>Page not found</h1>
        <p>The page you requested does not exist or may have moved.</p>
        <div className={ui.errorActions}>
          <Link className={`${ui.btn} ${ui.btnPrimary}`} href="/">
            <House size={15} aria-hidden="true" /> Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}