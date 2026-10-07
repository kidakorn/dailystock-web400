---
name: ux-ui-design-style
description: "Use when shaping user flows, information architecture, visual style, interaction patterns, responsive behavior, or accessibility for a web interface; UX/UI design, UI style, UX flow, ออกแบบ UX UI, ออกแบบสไตล์หน้าจอ."
---

# UX/UI Design Style

Design an interface around the user's real task, context, and frequency of use. Make the experience coherent and distinctive without sacrificing clarity, accessibility, or the existing product language.

## Design Workflow

1. Identify the audience, primary task, usage frequency, device context, and any domain constraints. Inspect the existing product, design tokens, component library, and nearest comparable screen.
2. Map the shortest complete user flow, including entry, primary action, feedback, cancellation or recovery, and completion. Preserve user context across navigation where appropriate.
3. Establish information hierarchy from task priority. Group related content, make important values scannable, and keep supporting details available without competing with the main action.
4. Choose a visual direction with purposeful typography, a balanced palette, consistent spacing, and restrained shape language. Reuse existing tokens and components when working inside an established system; add a new visual language only when the request calls for it.
5. Design interaction states, not just the default screen: loading, empty, error, disabled, focus, hover, selected, success, and destructive confirmation as relevant.
6. Check responsive behavior at narrow and wide viewports. Prevent text clipping, overlapping controls, unstable layout shifts, and hidden essential actions.
7. Verify semantic structure, keyboard operation, visible focus, contrast, accessible names, reduced motion, and zoom/text scaling. Use color alongside text or another clear status cue.
8. Validate the result with focused tests or browser checks and revise against actual content and realistic edge cases.

## Visual and Interaction Principles

- Give each screen one clear primary task and a visible path to complete it. Use familiar controls for familiar actions.
- Use typography to signal hierarchy; reserve display styling for true focal content and keep dense tools readable.
- Prefer deliberate alignment, spacing, and contrast over extra decoration. Use imagery only when it communicates relevant content or state.
- Use buttons for actions, links for navigation, inputs for values, toggles for binary settings, tabs for peer views, and menus for option sets.
- Keep component dimensions stable where changing content or focus states could shift surrounding layout.
- Motion should clarify transitions or feedback, remain brief, and respect `prefers-reduced-motion`.
- Avoid generic template layouts, decorative clutter, inconsistent radii, color-only meaning, and controls that look interactive but do nothing.

## Project Fit

For this repository, read `erp-design-system` before changing operational screens. Reuse `src/app/globals.css`, shared UI components, CSS Modules, and existing layout patterns instead of layering a competing style system. Test Thai and English labels, dense tables, realistic stock values, query-driven filters, and the production static-export base path when relevant.
