import type { ReactNode } from 'react';
import { Header } from '@/components/layout/header';
import { LoadingOverlay } from '@/components/layout/loading-overlay';
import { Sidebar } from '@/components/layout/sidebar';
import styles from '@/components/layout/shell.module.css';
import { StatusBar } from '@/components/layout/status-bar';
import { TopTabs } from '@/components/layout/top-tabs';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.app}>
      <Sidebar initialCollapsed={false} />
      <div className={styles.main}>
        <TopTabs />
        <Header />
        <div className={styles.contentArea}>
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
