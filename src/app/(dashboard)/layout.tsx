import type { ReactNode } from 'react';
import { Header } from '@/components/layout/header';
import { LoadingOverlay } from '@/components/layout/loading-overlay';
import { Sidebar } from '@/components/layout/sidebar';
import styles from '@/components/layout/shell.module.css';
// import { StaleDataBanner } from '@/components/layout/stale-data-banner';
import { StatusBar } from '@/components/layout/status-bar';
import { TopTabs } from '@/components/layout/top-tabs';
// import { getStockLines } from '@/lib/data/repository';

// No cookies() here: a statically exported layout cannot read request data. The sidebar restores its saved state in the browser.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.app}>
      <Sidebar />
      <div className={styles.main}>
        <TopTabs />
        <Header />
        <div className={styles.contentArea}>
          {/* <StaleDataBanner asOf={builtInAsOf} /> */}
          <main id="main" className={styles.content}>
            {children}
          </main>
          <LoadingOverlay />
        </div>
        <StatusBar />
      </div>
    </div>
  );
}
