# IT WEB400 Enterprise Monitoring (Next.js)

Next.js App Router, TypeScript strict, CSS Modules, Recharts, Zod-validated mock data.

    npm install
    npm run dev          # http://localhost:3000
    npm run typecheck && npm run lint && npm test && npm run build

Filters (plant, process, tab, search, sort, group, status) live in the URL, so pages are shareable and
filtered on the server. Sidebar state is stored in a cookie so the server renders it correctly.

Fonts come from next/font/google (Oxanium, IBM Plex Mono, IBM Plex Sans Thai) and need internet at build or first dev run.
Mock JSON is in data/ (regenerate: cd scripts && python3 generate-mock.py). All data access goes through
src/lib/data/repository.ts, the only file to change when a real API replaces the mock.
Background art: public/images/warehouse-bg.svg (replace with a photo by changing the url in components/layout/shell.module.css).
