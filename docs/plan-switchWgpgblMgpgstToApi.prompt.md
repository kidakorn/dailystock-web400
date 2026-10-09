## Plan: Switch WGPGBL and MGPGST to AS400 API

Replace local JSON reads with calls to odbc-as400-api (http://localhost:3099) for WGPGBL (Get all) and MGPGST (paged). Map raw WGPGBL columns to stockLineSchema in code. On API failure, show error panel (no mock fallback). MDVICE (by key) is out of scope for this phase.

Steps
1. Add config: API base URL env var (e.g. ODBC_API_BASE_URL, default http://localhost:3099), read only on server.
2. Add a server-only API client module (e.g. src/lib/data/api-client.ts) with fetchApi(path, params) that checks res.ok, parses body, throws on error field, and validates P_ISFOUND.
3. Capture real WGPGBL sample response and document raw column names; write mapWgpgblRow(raw) -> stockLine in src/lib/data/mappers.ts (depends on 2). Field mapping per Daily_Stock.xlsx renames: QTST34 balance, QTBW34 balDay, QTSTKP stock, QTWRKP actual, QTPDSH pending, plus snapshot, packageCode/Name/Kind, processCode/Name, subProcessCode/Name.
4. Add getAllWgpgbl() and getAllMgpgst() paging loop (limit=500, offset += limit until rows < limit) in src/lib/data/api-repository or repository.ts (depends on 2).
5. Switch repository.ts getStockLines() and getGroupPackageMaster() to API-backed functions; keep getProcessSeq/getPackageGroups/getPackagePairs/getDashboard/getStock/getPackages on JSON (depends on 3, 4).
6. Client page group-package-master-view.tsx currently fetches /data/mgpgst.json directly; change it to receive data from the server page (page.tsx already calls getGroupPackageMaster) and remove the client fetch (depends on 5). Update its test accordingly.
7. Keep Zod validation: parse API rows through stockLineSchema / mgpgstSchema so shape mismatches fail loudly (depends on 3, 4).
8. Error handling: API failure throws into existing dashboard/error.tsx and runtime-error-panel.tsx.

Relevant files
- src/lib/data/repository.ts — getStockLines, getGroupPackageMaster switch to API; cache() kept
- src/lib/data/schemas.ts — stockLineSchema, mgpgstSchema (validation targets, unchanged unless mapping needs it)
- src/app/(dashboard)/group-package-master/group-package-master-view.tsx — remove client fetch of /data/mgpgst.json (MASTER_URL)
- src/app/(dashboard)/group-package-master/group-package-master-view.test.tsx — update fetch mock expectation
- src/app/(dashboard)/group-package-master/page.tsx, src/app/(dashboard)/page.tsx, daily-stock-balance/page.tsx, package-summary/page.tsx — consumers, no change expected
- src/lib/data/data-files.test.ts — keep JSON tests; add tests for mapper
- docs/odbc_api/API.md — reference for WGPGBL/MGPGST/MDVICE contracts
- scripts/import-wgpgbl.py — reference for how wgpgbl.json was derived from raw data

Verification
1. Unit tests (Vitest): mapper converts a sample raw WGPGBL row to stockLine; paging loop stops when rows < limit; API error body throws.
2. Run npm test and npx tsc --noEmit / lint.
3. Manual: start odbc API (npm start), load /, /daily-stock-balance, /package-summary, /group-package-master and compare totals against data/wgpgbl.json and data/mgpgst.json.
4. Stop API and confirm error panel renders.

Decisions
- Included: WGPGBL Get all, MGPGST paged (all pages). Excluded: MDVICE, changes to API server, endpoint-manager changes, removing mock JSON files.
- Fetch on server only (repository.ts is server-only); no client calls to the API.
- No mock fallback on failure.

Further Considerations
1. Sample WGPGBL raw response needed to confirm column-to-field mapping. Option A: user provides JSON sample / Option B: call endpoint and save to tmp.
2. WGPGBL row count is unbounded (fetchAll); confirm acceptable response size or add server-side filter.
3. MDVICE by key (cddevc=4423): no UI consumer yet. Option A: add service function only / Option B: add a new page later.
