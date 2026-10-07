import { Roboto_Mono, Sarabun } from 'next/font/google';

/*
 * Each font is exposed as a CSS variable instead of a className so that CSS
 * Modules can pick the right face per element (heading / data / UI) without
 * every component importing font objects. next/font downloads and self-hosts
 * the files at build time, so users' browsers never call Google.
 */
export const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-data',
  display: 'swap',
});
export const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ui',
  display: 'swap',
});
