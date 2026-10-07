'use client';

import './globals.css';
import { RuntimeErrorPanel } from '@/components/ui/runtime-error-panel';
import ui from '@/components/ui/ui.module.css';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className={ui.errorPage}>
          <RuntimeErrorPanel reset={reset} />
        </main>
      </body>
    </html>
  );
}