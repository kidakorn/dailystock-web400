# โครงสร้างโปรเจกต์ `it-web400`

```text
it-web400/
├── data/                             # ข้อมูลจำลอง (Mock data)
│   ├── dashboard.json
│   ├── package-groups.json
│   ├── packages.json
│   ├── process-seq.json
│   ├── stock.json
│   └── wgpgbl.json
├── scripts/                          # สคริปต์สร้างและนำเข้าข้อมูล
│   ├── extract-workbook-config.py
│   ├── generate-mock.py
│   ├── import-wgpgbl-sample.py
│   └── import-wgpgbl.py
├── src/                              # Source Code หลัก
│   ├── app/                          # Next.js App Router
│   │   ├── (dashboard)/              # Route Group สำหรับหน้า Dashboard
│   │   │   ├── daily-stock-balance/  # หน้า Daily Stock Balance
│   │   │   │   ├── daily-stock-view.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── package-summary/      # หน้า Package Summary
│   │   │   │   ├── package-summary-view.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── process-master/       # หน้า Process Master
│   │   │   │   ├── process-master-view.tsx
│   │   │   │   ├── process-master.module.css
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard-view.tsx
│   │   │   ├── dashboard.module.css
│   │   │   ├── error.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css               # Global CSS
│   │   └── layout.tsx                # Root Layout
│   ├── assets/                       # รูปภาพและ Assets ของแอป
│   │   ├── favicon.ico
│   │   └── warehouse-bg.svg
│   ├── components/                   # React Components แบ่งตามหมวดหมู่
│   │   ├── charts/                   # กราฟต่างๆ
│   │   │   ├── bar-chart.tsx
│   │   │   ├── charts.module.css
│   │   │   ├── donut-chart.tsx
│   │   │   ├── line-chart.tsx
│   │   │   └── sparkline.tsx
│   │   ├── layout/                   # โครงสร้างหลักของหน้า
│   │   │   ├── clock.tsx
│   │   │   ├── header-portal.tsx
│   │   │   ├── header.tsx
│   │   │   ├── loading-overlay.module.css
│   │   │   ├── loading-overlay.test.tsx
│   │   │   ├── loading-overlay.tsx
│   │   │   ├── nav-icons.ts
│   │   │   ├── shell.module.css
│   │   │   ├── sidebar.test.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── status-bar.tsx
│   │   │   └── top-tabs.tsx
│   │   ├── packages/                 # Components สำหรับระบบแพ็กเกจ
│   │   │   ├── package-card.test.tsx
│   │   │   ├── package-card.tsx
│   │   │   └── packages.module.css
│   │   ├── stock/                    # Components สำหรับระบบสต็อก
│   │   │   ├── daily-stock-table.test.tsx
│   │   │   ├── daily-stock-table.tsx
│   │   │   └── export-csv-button.tsx
│   │   └── ui/                       # UI Components ทั่วไป
│   │       ├── badge.tsx
│   │       ├── calendar-filter.module.css
│   │       ├── calendar-filter.test.tsx
│   │       ├── calendar-filter.tsx
│   │       ├── card.tsx
│   │       ├── conveyor-loader.module.css
│   │       ├── conveyor-loader.tsx
│   │       ├── filter-bar.tsx
│   │       ├── kpi-card.tsx
│   │       ├── page-loading.tsx
│   │       └── ui.module.css
│   ├── lib/                          # ฟังก์ชันและ Utility ทั่วไป
│   │   ├── data/                     # Data Access Layer และ Schemas
│   │   │   ├── data-files.test.ts
│   │   │   ├── repository.ts
│   │   │   └── schemas.ts
│   │   ├── summary/                  # ตรรกะประมวลผลสรุปผลข้อมูล
│   │   │   ├── analytical-dashboard.test.ts
│   │   │   ├── analytical-dashboard.ts
│   │   │   ├── daily-stock.test.ts
│   │   │   ├── daily-stock.ts
│   │   │   ├── packages.test.ts
│   │   │   └── packages.ts
│   │   ├── csv.ts                    # ระบบ Export CSV
│   │   ├── filters.ts                # ตัวช่วยจัดการ Filters
│   │   ├── fonts.ts
│   │   ├── format.test.ts
│   │   ├── format.ts                 # ฟอร์แมตวันที่และตัวเลข
│   │   ├── loading-store.test.ts
│   │   ├── loading-store.ts
│   │   ├── nav.ts                    # รายการเมนู
│   │   ├── params.ts
│   │   ├── process-seq-store.test.ts
│   │   ├── process-seq-store.ts
│   │   ├── query.ts                  # ตัวช่วยจัดการ URL Query
│   │   ├── status.ts
│   │   ├── use-process-seq.ts
│   │   ├── use-query-params.ts
│   │   ├── use-query.ts
│   │   └── use-search-record.ts
│   └── types/                        # TypeScript Types / Interfaces
│       └── domain.ts
├── .gitignore
├── .prettierrc
├── eslint.config.mjs                 # ตั้งค่า ESLint
├── next-env.d.ts                     # Next.js TypeScript Types
├── next.config.ts                    # ตั้งค่า Next.js และ Static Export
├── package-lock.json
├── package.json                      # Dependencies และ Scripts
├── project-structure.md              # เอกสารโครงสร้างโปรเจกต์
├── README.md
├── tsconfig.json                      # ตั้งค่า TypeScript
└── vitest.config.mts                  # ตั้งค่า Vitest
```
