# โครงสร้างโปรเจกต์ `dailystock-web400`

```text
dailystock-web400/
├── data/                             # โฟลเดอร์เก็บข้อมูลจำลอง (Mock data)
│   ├── dashboard.json
│   ├── package-groups.json
│   ├── packages.json
│   ├── process-seq.json
│   ├── stock.json
│   └── wgpgbl.json
├── public/                           # โฟลเดอร์เก็บ Static Assets
│   └── favicon.ico
├── src/                              # โฟลเดอร์หลักสำหรับ Source Code
│   ├── app/                          # Next.js App Router
│   │   ├── (dashboard)/              # Route Group สำหรับหน้า Dashboard หลัก
│   │   │   ├── daily-stock-balance/  # หน้า Daily Stock Balance
│   │   │   │   └── page.tsx
│   │   │   ├── package-summary/      # หน้า Package Summary
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard.module.css
│   │   │   ├── error.tsx
│   │   │   ├── layout.tsx            # Layout สำหรับหน้า Dashboard
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css               # Global CSS
│   │   └── layout.tsx                # Root Layout
│   ├── components/                   # React Components แบ่งตามหมวดหมู่
│   │   ├── charts/                   # กราฟต่างๆ (Bar, Donut, Line, Sparkline)
│   │   ├── layout/                   # โครงสร้างหลัก (Sidebar, Header, TopTabs)
│   │   ├── packages/                 # คอมโพเนนต์เฉพาะของระบบแพ็กเกจ
│   │   ├── stock/                    # คอมโพเนนต์เฉพาะของระบบสต็อก
│   │   └── ui/                       # UI อเนกประสงค์ (Card, Badge, FilterBar, KpiCard)
│   ├── lib/                          # ฟังก์ชันและ Utility ทั่วไป
│   │   ├── data/                     # Data Access Layer (อ่านข้อมูลจากไฟล์ JSON)
│   │   │   ├── repository.ts         # ฟังก์ชัน Get ข้อมูล
│   │   │   └── schemas.ts            # Zod Schemas นิยามโครงสร้างข้อมูล
│   │   ├── summary/                  # ตรรกะประมวลผลสรุปผลข้อมูล
│   │   ├── csv.ts                    # ระบบ Export CSV
│   │   ├── filters.ts                # ตัวช่วยจัดการ Filters
│   │   ├── format.ts                 # ฟอร์แมตวันที่/ตัวเลข
│   │   ├── nav.ts                    # รายการเมนู
│   │   ├── query.ts                  # ตัวช่วยจัดการ URL Query
│   │   └── use-query-params.ts       # Hook จัดการ Query Params ฝั่ง Client
│   └── types/                        # TypeScript Types / Interfaces
│       └── domain.ts
├── eslint.config.mjs                 # ตั้งค่า ESLint
├── next-env.d.ts                     # Next.js TypeScript Types
├── next.config.ts                    # ตั้งค่า Next.js (รวมถึง BasePath & Static Export)
├── package.json                      # รายชื่อ Dependencies & Scripts
├── tsconfig.json                     # ตั้งค่า TypeScript
└── vitest.config.mts                 # ตั้งค่า Vitest
```
