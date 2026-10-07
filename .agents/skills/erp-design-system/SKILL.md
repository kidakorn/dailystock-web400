---
name: erp-design-system
description: "Use when designing or changing ERP dashboard UI, tables, filters, KPI indicators, charts, responsive layouts, or Thai/English operational labels; ERP design system, ออกแบบหน้าจอ ERP, dashboard UI."
---

# ERP Design System

Build dense, legible operational interfaces for frequent scanning and data comparison. Preserve the existing visual language instead of introducing a separate design system.

## Existing Foundations

- Global tokens and reset: `src/app/globals.css`.
- Shared UI components: `src/components/ui/` (badge, card, data-table, filter-bar, KPI card, calendar filter, loading and error states).
- Shell and navigation: `src/components/layout/`.
- Charts: `src/components/charts/`.
- Feature styles are colocated CSS Modules. Reuse component patterns and tokens before adding new abstractions.
- Status vocabulary is defined in `src/lib/status.ts`; formatting helpers are in `src/lib/format.ts`.

## Design Rules

- Keep operational information unframed and scannable; use compact headings, aligned numeric columns, stable table widths, and clear status hierarchy.
- Reuse shared controls and status colors. Never communicate status by color alone; include text or an accessible label.
- Preserve keyboard access, visible focus, semantic table markup, sufficient contrast, and responsive behavior. Test long Thai and English labels and realistic large values.
- Keep filter state/shareable state consistent with existing URL parameter patterns. Loading, empty, and error states should use established components.
- Respect current design tokens, including the existing charcoal/gray surfaces, blue primary, semantic status colors, compact spacing, and sharp corners. Change tokens only when a cohesive system-level need exists.
- Use the project's icon library, `lucide-react`, where suitable; icon-only actions need accessible names.
- Do not add decorative cards, gradients, font or color systems that conflict with the existing ERP application.

Before implementation, inspect the closest existing screen and its tests. Add or update focused interaction and responsive tests where the behavior warrants them.
