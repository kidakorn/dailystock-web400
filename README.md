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

## Static export and deployment

`next.config.ts` uses `output: 'export'`, so `npm run build` writes plain files to `out/`.

- Development: `npm run dev` -> http://localhost:3000/ (no base path).
- Production build: `npm run build` (NODE_ENV=production) -> every URL is prefixed with `/kidakorn`, so copy the
  contents of `out/` to `\\THWEB08\WebApps\AS400WebApp\kidakorn\` and open http://as400webappdev/kidakorn/.
- Filters, tab, search, sort, view and pagination live in the URL query string (for example
  `/kidakorn/package-summary/?group=IC2&tab=cancelled&page=2`) and are read in the browser.
- The data in `data/*.json` is read when the build runs and is embedded in the pages: after importing new AS400 data
  (`scripts/import-wgpgbl.py`) run `npm run build` again and redeploy `out/`.
- The build downloads the Google fonts, so the build machine needs internet access.
- Web server: serve `index.html` as the default document and make sure `.woff2` has a MIME type (IIS: `font/woff2`).
