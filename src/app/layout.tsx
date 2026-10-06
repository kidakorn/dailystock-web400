import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import 'react-day-picker/style.css';
import { oxanium, plexMono, plexSansThai } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'IT WEB400 Enterprise Monitoring', template: '%s | IT WEB400' },
  description: 'Operational and analytical monitoring of packages and daily stock balance.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${oxanium.variable} ${plexMono.variable} ${plexSansThai.variable}`}>
      <body>{children}</body>
    </html>
  );
}
